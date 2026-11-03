import { describe, expect, it } from 'vitest';
import { fotoSegura, normalizarDatos } from './normalizar';
import { normalizarProducto } from './producto';
import { DATOS_INICIALES } from './seed';

describe('fotoSegura', () => {
  it('acepta rutas propias, https y data:image', () => {
    expect(fotoSegura('/img/productos/taza.webp')).toBe('/img/productos/taza.webp');
    expect(fotoSegura('https://x.vercel.app/api/foto?id=a')).toBe('https://x.vercel.app/api/foto?id=a');
    expect(fotoSegura('data:image/jpeg;base64,AAAA')).toBe('data:image/jpeg;base64,AAAA');
  });
  it('rechaza esquemas peligrosos o ajenos', () => {
    expect(fotoSegura('javascript:alert(1)')).toBe('');
    expect(fotoSegura('http://sitio.com/a.jpg')).toBe('');
    expect(fotoSegura('data:text/html;base64,AAAA')).toBe('');
    expect(fotoSegura(42)).toBe('');
  });
});

describe('normalizarDatos', () => {
  it('con basura devuelve los datos iniciales completos', () => {
    expect(normalizarDatos(null)).toEqual(DATOS_INICIALES);
    expect(normalizarDatos('hola').productos).toHaveLength(DATOS_INICIALES.productos.length);
  });

  it('descarta productos inválidos y limpia los válidos', () => {
    const d = normalizarDatos({
      tienda: { nombre: '  Mi Casa  ', whatsapp: '+54 9 11 5555-0000', hero3d: false },
      productos: [
        { id: 'a', nombre: 'Taza', categoria: 'Cocina', precio: 100, foto: 'javascript:x', tamanoCm: 9, tipoMedida: 'alto', incluye: ['  uno ', ''] },
        { id: '', nombre: 'sin id', precio: 5 },
        { id: 'b', nombre: 'precio feo', precio: 'caro' },
        null,
      ],
    });
    expect(d.tienda).toMatchObject({ nombre: 'Mi Casa', whatsapp: '+5491155550000', hero3d: false, camara: true });
    expect(d.productos).toHaveLength(1);
    expect(d.productos[0]).toMatchObject({ id: 'a', foto: '', tamanoCm: 9, tipoMedida: 'alto', incluye: ['uno'] });
  });

  it('un precio negativo se lleva a cero y una medida inválida se ignora', () => {
    const p = normalizarDatos({ productos: [{ id: 'a', nombre: 'X', precio: -5, tamanoCm: -3, tipoMedida: 'raro' }] }).productos[0];
    expect(p.precio).toBe(0);
    expect(p.tamanoCm).toBeUndefined();
    expect(p.tipoMedida).toBeUndefined();
  });

  it('una lista vacía de productos es válida (la tienda puede estar vacía)', () => {
    expect(normalizarDatos({ productos: [] }).productos).toEqual([]);
  });

  it('stock entero >= 0 (negativo = 0, vacío o texto = ilimitado) y SKU; con stock 0 el producto queda agotado', () => {
    const [a, b, c, d] = normalizarDatos({ productos: [
      { id: 'a', nombre: 'A', precio: 1, stock: 4.9, sku: '  AB-1 ' },
      { id: 'b', nombre: 'B', precio: 1, stock: 0 },
      { id: 'c', nombre: 'C', precio: 1, stock: -3 },
      { id: 'd', nombre: 'D', precio: 1, stock: 'mucho' },
    ] }).productos;
    expect(a).toMatchObject({ stock: 4, sku: 'AB-1' });
    expect(a.agotado).toBeUndefined();
    expect(b).toMatchObject({ stock: 0, agotado: true });
    expect(c.stock).toBe(0);
    expect(d.stock).toBeUndefined();
  });
});

describe('normalizarProducto: oferta, ocultar, fotos y variantes', () => {
  const base = { id: 'a', nombre: 'A', precio: 1000 };
  const uno = (extra: object) => normalizarProducto({ ...base, ...extra })!;

  it('el precio promocional debe ser menor al normal', () => {
    expect(uno({ precioPromo: 800 }).precioPromo).toBe(800);
    expect(uno({ precioPromo: 1000 }).precioPromo).toBeUndefined();
    expect(uno({ precioPromo: 0 }).precioPromo).toBeUndefined();
    expect(uno({ precioPromo: 'barato' }).precioPromo).toBeUndefined();
  });

  it('oculto solo vale con true', () => {
    expect(uno({ oculto: true }).oculto).toBe(true);
    expect(uno({ oculto: 'si' }).oculto).toBeUndefined();
  });

  it('las fotos extra pasan por fotoSegura y se acotan', () => {
    const p = uno({ fotos: ['/a.webp', 'javascript:x', 'https://x/b.jpg', 42, ...new Array(10).fill('/c.webp')] });
    expect(p.fotos).toEqual(['/a.webp', 'https://x/b.jpg', '/c.webp', '/c.webp', '/c.webp']);
    expect(uno({ fotos: [] }).fotos).toBeUndefined();
  });

  it('variantes: id derivado de los valores, sin repetidas ni incompletas, y manda su stock', () => {
    const p = uno({
      stock: 9, propiedades: ['Talle', 'Color'],
      variantes: [
        { valores: ['M', 'Rojo'], stock: 3, precio: 1200, sku: 'M-R' },
        { id: 'trucho', valores: ['M', 'Rojo'], stock: 99 }, // repetida: se descarta
        { valores: ['L', ''], stock: 1 }, // incompleta
        { valores: ['L', 'Azul'] },
        { valores: ['S', 'Negro'], stock: -4, precio: -1 },
      ],
    });
    expect(p.propiedades).toEqual(['Talle', 'Color']);
    expect(p.variantes).toEqual([
      { id: 'm-rojo', valores: ['M', 'Rojo'], stock: 3, precio: 1200, sku: 'M-R' },
      { id: 'l-azul', valores: ['L', 'Azul'] },
      { id: 's-negro', valores: ['S', 'Negro'], stock: 0 },
    ]);
    expect(p.stock).toBeUndefined(); // con variantes el stock del producto no cuenta
    expect(p.agotado).toBeUndefined(); // 'l-azul' es ilimitada
  });

  it('agotado cuando todas las variantes están en 0; sin propiedades usa «Opción»; más de 3 propiedades se recortan', () => {
    expect(uno({ variantes: [{ valores: ['M'], stock: 0 }, { valores: ['L'], stock: 0 }] })).toMatchObject({ agotado: true, propiedades: ['Opción'] });
    expect(uno({ propiedades: ['a', 'b', 'c', 'd'], variantes: [{ valores: ['1', '2', '3', '4'] }] }).propiedades).toEqual(['a', 'b', 'c']);
  });

  it('sin variantes válidas el producto vuelve a ser simple', () => {
    const p = uno({ stock: 2, propiedades: ['Talle'], variantes: [{ valores: [''] }, 'x'] });
    expect(p.variantes).toBeUndefined();
    expect(p.propiedades).toBeUndefined();
    expect(p.stock).toBe(2);
  });

  it('máximo 40 variantes', () => {
    const variantes = Array.from({ length: 60 }, (_, i) => ({ valores: [`v${i}`] }));
    expect(uno({ variantes }).variantes).toHaveLength(40);
  });
});
