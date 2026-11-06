import { describe, expect, it, vi } from 'vitest';
import { enviosDesdeEnv, tarifaPorZona, conRespaldo, type EnviosProvider } from './envios';
import { andreani, correoArgentino, correosDesdeEnv, oca, variosCorreos } from './envios-correos';

// Respuestas SIMULADAS con la forma de la documentación pública de cada correo (ver el aviso en envios-correos.ts): no prueban el servicio real.
const json = (cuerpo: unknown, estado = 200, headers: Record<string, string> = {}) => new Response(JSON.stringify(cuerpo), { status: estado, headers });
const pedido = { cp: 'C1425ABC', pesoGr: 1500, valorDeclarado: 20000 };

describe('Andreani', () => {
  const config = { usuario: 'u', clave: 'c', contrato: '400', cliente: 'CL1', sucursalOrigen: 'BAR' };
  it('inicia sesión una vez, manda el CP de 4 dígitos, kilos y volumen, y devuelve la tarifa con IVA', async () => {
    const f = vi.fn<typeof fetch>(async url => String(url).endsWith('/login') ? json({}, 200, { 'x-authorization-token': 'T1' }) : json({ tarifaConIva: { total: '8123.5' } }));
    const p = andreani({ ...config, fetch: f as never });
    const [op] = await p.cotizar(pedido);
    await p.cotizar(pedido);
    expect(op).toMatchObject({ proveedor: 'andreani', precio: 8124 });
    expect(f).toHaveBeenCalledTimes(3); // 1 login + 2 tarifas
    const url = new URL(String(f.mock.calls[1][0]));
    expect(url.searchParams.get('cpDestino')).toBe('1425');
    expect(url.searchParams.get('bultos[0][kilos]')).toBe('1.5');
    expect(url.searchParams.get('bultos[0][volumen]')).toBe('9000');
    expect((f.mock.calls[1][1] as RequestInit).headers).toMatchObject({ 'x-authorization-token': 'T1' });
  });
  it('un login rechazado o un precio raro hacen fallar al adaptador (para que entre el respaldo)', async () => {
    await expect(andreani({ ...config, fetch: (async () => json({}, 401)) as never }).cotizar(pedido)).rejects.toThrow(/login/);
    const f = async (u: string | URL | Request) => (String(u).endsWith('/login') ? json({}, 200, { 'x-authorization-token': 'T' }) : json({ tarifaConIva: { total: '-5' } }));
    await expect(andreani({ ...config, fetch: f as never }).cotizar(pedido)).rejects.toThrow(/precio inválido/);
  });
});

describe('Correo Argentino (MiCorreo)', () => {
  const config = { usuario: 'u', clave: 'c', clienteId: '0001', cpOrigen: '1000' };
  it('pide token y cotiza; devuelve una opción por servicio con sus plazos', async () => {
    const f = vi.fn<typeof fetch>(async url => String(url).endsWith('/token') ? json({ token: 'tk' }) : json({ rates: [
      { productName: 'Clásico', price: 6200, deliveryTimeMin: '3', deliveryTimeMax: '5' }, { productName: 'Expreso', price: 9100, deliveryTimeMin: '1', deliveryTimeMax: '2' },
    ] }));
    const ops = await correoArgentino({ ...config, fetch: f as never }).cotizar(pedido);
    expect(ops.map(o => [o.servicio, o.precio, o.diasMin, o.diasMax])).toEqual([['Correo Argentino Clásico', 6200, 3, 5], ['Correo Argentino Expreso', 9100, 1, 2]]);
    const cuerpo = JSON.parse((f.mock.calls[1][1] as RequestInit).body as string);
    expect(cuerpo).toMatchObject({ customerId: '0001', postalCodeOrigin: '1000', postalCodeDestination: '1425', dimensions: { weight: 1500 } });
  });
  it('sin token falla; sin tarifas devuelve lista vacía (el respaldo la toma)', async () => {
    await expect(correoArgentino({ ...config, fetch: (async () => json({})) as never }).cotizar(pedido)).rejects.toThrow(/token/);
    const f = async (u: string | URL | Request) => (String(u).endsWith('/token') ? json({ token: 'tk' }) : json({ rates: [] }));
    expect(await correoArgentino({ ...config, fetch: f as never }).cotizar(pedido)).toEqual([]);
  });
});

describe('OCA e-Pak', () => {
  const config = { cuit: '30-12345678-9', operativa: '123456', cpOrigen: '1000' };
  it('lee Total y PlazoEntrega del XML', async () => {
    const f = vi.fn<typeof fetch>(async () => new Response('<?xml version="1.0"?><NewDataSet><Table><Total>7345.80</Total><PlazoEntrega>4</PlazoEntrega></Table></NewDataSet>'));
    const [op] = await oca({ ...config, fetch: f as never }).cotizar(pedido);
    expect(op).toMatchObject({ proveedor: 'oca', precio: 7346, diasMax: 4 });
    const url = new URL(String(f.mock.calls[0][0]));
    expect(url.searchParams.get('CodigoPostalDestino')).toBe('1425');
    expect(url.searchParams.get('PesoTotal')).toBe('1.5');
  });
  it('un XML sin Total o un error HTTP fallan', async () => {
    await expect(oca({ ...config, fetch: (async () => new Response('<x/>')) as never }).cotizar(pedido)).rejects.toThrow(/Total/);
    await expect(oca({ ...config, fetch: (async () => new Response('', { status: 500 })) as never }).cotizar(pedido)).rejects.toThrow(/500/);
  });
});

describe('variosCorreos + respaldo', () => {
  const fijo = (nombre: string, precio: number): EnviosProvider => ({ nombre, cotizar: async () => [{ proveedor: nombre, servicio: nombre, precio, diasMin: 1, diasMax: 2 }] });
  const roto: EnviosProvider = { nombre: 'roto', cotizar: async () => { throw new Error('caído'); } };

  it('ordena por precio e ignora al que falla', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const ops = await variosCorreos([fijo('b', 900), roto, fijo('a', 500)]).cotizar(pedido);
    expect(ops.map(o => o.servicio)).toEqual(['a', 'b']);
  });
  it('si fallan todos, el respaldo de tarifa por zona deja comprar', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const p = conRespaldo(variosCorreos([roto, roto]), tarifaPorZona());
    const [op] = await p.cotizar({ cp: '1425', pesoGr: 500, valorDeclarado: 1000 });
    expect(op.proveedor).toBe('tarifa-por-zona');
  });
});

describe('activación por variables de entorno', () => {
  it('sin variables no hay correos y rige la tarifa por zona', async () => {
    expect(correosDesdeEnv({})).toEqual([]);
    expect(enviosDesdeEnv().nombre).toBe('tarifa-por-zona');
  });
  it('un correo con variables incompletas no se activa; con todas, sí', () => {
    expect(correosDesdeEnv({ ANDREANI_USUARIO: 'u', ANDREANI_CLAVE: 'c' })).toEqual([]);
    const lista = correosDesdeEnv({ ANDREANI_USUARIO: 'u', ANDREANI_CLAVE: 'c', ANDREANI_CONTRATO: '1', ANDREANI_CLIENTE: '2', OCA_CUIT: '30', OCA_OPERATIVA: '9', ENVIO_CP_ORIGEN: '1000' });
    expect(lista.map(p => p.nombre)).toEqual(['andreani', 'oca']);
  });
});
