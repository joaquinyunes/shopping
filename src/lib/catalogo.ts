import type { Producto, Variante } from '../tipos';

// Reglas de precio, variantes y claves de carrito. Las usan el front y el servidor: una sola fuente para que el total que ve la clienta sea el que cobra la API.

const sinTildes = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
export const slug = (s: string) => sinTildes(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

/** Id de una variante: los valores en minúsculas y sin tildes, unidos por «-» (talle M + rojo → «m-rojo»). Vacío si algún valor no tiene letras ni números. */
export function idVariante(valores: string[]): string {
  const partes = valores.map(slug);
  return partes.length > 0 && partes.every(Boolean) ? partes.join('-') : '';
}

export const etiquetaVariante = (v: Pick<Variante, 'valores'>) => v.valores.join(' / ');

/** Precio vigente del producto: el promocional solo cuenta si es menor al normal. */
export const precioVigente = (p: Pick<Producto, 'precio' | 'precioPromo'>) =>
  p.precioPromo !== undefined && p.precioPromo > 0 && p.precioPromo < p.precio ? p.precioPromo : p.precio;

/** Lo que cuesta la unidad: el precio propio de la variante o, si no tiene, el vigente del producto. */
export const precioDe = (p: Pick<Producto, 'precio' | 'precioPromo'>, v?: Pick<Variante, 'precio'>) => v?.precio ?? precioVigente(p);

/** ¿Se muestra tachado el precio normal? Una variante con precio propio no hereda la oferta. */
export const enOferta = (p: Pick<Producto, 'precio' | 'precioPromo'>, v?: Pick<Variante, 'precio'>) => v?.precio === undefined && precioVigente(p) < p.precio;

export const buscarVariante = (p: Pick<Producto, 'variantes'>, id: string | undefined) => (id ? p.variantes?.find(v => v.id === id) : undefined);

/** Agotado a mano, sin stock, o con todas las variantes sin stock. */
export const estaAgotado = (p: Pick<Producto, 'agotado' | 'stock' | 'variantes'>) =>
  p.agotado === true || p.stock === 0 || (p.variantes?.length ? p.variantes.every(v => v.stock === 0) : false);

/** Rango de precios de un producto con variantes: [desde, hasta]. Sin variantes, el vigente dos veces. */
export function rangoDePrecios(p: Pick<Producto, 'precio' | 'precioPromo' | 'variantes'>): [number, number] {
  const precios = (p.variantes?.length ? p.variantes : [undefined]).map(v => precioDe(p, v));
  return [Math.min(...precios), Math.max(...precios)];
}

// ---- Claves del carrito: «id» o «id::variante» ----

export const claveLinea = (id: string, varianteId?: string) => (varianteId ? `${id}::${varianteId}` : id);

export function separarClave(clave: string): { id: string; varianteId?: string } {
  const i = clave.lastIndexOf('::');
  return i < 0 ? { id: clave } : { id: clave.slice(0, i), varianteId: clave.slice(i + 2) };
}
