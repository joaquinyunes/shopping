import { conexion } from '../server/db.js';
import { json, ruta } from '../server/http.js';

/** Pública y sin datos: dice si la API y la base responden. Es lo que mira el aviso de caída (uptime). */
export default ruta(async (req, res) => {
  if (req.method !== 'GET') return json(res, 405, { error: 'Método no permitido' });
  res.setHeader('Cache-Control', 'no-store');
  try {
    await (await conexion()).db.command({ ping: 1 });
    json(res, 200, { ok: true });
  } catch {
    json(res, 503, { ok: false });
  }
});
