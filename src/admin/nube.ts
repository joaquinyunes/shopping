import { API_URL } from '../data/almacen';
import type { Datos, EstadoPedido, PedidoRegistrado } from '../tipos';

/** Texto para quien administra: sin jerga de API, con qué hacer. */
const msgHttp = (estado: number) => `No se pudo completar la acción (error ${estado}). Probá de nuevo en un momento.`;

/** Lo que se manda en cada pedido del panel: la sesión (un token), nunca la contraseña. */
const cabeza = (sesion: string) => ({ Authorization: `Bearer ${sesion}` });

/** ¿Pide código de la app? ¿Sigue vigente la sesión guardada en esta pestaña? */
export async function estadoDeSesion(sesion?: string): Promise<{ dosPasos: boolean; sesion: boolean }> {
  const r = await fetch(`${API_URL}/api/login`, { headers: sesion ? cabeza(sesion) : {} });
  if (!r.ok) throw new Error(msgHttp(r.status));
  return r.json();
}

/** Devuelve la sesión, o `null` si la contraseña o el código están mal. Lanza con el mensaje de la API si está bloqueado (429) o no responde. */
export async function entrar(clave: string, codigo?: string): Promise<string | null> {
  const r = await fetch(`${API_URL}/api/login`, { method: 'POST', headers: { 'x-admin-clave': clave, ...(codigo && { 'x-admin-codigo': codigo }) } });
  if (r.status === 401) return null;
  if (!r.ok) throw await fallo(r);
  return ((await r.json()) as { token: string }).token;
}

/** Cierra la sesión en todos los dispositivos (también en este). */
export async function cerrarTodasLasSesiones(sesion: string): Promise<void> {
  const r = await fetch(`${API_URL}/api/login`, { method: 'DELETE', headers: cabeza(sesion) });
  if (!r.ok) throw await fallo(r);
}

/** Derecho de acceso y de supresión de una persona (por mail o teléfono). Devuelve el archivo a entregar o la cantidad anonimizada. */
export async function datosDePersona(sesion: string, accion: 'exportar' | 'borrar', persona: { email?: string; telefono?: string }): Promise<{ pedidos?: unknown[]; anonimizados?: number }> {
  const r = await fetch(`${API_URL}/api/datos`, { method: 'POST', headers: { ...cabeza(sesion), 'Content-Type': 'application/json' }, body: JSON.stringify({ accion, ...persona }) });
  if (!r.ok) throw await fallo(r);
  return r.json();
}

export interface EventoAuditoria { creado: string; tipo: string; cambios: Array<{ producto?: string; campo: string; antes?: unknown; despues?: unknown }> }
export async function listarAuditoria(sesion: string): Promise<EventoAuditoria[]> {
  const r = await fetch(`${API_URL}/api/auditoria`, { headers: cabeza(sesion) });
  if (!r.ok) throw await fallo(r);
  return r.json();
}

/** El catálogo cambió en el servidor desde que se abrió el panel (entró un pedido o se guardó desde otro lado). */
export class CatalogoDesactualizado extends Error {}

/** Guarda y devuelve la versión nueva; hay que mandar la que se leyó, así el servidor sabe si la copia quedó vieja. */
export async function guardarEnNube(clave: string, datos: Datos): Promise<number> {
  const { version, ...resto } = datos;
  const r = await fetch(`${API_URL}/api/tienda`, {
    method: 'PUT', headers: { ...cabeza(clave), 'Content-Type': 'application/json' }, body: JSON.stringify({ ...resto, _v: version ?? 0 }),
  });
  if (r.status === 409) throw new CatalogoDesactualizado((await r.json().catch(() => ({})) as { error?: string }).error);
  if (!r.ok) throw new Error(msgHttp(r.status));
  return ((await r.json()) as { _v: number })._v;
}

/** Sube la foto y devuelve su URL pública. */
export async function subirFotoANube(clave: string, blob: Blob): Promise<string> {
  const r = await fetch(`${API_URL}/api/foto`, { method: 'POST', headers: { ...cabeza(clave), 'Content-Type': blob.type || 'image/jpeg' }, body: blob });
  if (!r.ok) throw new Error(msgHttp(r.status));
  return ((await r.json()) as { url: string }).url;
}

/** Mensaje que manda la API (ej. "Un pedido enviado no puede pasar a cancelado") o el código si no hay. */
async function fallo(r: Response): Promise<Error> {
  const { error } = await r.json().catch(() => ({})) as { error?: string };
  return new Error(error ?? msgHttp(r.status));
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
