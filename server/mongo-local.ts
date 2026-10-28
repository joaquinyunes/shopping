import { spawn, type ChildProcess } from 'node:child_process';
import { existsSync, mkdtempSync, rmSync } from 'node:fs';
import { createServer } from 'node:net';
import { homedir, tmpdir } from 'node:os';
import { join } from 'node:path';
import { MongoClient } from 'mongodb';

/** mongod 5.0.19 ya descargado en la compu (no se baja nada). Para probar contra un replica set local. */
export const MONGOD = process.env.MONGOD_BIN ?? join(homedir(), '.cache', 'mongodb-binaries', 'mongod-x64-win32-5.0.19.exe');

export const hayMongod = () => existsSync(MONGOD);

const puertoLibre = () => new Promise<number>((ok, mal) => {
  const s = createServer().listen(0, '127.0.0.1', () => { const { port } = s.address() as { port: number }; s.close(() => ok(port)); });
  s.on('error', mal);
});

const esperar = (ms: number) => new Promise(r => setTimeout(r, ms));

/** Levanta un mongod de un solo nodo como replica set (las transacciones lo exigen) en una carpeta temporal. */
export async function levantarReplicaSet(): Promise<{ uri: string; parar: () => Promise<void> }> {
  const dir = mkdtempSync(join(tmpdir(), 'casa-nido-mongo-'));
  const puerto = await puertoLibre();
  const proceso: ChildProcess = spawn(MONGOD, ['--replSet', 'rs0', '--dbpath', dir, '--port', String(puerto), '--bind_ip', '127.0.0.1'], { stdio: 'ignore' });
  const parar = async () => {
    if (proceso.exitCode === null) { proceso.kill(); await new Promise(r => proceso.once('exit', r)); }
    rmSync(dir, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 });
  };
  try {
    const inicio = Date.now();
    for (;;) {
      const c = new MongoClient(`mongodb://127.0.0.1:${puerto}/?directConnection=true`, { serverSelectionTimeoutMS: 500 });
      try {
        await c.connect();
        try {
          await c.db('admin').command({ replSetInitiate: { _id: 'rs0', members: [{ _id: 0, host: `127.0.0.1:${puerto}` }] } });
        } catch (e) {
          if ((e as { codeName?: string }).codeName !== 'AlreadyInitialized') throw e;
        }
        while (!(await c.db('admin').command({ hello: 1 })).isWritablePrimary) await esperar(100);
        break;
      } catch (e) {
        if (Date.now() - inicio > 30_000) throw e;
        await esperar(300);
      } finally { await c.close(); }
    }
  } catch (e) { await parar(); throw e; }
  return { uri: `mongodb://127.0.0.1:${puerto}/?replicaSet=rs0`, parar };
}
