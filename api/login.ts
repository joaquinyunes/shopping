import { esAdmin, json, ruta } from '../server/http.js';

export default ruta(async (req, res) => {
  if (req.method !== 'POST') return json(res, 405, { error: 'Método no permitido' });
  if (!process.env.ADMIN_PASSWORD) return json(res, 503, { error: 'El admin no está configurado' });
  if (esAdmin(req)) { res.statusCode = 204; res.end(); return; }
  await new Promise(r => setTimeout(r, 700)); // frena un poco los intentos al azar
  json(res, 401, { error: 'Clave incorrecta' });
});
