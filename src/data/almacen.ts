import type { Datos } from '../tipos';
import { normalizarDatos } from './normalizar';
import { DATOS_INICIALES } from './seed';

export const SUPABASE_URL: string = import.meta.env.VITE_SUPABASE_URL ?? '';
export const SUPABASE_KEY: string = import.meta.env.VITE_SUPABASE_KEY ?? '';
/** Sin variables de Supabase la tienda funciona en modo demo: los cambios quedan solo en este navegador. */
export const hayNube = Boolean(SUPABASE_URL && SUPABASE_KEY);
/** Nombres con prefijo: el proyecto de Supabase puede compartirse con otros sitios. */
export const TABLA = 'casanido_tienda', BUCKET = 'casanido';

const CLAVE_LOCAL = 'casa-nido:tienda';

/** Lectura pública por REST: no hace falta el SDK de Supabase para mostrar la tienda. */
async function cargarDeLaNube(): Promise<Datos | null> {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/${TABLA}?id=eq.1&select=datos`, {
    headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` },
  });
  if (!r.ok) throw new Error(`Supabase respondió ${r.status}`);
  const [fila] = (await r.json()) as Array<{ datos: unknown }>;
  return fila ? normalizarDatos(fila.datos) : null;
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
