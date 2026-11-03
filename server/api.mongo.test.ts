import { Readable } from 'node:stream';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { MongoClient } from 'mongodb';
import { hayMongod, levantarReplicaSet } from './mongo-local';
import type { Req, Res } from './http';

// Pruebas de las funciones de api/ contra un MongoDB real (replica set local de un nodo). Se saltean si no hay binario de mongod.
const conMongo = hayMongod() ? describe : describe.skip;

type Handler = (req: Req, res: Res) => Promise<void>;
async function llamar(handler: Handler, metodo: string, cuerpo?: unknown, headers: Record<string, string> = {}, url = '/') {
  const bytes = cuerpo === undefined ? [] : [Buffer.from(typeof cuerpo === 'string' ? cuerpo : JSON.stringify(cuerpo))];
  const req = Object.assign(Readable.from(bytes), { method: metodo, headers: { host: 'localhost', ...headers }, url }) as unknown as Req;
  let texto = '';
  const res = { statusCode: 200, setHeader() {}, end(t?: string) { texto = t ?? ''; } } as unknown as Res;
  await handler(req, res);
  return { estado: res.statusCode, cuerpo: texto ? JSON.parse(texto) : null };
}

conMongo('api/ contra MongoDB con replica set', () => {
  let mongo: Awaited<ReturnType<typeof levantarReplicaSet>>;
  let raw: MongoClient;
  let pedido: Handler, pedidos: Handler, envio: Handler, tienda: Handler, login: Handler, vencer: Handler, csp: Handler;
  const admin = { 'x-admin-clave': 'clave-de-prueba' };

  const catalogo = () => ({
    tienda: { nombre: 'Casa Nido' },
    productos: [
      { id: 'taza', nombre: 'Taza', categoria: 'Cocina', precio: 8500, stock: 3, pesoGr: 300 },
      { id: 'vela', nombre: 'Vela', categoria: 'Deco', precio: 7200, stock: 1 },
      { id: 'libre', nombre: 'Libre', categoria: 'Deco', precio: 100 },
    ],
  });
  const stockDe = async (id: string) => {
    const fila = await raw.db('casanido_test').collection('tienda').findOne({ _id: 1 as never }) as unknown as { datos: { productos: Array<{ id: string; stock?: number }> } };
    return fila.datos.productos.find(p => p.id === id)!.stock;
  };
  const comprar = (items: Array<{ id: string; cant: number }>, extra: object = {}) =>
    llamar(pedido, 'POST', { items, cliente: { nombre: 'Ana', telefono: '1155550000', cp: '1425' }, ...extra });

  beforeAll(async () => {
    mongo = await levantarReplicaSet();
    process.env.MONGODB_URI = mongo.uri;
    process.env.MONGODB_DB = 'casanido_test';
    process.env.ADMIN_PASSWORD = 'clave-de-prueba';
    raw = await new MongoClient(mongo.uri).connect();
    ({ default: pedido } = await import('../api/pedido'));
    ({ default: pedidos } = await import('../api/pedidos'));
    ({ default: envio } = await import('../api/envio'));
    ({ default: tienda } = await import('../api/tienda'));
    ({ default: login } = await import('../api/login'));
    ({ default: vencer } = await import('../api/vencer'));
    ({ default: csp } = await import('../api/csp'));
  }, 60_000);

  afterAll(async () => { await raw?.close(); await mongo?.parar(); });

  beforeEach(async () => {
    const db = raw.db('casanido_test');
    await Promise.all(['pedidos', 'contadores', 'tienda'].map(c => db.collection(c).deleteMany({})));
    expect((await llamar(tienda, 'PUT', catalogo(), admin)).estado).toBe(200);
  });

  it('login y catálogo: la clave manda y el GET es público', async () => {
    expect((await llamar(login, 'POST', undefined, admin)).estado).toBe(204);
    expect((await llamar(tienda, 'PUT', catalogo(), { 'x-admin-clave': 'mala' })).estado).toBe(401);
    expect((await llamar(tienda, 'GET')).cuerpo.productos).toHaveLength(3);
  });

  it('crear un pedido descuenta el stock y calcula el total con los precios del servidor', async () => {
    const r = await comprar([{ id: 'taza', cant: 2 }, { id: 'libre', cant: 1 }]);
    expect(r.estado).toBe(201);
    expect(r.cuerpo).toMatchObject({ numero: 1, estado: 'pendiente', subtotal: 17100, total: 17100 });
    expect(await stockDe('taza')).toBe(1);
    expect(await stockDe('libre')).toBeUndefined();
    expect((await comprar([{ id: 'libre', cant: 1 }])).cuerpo.numero).toBe(2);
  });

  it('con envío cotizado: el precio sale del proveedor, no del cliente', async () => {
    const cot = await llamar(envio, 'POST', { cp: '1425', items: [{ id: 'taza', cant: 2 }] });
    expect(cot.estado).toBe(200);
    const elegida = cot.cuerpo.opciones[0];
    const r = await comprar([{ id: 'taza', cant: 2 }], { envio: { servicio: elegida.servicio, precio: 1 } });
    expect(r.cuerpo.envio).toMatchObject({ servicio: elegida.servicio, precio: elegida.precio });
    expect(r.cuerpo.total).toBe(17000 + elegida.precio);
    expect((await comprar([{ id: 'taza', cant: 1 }], { envio: { servicio: 'inventado' } })).estado).toBe(400);
  });

  it('no deja vender más que el stock, y no queda nada a medias', async () => {
    const r = await comprar([{ id: 'taza', cant: 1 }, { id: 'vela', cant: 2 }]);
    expect(r.estado).toBe(409);
    expect(await stockDe('taza')).toBe(3); // la transacción deshizo el descuento de la taza
    expect(await raw.db('casanido_test').collection('pedidos').countDocuments()).toBe(0);
  });

  it('dos compradores a la vez por la última unidad: gana uno solo', async () => {
    const [a, b] = await Promise.all([comprar([{ id: 'vela', cant: 1 }]), comprar([{ id: 'vela', cant: 1 }])]);
    expect([a.estado, b.estado].sort()).toEqual([201, 409]);
    expect(await stockDe('vela')).toBe(0);
    expect(await raw.db('casanido_test').collection('pedidos').countDocuments()).toBe(1);
  });

  it('pedidos: solo la dueña los ve y los cambia; cancelar repone y reabrir vuelve a descontar', async () => {
    await comprar([{ id: 'taza', cant: 2 }]);
    expect((await llamar(pedidos, 'GET')).estado).toBe(401);
    expect((await llamar(pedidos, 'GET', undefined, admin)).cuerpo).toHaveLength(1);

    const cambiar = (estado: string) => llamar(pedidos, 'PATCH', { numero: 1, estado }, admin);
    expect((await cambiar('enviado')).estado).toBe(409); // pendiente no salta a enviado
    expect((await cambiar('cancelado')).estado).toBe(200);
    expect(await stockDe('taza')).toBe(3);
    expect((await cambiar('pendiente')).estado).toBe(200);
    expect(await stockDe('taza')).toBe(1);

    // reabrir sin stock suficiente falla y no cambia el estado
    await cambiar('cancelado');
    await comprar([{ id: 'taza', cant: 3 }]);
    expect((await cambiar('pendiente')).estado).toBe(409);
    const lista = (await llamar(pedidos, 'GET', undefined, admin)).cuerpo as Array<{ numero: number; estado: string }>;
    expect(lista.find(p => p.numero === 1)!.estado).toBe('cancelado');
  });

  it('el camino feliz queda en el historial y el filtro por estado funciona', async () => {
    await comprar([{ id: 'libre', cant: 1 }]);
    for (const e of ['pagado', 'enviado', 'entregado']) expect((await llamar(pedidos, 'PATCH', { numero: 1, estado: e }, admin)).estado).toBe(200);
    const [p] = (await llamar(pedidos, 'GET', undefined, admin)).cuerpo;
    expect(p.estado).toBe('entregado');
    expect(p.historial.map((h: { estado: string }) => h.estado)).toEqual(['pendiente', 'pagado', 'enviado', 'entregado']);
    expect((await llamar(pedidos, 'GET', undefined, admin, '/api/pedidos?estado=pendiente')).cuerpo).toHaveLength(0);
    expect((await llamar(pedidos, 'PATCH', { numero: 99, estado: 'pagado' }, admin)).estado).toBe(404);
  });

  it('entradas inválidas son 400 y un cuerpo roto no se cuela', async () => {
    expect((await comprar([])).estado).toBe(400);
    expect((await comprar([{ id: 'nada', cant: 1 }])).estado).toBe(400);
    expect((await llamar(pedido, 'POST', '{no es json')).estado).toBe(400);
    expect((await llamar(envio, 'POST', { cp: 'x', items: [{ id: 'taza', cant: 1 }] })).estado).toBe(400);
  });

  describe('variantes, oferta y productos ocultos', () => {
    const conVariantes = () => {
      const c = catalogo();
      c.productos.push(
        {
          id: 'remera', nombre: 'Remera', categoria: 'Textiles', precio: 10000, precioPromo: 8000, propiedades: ['Talle'],
          variantes: [{ valores: ['M'], stock: 2 }, { valores: ['L'], stock: 1, precio: 12000 }, { valores: ['S'] }],
        } as never,
        { id: 'secreta', nombre: 'Secreta', categoria: 'Deco', precio: 500, oculto: true } as never,
      );
      return c;
    };
    const stockVariante = async (id: string, variante: string) => {
      const fila = await raw.db('casanido_test').collection('tienda').findOne({ _id: 1 as never }) as unknown as { datos: { productos: Array<{ id: string; variantes?: Array<{ id: string; stock?: number }> }> } };
      return fila.datos.productos.find(p => p.id === id)!.variantes!.find(v => v.id === variante)!.stock;
    };
    const version = async () => (await llamar(tienda, 'GET')).cuerpo._v as number;
    beforeEach(async () => { expect((await llamar(tienda, 'PUT', { ...conVariantes(), _v: await version() }, admin)).estado).toBe(200); });

    it('cada variante descuenta y repone su propio stock, y cobra su precio o la oferta', async () => {
      const r = await comprar([{ id: 'remera', variante: 'm', cant: 2 }, { id: 'remera', variante: 'l', cant: 1 }] as never);
      expect(r.estado).toBe(201);
      expect(r.cuerpo.subtotal).toBe(2 * 8000 + 12000);
      expect(r.cuerpo.items[0]).toMatchObject({ nombre: 'Remera', variante: { id: 'm', nombre: 'M' }, precio: 8000 });
      expect(await stockVariante('remera', 'm')).toBe(0);
      expect(await stockVariante('remera', 'l')).toBe(0);
      expect(await stockVariante('remera', 's')).toBeUndefined(); // ilimitada: no se toca

      await llamar(pedidos, 'PATCH', { numero: 1, estado: 'cancelado' }, admin);
      expect(await stockVariante('remera', 'm')).toBe(2);
      expect(await stockVariante('remera', 'l')).toBe(1);
      expect((await llamar(pedidos, 'PATCH', { numero: 1, estado: 'pendiente' }, admin)).estado).toBe(200);
      expect(await stockVariante('remera', 'm')).toBe(0);
    });

    it('si una variante no alcanza no se guarda nada del pedido', async () => {
      const r = await comprar([{ id: 'taza', cant: 1 }, { id: 'remera', variante: 'l', cant: 2 }] as never);
      expect(r.estado).toBe(409);
      expect(await stockDe('taza')).toBe(3);
      expect(await stockVariante('remera', 'l')).toBe(1);
    });

    it('dos compradores por la última remera L: gana uno solo', async () => {
      const compra = () => comprar([{ id: 'remera', variante: 'l', cant: 1 }] as never);
      const [a, b] = await Promise.all([compra(), compra()]);
      expect([a.estado, b.estado].sort()).toEqual([201, 409]);
      expect(await stockVariante('remera', 'l')).toBe(0);
    });

    it('exige elegir variante y rechaza variantes inventadas, productos ocultos y mails inválidos', async () => {
      expect((await comprar([{ id: 'remera', cant: 1 }])).estado).toBe(400);
      expect((await comprar([{ id: 'remera', variante: 'xxl', cant: 1 }] as never)).estado).toBe(400);
      expect((await comprar([{ id: 'taza', variante: 'm', cant: 1 }] as never)).estado).toBe(400);
      expect((await comprar([{ id: 'secreta', cant: 1 }])).estado).toBe(400);
      expect((await llamar(pedido, 'POST', { items: [{ id: 'libre', cant: 1 }], cliente: { nombre: 'Ana', email: 'no-es-mail' } })).estado).toBe(400);
    });

    it('guardar normaliza lo que manda el cliente: ids de variante, fotos peligrosas, oferta inválida', async () => {
      const c = catalogo();
      c.productos.push({ id: 'x', nombre: 'X', precio: 100, precioPromo: 500, foto: 'javascript:alert(1)', variantes: [{ id: 'trucho', valores: ['Rojo'] }] } as never);
      expect((await llamar(tienda, 'PUT', { ...c, _v: await version() }, admin)).estado).toBe(200);
      const x = (await llamar(tienda, 'GET')).cuerpo.productos.find((p: { id: string }) => p.id === 'x');
      expect(x).toMatchObject({ foto: '', variantes: [{ id: 'rojo', valores: ['Rojo'] }] });
      expect(x.precioPromo).toBeUndefined();
    });
  });

  describe('versión del catálogo (el admin no pisa lo vendido)', () => {
    it('guardar con una versión vieja es 409 y no pisa el stock descontado', async () => {
      const abierto = await llamar(tienda, 'GET'); // la dueña abre el panel
      await comprar([{ id: 'taza', cant: 2 }]); // entra un pedido
      expect((await llamar(tienda, 'GET')).cuerpo._v).toBeGreaterThan(abierto.cuerpo._v);
      const r = await llamar(tienda, 'PUT', abierto.cuerpo, admin); // guarda con su copia vieja
      expect(r.estado).toBe(409);
      expect(r.cuerpo.error).toMatch(/Recarg/);
      expect(await stockDe('taza')).toBe(1);
    });

    it('con la versión al día guarda y devuelve la nueva; sin versión sobre un catálogo existente es 409', async () => {
      const v = (await llamar(tienda, 'GET')).cuerpo._v;
      const ok = await llamar(tienda, 'PUT', { ...catalogo(), _v: v }, admin);
      expect(ok.estado).toBe(200);
      expect(ok.cuerpo._v).toBe(v + 1);
      expect((await llamar(tienda, 'PUT', catalogo(), admin)).estado).toBe(409);
    });
  });

  describe('límite de pedidos pendientes por origen', () => {
    it('el sexto pedido pendiente de la misma IP en una hora es 429; otra IP puede comprar', async () => {
      const desde = (ip: string) => llamar(pedido, 'POST', { items: [{ id: 'libre', cant: 1 }], cliente: { nombre: 'Ana' } }, { 'x-forwarded-for': `${ip}, 10.0.0.1` });
      for (let i = 0; i < 5; i++) expect((await desde('203.0.113.7')).estado).toBe(201);
      expect((await desde('203.0.113.7')).estado).toBe(429);
      expect((await desde('198.51.100.2')).estado).toBe(201);
      const guardado = await raw.db('casanido_test').collection('pedidos').findOne({}) as unknown as { origen?: string };
      expect(guardado.origen).toMatch(/^[a-f0-9]{24}$/); // huella, no la IP
      expect((await llamar(pedidos, 'GET', undefined, admin)).cuerpo[0].origen).toBeUndefined();
    });
  });

  describe('cancelación automática de pedidos sin pago', () => {
    const horas = process.env.PEDIDO_VENCE_HORAS, cron = process.env.CRON_SECRET;
    afterEach(() => {
      if (horas === undefined) delete process.env.PEDIDO_VENCE_HORAS; else process.env.PEDIDO_VENCE_HORAS = horas;
      if (cron === undefined) delete process.env.CRON_SECRET; else process.env.CRON_SECRET = cron;
    });
    const envejecer = (numero: number, horasAtras: number) =>
      raw.db('casanido_test').collection('pedidos').updateOne({ _id: numero as never }, { $set: { creado: new Date(Date.now() - horasAtras * 3_600_000) } });

    it('viene apagada: sin PEDIDO_VENCE_HORAS no cancela nada, ni siquiera un pedido viejísimo', async () => {
      delete process.env.PEDIDO_VENCE_HORAS;
      await comprar([{ id: 'taza', cant: 1 }]);
      await envejecer(1, 24 * 90);
      expect((await llamar(vencer, 'POST', undefined, admin)).cuerpo).toEqual({ activo: false, vencidos: 0 });
      expect((await llamar(pedidos, 'GET', undefined, admin)).cuerpo[0].estado).toBe('pendiente');
    });

    it('prendida: cancela solo los pendientes viejos, devuelve su stock y deja el motivo en el historial', async () => {
      process.env.PEDIDO_VENCE_HORAS = '48';
      await comprar([{ id: 'taza', cant: 1 }]); // 1: viejo y pendiente
      await comprar([{ id: 'taza', cant: 1 }]); // 2: viejo pero pagado
      await comprar([{ id: 'taza', cant: 1 }]); // 3: reciente
      await llamar(pedidos, 'PATCH', { numero: 2, estado: 'pagado' }, admin);
      await envejecer(1, 49); await envejecer(2, 49); await envejecer(3, 47);
      expect(await stockDe('taza')).toBe(0);

      expect((await llamar(vencer, 'POST', undefined, admin)).cuerpo).toEqual({ activo: true, vencidos: 1 });
      const lista = (await llamar(pedidos, 'GET', undefined, admin)).cuerpo as Array<{ numero: number; estado: string; historial: Array<{ motivo?: string }> }>;
      expect(lista.map(p => [p.numero, p.estado])).toEqual([[3, 'pendiente'], [2, 'pagado'], [1, 'cancelado']]);
      expect(lista[2].historial.at(-1)!.motivo).toBe('vencido');
      expect(await stockDe('taza')).toBe(1);
    });

    it('también se dispara al entrar un pedido nuevo (así el stock retenido vuelve a estar a la venta)', async () => {
      process.env.PEDIDO_VENCE_HORAS = '24';
      await comprar([{ id: 'vela', cant: 1 }]);
      await envejecer(1, 30);
      expect((await comprar([{ id: 'vela', cant: 1 }])).estado).toBe(201); // sin vencer antes, daría 409
    });

    it('el cron entra con CRON_SECRET; sin clave ni secreto es 401', async () => {
      process.env.CRON_SECRET = 'secreto-cron';
      expect((await llamar(vencer, 'GET')).estado).toBe(401);
      expect((await llamar(vencer, 'GET', undefined, { authorization: 'Bearer otro' })).estado).toBe(401);
      expect((await llamar(vencer, 'GET', undefined, { authorization: 'Bearer secreto-cron' })).estado).toBe(200);
    });
  });

  it('el reporte de CSP se acepta (204) aunque venga roto', async () => {
    expect((await llamar(csp, 'POST', { 'csp-report': { 'violated-directive': 'img-src', 'blocked-uri': 'https://x.test/a.png' } })).estado).toBe(204);
    expect((await llamar(csp, 'POST', '{roto')).estado).toBe(204);
    expect((await llamar(csp, 'GET')).estado).toBe(405);
  });
});
