import { describe, expect, it } from 'vitest';
import { armarPedido, puedePasar, validarEntrada, type ProductoServidor } from './pedidos';

const cat: ProductoServidor[] = [
  { id: 'taza', nombre: 'Taza', precio: 8500, stock: 5, pesoGr: 300 },
  { id: 'vela', nombre: 'Vela', precio: 7200, agotado: true },
  { id: 'cero', nombre: 'Cero', precio: 100, stock: 0 },
  { id: 'libre', nombre: 'Libre', precio: 100 },
];

describe('validarEntrada', () => {
  it('acepta items y cliente mínimos y limpia los textos', () => {
    const r = validarEntrada({ items: [{ id: 'taza', cant: 2 }], cliente: { nombre: '  Ana ', telefono: '+54 9 11 5555-0000', cp: ' 1425 ' } });
    expect(r).toEqual({ items: [{ id: 'taza', cant: 2 }], cliente: { nombre: 'Ana', telefono: '+5491155550000', cp: '1425' } });
  });
  it.each([
    [null], [{}], [{ items: [] }], [{ items: [{ id: 'a', cant: 0 }], cliente: { nombre: 'x' } }],
    [{ items: [{ id: 'a', cant: 1.5 }], cliente: { nombre: 'x' } }], [{ items: [{ id: 'a', cant: 100 }], cliente: { nombre: 'x' } }],
    [{ items: [{ id: 'a', cant: 1 }], cliente: { nombre: '' } }], [{ items: [{ id: 'a', cant: 1 }] }],
    [{ items: new Array(51).fill({ id: 'a', cant: 1 }), cliente: { nombre: 'x' } }],
  ])('rechaza entradas inválidas %#', raw => expect(typeof validarEntrada(raw)).toBe('string'));
  it('junta las líneas repetidas del mismo producto', () => {
    const r = validarEntrada({ items: [{ id: 'taza', cant: 1 }, { id: 'taza', cant: 2 }], cliente: { nombre: 'x' } });
    expect(r).toMatchObject({ items: [{ id: 'taza', cant: 3 }] });
  });
});

describe('armarPedido', () => {
  const entrada = (items: Array<{ id: string; cant: number }>) => ({ items, cliente: { nombre: 'Ana' } });

  it('toma precio y nombre del catálogo del servidor, nunca del cliente', () => {
    const r = armarPedido(cat, { items: [{ id: 'taza', cant: 2, precio: 1 } as never], cliente: { nombre: 'Ana' } });
    expect(r).toMatchObject({ subtotal: 17000, pesoGr: 600, items: [{ id: 'taza', nombre: 'Taza', precio: 8500, cant: 2 }] });
  });
  it('rechaza productos inexistentes, agotados o sin stock', () => {
    expect(armarPedido(cat, entrada([{ id: 'nada', cant: 1 }]))).toMatch(/no existe/i);
    expect(armarPedido(cat, entrada([{ id: 'vela', cant: 1 }]))).toMatch(/agotado/i);
    expect(armarPedido(cat, entrada([{ id: 'cero', cant: 1 }]))).toMatch(/agotado/i);
    expect(armarPedido(cat, entrada([{ id: 'taza', cant: 6 }]))).toMatch(/stock/i);
  });
  it('un producto sin stock cargado es ilimitado', () => {
    expect(armarPedido(cat, entrada([{ id: 'libre', cant: 99 }]))).toMatchObject({ subtotal: 9900 });
  });
});

describe('puedePasar', () => {
  it('sigue el camino pendiente → pagado → enviado → entregado', () => {
    expect(puedePasar('pendiente', 'pagado')).toBe(true);
    expect(puedePasar('pagado', 'enviado')).toBe(true);
    expect(puedePasar('enviado', 'entregado')).toBe(true);
  });
  it('se puede cancelar antes de enviar y reabrir una cancelada, nada más', () => {
    expect(puedePasar('pendiente', 'cancelado')).toBe(true);
    expect(puedePasar('pagado', 'cancelado')).toBe(true);
    expect(puedePasar('cancelado', 'pendiente')).toBe(true);
    expect(puedePasar('enviado', 'cancelado')).toBe(false);
    expect(puedePasar('entregado', 'pendiente')).toBe(false);
    expect(puedePasar('pendiente', 'enviado')).toBe(false);
    expect(puedePasar('pendiente', 'pendiente')).toBe(false);
  });
});
