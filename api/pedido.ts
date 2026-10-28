import { conexion } from '../server/db.js';
import { enviosDesdeEnv } from '../server/envios.js';
import { json, leerJson, ruta } from '../server/http.js';
import { registrarPedido, salida } from '../server/pedidos.js';

/** Pública: la clienta registra su pedido (precios, stock y envío los calcula el servidor). */
export default ruta(async (req, res) => {
  if (req.method !== 'POST') return json(res, 405, { error: 'Método no permitido' });
  const pedido = await registrarPedido(await conexion(), await leerJson(req, 20_000), enviosDesdeEnv());
  json(res, 201, salida(pedido));
});
