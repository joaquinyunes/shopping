import type { Conexion } from './db.js';
import { ErrorHttp } from './http.js';
import { cambiarEstado, pedidosDe, type Pedido } from './pedidos.js';

/**
 * Horas que un pedido puede quedar pendiente antes de cancelarse solo (devuelve el stock).
 * Viene APAGADO: sin `PEDIDO_VENCE_HORAS` nadie cancela nada, porque la dueña coordina el pago por WhatsApp y puede tardar días.
 */
export function horasDeVencimiento(): number | undefined {
  const horas = Number(process.env.PEDIDO_VENCE_HORAS);
  return Number.isFinite(horas) && horas > 0 ? horas : undefined;
}

/** Cancela los pendientes más viejos que `horas`. Cada uno en su transacción; si la dueña lo cambió un instante antes, se respeta. Devuelve los cancelados. */
export async function vencerPendientes(cx: Conexion, horas: number, ahora = new Date()): Promise<Pedido[]> {
  const limite = new Date(ahora.getTime() - horas * 3_600_000);
  const viejos = await pedidosDe(cx.db).find({ estado: 'pendiente', creado: { $lt: limite } }).sort({ _id: 1 }).limit(50).toArray();
  const cancelados: Pedido[] = [];
  for (const { _id } of viejos) {
    try {
      cancelados.push(await cambiarEstado(cx, _id, 'cancelado', { soloDesde: 'pendiente', motivo: 'vencido' }));
    } catch (error) {
      if (!(error instanceof ErrorHttp)) throw error; // 409/404: ya lo movió la dueña, nada que hacer
    }
  }
  return cancelados;
}
