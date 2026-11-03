import { timingSafeEqual } from 'node:crypto';
import { conexion } from '../server/db.js';
import { vencerSiCorresponde } from '../server/avisar.js';
import { esAdmin, json, ruta, type Req } from '../server/http.js';
import { horasDeVencimiento } from '../server/vencimiento.js';

/** Vercel Cron manda `Authorization: Bearer $CRON_SECRET`; la dueña también puede llamarlo con su clave. */
function autorizado(req: Req): boolean {
  const secreto = process.env.CRON_SECRET, dado = req.headers.authorization;
  if (secreto && typeof dado === 'string') {
    const a = Buffer.from(dado), b = Buffer.from(`Bearer ${secreto}`);
    if (a.length === b.length && timingSafeEqual(a, b)) return true;
  }
  return esAdmin(req);
}

/** Cron diario: cancela los pedidos pendientes vencidos (solo si PEDIDO_VENCE_HORAS está definida). */
export default ruta(async (req, res) => {
  if (req.method !== 'GET' && req.method !== 'POST') return json(res, 405, { error: 'Método no permitido' });
  if (!autorizado(req)) return json(res, 401, { error: 'No autorizado' });
  const activo = horasDeVencimiento() !== undefined;
  json(res, 200, { activo, vencidos: activo ? await vencerSiCorresponde(await conexion()) : 0 });
});
