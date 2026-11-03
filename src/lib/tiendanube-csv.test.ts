import { describe, expect, it } from 'vitest';
import { exportarCsv, importarCsv, leerCsv } from './tiendanube-csv';
import type { Producto } from '../tipos';

const p = (o: Partial<Producto>): Producto => ({ id: 'taza', nombre: 'Taza', categoria: 'Cocina', precio: 8500, foto: '/img/taza.webp', ...o });

describe('leerCsv', () => {
  it('maneja comillas, comas, saltos de línea, BOM y CRLF', () => {
    const filas = leerCsv('﻿a,b\r\n"x, y","di ""hola""\nchau"\r\n');
    expect(filas).toEqual([['a', 'b'], ['x, y', 'di "hola"\nchau']]);
  });
});

describe('exportarCsv', () => {
  const csv = exportarCsv([p({ stock: 3, sku: 'TZ-1', pesoGr: 350, descripcion: 'Esmalte, mate', categoria: 'Deco' })]);
  const [cabeza, fila] = leerCsv(csv);
  const col = (n: string) => fila[cabeza.indexOf(n)];

  it('usa los encabezados de la plantilla de Tiendanube', () => {
    for (const c of ['Identificador de URL', 'Nombre', 'Categorías', 'Precio', 'Peso', 'Stock', 'SKU', 'Mostrar en tienda', 'Descripción']) {
      expect(cabeza).toContain(c);
    }
  });
  it('escribe precio con punto, peso en kg y stock numérico', () => {
    expect(col('Identificador de URL')).toBe('taza');
    expect(col('Precio')).toBe('8500');
    expect(col('Peso')).toBe('0.35');
    expect(col('Stock')).toBe('3');
    expect(col('SKU')).toBe('TZ-1');
    expect(col('Descripción')).toBe('Esmalte, mate');
    expect(col('Mostrar en tienda')).toBe('SI');
  });
  it('stock vacío = ilimitado; agotado manual sale con stock 0', () => {
    const [h, a, b] = leerCsv(exportarCsv([p({}), p({ id: 'vela', agotado: true })]));
    expect(a[h.indexOf('Stock')]).toBe('');
    expect(b[h.indexOf('Stock')]).toBe('0');
  });
  it('si el id no es un identificador de URL válido, lo arma desde el nombre', () => {
    const [h, f] = leerCsv(exportarCsv([p({ id: 'Id raro/ñ', nombre: 'Lámpara de Mesa' })]));
    expect(f[h.indexOf('Identificador de URL')]).toBe('lampara-de-mesa');
  });
});

describe('importarCsv', () => {
  const base = [p({ id: 'taza', foto: '/img/taza.webp', tamanoCm: 9 })];
  const encabezado = 'Identificador de URL,Nombre,Categorías,Precio,Peso,Stock,SKU,Mostrar en tienda,Descripción';

  it('actualiza los existentes sin perder foto ni medidas, y crea los nuevos', () => {
    const r = importarCsv(`${encabezado}\ntaza,Taza grande,Cocina,9000.50,0.4,5,TZ,SI,Nueva\nvela,Vela,Deco,7200,,,,SI,`, base);
    expect(r.errores).toEqual([]);
    expect(r.productos).toHaveLength(2);
    expect(r.productos[0]).toMatchObject({ id: 'taza', nombre: 'Taza grande', precio: 9000.5, pesoGr: 400, stock: 5, sku: 'TZ', foto: '/img/taza.webp', tamanoCm: 9, descripcion: 'Nueva' });
    expect(r.productos[1]).toMatchObject({ id: 'vela', nombre: 'Vela', categoria: 'Deco', precio: 7200, foto: '' });
    expect(r.productos[1].stock).toBeUndefined();
  });

  it('en existentes, celda vacía = sin cambios; "-" en stock = ilimitado; 0 = agotado', () => {
    const conStock = [p({ id: 'a', stock: 4 }), p({ id: 'b', stock: 4 }), p({ id: 'c', stock: 4 })];
    const r = importarCsv(`Identificador de URL,Nombre,Precio,Stock\na,,,\nb,,,-\nc,,,0`, conStock);
    expect(r.errores).toEqual([]);
    expect(r.productos.find(x => x.id === 'a')!.stock).toBe(4);
    expect(r.productos.find(x => x.id === 'b')!.stock).toBeUndefined();
    expect(r.productos.find(x => x.id === 'c')!.stock).toBe(0);
  });

  it('reporta filas inválidas con su número y sigue con las demás', () => {
    const r = importarCsv(`${encabezado}\n,Sin handle,Deco,100,,,,SI,\nnuevo,,Deco,100,,,,SI,\nmalo,Malo,Deco,abc,,,,SI,\nbien,Bien,Deco,100,,-1,,SI,`, []);
    expect(r.productos.map(x => x.id)).toEqual([]);
    expect(r.errores).toHaveLength(4);
    expect(r.errores[0]).toMatch(/Fila 2/);
  });

  it('las filas que repiten el identificador son variantes del mismo producto', () => {
    const r = importarCsv(`Identificador de URL,Nombre,Precio,Precio promocional,Nombre de propiedad 1,Valor de propiedad 1,Nombre de propiedad 2,Valor de propiedad 2,Stock,SKU
almohadon,Almohadón,100,80,Color,Rojo,Talle,M,2,AR
almohadon,,100,,Color,Azul,Talle,L,3,
almohadon,,150,,Color,Azul,Talle,S,-,AS`, []);
    expect(r.errores).toEqual([]);
    expect(r.productos).toHaveLength(1);
    expect(r.productos[0]).toMatchObject({ precio: 100, precioPromo: 80, propiedades: ['Color', 'Talle'] });
    expect(r.productos[0].stock).toBeUndefined();
    expect(r.productos[0].variantes).toEqual([
      { id: 'rojo-m', valores: ['Rojo', 'M'], stock: 2, sku: 'AR' },
      { id: 'azul-l', valores: ['Azul', 'L'], stock: 3 },
      { id: 'azul-s', valores: ['Azul', 'S'], precio: 150, sku: 'AS' },
    ]);
  });

  it('al reimportar variantes, la celda vacía conserva el stock y el precio propio', () => {
    const con = [p({ id: 'remera', propiedades: ['Talle'], variantes: [{ id: 'm', valores: ['M'], stock: 5, precio: 9000 }, { id: 'l', valores: ['L'], stock: 1 }] })];
    const r = importarCsv(`Identificador de URL,Nombre de propiedad 1,Valor de propiedad 1,Stock,Precio
remera,Talle,M,,
remera,Talle,L,7,`, con);
    expect(r.errores).toEqual([]);
    expect(r.productos[0].variantes).toEqual([{ id: 'm', valores: ['M'], stock: 5, precio: 9000 }, { id: 'l', valores: ['L'], stock: 7 }]);
  });

  it('una fila repetida sin propiedades se informa y no se toma', () => {
    const r = importarCsv(`${encabezado}
x,X,Deco,100,,,,SI,
x,X,Deco,100,,,,SI,`, []);
    expect(r.productos).toHaveLength(1);
    expect(r.errores.join(' ')).toMatch(/Fila 3/);
  });

  it('Mostrar en tienda = NO oculta el producto y SI lo vuelve a mostrar', () => {
    const r = importarCsv(`${encabezado}
x,X,Deco,100,,,,NO,
y,Y,Deco,100,,,,SI,`, [p({ id: 'y', oculto: true })]);
    expect(r.productos.find(x => x.id === 'x')!.oculto).toBe(true);
    expect(r.productos.find(x => x.id === 'y')!.oculto).toBeUndefined();
  });

  it('precio promocional inválido es un error de esa fila', () => {
    expect(importarCsv(`Identificador de URL,Nombre,Precio,Precio promocional
x,X,100,barato`, []).errores[0]).toMatch(/promocional/);
  });

  it('sin la columna "Identificador de URL" no importa nada', () => {
    const r = importarCsv('Nombre,Precio\nTaza,100', []);
    expect(r.productos).toEqual([]);
    expect(r.errores[0]).toMatch(/Identificador de URL/);
  });

  it('exportar e importar da lo mismo', () => {
    const orig = [p({ stock: 2, sku: 'A', pesoGr: 120, descripcion: 'x, "y"' }), p({ id: 'vela', nombre: 'Vela', categoria: 'Deco', precio: 10.5, agotado: true })];
    const r = importarCsv(exportarCsv(orig), orig);
    expect(r.errores).toEqual([]);
    expect(r.productos).toEqual(orig.map(o => ({ ...o, ...(o.agotado ? { stock: 0 } : {}) })));
  });

  it('exportar e importar conserva variantes, oferta y ocultos', () => {
    const orig = [
      p({ id: 'remera', nombre: 'Remera', precio: 100, precioPromo: 80, oculto: true, propiedades: ['Talle', 'Color'], variantes: [
        { id: 'm-rojo', valores: ['M', 'Rojo'], stock: 2, sku: 'MR' }, { id: 'l-azul', valores: ['L', 'Azul'], precio: 150 },
      ] }),
      p({ id: 'taza', precioPromo: 7000 }),
    ];
    const csv = exportarCsv(orig);
    const filas = leerCsv(csv);
    expect(filas).toHaveLength(4); // encabezado + 2 variantes + taza
    expect(filas[2][filas[0].indexOf('Nombre')]).toBe(''); // la fila de variante no repite datos del producto
    const r = importarCsv(csv, []);
    expect(r.errores).toEqual([]);
    expect(r.productos.map(({ foto: _f, ...resto }) => resto)).toEqual(orig.map(({ foto: _f, ...resto }) => resto)); // eslint-disable-line @typescript-eslint/no-unused-vars
  });
});
