import type { Producto, Variante } from '../tipos';
import { enOferta, estaAgotado, slug } from './catalogo';

// Reglas de lo que la clienta ve en la tienda (búsqueda, destacados, relacionados, ficha). Funciones puras: se prueban sin pantalla.

const disponible = (p: Producto) => !estaAgotado(p) && !!p.foto;

/** Busca por nombre, descripción y categoría, sin mayúsculas ni tildes; todas las palabras tienen que aparecer. */
export function buscarProductos(productos: Producto[], texto: string): Producto[] {
  const palabras = slug(texto).split('-').filter(Boolean);
  if (palabras.length === 0) return productos;
  return productos.filter(p => {
    const pajar = slug(`${p.nombre} ${p.descripcion ?? ''} ${p.categoria}`);
    return palabras.every(w => pajar.includes(w));
  });
}

/** Para el bloque de destacados de la portada: ofertas primero, después el orden del catálogo. */
export function destacadosDe(productos: Producto[], max: number): Producto[] {
  const ok = productos.filter(disponible);
  return [...ok.filter(p => enOferta(p)), ...ok.filter(p => !enOferta(p))].slice(0, max);
}

/** Productos para sugerir en la ficha: los de la misma categoría y, si faltan, los demás. */
export function relacionadosDe(productos: Producto[], actual: Producto, max: number): Producto[] {
  const otros = productos.filter(p => p.id !== actual.id && disponible(p));
  return [...otros.filter(p => p.categoria === actual.categoria), ...otros.filter(p => p.categoria !== actual.categoria)].slice(0, max);
}

/** Unidades que se pueden mostrar: las de la variante elegida; sin variante, las del producto. `undefined` = sin límite o sin dato. */
export function stockVisible(p: Pick<Producto, 'stock'>, v?: Pick<Variante, 'stock'>): number | undefined {
  return v ? v.stock : p.stock;
}

/** Las fotos de ejemplo tienen una versión de 400 px (scripts/miniaturas.mjs); las que sube la dueña no: sin srcset. */
export function srcSetDe(foto: string): string | undefined {
  const m = /^(\/img\/productos\/[a-z0-9-]+)\.webp$/.exec(foto);
  return m ? `${m[1]}-400.webp 400w, ${foto} 640w` : undefined;
}

const PREFIJO = '#/producto/';
export const rutaFicha = (id: string) => PREFIJO + encodeURIComponent(id);
export function idDeRuta(hash: string): string | null {
  if (!hash.startsWith(PREFIJO) || hash.length === PREFIJO.length) return null;
  try { return decodeURIComponent(hash.slice(PREFIJO.length)); } catch { return null; }
}
