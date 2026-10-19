import { API_URL } from '../data/almacen';
import type { Datos } from '../tipos';

const cabeza = (clave: string) => ({ 'x-admin-clave': clave });

/** ¿Es correcta la clave? Lanza solo si la API no responde bien (no si la clave está mal). */
export async function entrar(clave: string): Promise<boolean> {
  const r = await fetch(`${API_URL}/api/login`, { method: 'POST', headers: cabeza(clave) });
  if (r.status === 401) return false;
  if (!r.ok) throw new Error(`La API respondió ${r.status}`);
  return true;
}

export async function guardarEnNube(clave: string, datos: Datos) {
  const r = await fetch(`${API_URL}/api/tienda`, {
    method: 'PUT', headers: { ...cabeza(clave), 'Content-Type': 'application/json' }, body: JSON.stringify(datos),
  });
  if (!r.ok) throw new Error(`La API respondió ${r.status}`);
}

/** Sube la foto y devuelve su URL pública. */
export async function subirFotoANube(clave: string, blob: Blob): Promise<string> {
  const r = await fetch(`${API_URL}/api/foto`, { method: 'POST', headers: { ...cabeza(clave), 'Content-Type': blob.type || 'image/jpeg' }, body: blob });
  if (!r.ok) throw new Error(`La API respondió ${r.status}`);
  return ((await r.json()) as { url: string }).url;
}
