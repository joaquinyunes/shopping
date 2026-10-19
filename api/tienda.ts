import { coleccion } from '../server/db.js';
import { datosValidos } from '../server/foto.js';
import { esAdmin, json, leerCuerpo, ruta } from '../server/http.js';

interface Fila { _id: number; datos: unknown; actualizado: Date }

export default ruta(async (req, res) => {
  if (req.method === 'GET') {
    const fila = await (await coleccion<Fila>('tienda')).findOne({ _id: 1 });
    res.setHeader('Cache-Control', 'public, max-age=0, s-maxage=10');
    return json(res, 200, fila?.datos ?? null);
  }
  if (req.method !== 'PUT') return json(res, 405, { error: 'Método no permitido' });
  if (!esAdmin(req)) return json(res, 401, { error: 'Clave incorrecta' });

  let datos: unknown;
  try { datos = JSON.parse((await leerCuerpo(req, 1_000_000)).toString('utf8')); } catch (e) {
    if (e instanceof SyntaxError) return json(res, 400, { error: 'JSON inválido' });
    throw e;
  }
  if (!datosValidos(datos)) return json(res, 400, { error: 'Datos inválidos' });
  await (await coleccion<Fila>('tienda')).replaceOne({ _id: 1 }, { datos, actualizado: new Date() }, { upsert: true });
  json(res, 200, { ok: true });
});
