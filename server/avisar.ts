import type { Conexion } from './db.js';
import { avisarSinFallar, avisosDesdeEnv, type EventoPedido } from './notificaciones.js';
import { leerNombreTienda, type Pedido } from './pedidos.js';
import { horasDeVencimiento, vencerPendientes } from './vencimiento.js';

/** Avisa al cliente del pedido (si dejó mail y hay proveedor). Nunca lanza. */
export async function avisarPedido(cx: Conexion, evento: EventoPedido, pedido: Pedido): Promise<void> {
  const proveedor = avisosDesdeEnv();
  if (proveedor.nombre === 'sin-avisos' || !pedido.cliente.email) return;
  await avisarSinFallar(proveedor, evento, pedido, await leerNombreTienda(cx.db));
}

/**
 * Si el vencimiento automático está prendido (PEDIDO_VENCE_HORAS), cancela los pendientes viejos y avisa a cada cliente.
 * Se llama desde el cron diario y, de paso, cuando entra un pedido o la dueña abre el panel: así el stock no queda retenido hasta el próximo cron.
 * Nunca rompe la llamada que lo disparó.
 */
export async function vencerSiCorresponde(cx: Conexion): Promise<number> {
  const horas = horasDeVencimiento();
  if (!horas) return 0;
  try {
    const cancelados = await vencerPendientes(cx, horas);
    for (const p of cancelados) await avisarPedido(cx, 'vencido', p);
    return cancelados.length;
  } catch (error) {
    console.error('No se pudieron vencer los pedidos pendientes:', error instanceof Error ? error.message : error);
    return 0;
  }
}
