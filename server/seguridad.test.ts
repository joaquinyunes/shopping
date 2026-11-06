import { describe, expect, it } from 'vitest';
import { diferencias } from './auditoria';
import { parsearJson, tieneOperadores } from './http';
import { huellaDeOrigen, redDeIp } from './pedidos';
import { DURACION_SESION_MS, firmarSesion, sesionValida } from './sesion';
import { base32Codificar, base32Decodificar, codigoDePaso, generarSecreto, pasoDe, pasoValido, uriOtpauth } from './totp';
import type { Producto } from '../src/tipos';

// Secreto de los vectores de prueba del RFC 6238 (ASCII «12345678901234567890»).
const RFC = base32Codificar(Buffer.from('12345678901234567890'));

describe('TOTP (RFC 6238)', () => {
  it('coincide con los vectores del RFC (los 6 dígitos finales de cada código de 8)', () => {
    expect(codigoDePaso(RFC, pasoDe(59_000))).toBe('287082');
    expect(codigoDePaso(RFC, pasoDe(1_111_111_109_000))).toBe('081804');
    expect(codigoDePaso(RFC, pasoDe(1_234_567_890_000))).toBe('005924');
    expect(codigoDePaso(RFC, pasoDe(2_000_000_000_000))).toBe('279037');
  });
  it('base32 de ida y vuelta, y rechaza caracteres que no son base32', () => {
    expect(base32Decodificar(RFC).toString()).toBe('12345678901234567890');
    expect(base32Decodificar(generarSecreto())).toHaveLength(20);
    expect(() => base32Decodificar('ABC1')).toThrow();
  });
  it('acepta el paso actual y ±1, rechaza el resto y lo que no son 6 dígitos', () => {
    const ahora = 1_700_000_000_000;
    const en = (d: number) => codigoDePaso(RFC, pasoDe(ahora) + d);
    for (const d of [-1, 0, 1]) expect(pasoValido(RFC, en(d), ahora)).toBe(pasoDe(ahora) + d);
    expect(pasoValido(RFC, en(2), ahora)).toBeNull();
    expect(pasoValido(RFC, en(-2), ahora)).toBeNull();
    expect(pasoValido(RFC, '12345', ahora)).toBeNull();
    expect(pasoValido(RFC, 'abcdef', ahora)).toBeNull();
  });
  it('arma la dirección otpauth para la app del celular', () => {
    expect(uriOtpauth('ABC', 'dueña', 'Casa Nido')).toBe('otpauth://totp/Casa%20Nido%3Adue%C3%B1a?secret=ABC&issuer=Casa%20Nido&digits=6&period=30');
  });
});

describe('sesión firmada', () => {
  const antes = process.env.ADMIN_PASSWORD;
  process.env.ADMIN_PASSWORD = 'una-clave-larga-de-prueba';

  it('vale hasta que vence y no se puede alterar ni armar a mano', () => {
    const t = 1_700_000_000_000;
    const { token, expira } = firmarSesion(t);
    expect(expira).toBe(t + DURACION_SESION_MS);
    expect(sesionValida(token, undefined, t + 1000)).toBe(true);
    expect(sesionValida(token, undefined, expira + 1)).toBe(false);
    expect(sesionValida(token.replace(String(expira), String(expira + 1)), undefined, t)).toBe(false);
    expect(sesionValida(`${t}.${expira}.firma-falsa`, undefined, t)).toBe(false);
    expect(sesionValida('', undefined, t)).toBe(false);
    expect(sesionValida(`${token}.extra`, undefined, t)).toBe(false);
  });
  it('«cerrar todas» invalida lo emitido antes; cambiar la contraseña invalida todo', () => {
    const t = 1_700_000_000_000;
    const { token } = firmarSesion(t);
    expect(sesionValida(token, new Date(t + 1), t + 2)).toBe(false);
    expect(sesionValida(token, new Date(t), t + 2)).toBe(true);
    process.env.ADMIN_PASSWORD = 'otra-clave-larga-distinta';
    expect(sesionValida(token, undefined, t + 2)).toBe(false);
    if (antes === undefined) delete process.env.ADMIN_PASSWORD; else process.env.ADMIN_PASSWORD = antes;
  });
});

describe('operadores de Mongo en el JSON', () => {
  it('detecta $ y puntos en claves a cualquier profundidad', () => {
    expect(tieneOperadores({ a: { $ne: 1 } })).toBe(true);
    expect(tieneOperadores([{ a: [{ 'b.c': 1 }] }])).toBe(true);
    expect(tieneOperadores({ nombre: 'Ana', precio: 100, tags: ['a', 'b'], valor: '$ne', n: null })).toBe(false);
  });
  it('un cuerpo con operadores o roto es 400', () => {
    expect(() => parsearJson(Buffer.from('{"x":{"$gt":0}}'))).toThrow(/Datos inválidos/);
    expect(() => parsearJson(Buffer.from('{roto'))).toThrow(/JSON inválido/);
    expect(parsearJson(Buffer.from('{"x":1}'))).toEqual({ x: 1 });
  });
});

describe('origen de una conexión', () => {
  it('IPv4 y ::ffff:IPv4 es la misma dirección; IPv6 se cuenta por red /64', () => {
    expect(redDeIp('203.0.113.7')).toBe('203.0.113.7');
    expect(redDeIp('::ffff:203.0.113.7')).toBe('203.0.113.7');
    expect(redDeIp('2001:db8:abcd:12:aaaa:bbbb:cccc:dddd')).toBe('2001:db8:abcd:12::/64');
    expect(redDeIp('2001:0DB8:abcd:0012::1')).toBe('2001:db8:abcd:12::/64');
    expect(redDeIp('2001:db8::1')).toBe('2001:db8:0:0::/64');
  });
  it('dos direcciones de la misma red /64 dan la misma huella; otra red, otra huella', () => {
    expect(huellaDeOrigen('2001:db8:abcd:12::1')).toBe(huellaDeOrigen('2001:db8:abcd:12:ffff:ffff:ffff:ffff'));
    expect(huellaDeOrigen('2001:db8:abcd:12::1')).not.toBe(huellaDeOrigen('2001:db8:abcd:13::1'));
    expect(huellaDeOrigen('203.0.113.7')).not.toBe(huellaDeOrigen('203.0.113.8'));
  });
});

describe('auditoría: diferencias entre catálogos', () => {
  const p = (o: Partial<Producto> & { id: string }): Producto => ({ nombre: o.id, categoria: 'X', precio: 100, foto: '', ...o });
  it('sin cambios no hay nada que registrar', () => {
    expect(diferencias([p({ id: 'a', stock: 3 })], [p({ id: 'a', stock: 3 })])).toEqual([]);
  });
  it('precio, oferta, stock, ocultar, altas y bajas', () => {
    const antes = [p({ id: 'a', stock: 3 }), p({ id: 'b' })];
    const despues = [p({ id: 'a', stock: 5, precio: 120, precioPromo: 90, oculto: true }), p({ id: 'c' })];
    expect(diferencias(antes, despues)).toEqual(expect.arrayContaining([
      { producto: 'a', campo: 'precio', antes: 100, despues: 120 },
      { producto: 'a', campo: 'precioPromo', antes: undefined, despues: 90 },
      { producto: 'a', campo: 'stock', antes: 3, despues: 5 },
      { producto: 'a', campo: 'oculto', antes: undefined, despues: true },
      { producto: 'c', campo: 'alta', despues: 100 },
      { producto: 'b', campo: 'baja', antes: 100 },
    ]));
  });
  it('cambios por variante', () => {
    const v = (stock: number, precio?: number) => ({ id: 'm', valores: ['M'], stock, precio });
    const r = diferencias([p({ id: 'a', variantes: [v(2)] })], [p({ id: 'a', variantes: [v(1, 150)] })]);
    expect(r).toEqual([
      { producto: 'a', campo: 'variante:m:precio', antes: undefined, despues: 150 },
      { producto: 'a', campo: 'variante:m:stock', antes: 2, despues: 1 },
    ]);
  });
});
