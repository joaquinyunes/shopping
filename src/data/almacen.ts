import type { Datos } from '../tipos';
import { normalizarDatos } from './normalizar';
import { DATOS_INICIALES } from './seed';

/** Dirección de la API (MongoDB Atlas detrás). Vacía = el mismo sitio; la copia en Render apunta a Vercel. */
export const API_URL: string = (import.meta.env.VITE_API_URL ?? '').replace(/\/$/, '');
/** En producción hay API; en desarrollo la tienda funciona en modo demo: los cambios quedan solo en este navegador. */
export const hayNube = import.meta.env.PROD || Boolean(API_URL);

const CLAVE_LOCAL = 'casa-nido:tienda';

/** Lectura pública: `null` si la dueña todavía no guardó nada (se usan los datos iniciales). */
async function cargarDeLaNube(): Promise<Datos | null> {
  const r = await fetch(`${API_URL}/api/tienda`);
  if (!r.ok) throw new Error(`La API respondió ${r.status}`);
  const datos: unknown = await r.json();
  return datos ? normalizarDatos(datos) : null;
}

export async function cargarDatos(): Promise<Datos> {
  try {
    if (hayNube) {
      const nube = await cargarDeLaNube();
      if (nube) return nube;
    } else {
      const local = localStorage.getItem(CLAVE_LOCAL);
      if (local) return normalizarDatos(JSON.parse(local));
    }
  } catch (error) {
    console.warn('No se pudo cargar la tienda; se usan los datos iniciales', error);
  }
  return structuredClone(DATOS_INICIALES);
}

export function guardarLocal(datos: Datos) {
  localStorage.setItem(CLAVE_LOCAL, JSON.stringify(datos));
}

export function borrarLocal() {
  try { localStorage.removeItem(CLAVE_LOCAL); } catch { /* sin storage */ }
}
