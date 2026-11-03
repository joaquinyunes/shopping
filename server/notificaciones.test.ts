import { afterEach, describe, expect, it, vi } from 'vitest';
import { avisarSinFallar, avisosDesdeEnv, porResend, sinAvisos, textoDeAviso, type NotificacionesProvider } from './notificaciones';
import type { Pedido } from './pedidos';

const ahora = new Date();
const pedido = (email: string | undefined = 'ana@example.com'): Pedido => ({
  _id: 12, estado: 'pendiente', subtotal: 16000, total: 20500, creado: ahora, actualizado: ahora, historial: [],
  items: [{ id: 'remera', nombre: 'Remera <b>', cant: 2, precio: 8000, variante: { id: 'm', nombre: 'M' } }],
  envio: { proveedor: 'tarifa-por-zona', servicio: 'Envío a domicilio', precio: 4500 },
  cliente: { nombre: 'Ana', ...(email && { email }) },
});

describe('textoDeAviso', () => {
  it('lleva número, detalle con variante, envío y total', () => {
    const { asunto, texto } = textoDeAviso('creado', pedido(), 'Casa Nido');
    expect(asunto).toBe('Recibimos tu pedido (n.º 12) · Casa Nido');
    expect(texto).toContain('2 x Remera <b> (M) — $16.000');
    expect(texto).toContain('Envío a domicilio: $4.500');
    expect(texto).toContain('Total: $20.500');
  });
  it('cada evento tiene su propio asunto y el vencido explica qué pasó', () => {
    expect(textoDeAviso('enviado', pedido(), 'X').asunto).toMatch(/camino/);
    expect(textoDeAviso('vencido', pedido(), 'X').texto).toMatch(/liberamos los productos/);
  });
});

describe('porResend', () => {
  it('manda el POST con la clave en el encabezado y escapa el HTML', async () => {
    const pedir = vi.fn(async () => new Response('{}', { status: 200 }));
    await porResend({ apiKey: 're_test', from: 'Casa Nido <hola@casanido.test>', fetch: pedir as never }).avisar('pagado', pedido(), 'Casa Nido');
    const [url, init] = pedir.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe('https://api.resend.com/emails');
    expect((init.headers as Record<string, string>).Authorization).toBe('Bearer re_test');
    const cuerpo = JSON.parse(init.body as string);
    expect(cuerpo).toMatchObject({ from: 'Casa Nido <hola@casanido.test>', to: ['ana@example.com'] });
    expect(cuerpo.html).not.toContain('<b>');
    expect(cuerpo.html).toContain('&#60;b&#62;');
  });
  it('sin mail del cliente no llama a nadie; si Resend rechaza, lanza', async () => {
    const pedir = vi.fn(async () => new Response('{}', { status: 422 }));
    const p = porResend({ apiKey: 'k', from: 'f', fetch: pedir as never });
    await p.avisar('creado', pedido(''), 'X');
    expect(pedir).not.toHaveBeenCalled();
    await expect(p.avisar('creado', pedido(), 'X')).rejects.toThrow(/422/);
  });
});

describe('avisarSinFallar', () => {
  afterEach(() => { vi.restoreAllMocks(); delete process.env.RESEND_API_KEY; delete process.env.RESEND_FROM; });
  const roto: NotificacionesProvider = { nombre: 'roto', avisar: async () => { throw new Error('sin red'); } };

  it('un proveedor roto o lento nunca hace fallar al pedido: devuelve false y deja el error en el log', async () => {
    const log = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(await avisarSinFallar(roto, 'creado', pedido(), 'X')).toBe(false);
    expect(await avisarSinFallar({ nombre: 'lento', avisar: () => new Promise(() => {}) }, 'creado', pedido(), 'X', 20)).toBe(false);
    expect(log).toHaveBeenCalledTimes(2);
  });
  it('no avisa sin proveedor o sin mail; con ambos, sí', async () => {
    const ok = { nombre: 'ok', avisar: vi.fn(async () => {}) };
    expect(await avisarSinFallar(sinAvisos, 'creado', pedido(), 'X')).toBe(false);
    expect(await avisarSinFallar(ok, 'creado', pedido(''), 'X')).toBe(false);
    expect(await avisarSinFallar(ok, 'creado', pedido(), 'X')).toBe(true);
  });
  it('el proveedor sale de RESEND_API_KEY y RESEND_FROM; con una sola, no hay avisos', () => {
    expect(avisosDesdeEnv()).toBe(sinAvisos);
    process.env.RESEND_API_KEY = 'k';
    expect(avisosDesdeEnv()).toBe(sinAvisos);
    process.env.RESEND_FROM = 'hola@x.test';
    expect(avisosDesdeEnv().nombre).toBe('resend');
  });
});
