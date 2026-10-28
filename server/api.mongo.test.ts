import { Readable } from 'node:stream';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
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
  let pedido: Handler, pedidos: Handler, envio: Handler, tienda: Handler, login: Handler;
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
});
