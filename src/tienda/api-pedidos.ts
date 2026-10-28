import { API_URL } from '../data/almacen';
import type { OpcionEnvio } from '../tipos';

interface Linea { id: string; cant: number }

async function enviar<T>(ruta: string, cuerpo: unknown): Promise<T> {
  const r = await fetch(`${API_URL}${ruta}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(cuerpo) });
  const datos = await r.json().catch(() => ({})) as T & { error?: string };
  if (!r.ok) throw new Error(datos.error ?? 'No se pudo conectar. Probá de nuevo.');
  return datos;
}

export const cotizarEnvio = (cp: string, items: Linea[]) =>
  enviar<{ opciones: OpcionEnvio[] }>('/api/envio', { cp, items }).then(r => r.opciones);

/** Registra el pedido (el servidor descuenta el stock y fija precios y envío). */
export const registrarPedido = (items: Linea[], cliente: { nombre: string; cp?: string }, servicio?: string) =>
  enviar<{ numero: number; total: number; envio?: { servicio: string; precio: number } }>('/api/pedido', { items, cliente, ...(servicio && { envio: { servicio } }) });
