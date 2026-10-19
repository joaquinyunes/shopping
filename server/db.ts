import { MongoClient, type Collection, type Document } from 'mongodb';

// Un solo cliente por instancia de la función: Vercel la reutiliza entre pedidos y así no se reconecta cada vez.
let cliente: Promise<MongoClient> | undefined;

export async function coleccion<T extends Document>(nombre: string): Promise<Collection<T>> {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error('Falta la variable MONGODB_URI');
  if (!cliente) {
    cliente = new MongoClient(uri, { maxPoolSize: 5, serverSelectionTimeoutMS: 8000 }).connect();
    cliente.catch(() => { cliente = undefined; });
  }
  return (await cliente).db(process.env.MONGODB_DB || 'casanido').collection<T>(nombre);
}
