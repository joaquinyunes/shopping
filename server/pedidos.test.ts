import { describe, expect, it } from 'vitest';
import { armarPedido, puedePasar, validarEntrada, validarItems, type ProductoServidor } from './pedidos';

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


describe('variantes, oferta y ocultos (puro)', () => {
  const remera: ProductoServidor = {
    id: 'remera', nombre: 'Remera', precio: 10000, precioPromo: 8000, propiedades: ['Talle'],
    variantes: [{ id: 'm', valores: ['M'], stock: 2 }, { id: 'l', valores: ['L'], precio: 12000 }, { id: 's', valores: ['S'], stock: 0 }],
  };
  const catalogo2 = [remera, { id: 'oculta', nombre: 'Oculta', precio: 1, oculto: true }, { id: 'promo', nombre: 'Promo', precio: 1000, precioPromo: 700 }];
  const armar = (items: Array<{ id: string; cant: number; variante?: string }>) => armarPedido(catalogo2, { items, cliente: { nombre: 'Ana' } });

  it('cobra el precio de la variante, o la oferta del producto', () => {
    expect(armar([{ id: 'remera', variante: 'm', cant: 2 }, { id: 'remera', variante: 'l', cant: 1 }, { id: 'promo', cant: 1 }]))
      .toMatchObject({ subtotal: 16000 + 12000 + 700 });
  });
  it('exige variante, rechaza la agotada, la inexistente, la sobrante en producto simple y los ocultos', () => {
    expect(armar([{ id: 'remera', cant: 1 }])).toMatch(/Elegí una opción/);
    expect(armar([{ id: 'remera', variante: 's', cant: 1 }])).toMatch(/agotado/);
    expect(armar([{ id: 'remera', variante: 'm', cant: 3 }])).toMatch(/stock suficiente.*quedan 2/);
    expect(armar([{ id: 'remera', variante: 'xxl', cant: 1 }])).toMatch(/ya no existe/);
    expect(armar([{ id: 'promo', variante: 'm', cant: 1 }])).toMatch(/ya no existe/);
    expect(armar([{ id: 'oculta', cant: 1 }])).toMatch(/ya no existe/);
  });
  it('junta las líneas repetidas de la misma variante pero no las de variantes distintas', () => {
    const r = validarItems([{ id: 'remera', variante: 'm', cant: 1 }, { id: 'remera', variante: 'm', cant: 2 }, { id: 'remera', variante: 'l', cant: 1 }]);
    expect(r).toEqual([{ id: 'remera', variante: 'm', cant: 3 }, { id: 'remera', variante: 'l', cant: 1 }]);
    expect(typeof validarItems([{ id: 'a', variante: '', cant: 1 }])).toBe('string');
  });
  it('el mail se normaliza y se valida', () => {
    expect(validarEntrada({ items: [{ id: 'a', cant: 1 }], cliente: { nombre: 'x', email: ' ANA@Example.com ' } })).toMatchObject({ cliente: { email: 'ana@example.com' } });
    expect(typeof validarEntrada({ items: [{ id: 'a', cant: 1 }], cliente: { nombre: 'x', email: 'ana@' } })).toBe('string');
  });
});
