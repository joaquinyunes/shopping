import { cerrarTodasLasSesiones, dosPasos, exigirAdmin, haySesion, iniciarSesion } from '../server/auth.js';
import { conexion } from '../server/db.js';
import { json, ruta } from '../server/http.js';

/**
 * GET (público): ¿pide código de la app? ¿sigue vigente la sesión que trae esta pestaña?
 * POST: clave en x-admin-clave (y código en x-admin-codigo si hay segundo paso) → sesión.
 * DELETE (con sesión): cierra la sesión en todos los dispositivos.
 */
export default ruta(async (req, res) => {
  const { db } = await conexion();
  if (req.method === 'GET') {
    res.setHeader('Cache-Control', 'no-store');
    return json(res, 200, { dosPasos: dosPasos(), sesion: await haySesion(req, db) });
  }
  if (req.method === 'POST') return json(res, 200, await iniciarSesion(req, db));
  if (req.method === 'DELETE') {
    await exigirAdmin(req, db);
    await cerrarTodasLasSesiones(db);
    res.statusCode = 204;
    return void res.end();
  }
  json(res, 405, { error: 'Método no permitido' });
});
