import { registrar } from '../server/auditoria.js';
import { exigirAdmin } from '../server/auth.js';
import { conexion } from '../server/db.js';
import { ErrorHttp, ipDe, json, leerJson, ruta } from '../server/http.js';
import { huellaDeOrigen } from '../server/pedidos.js';
import { borrarDatos, exportarDatos, personaDe } from '../server/privacidad.js';

/**
 * Solo la dueña, por POST (los datos personales no van en la dirección): {accion: 'exportar' | 'borrar', email?, telefono?}.
 * Es el derecho de acceso y de supresión de la Ley 25.326, a pedido de la persona.
 */
export default ruta(async (req, res) => {
  if (req.method !== 'POST') return json(res, 405, { error: 'Método no permitido' });
  const { db } = await conexion();
  await exigirAdmin(req, db);
  const cuerpo = (await leerJson(req, 2_000) ?? {}) as Record<string, unknown>;
  const persona = personaDe(cuerpo);
  res.setHeader('Cache-Control', 'no-store');
  if (cuerpo.accion === 'exportar') return json(res, 200, { pedidos: await exportarDatos(db, persona) });
  if (cuerpo.accion === 'borrar') {
    const n = await borrarDatos(db, persona);
    await registrar(db, { tipo: 'privacidad', origen: huellaDeOrigen(ipDe(req) ?? 'sin-ip'), cambios: [{ campo: 'datos personales borrados a pedido', despues: `${n} pedido(s)` }] }); // sin el mail ni el teléfono
    return json(res, 200, { anonimizados: n });
  }
  throw new ErrorHttp(400, 'Acción inválida');
});
