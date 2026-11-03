import { conexion } from '../server/db.js';
import { avisarPedido, vencerSiCorresponde } from '../server/avisar.js';
import { enviosDesdeEnv } from '../server/envios.js';
import { ipDe, json, leerJson, ruta } from '../server/http.js';
import { registrarPedido, salida } from '../server/pedidos.js';

/** Pública: la clienta registra su pedido (precios, stock y envío los calcula el servidor). */
export default ruta(async (req, res) => {
  if (req.method !== 'POST') return json(res, 405, { error: 'Método no permitido' });
  const cx = await conexion();
  await vencerSiCorresponde(cx); // libera el stock de pedidos viejos sin pago antes de vender
  const pedido = await registrarPedido(cx, await leerJson(req, 20_000), enviosDesdeEnv(), ipDe(req));
  await avisarPedido(cx, 'creado', pedido);
  json(res, 201, salida(pedido));
});
