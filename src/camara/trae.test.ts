import { describe, expect, it } from 'vitest';
import { loQueTrae } from './trae';

describe('loQueTrae', () => {
  it('prefiere la lista cargada por la dueña', () => {
    expect(loQueTrae({ incluye: [' 3 platos ', '', 'Caja'], descripcion: 'otra cosa' })).toEqual(['3 platos', 'Caja']);
  });

  it('corta la descripción por comas y por "y"', () => {
    expect(loQueTrae({ descripcion: 'Frasco de vidrio, tapa de bambú y cierre de goma' }))
      .toEqual(['Frasco de vidrio', 'Tapa de bambú', 'Cierre de goma']);
  });

  it('sin datos devuelve una lista vacía', () => expect(loQueTrae({})).toEqual([]));

  it('descarta fragmentos demasiado cortos y limita a 6', () => {
    const r = loQueTrae({ descripcion: 'a, uno, dos, tres, cuatro, cinco, seis, siete' });
    expect(r).not.toContain('A');
    expect(r).toHaveLength(6);
  });
});
