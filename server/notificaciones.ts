import type { Pedido } from './pedidos.js';

export type EventoPedido = 'creado' | 'pagado' | 'enviado' | 'entregado' | 'cancelado' | 'vencido';

/**
 * Avisos al cliente por mail. Hoy hay dos adaptadores: `sinAvisos` (por defecto) y `porResend` (necesita RESEND_API_KEY y RESEND_FROM).
 * Otro proveedor se enchufa implementando esta interfaz, sin tocar pedidos.
 */
export interface NotificacionesProvider {
  nombre: string;
  avisar(evento: EventoPedido, pedido: Pedido, tienda: string): Promise<void>;
}

export const sinAvisos: NotificacionesProvider = { nombre: 'sin-avisos', async avisar() { /* no hay proveedor configurado */ } };

const pesos = (n: number) => '$' + Math.round(n).toLocaleString('es-AR');
const escapar = (s: string) => s.replace(/[&<>"']/g, c => `&#${c.charCodeAt(0)};`);

const ASUNTO: Record<EventoPedido, string> = {
  creado: 'Recibimos tu pedido',
  pagado: 'Confirmamos el pago de tu pedido',
  enviado: 'Tu pedido va en camino',
  entregado: 'Tu pedido fue entregado',
  cancelado: 'Cancelamos tu pedido',
  vencido: 'Tu pedido venció',
};

const CIERRE: Record<EventoPedido, string> = {
  creado: 'Te vamos a escribir para coordinar el pago y la entrega.',
  pagado: 'Estamos preparando tu pedido.',
  enviado: 'En cuanto llegue, avisanos si está todo bien.',
  entregado: '¡Gracias por tu compra!',
  cancelado: 'Si fue un error o querés retomarlo, escribinos y lo vemos.',
  vencido: 'Pasó el plazo para confirmarlo y liberamos los productos. Si todavía lo querés, escribinos y lo retomamos.',
};

/** Asunto y cuerpo (texto plano) del aviso; sin datos de más: número, detalle y total. */
export function textoDeAviso(evento: EventoPedido, p: Pedido, tienda: string): { asunto: string; texto: string } {
  const detalle = p.items.map(i => `• ${i.cant} x ${i.nombre}${i.variante ? ` (${i.variante.nombre})` : ''} — ${pesos(i.precio * i.cant)}`).join('\n');
  const envio = p.envio ? `\n${p.envio.servicio}: ${p.envio.precio ? pesos(p.envio.precio) : 'gratis'}` : '';
  return {
    asunto: `${ASUNTO[evento]} (n.º ${p._id}) · ${tienda}`,
    texto: `Hola ${p.cliente.nombre}:\n\n${ASUNTO[evento]}.\n\nPedido n.º ${p._id}\n${detalle}${envio}\nTotal: ${pesos(p.total)}\n\n${CIERRE[evento]}\n\n${tienda}`,
  };
}

/**
 * Resend (https://resend.com): POST /emails con Bearer. No se probó contra la API real (faltan RESEND_API_KEY y un dominio verificado);
 * la forma del pedido sigue su documentación y está cubierta con un `fetch` simulado en los tests.
 */
export function porResend({ apiKey, from, fetch: pedir = fetch }: { apiKey: string; from: string; fetch?: typeof fetch }): NotificacionesProvider {
  return {
    nombre: 'resend',
    async avisar(evento, pedido, tienda) {
      if (!pedido.cliente.email) return; // el mail es opcional en el pedido
      const { asunto, texto } = textoDeAviso(evento, pedido, tienda);
      const r = await pedir('https://api.resend.com/emails', {
        method: 'POST',
        headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ from, to: [pedido.cliente.email], subject: asunto, text: texto, html: `<p style="white-space:pre-line">${escapar(texto)}</p>` }),
      });
      if (!r.ok) throw new Error(`Resend respondió ${r.status}`);
    },
  };
}

export function avisosDesdeEnv(): NotificacionesProvider {
  const apiKey = process.env.RESEND_API_KEY, from = process.env.RESEND_FROM;
  return apiKey && from ? porResend({ apiKey, from }) : sinAvisos;
}

/** Manda el aviso sin dejar que un fallo (o un proveedor lento) rompa el pedido: el error queda en el log del servidor. */
export async function avisarSinFallar(proveedor: NotificacionesProvider, evento: EventoPedido, pedido: Pedido, tienda: string, esperaMs = 4000): Promise<boolean> {
  if (proveedor === sinAvisos || !pedido.cliente.email) return false;
  try {
    await Promise.race([
      proveedor.avisar(evento, pedido, tienda),
      new Promise((_, no) => setTimeout(() => no(new Error('El aviso tardó demasiado')), esperaMs).unref?.()),
    ]);
    return true;
  } catch (error) {
    console.error(`No se pudo avisar (${evento}, pedido ${pedido._id}):`, error instanceof Error ? error.message : error);
    return false;
  }
}
