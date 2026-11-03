import { idVariante } from '../lib/catalogo';
import type { Producto, TipoMedida, Variante } from '../tipos';

const TIPOS: TipoMedida[] = ['alto', 'largo', 'ancho', 'diametro'];

export const MAX_VARIANTES = 40;
export const MAX_PROPIEDADES = 3;
export const MAX_FOTOS_EXTRA = 5;

const texto = (v: unknown, max: number) => (typeof v === 'string' ? v.trim().slice(0, max) : '');
const entero = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) ? Math.max(0, Math.floor(v)) : undefined);
const positivo = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) && v > 0 ? v : undefined);

/** Una foto es una ruta propia, una URL https o una imagen subida (data:image). Nada de javascript: ni otros esquemas. */
export function fotoSegura(v: unknown): string {
  const s = typeof v === 'string' ? v.trim() : '';
  return /^(\/|https:\/\/|data:image\/(png|jpe?g|webp);base64,)/i.test(s) ? s : '';
}

function normalizarVariantes(rawProps: unknown, rawVars: unknown): { propiedades?: string[]; variantes?: Variante[] } {
  if (!Array.isArray(rawVars)) return {};
  const propiedades = (Array.isArray(rawProps) ? rawProps : []).map(p => texto(p, 30)).filter(Boolean).slice(0, MAX_PROPIEDADES);
  if (propiedades.length === 0) propiedades.push('Opción');
  const vistos = new Set<string>();
  const variantes: Variante[] = [];
  for (const raw of rawVars) {
    if (variantes.length >= MAX_VARIANTES) break;
    const r = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
    const valores = (Array.isArray(r.valores) ? r.valores : []).slice(0, propiedades.length).map(v => texto(v, 30));
    while (valores.length < propiedades.length) valores.push('');
    const id = idVariante(valores);
    if (!id || vistos.has(id)) continue; // sin valores completos, o repetida: se descarta
    vistos.add(id);
    variantes.push({
      id, valores,
      ...(positivo(r.precio) !== undefined && { precio: positivo(r.precio) }),
      ...(entero(r.stock) !== undefined && { stock: entero(r.stock) }),
      ...(texto(r.sku, 40) && { sku: texto(r.sku, 40) }),
    });
  }
  return variantes.length ? { propiedades, variantes } : {};
}

/** Un producto de afuera (API, localStorage, CSV) en su forma segura; `null` si no sirve. El servidor la usa al guardar y al leer. */
export function normalizarProducto(raw: unknown): Producto | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Record<string, unknown>;
  const id = texto(r.id, 80), nombre = texto(r.nombre, 80);
  const precio = typeof r.precio === 'number' && Number.isFinite(r.precio) ? Math.max(0, r.precio) : NaN;
  if (!id || !nombre || Number.isNaN(precio)) return null;
  const incluye = Array.isArray(r.incluye) ? r.incluye.map(i => texto(i, 60)).filter(Boolean).slice(0, 8) : undefined;
  const fotos = Array.isArray(r.fotos) ? r.fotos.map(fotoSegura).filter(Boolean).slice(0, MAX_FOTOS_EXTRA) : undefined;
  const { propiedades, variantes } = normalizarVariantes(r.propiedades, r.variantes);
  // Con variantes manda el stock de cada una; el del producto no se usa.
  const stock = variantes ? undefined : entero(r.stock);
  const promo = positivo(r.precioPromo);
  return {
    id, nombre, precio,
    categoria: texto(r.categoria, 30) || 'Otros',
    foto: fotoSegura(r.foto),
    descripcion: texto(r.descripcion, 160) || undefined,
    agotado: r.agotado === true || stock === 0 || (variantes ? variantes.every(v => v.stock === 0) : false) || undefined,
    stock,
    sku: texto(r.sku, 40) || undefined,
    tamanoCm: positivo(r.tamanoCm),
    tipoMedida: TIPOS.includes(r.tipoMedida as TipoMedida) ? (r.tipoMedida as TipoMedida) : undefined,
    pesoGr: positivo(r.pesoGr),
    incluye: incluye?.length ? incluye : undefined,
    fotos: fotos?.length ? fotos : undefined,
    precioPromo: promo !== undefined && promo < precio ? promo : undefined,
    oculto: r.oculto === true || undefined,
    propiedades,
    variantes,
  };
}
