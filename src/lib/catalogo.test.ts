import { describe, expect, it } from 'vitest';
import { claveLinea, enOferta, estaAgotado, etiquetaVariante, idVariante, precioDe, precioVigente, rangoDePrecios, separarClave } from './catalogo';
import type { Variante } from '../tipos';

const v = (o: Partial<Variante> = {}): Variante => ({ id: 'm-rojo', valores: ['M', 'Rojo'], ...o });

describe('idVariante / etiquetaVariante', () => {
  it('une los valores sin tildes ni mayúsculas', () => {
    expect(idVariante(['M', 'Rojo'])).toBe('m-rojo');
    expect(idVariante(['Chico', 'Azul marino'])).toBe('chico-azul-marino');
    expect(idVariante(['Lino', 'Crudo ñandú'])).toBe('lino-crudo-nandu');
  });
  it('vacío si falta algún valor o no tiene letras ni números', () => {
    expect(idVariante(['M', ''])).toBe('');
    expect(idVariante(['M', '---'])).toBe('');
    expect(idVariante([])).toBe('');
  });
  it('la etiqueta muestra los valores en orden', () => expect(etiquetaVariante(v())).toBe('M / Rojo'));
});

describe('precios', () => {
  it('el promocional solo vale si es menor al normal', () => {
    expect(precioVigente({ precio: 1000, precioPromo: 800 })).toBe(800);
    expect(precioVigente({ precio: 1000, precioPromo: 1000 })).toBe(1000);
    expect(precioVigente({ precio: 1000, precioPromo: 1500 })).toBe(1000);
    expect(precioVigente({ precio: 1000 })).toBe(1000);
  });
  it('la variante con precio propio manda; sin precio hereda el vigente', () => {
    const p = { precio: 1000, precioPromo: 800 };
    expect(precioDe(p, v({ precio: 1200 }))).toBe(1200);
    expect(precioDe(p, v())).toBe(800);
    expect(precioDe(p)).toBe(800);
  });
  it('la oferta se muestra salvo que la variante tenga precio propio', () => {
    const p = { precio: 1000, precioPromo: 800 };
    expect(enOferta(p)).toBe(true);
    expect(enOferta(p, v())).toBe(true);
    expect(enOferta(p, v({ precio: 900 }))).toBe(false);
    expect(enOferta({ precio: 1000 })).toBe(false);
  });
  it('el rango recorre las variantes', () => {
    expect(rangoDePrecios({ precio: 1000 })).toEqual([1000, 1000]);
    expect(rangoDePrecios({ precio: 1000, variantes: [v(), v({ id: 'l-rojo', precio: 1500 })] })).toEqual([1000, 1500]);
  });
});

describe('estaAgotado', () => {
  it('agotado a mano, stock 0 o todas las variantes en 0', () => {
    expect(estaAgotado({ agotado: true })).toBe(true);
    expect(estaAgotado({ stock: 0 })).toBe(true);
    expect(estaAgotado({ variantes: [v({ stock: 0 }), v({ id: 'otra', stock: 0 })] })).toBe(true);
    expect(estaAgotado({ variantes: [v({ stock: 0 }), v({ id: 'otra' })] })).toBe(false); // una ilimitada alcanza
    expect(estaAgotado({ stock: 3 })).toBe(false);
  });
});

describe('claves del carrito', () => {
  it('ida y vuelta, con y sin variante', () => {
    expect(claveLinea('taza')).toBe('taza');
    expect(claveLinea('taza', 'm-rojo')).toBe('taza::m-rojo');
    expect(separarClave('taza')).toEqual({ id: 'taza' });
    expect(separarClave('taza::m-rojo')).toEqual({ id: 'taza', varianteId: 'm-rojo' });
  });
});
