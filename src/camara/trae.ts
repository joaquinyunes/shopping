import type { Producto } from '../tipos';

const mayuscula = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/** "Lo que trae": la lista cargada por la dueña o, si falta, la descripción cortada por comas y " y ". */
export function loQueTrae(p: Pick<Producto, 'incluye' | 'descripcion'>): string[] {
  if (p.incluye?.length) return p.incluye.map(s => s.trim()).filter(Boolean);
  if (!p.descripcion) return [];
  return p.descripcion
    .split(/,|\s+y\s+|\s+e\s+/)
    .map(s => s.trim().replace(/\.$/, ''))
    .filter(s => s.length >= 3)
    .slice(0, 6)
    .map(mayuscula);
}
