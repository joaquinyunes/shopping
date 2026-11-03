// Guarda un respaldo de la base en backups/casanido-AAAA-MM-DD.ndjson.gz. Uso: MONGODB_URI=... node scripts/backup.mjs [carpeta]
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { MongoClient } from 'mongodb';
import { exportar } from '../server/respaldo.ts';

const uri = process.env.MONGODB_URI;
if (!uri) { console.error('Falta MONGODB_URI'); process.exit(1); }
const carpeta = process.argv[2] ?? 'backups';
mkdirSync(carpeta, { recursive: true });
const archivo = join(carpeta, `casanido-${new Date().toISOString().slice(0, 10)}.ndjson.gz`);
const cliente = await new MongoClient(uri).connect();
try {
  const cuenta = await exportar(cliente.db(process.env.MONGODB_DB || 'casanido'), archivo);
  console.log(`Respaldo guardado en ${archivo}:`, cuenta);
} finally { await cliente.close(); }
