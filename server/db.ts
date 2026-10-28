import { MongoClient, type Collection, type Db, type Document } from 'mongodb';

/** Las transacciones necesitan el cliente además de la base. */
export interface Conexion { client: MongoClient; db: Db }

// Un solo cliente por instancia de la función: Vercel la reutiliza entre pedidos y así no se reconecta cada vez.
let cliente: Promise<MongoClient> | undefined;

export async function conexion(): Promise<Conexion> {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error('Falta la variable MONGODB_URI');
  if (!cliente) {
    cliente = new MongoClient(uri, { maxPoolSize: 5, serverSelectionTimeoutMS: 8000 }).connect();
    cliente.catch(() => { cliente = undefined; });
  }
  const client = await cliente;
  return { client, db: client.db(process.env.MONGODB_DB || 'casanido') };
}

export async function coleccion<T extends Document>(nombre: string): Promise<Collection<T>> {
  return (await conexion()).db.collection<T>(nombre);
}
