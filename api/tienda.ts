import { normalizarProducto } from '../src/data/producto.js';
import type { Producto } from '../src/tipos.js';
import { diferencias, registrar } from '../server/auditoria.js';
import { exigirAdmin } from '../server/auth.js';
import { coleccion, conexion } from '../server/db.js';
import { datosValidos } from '../server/foto.js';
import { ipDe, json, leerCuerpo, parsearJson, ruta } from '../server/http.js';
import { huellaDeOrigen, leerCatalogo, type FilaTienda } from '../server/pedidos.js';

export default ruta(async (req, res) => {
  if (req.method === 'GET') {
    const fila = await (await coleccion<FilaTienda>('tienda')).findOne({ _id: 1 });
    res.setHeader('Cache-Control', 'no-store'); // sin caché de borde: Vercel no separa por Origin y se perdería el encabezado CORS
    return json(res, 200, fila?.datos ? { ...fila.datos, _v: fila.version ?? 0 } : null);
  }
  if (req.method !== 'PUT') return json(res, 405, { error: 'Método no permitido' });
  const cx = await conexion();
  await exigirAdmin(req, cx.db);

  const cuerpo = parsearJson(await leerCuerpo(req, 1_000_000));
  if (!datosValidos(cuerpo)) return json(res, 400, { error: 'Datos inválidos' });
  const { _v, ...resto } = cuerpo as typeof cuerpo & { _v?: unknown };
  const versionBase = typeof _v === 'number' && Number.isInteger(_v) && _v >= 0 ? _v : 0;
  // Se guarda la forma normalizada: ids de variantes, precios y fotos ya validados, sea cual sea el cliente que escribió.
  // El round-trip por JSON saca las claves `undefined`: el driver de Mongo las guardaría como null.
  const datos = JSON.parse(JSON.stringify({ tienda: resto.tienda, productos: resto.productos.flatMap(p => normalizarProducto(p) ?? []) })) as { tienda: Record<string, unknown>; productos: unknown[] };

  const antes = await leerCatalogo(cx.db); // para la auditoría: qué cambió respecto de lo guardado
  // Control de versión: si entró un pedido (o se guardó desde otro lado) desde que la dueña abrió el panel, su copia trae stock viejo y pisaría lo vendido.
  const filtro = versionBase === 0 ? { _id: 1, $or: [{ version: 0 }, { version: { $exists: false } }] } : { _id: 1, version: versionBase };
  let fila: FilaTienda | null = null;
  try {
    fila = await (await coleccion<FilaTienda>('tienda')).findOneAndUpdate(
      filtro, { $set: { datos, actualizado: new Date() }, $inc: { version: 1 } }, { upsert: versionBase === 0, returnDocument: 'after' },
    );
  } catch (e) {
    if ((e as { code?: number }).code !== 11000) throw e; // 11000: ya existe el documento con otra versión
  }
  if (fila) await registrar(cx.db, { tipo: 'catalogo', origen: huellaDeOrigen(ipDe(req) ?? 'sin-ip'), cambios: diferencias(antes, datos.productos as Producto[]) });
  if (!fila) return json(res, 409, { error: 'La tienda cambió mientras editabas (por ejemplo, entró un pedido). Recargá para ver el stock actual y volvé a hacer tu cambio.' });
  json(res, 200, { ok: true, _v: fila.version ?? 0 });
});
