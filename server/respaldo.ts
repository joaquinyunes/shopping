import { createReadStream, createWriteStream } from 'node:fs';
import { createInterface } from 'node:readline';
import { pipeline } from 'node:stream/promises';
import { createGunzip, createGzip } from 'node:zlib';
import { Readable } from 'node:stream';
import { BSON, type Db, type Document } from 'mongodb';

// Respaldo de la base: un archivo comprimido con un documento por línea (EJSON, conserva fechas y fotos). Sin dependencias nuevas ni mongodump.
// Lo escriben scripts/backup.mjs y el workflow semanal; scripts/restaurar.mjs lo vuelve a cargar.

/** Lo que vale la pena guardar. `limites` (contadores de frecuencia) y `ajustes` de sesión se regeneran solos. */
export const COLECCIONES = ['tienda', 'pedidos', 'contadores', 'fotos', 'auditoria'] as const;

async function* lineas(db: Db): AsyncGenerator<string> {
  for (const c of COLECCIONES) {
    for await (const d of db.collection(c).find()) yield `${JSON.stringify({ c, d: BSON.EJSON.serialize(d, { relaxed: false }) })}\n`;
  }
}

/** Guarda la base en `ruta` (.ndjson.gz). Devuelve cuántos documentos hay por colección. */
export async function exportar(db: Db, ruta: string): Promise<Record<string, number>> {
  const cuenta: Record<string, number> = {};
  const origen = Readable.from((async function* () {
    for await (const l of lineas(db)) { const c = (JSON.parse(l) as { c: string }).c; cuenta[c] = (cuenta[c] ?? 0) + 1; yield l; }
  })());
  await pipeline(origen, createGzip(), createWriteStream(ruta, { mode: 0o600 })); // los pedidos tienen datos personales: solo el dueño lo lee
  return cuenta;
}

/** Carga un respaldo. Si la base de destino ya tiene datos, se niega salvo `forzar` (que los reemplaza). */
export async function importar(db: Db, ruta: string, opciones: { forzar?: boolean } = {}): Promise<Record<string, number>> {
  const hay = (await Promise.all(COLECCIONES.map(c => db.collection(c).estimatedDocumentCount()))).some(n => n > 0);
  if (hay && !opciones.forzar) throw new Error(`La base «${db.databaseName}» ya tiene datos. Restaurá en una base vacía o usá --forzar para reemplazarlos.`);
  if (hay) await Promise.all(COLECCIONES.map(c => db.collection(c).deleteMany({})));
  const cuenta: Record<string, number> = {};
  const lote: Record<string, Document[]> = {};
  const volcar = async (c: string) => { if (lote[c]?.length) { await db.collection(c).insertMany(lote[c]); lote[c] = []; } };
  const rl = createInterface({ input: createReadStream(ruta).pipe(createGunzip()), crlfDelay: Infinity });
  for await (const linea of rl) {
    if (!linea) continue;
    const { c, d } = JSON.parse(linea) as { c: string; d: Document };
    if (!(COLECCIONES as readonly string[]).includes(c)) throw new Error(`Colección inesperada en el respaldo: ${c}`);
    (lote[c] ??= []).push(BSON.EJSON.deserialize(d, { relaxed: false }) as Document);
    cuenta[c] = (cuenta[c] ?? 0) + 1;
    if (lote[c].length >= 100) await volcar(c);
  }
  for (const c of Object.keys(lote)) await volcar(c);
  return cuenta;
}
