import { conexion } from '../server/db.js';
import { cotizarEnvio, enviosDesdeEnv } from '../server/envios.js';
import { ErrorHttp, json, leerJson, ruta } from '../server/http.js';
import { leerCatalogo, resolverItems, validarItems } from '../server/pedidos.js';

/** Pública: {cp, items:[{id, cant}]} → opciones de envío cotizadas con el peso y el valor del carrito. */
export default ruta(async (req, res) => {
  if (req.method !== 'POST') return json(res, 405, { error: 'Método no permitido' });
  const { cp, items } = (await leerJson(req, 5_000) ?? {}) as Record<string, unknown>;
  const lineas = validarItems(items);
  if (typeof lineas === 'string') throw new ErrorHttp(400, lineas);
  const armado = resolverItems(await leerCatalogo((await conexion()).db), lineas);
  if (typeof armado === 'string') throw new ErrorHttp(/stock|agotado/i.test(armado) ? 409 : 400, armado);
  const opciones = await cotizarEnvio(enviosDesdeEnv(), { cp: typeof cp === 'string' ? cp : '', pesoGr: armado.pesoGr, valorDeclarado: armado.subtotal });
  json(res, 200, { opciones });
});
