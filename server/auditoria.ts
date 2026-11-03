import type { Db } from 'mongodb';
import { precioVigente } from '../src/lib/catalogo.js';
import type { Producto } from '../src/tipos.js';

// Registro de quién cambió qué (precio, stock, pedidos). Solo se agrega: la API no tiene ninguna ruta que lo edite ni lo borre.
// Hay una sola dueña, así que «quién» es el origen (huella de la IP), no un usuario.

export interface Cambio { producto?: string; campo: string; antes?: unknown; despues?: unknown }
export interface Evento { creado: Date; origen?: string; tipo: 'catalogo' | 'pedido' | 'privacidad'; cambios: Cambio[] }

const CAMPOS = ['precio', 'precioPromo', 'stock', 'oculto', 'agotado'] as const;

/** Qué cambió entre dos catálogos: altas, bajas y, por producto y variante, precio, oferta, stock y visibilidad. */
export function diferencias(antes: Producto[], despues: Producto[]): Cambio[] {
  const cambios: Cambio[] = [];
  const previos = new Map(antes.map(p => [p.id, p]));
  for (const p of despues) {
    const a = previos.get(p.id);
    if (!a) { cambios.push({ producto: p.id, campo: 'alta', despues: precioVigente(p) }); continue; }
    for (const c of CAMPOS) if (a[c] !== p[c] && !(a[c] == null && p[c] == null)) cambios.push({ producto: p.id, campo: c, antes: a[c], despues: p[c] });
    for (const v of p.variantes ?? []) {
      const av = a.variantes?.find(x => x.id === v.id);
      if (!av) { cambios.push({ producto: p.id, campo: `variante:${v.id}`, despues: 'alta' }); continue; }
      for (const c of ['precio', 'stock'] as const) if (av[c] !== v[c]) cambios.push({ producto: p.id, campo: `variante:${v.id}:${c}`, antes: av[c], despues: v[c] });
    }
    for (const av of a.variantes ?? []) if (!p.variantes?.some(v => v.id === av.id)) cambios.push({ producto: p.id, campo: `variante:${av.id}`, antes: 'alta', despues: 'baja' });
  }
  const quedan = new Set(despues.map(p => p.id));
  for (const a of antes) if (!quedan.has(a.id)) cambios.push({ producto: a.id, campo: 'baja', antes: precioVigente(a) });
  return cambios;
}

/** Agrega un evento. No lanza: perder una línea de auditoría no puede impedir guardar un cambio. */
export async function registrar(db: Db, evento: Omit<Evento, 'creado'>): Promise<void> {
  if (evento.cambios.length === 0) return;
  try {
    await db.collection<Evento>('auditoria').insertOne({ ...evento, creado: new Date() });
  } catch (error) {
    console.error('No se pudo registrar en la auditoría:', error instanceof Error ? error.message : error);
  }
}

export const listarAuditoria = (db: Db, limite = 200) => db.collection<Evento>('auditoria').find({}, { projection: { _id: 0, origen: 0 } }).sort({ creado: -1 }).limit(limite).toArray();
