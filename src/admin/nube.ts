import { API_URL } from '../data/almacen';
import type { Datos, EstadoPedido, PedidoRegistrado } from '../tipos';

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

/** Mensaje que manda la API (ej. "Un pedido enviado no puede pasar a cancelado") o el código si no hay. */
async function fallo(r: Response): Promise<Error> {
  const { error } = await r.json().catch(() => ({})) as { error?: string };
  return new Error(error ?? `La API respondió ${r.status}`);
}

export async function listarPedidos(clave: string): Promise<PedidoRegistrado[]> {
  const r = await fetch(`${API_URL}/api/pedidos`, { headers: cabeza(clave) });
  if (!r.ok) throw await fallo(r);
  return r.json();
}

export async function cambiarEstadoPedido(clave: string, numero: number, estado: EstadoPedido): Promise<void> {
  const r = await fetch(`${API_URL}/api/pedidos`, {
    method: 'PATCH', headers: { ...cabeza(clave), 'Content-Type': 'application/json' }, body: JSON.stringify({ numero, estado }),
  });
  if (!r.ok) throw await fallo(r);
}
