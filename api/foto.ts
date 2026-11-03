import { randomUUID } from 'node:crypto';
import { Binary } from 'mongodb';
import { coleccion, conexion } from '../server/db.js';
import { tipoDeImagen } from '../server/foto.js';
import { exigirAdmin } from '../server/auth.js';
import { json, leerCuerpo, ruta } from '../server/http.js';
import { limitar } from '../server/limites.js';

interface Foto { _id: string; tipo: string; data: Binary; creado: Date }

export default ruta(async (req, res) => {
  if (req.method === 'GET') {
    const id = new URL(req.url ?? '', 'http://x').searchParams.get('id') ?? '';
    const foto = /^[a-f0-9-]{36}$/.test(id) ? await (await coleccion<Foto>('fotos')).findOne({ _id: id }) : null;
    if (!foto) return json(res, 404, { error: 'No existe' });
    res.statusCode = 200;
    res.setHeader('Content-Type', foto.tipo);
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable'); // cada foto nueva tiene id nuevo
    res.end(Buffer.from(foto.data.buffer));
    return;
  }
  if (req.method !== 'POST') return json(res, 405, { error: 'Método no permitido' });
  const { db } = await conexion();
  await exigirAdmin(req, db);
  await limitar(db, 'subida-fotos', 60, 3_600_000, 'Subiste muchas fotos seguidas. Esperá un rato.');

  const bytes = await leerCuerpo(req, 3_000_000);
  const tipo = tipoDeImagen(bytes);
  if (!tipo) return json(res, 400, { error: 'Solo JPG, PNG o WebP' });
  const id = randomUUID();
  await (await coleccion<Foto>('fotos')).insertOne({ _id: id, tipo, data: new Binary(bytes), creado: new Date() });
  json(res, 201, { url: `https://${req.headers.host}/api/foto?id=${id}` });
});
