import { describe, expect, it } from 'vitest';
import { fotoSegura, normalizarDatos } from './normalizar';
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
});
