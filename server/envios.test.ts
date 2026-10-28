import { describe, expect, it } from 'vitest';
import { cotizarEnvio, tarifaPorZona, zonaDeCp } from './envios';

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
