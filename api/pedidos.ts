import { conexion } from '../server/db.js';
import { avisarPedido, vencerSiCorresponde } from '../server/avisar.js';
import { exigirAdmin } from '../server/auth.js';
import { registrar } from '../server/auditoria.js';
import { ErrorHttp, ipDe, json, leerJson, ruta } from '../server/http.js';
import { cambiarEstado, ESTADOS, huellaDeOrigen, listarPedidos, pedidosDe, salida, type EstadoPedido } from '../server/pedidos.js';

const esEstado = (v: unknown): v is EstadoPedido => ESTADOS.includes(v as EstadoPedido);

/** Solo la dueña: GET lista (?estado=…) y PATCH {numero, estado} cambia el estado (cancelar repone el stock). */
export default ruta(async (req, res) => {
  if (req.method !== 'GET' && req.method !== 'PATCH') return json(res, 405, { error: 'Método no permitido' });
  const cx = await conexion();
  await exigirAdmin(req, cx.db);

  if (req.method === 'GET') {
    const estado = new URL(req.url ?? '', 'http://x').searchParams.get('estado') ?? undefined;
    if (estado !== undefined && !esEstado(estado)) throw new ErrorHttp(400, 'Estado inválido');
    await vencerSiCorresponde(cx);
    res.setHeader('Cache-Control', 'no-store');
    return json(res, 200, (await listarPedidos(cx.db, estado)).map(salida));
  }

  const { numero, estado } = (await leerJson(req, 2_000) ?? {}) as Record<string, unknown>;
  if (typeof numero !== 'number' || !Number.isInteger(numero) || !esEstado(estado)) throw new ErrorHttp(400, 'Pedido o estado inválido');
  const antes = (await pedidosDe(cx.db).findOne({ _id: numero }))?.estado;
  const pedido = await cambiarEstado(cx, numero, estado);
  await registrar(cx.db, { tipo: 'pedido', origen: huellaDeOrigen(ipDe(req) ?? 'sin-ip'), cambios: [{ producto: `pedido ${numero}`, campo: 'estado', antes, despues: estado }] });
  if (estado !== 'pendiente') await avisarPedido(cx, estado, pedido); // reabrir no avisa
  json(res, 200, salida(pedido));
});
