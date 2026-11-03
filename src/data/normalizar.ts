import type { Datos, Producto, Tienda } from '../tipos';
import { normalizarProducto } from './producto';
import { DATOS_INICIALES } from './seed';

export { fotoSegura } from './producto';

const texto = (v: unknown, max: number) => (typeof v === 'string' ? v.trim().slice(0, max) : '');

/** Todo lo que viene de afuera (la API, localStorage) pasa por acá antes de usarse. */
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
