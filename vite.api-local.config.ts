/// <reference types="vitest/config" />
import { defineConfig, mergeConfig, type Plugin } from 'vite';
import base from './vite.config';

/**
 * `npm run dev:api`: la tienda con la API real (api/*.ts) contra un MongoDB local de un nodo (replica set), para probar pedidos de punta a punta
 * sin Atlas ni Vercel. La base arranca vacía con unos productos de prueba (uno con stock y otro con variantes) y se borra al cerrar.
 * Clave del admin local: dev-casa-nido (solo vale en esta compu).
 */
const PUERTO = 5501;

function apiLocal(): Plugin {
  return {
    name: 'api-local',
    apply: 'serve',
    async configureServer(server) {
      const { hayMongod, levantarReplicaSet } = await server.ssrLoadModule('/server/mongo-local.ts') as typeof import('./server/mongo-local');
      if (!hayMongod()) throw new Error('No hay mongod local (ver MONGOD_BIN en docs/DEPLOY.md).');
      const mongo = await levantarReplicaSet();
      Object.assign(process.env, { MONGODB_URI: mongo.uri, MONGODB_DB: 'casanido_dev', ADMIN_PASSWORD: 'dev-casa-nido' });

      const { MongoClient } = await import('mongodb');
      const c = await new MongoClient(mongo.uri).connect();
      const { DATOS_INICIALES } = await server.ssrLoadModule('/src/data/seed.ts') as typeof import('./src/data/seed');
      const productos = structuredClone(DATOS_INICIALES.productos);
      productos[0] = { ...productos[0], stock: 3 };
      productos.unshift({
        id: 'remera', nombre: 'Remera de lino', categoria: 'Textiles', precio: 20000, precioPromo: 16000, propiedades: ['Talle', 'Color'], foto: productos[0].foto,
        variantes: [{ id: 'm-crudo', valores: ['M', 'Crudo'], stock: 2 }, { id: 'l-crudo', valores: ['L', 'Crudo'], stock: 1, precio: 22000 }, { id: 's-negro', valores: ['S', 'Negro'], stock: 0 }],
      });
      await c.db('casanido_dev').collection('tienda').insertOne({ _id: 1 as never, datos: { tienda: DATOS_INICIALES.tienda, productos }, actualizado: new Date(), version: 1 });
      await c.close();

      server.middlewares.use(async (req, res, next) => {
        const nombre = /^\/api\/([a-z]+)(?:\?|$)/.exec(req.url ?? '')?.[1];
        if (!nombre) return next();
        try { await ((await server.ssrLoadModule(`/api/${nombre}.ts`)) as { default: (a: unknown, b: unknown) => Promise<void> }).default(req, res); } catch (e) { next(e); }
      });
      server.httpServer?.once('close', () => { void mongo.parar(); });
    },
  };
}

export default mergeConfig(base, defineConfig({
  plugins: [apiLocal()],
  server: { port: PUERTO, strictPort: true },
  define: { 'import.meta.env.VITE_API_URL': JSON.stringify(`http://localhost:${PUERTO}`) },
}));
