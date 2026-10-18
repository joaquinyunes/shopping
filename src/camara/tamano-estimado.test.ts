import { describe, expect, it } from 'vitest';
import { etiquetaMedida, medidaDelProducto } from './tamano-estimado';

describe('medidaDelProducto', () => {
  it('usa la medida real cuando la dueña la cargó', () => {
    const m = medidaDelProducto({ nombre: 'Taza', tamanoCm: 11, tipoMedida: 'alto' });
    expect(m).toEqual({ cm: 11, tipo: 'alto', estimada: false });
  });

  it('estima por palabra clave, sin importar acentos ni mayúsculas', () => {
    expect(medidaDelProducto({ nombre: 'Lámpara de mesa' })).toMatchObject({ cm: 40, tipo: 'alto', estimada: true });
    expect(medidaDelProducto({ nombre: 'SET DE PLATOS' })).toMatchObject({ cm: 26, tipo: 'diametro', estimada: true });
    expect(medidaDelProducto({ nombre: 'Almohadón de lino' })).toMatchObject({ tipo: 'ancho' });
  });

  it('un producto desconocido recibe una estimación genérica marcada como aprox.', () => {
    expect(medidaDelProducto({ nombre: 'Objeto raro' })).toEqual({ cm: 20, tipo: 'alto', estimada: true });
  });

  it('si la dueña cargó cm pero no el tipo, deduce el tipo del nombre', () => {
    expect(medidaDelProducto({ nombre: 'Plato hondo', tamanoCm: 22 }).tipo).toBe('diametro');
  });

  it('etiqueta con Ø para redondos y "aprox." para estimadas', () => {
    expect(etiquetaMedida({ cm: 26, tipo: 'diametro', estimada: true })).toBe('Ø 26 cm (aprox.)');
    expect(etiquetaMedida({ cm: 9.5, tipo: 'alto', estimada: false })).toBe('9,5 cm de alto');
  });
});
