import type { Datos, Producto, TipoMedida, Tienda } from '../tipos';
import { DATOS_INICIALES } from './seed';

const TIPOS: TipoMedida[] = ['alto', 'largo', 'ancho', 'diametro'];

const texto = (v: unknown, max: number) => (typeof v === 'string' ? v.trim().slice(0, max) : '');
const positivo = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) && v > 0 ? v : undefined);

/** Una foto es una ruta propia, una URL https o una imagen subida (data:image). Nada de javascript: ni otros esquemas. */
export function fotoSegura(v: unknown): string {
  const s = typeof v === 'string' ? v.trim() : '';
  return /^(\/|https:\/\/|data:image\/(png|jpe?g|webp);base64,)/i.test(s) ? s : '';
}

function normalizarProducto(raw: unknown): Producto | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Record<string, unknown>;
  const id = texto(r.id, 80), nombre = texto(r.nombre, 80);
  const precio = typeof r.precio === 'number' && Number.isFinite(r.precio) ? Math.max(0, r.precio) : NaN;
  if (!id || !nombre || Number.isNaN(precio)) return null;
  const incluye = Array.isArray(r.incluye) ? r.incluye.map(i => texto(i, 60)).filter(Boolean).slice(0, 8) : undefined;
  return {
    id, nombre, precio,
    categoria: texto(r.categoria, 30) || 'Otros',
    foto: fotoSegura(r.foto),
    descripcion: texto(r.descripcion, 160) || undefined,
    agotado: r.agotado === true || undefined,
    tamanoCm: positivo(r.tamanoCm),
    tipoMedida: TIPOS.includes(r.tipoMedida as TipoMedida) ? (r.tipoMedida as TipoMedida) : undefined,
    pesoGr: positivo(r.pesoGr),
    incluye: incluye?.length ? incluye : undefined,
  };
}

/** Todo lo que viene de afuera (Supabase, localStorage) pasa por acá antes de usarse. */
export function normalizarDatos(raw: unknown): Datos {
  const base = DATOS_INICIALES.tienda;
  const r = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
  const t = (r.tienda && typeof r.tienda === 'object' ? r.tienda : {}) as Record<string, unknown>;
  const tienda: Tienda = {
    nombre: texto(t.nombre, 40) || base.nombre,
    lema: texto(t.lema, 60) || base.lema,
    whatsapp: texto(t.whatsapp, 20).replace(/[^\d+]/g, '') || base.whatsapp,
    hero3d: typeof t.hero3d === 'boolean' ? t.hero3d : base.hero3d,
    camara: typeof t.camara === 'boolean' ? t.camara : base.camara,
  };
  const lista = Array.isArray(r.productos) ? r.productos.map(normalizarProducto).filter((p): p is Producto => p !== null) : null;
  return { tienda, productos: lista ?? structuredClone(DATOS_INICIALES.productos) };
}
