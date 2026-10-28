import { conexion } from '../server/db.js';
import { ErrorHttp, esAdmin, json, leerJson, ruta } from '../server/http.js';
import { cambiarEstado, ESTADOS, listarPedidos, salida, type EstadoPedido } from '../server/pedidos.js';

const esEstado = (v: unknown): v is EstadoPedido => ESTADOS.includes(v as EstadoPedido);

/** Solo la dueña: GET lista (?estado=…) y PATCH {numero, estado} cambia el estado (cancelar repone el stock). */
export default ruta(async (req, res) => {
  if (req.method !== 'GET' && req.method !== 'PATCH') return json(res, 405, { error: 'Método no permitido' });
  if (!esAdmin(req)) return json(res, 401, { error: 'Clave incorrecta' });
  const cx = await conexion();

  if (req.method === 'GET') {
    const estado = new URL(req.url ?? '', 'http://x').searchParams.get('estado') ?? undefined;
    if (estado !== undefined && !esEstado(estado)) throw new ErrorHttp(400, 'Estado inválido');
    res.setHeader('Cache-Control', 'no-store');
    return json(res, 200, (await listarPedidos(cx.db, estado)).map(salida));
  }

  const { numero, estado } = (await leerJson(req, 2_000) ?? {}) as Record<string, unknown>;
  if (typeof numero !== 'number' || !Number.isInteger(numero) || !esEstado(estado)) throw new ErrorHttp(400, 'Pedido o estado inválido');
  json(res, 200, salida(await cambiarEstado(cx, numero, estado)));
});
