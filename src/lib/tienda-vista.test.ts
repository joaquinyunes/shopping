import { describe, expect, it } from 'vitest';
import { buscarProductos, destacadosDe, idDeRuta, relacionadosDe, rutaFicha, srcSetDe, stockVisible } from './tienda-vista';
import type { Producto } from '../tipos';

const p = (o: Partial<Producto> & { id: string }): Producto => ({ nombre: o.id, categoria: 'Cocina', precio: 1000, foto: `/img/${o.id}.webp`, ...o });

describe('buscarProductos', () => {
  const lista = [
    p({ id: 'taza', nombre: 'Taza de cerámica', descripcion: 'Esmalte mate' }),
    p({ id: 'toallas', nombre: 'Juego de toallas', categoria: 'Baño' }),
    p({ id: 'vela', nombre: 'Vela aromática', categoria: 'Deco' }),
  ];
  it('ignora mayúsculas y tildes, en nombre, descripción y categoría', () => {
    expect(buscarProductos(lista, 'CERAMICA').map(x => x.id)).toEqual(['taza']);
    expect(buscarProductos(lista, 'esmalte').map(x => x.id)).toEqual(['taza']);
    expect(buscarProductos(lista, 'bano').map(x => x.id)).toEqual(['toallas']);
  });
  it('todas las palabras tienen que estar', () => {
    expect(buscarProductos(lista, 'vela deco').map(x => x.id)).toEqual(['vela']);
    expect(buscarProductos(lista, 'vela taza')).toEqual([]);
  });
  it('sin texto devuelve todo', () => {
    expect(buscarProductos(lista, '  ')).toHaveLength(3);
  });
});

describe('relacionadosDe', () => {
  const lista = [
    p({ id: 'a' }), p({ id: 'b' }), p({ id: 'c', categoria: 'Deco' }), p({ id: 'd', categoria: 'Deco', agotado: true }),
    p({ id: 'e', foto: '' }), p({ id: 'f', categoria: 'Baño' }),
  ];
  it('primero los de la misma categoría, sin el propio, sin agotados ni sin foto', () => {
    expect(relacionadosDe(lista, lista[0], 4).map(x => x.id)).toEqual(['b', 'c', 'f']);
  });
  it('respeta el tope', () => {
    expect(relacionadosDe(lista, lista[0], 1).map(x => x.id)).toEqual(['b']);
  });
});

describe('destacadosDe', () => {
  it('las ofertas van primero, no entran agotados ni sin foto, y respeta el tope', () => {
    const lista = [
      p({ id: 'a' }), p({ id: 'b', precioPromo: 500 }), p({ id: 'c', agotado: true }), p({ id: 'd', foto: '' }), p({ id: 'e' }), p({ id: 'f' }),
    ];
    expect(destacadosDe(lista, 3).map(x => x.id)).toEqual(['b', 'a', 'e']);
  });
});

describe('stockVisible', () => {
  it('con variante manda el de la variante; sin valor, el del producto; sin ninguno, indefinido', () => {
    expect(stockVisible(p({ id: 'a', stock: 9 }), { stock: 2 })).toBe(2);
    expect(stockVisible(p({ id: 'a', stock: 9 }), { stock: undefined })).toBeUndefined();
    expect(stockVisible(p({ id: 'a', stock: 9 }))).toBe(9);
    expect(stockVisible(p({ id: 'a' }))).toBeUndefined();
  });
});

describe('ruta de la ficha', () => {
  it('ida y vuelta, también con caracteres raros', () => {
    expect(idDeRuta(rutaFicha('taza'))).toBe('taza');
    expect(idDeRuta(rutaFicha('a b/ñ'))).toBe('a b/ñ');
  });
  it('otras rutas no son una ficha', () => {
    expect(idDeRuta('#catalogo')).toBeNull();
    expect(idDeRuta('#/admin')).toBeNull();
    expect(idDeRuta('')).toBeNull();
    expect(idDeRuta('#/producto/')).toBeNull();
  });
});

describe('srcSetDe', () => {
  it('las fotos de ejemplo tienen versión chica; las subidas o de otro lugar, no', () => {
    expect(srcSetDe('/img/productos/taza.webp')).toBe('/img/productos/taza-400.webp 400w, /img/productos/taza.webp 640w');
    expect(srcSetDe('https://x.test/a.jpg')).toBeUndefined();
    expect(srcSetDe('data:image/png;base64,AAA')).toBeUndefined();
    expect(srcSetDe('/api/foto?id=1')).toBeUndefined();
  });
});
