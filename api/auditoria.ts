import { exigirAdmin } from '../server/auth.js';
import { listarAuditoria } from '../server/auditoria.js';
import { conexion } from '../server/db.js';
import { json, ruta } from '../server/http.js';

/** Solo la dueña, solo lectura: quién cambió precios, stock y estados de pedidos. No hay ruta que lo edite ni lo borre. */
export default ruta(async (req, res) => {
  if (req.method !== 'GET') return json(res, 405, { error: 'Método no permitido' });
  const { db } = await conexion();
  await exigirAdmin(req, db);
  res.setHeader('Cache-Control', 'no-store');
  json(res, 200, await listarAuditoria(db));
});
