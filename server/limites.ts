import type { Db } from 'mongodb';
import { ErrorHttp } from './http.js';

// Contadores por ventana de tiempo guardados en Mongo: sirven entre instancias de la función (en Vercel cada pedido puede caer en una distinta).
// Se vencen solos con un índice TTL. La clave no lleva la IP en claro: quien llama pasa una huella.

interface Fila { _id: string; n: number; expira: Date }

const indicesListos = new Set<string>();
async function coleccion(db: Db) {
  const c = db.collection<Fila>('limites');
  if (!indicesListos.has(db.databaseName)) {
    await c.createIndex({ expira: 1 }, { expireAfterSeconds: 0 });
    indicesListos.add(db.databaseName);
  }
  return c;
}

/** Suma 1 al contador de `clave` (si la ventana venció, empieza otra) y devuelve el valor. Atómico: dos pedidos a la vez no se pisan. */
export async function contar(db: Db, clave: string, ventanaMs: number, ahora = new Date()): Promise<number> {
  const vigente = { $gt: ['$expira', ahora] };
  const fila = await (await coleccion(db)).findOneAndUpdate(
    { _id: clave },
    [{ $set: { n: { $cond: [vigente, { $add: ['$n', 1] }, 1] }, expira: { $cond: [vigente, '$expira', new Date(ahora.getTime() + ventanaMs)] } } }],
    { upsert: true, returnDocument: 'after' },
  );
  return fila!.n;
}

/** Borra el contador (por ejemplo, tras un ingreso correcto). */
export async function reiniciar(db: Db, clave: string): Promise<void> {
  await (await coleccion(db)).deleteOne({ _id: clave });
}

/** Valor actual del contador sin sumar. */
export async function valorDe(db: Db, clave: string, ahora = new Date()): Promise<number> {
  return (await (await coleccion(db)).findOne({ _id: clave, expira: { $gt: ahora } }))?.n ?? 0;
}

/** Cuenta un intento y responde 429 si ya pasó de `max` en la ventana. */
export async function limitar(db: Db, clave: string, max: number, ventanaMs: number, mensaje = 'Demasiados intentos. Esperá un rato y probá de nuevo.'): Promise<void> {
  if (await contar(db, clave, ventanaMs) > max) throw new ErrorHttp(429, mensaje);
}
