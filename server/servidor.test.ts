import { afterEach, describe, expect, it } from 'vitest';
import { datosValidos, tipoDeImagen } from './foto';
import { cors, esAdmin, leerCuerpo, CuerpoGrande, type Req, type Res } from './http';
import { Readable } from 'node:stream';

const pedido = (headers: Record<string, string> = {}, method = 'GET') => ({ headers, method }) as unknown as Req;

describe('tipoDeImagen', () => {
  it('reconoce JPG, PNG y WebP por los bytes', () => {
    expect(tipoDeImagen(Uint8Array.from([0xff, 0xd8, 0xff, 0xe0]))).toBe('image/jpeg');
    expect(tipoDeImagen(Uint8Array.from([0x89, 0x50, 0x4e, 0x47, 0, 0, 0, 0]))).toBe('image/png');
    expect(tipoDeImagen(Buffer.from('RIFF\0\0\0\0WEBPVP8 '))).toBe('image/webp');
  });
  it('rechaza lo demás aunque diga ser imagen', () => {
    expect(tipoDeImagen(Buffer.from('<svg onload=alert(1)>'))).toBeNull();
    expect(tipoDeImagen(new Uint8Array())).toBeNull();
  });
});

describe('datosValidos', () => {
  it('pide tienda y lista de productos acotada', () => {
    expect(datosValidos({ tienda: {}, productos: [] })).toBe(true);
    expect(datosValidos({ tienda: {}, productos: 'x' })).toBe(false);
    expect(datosValidos({ productos: [] })).toBe(false);
    expect(datosValidos({ tienda: {}, productos: new Array(501).fill({}) })).toBe(false);
    expect(datosValidos(null)).toBe(false);
  });
});

describe('esAdmin', () => {
  const antes = process.env.ADMIN_PASSWORD;
  afterEach(() => { if (antes === undefined) delete process.env.ADMIN_PASSWORD; else process.env.ADMIN_PASSWORD = antes; });

  it('acepta solo la clave exacta', () => {
    process.env.ADMIN_PASSWORD = 'secreta';
    expect(esAdmin(pedido({ 'x-admin-clave': 'secreta' }))).toBe(true);
    expect(esAdmin(pedido({ 'x-admin-clave': 'secreta ' }))).toBe(false);
    expect(esAdmin(pedido({}))).toBe(false);
  });
  it('sin ADMIN_PASSWORD nadie entra, ni con clave vacía', () => {
    delete process.env.ADMIN_PASSWORD;
    expect(esAdmin(pedido({ 'x-admin-clave': '' }))).toBe(false);
    expect(esAdmin(pedido({ 'x-admin-clave': 'x' }))).toBe(false);
  });
});

describe('cors', () => {
  const respuesta = () => {
    const h: Record<string, string> = {};
    return { h, res: { setHeader: (k: string, v: string) => { h[k] = v; }, end() {}, statusCode: 0 } as unknown as Res };
  };
  it('deja pasar solo los orígenes permitidos y resuelve el preflight', () => {
    const a = respuesta();
    expect(cors(pedido({ origin: 'https://casa-nido.onrender.com' }, 'OPTIONS'), a.res)).toBe(true);
    expect(a.h['Access-Control-Allow-Origin']).toBe('https://casa-nido.onrender.com');
    const b = respuesta();
    expect(cors(pedido({ origin: 'https://malo.example' }), b.res)).toBe(false);
    expect(b.h['Access-Control-Allow-Origin']).toBeUndefined();
    expect(b.h['Vary']).toBe('Origin');
  });
});

describe('leerCuerpo', () => {
  it('corta cuando pasa el máximo', async () => {
    await expect(leerCuerpo(Readable.from([Buffer.alloc(10)]) as unknown as Req, 5)).rejects.toBeInstanceOf(CuerpoGrande);
    expect((await leerCuerpo(Readable.from([Buffer.from('ab'), Buffer.from('cd')]) as unknown as Req, 10)).toString()).toBe('abcd');
  });
});
