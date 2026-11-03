// Carga un respaldo en una base. Uso: MONGODB_URI=... node scripts/restaurar.mjs archivo.ndjson.gz [--db nombre] [--forzar]
// Por defecto se niega a tocar una base que ya tiene datos: restaurá en una vacía (--db) y, si está bien, apuntá la tienda a ella.
import { MongoClient } from 'mongodb';
import { importar } from '../server/respaldo.ts';

const [archivo, ...resto] = process.argv.slice(2);
const uri = process.env.MONGODB_URI;
if (!uri || !archivo) { console.error('Uso: MONGODB_URI=... node scripts/restaurar.mjs archivo.ndjson.gz [--db nombre] [--forzar]'); process.exit(1); }
const i = resto.indexOf('--db');
const nombre = (i >= 0 && resto[i + 1]) || process.env.MONGODB_DB || 'casanido';
const cliente = await new MongoClient(uri).connect();
try {
  console.log(`Restaurado en «${nombre}»:`, await importar(cliente.db(nombre), archivo, { forzar: resto.includes('--forzar') }));
} catch (e) { console.error(e instanceof Error ? e.message : e); process.exitCode = 1; } finally { await cliente.close(); }
