import type { Db, Filter } from 'mongodb';
import { ErrorHttp } from './http.js';
import { pedidosDe, type Pedido } from './pedidos.js';

// Ley 25.326 (Argentina): la persona puede pedir ver (art. 14) o suprimir (art. 16) sus datos. Los pedidos son registros de venta y se conservan,
// pero sin los datos que identifican a la persona: se reemplaza el nombre y se quitan teléfono, mail, código postal y huella de origen.

export interface Persona { email?: string; telefono?: string }

/** Una persona se busca por mail o por teléfono (lo que dejó al pedir). Acepta solo texto: nada de objetos ni operadores. */
export function personaDe(raw: unknown): Persona {
  const r = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
  const email = typeof r.email === 'string' ? r.email.trim().toLowerCase().slice(0, 80) : '';
  const telefono = typeof r.telefono === 'string' ? r.telefono.trim().slice(0, 25).replace(/[^\d+]/g, '') : '';
  if (!email && !telefono) throw new ErrorHttp(400, 'Indicá el mail o el teléfono de la persona');
  return { ...(email && { email }), ...(telefono && { telefono }) };
}

const filtroDe = ({ email, telefono }: Persona): Filter<Pedido> => ({ $or: [...(email ? [{ 'cliente.email': email }] : []), ...(telefono ? [{ 'cliente.telefono': telefono }] : [])] });

/** Todo lo que se guarda de esa persona (para entregárselo si lo pide). */
export async function exportarDatos(db: Db, persona: Persona): Promise<Pedido[]> {
  return pedidosDe(db).find(filtroDe(persona), { projection: { origen: 0 } }).sort({ _id: 1 }).toArray();
}

/** Anonimiza sus pedidos. Devuelve cuántos. No toca montos, productos ni estados: la contabilidad sigue cerrando. */
export async function borrarDatos(db: Db, persona: Persona): Promise<number> {
  const r = await pedidosDe(db).updateMany(filtroDe(persona), { $set: { cliente: { nombre: 'Datos borrados a pedido' } }, $unset: { origen: '' } });
  return r.modifiedCount;
}
