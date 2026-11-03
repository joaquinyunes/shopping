import { afterEach, describe, expect, it, vi } from 'vitest';
import { cotizarEnvio, conRespaldo, enviosDesdeEnv, tarifaPorZona, tarifasDesdeTexto, zonaDeCp, type EnviosProvider } from './envios';
import { ErrorHttp } from './http';

describe('zonaDeCp', () => {
  it('reconoce CP de 4 dígitos y CPA, y separa AMBA del interior', () => {
    expect(zonaDeCp('1425')).toBe('amba');
    expect(zonaDeCp('C1425ABC')).toBe('amba');
    expect(zonaDeCp(' 5000 ')).toBe('interior');
    expect(zonaDeCp('X5000ABC')).toBe('interior');
  });
  it('rechaza lo que no es un código postal', () => {
    expect(zonaDeCp('')).toBeNull();
    expect(zonaDeCp('abc')).toBeNull();
    expect(zonaDeCp('123')).toBeNull();
  });
});

describe('tarifaPorZona (proveedor sin credenciales)', () => {
  const proveedor = tarifaPorZona();
  it('cotiza más caro al interior y suma por kilo adicional', async () => {
    const [amba] = await proveedor.cotizar({ cp: '1425', pesoGr: 500, valorDeclarado: 1000 });
    const [interior] = await proveedor.cotizar({ cp: '5000', pesoGr: 500, valorDeclarado: 1000 });
    const [pesado] = await proveedor.cotizar({ cp: '1425', pesoGr: 3200, valorDeclarado: 1000 });
    expect(interior.precio).toBeGreaterThan(amba.precio);
    expect(pesado.precio).toBeGreaterThan(amba.precio);
    expect(amba).toMatchObject({ proveedor: 'tarifa-por-zona' });
  });
  it('peso desconocido (0) cuenta como 1 kg', async () => {
    const [a] = await proveedor.cotizar({ cp: '1425', pesoGr: 0, valorDeclarado: 0 });
    const [b] = await proveedor.cotizar({ cp: '1425', pesoGr: 1000, valorDeclarado: 0 });
    expect(a.precio).toBe(b.precio);
  });
  it('envío gratis sobre el monto configurado', async () => {
    const p = tarifaPorZona({ gratisDesde: 50000 });
    expect((await p.cotizar({ cp: '1425', pesoGr: 500, valorDeclarado: 60000 }))[0].precio).toBe(0);
    expect((await p.cotizar({ cp: '1425', pesoGr: 500, valorDeclarado: 40000 }))[0].precio).toBeGreaterThan(0);
  });
});

describe('cotizarEnvio', () => {
  it('CP inválido es un error del cliente, no del proveedor', async () => {
    await expect(cotizarEnvio(tarifaPorZona(), { cp: 'x', pesoGr: 1, valorDeclarado: 1 })).rejects.toThrow(/código postal/i);
  });
  it('una falla del proveedor no se pierde', async () => {
    const roto = { nombre: 'roto', cotizar: async () => { throw new Error('sin credenciales'); } };
    await expect(cotizarEnvio(roto, { cp: '1425', pesoGr: 1, valorDeclarado: 1 })).rejects.toThrow('sin credenciales');
  });
});

const buenas = '{"amba":{"base":1000,"porKgExtra":100,"diasMin":1,"diasMax":2},"interior":{"base":2000,"porKgExtra":200,"diasMin":3,"diasMax":5}}';

describe('tarifas propias por variable de entorno', () => {
  afterEach(() => { delete process.env.ENVIO_TARIFAS; delete process.env.ENVIO_GRATIS_DESDE; vi.restoreAllMocks(); });

  it('lee amba e interior válidos', () => {
    expect(tarifasDesdeTexto(buenas)).toMatchObject({ amba: { base: 1000 }, interior: { diasMax: 5 } });
    expect(tarifasDesdeTexto(undefined)).toBeUndefined();
  });
  it('lo mal escrito se ignora con aviso, no rompe la tienda', () => {
    const aviso = vi.spyOn(console, 'error').mockImplementation(() => {});
    for (const mal of ['no es json', '{}', '{"amba":{"base":-1,"porKgExtra":0,"diasMin":1,"diasMax":2},"interior":{}}', buenas.replace('"diasMin":3', '"diasMin":9')])
      expect(tarifasDesdeTexto(mal)).toBeUndefined();
    expect(aviso).toHaveBeenCalledTimes(4);
  });
  it('enviosDesdeEnv usa las tarifas de la dueña y el envío gratis', async () => {
    process.env.ENVIO_TARIFAS = buenas;
    expect((await enviosDesdeEnv().cotizar({ cp: '1425', pesoGr: 500, valorDeclarado: 1 }))[0]).toMatchObject({ precio: 1000, diasMin: 1 });
    process.env.ENVIO_GRATIS_DESDE = '5000';
    expect((await enviosDesdeEnv().cotizar({ cp: '5000', pesoGr: 500, valorDeclarado: 6000 }))[0].precio).toBe(0);
  });
});

describe('conRespaldo', () => {
  const pedido = { cp: '1425', pesoGr: 500, valorDeclarado: 1000 };
  const respaldo = tarifaPorZona();
  const opcion = { proveedor: 'correo', servicio: 'Express', precio: 1, diasMin: 1, diasMax: 1 };
  const proveedor = (cotizar: EnviosProvider['cotizar']): EnviosProvider => ({ nombre: 'correo', cotizar });

  it('usa al principal cuando responde', async () => {
    expect(await conRespaldo(proveedor(async () => [opcion]), respaldo).cotizar(pedido)).toEqual([opcion]);
  });
  it('si el principal falla, tarda o no devuelve nada, cae a la tarifa por zona', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const lento = proveedor(() => new Promise(() => {}));
    for (const p of [proveedor(async () => { throw new Error('credenciales vencidas'); }), proveedor(async () => []), lento, proveedor(async () => { throw new ErrorHttp(502, 'mal'); })]) {
      expect((await conRespaldo(p, respaldo, 20).cotizar(pedido))[0].proveedor).toBe('tarifa-por-zona');
    }
  });
  it('un error del cliente (CP inválido) no se esconde detrás del respaldo', async () => {
    const p = proveedor(async () => { throw new ErrorHttp(400, 'Código postal inválido'); });
    await expect(conRespaldo(p, respaldo).cotizar(pedido)).rejects.toThrow(/código postal/i);
  });
});
