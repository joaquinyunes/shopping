import type { Producto, Tienda } from '../tipos';

export type Carrito = Record<string, number>;

export const formatoPrecio = (n: number) => '$' + Math.round(n).toLocaleString('es-AR');

/** Líneas del carrito sin productos agotados, borrados o con cantidad inválida. */
export function lineasDelCarrito(carrito: Carrito, productos: Producto[]) {
  return Object.entries(carrito).flatMap(([id, cant]) => {
    const producto = productos.find(p => p.id === id);
    return producto && !producto.agotado && cant >= 1 ? [{ producto, cant }] : [];
  });
}

export function totalDelCarrito(carrito: Carrito, productos: Producto[]) {
  return lineasDelCarrito(carrito, productos).reduce((s, l) => s + l.producto.precio * l.cant, 0);
}

/** Lo que devuelve el servidor cuando el pedido quedó registrado: número, envío cotizado y total final. */
export interface ExtraMensaje { numero?: number; envio?: { servicio: string; precio: number }; total?: number }

export function armarMensaje(carrito: Carrito, productos: Producto[], tienda: Pick<Tienda, 'nombre'>, extra: ExtraMensaje = {}): string | null {
  const lineas = lineasDelCarrito(carrito, productos);
  if (!lineas.length) return null;
  const detalle = lineas.map(l => `• ${l.cant} x ${l.producto.nombre} — ${formatoPrecio(l.producto.precio * l.cant)}`).join('\n');
  const envio = extra.envio ? `\n${extra.envio.servicio}: ${extra.envio.precio ? formatoPrecio(extra.envio.precio) : 'gratis'}` : '';
  const total = extra.total ?? totalDelCarrito(carrito, productos);
  return `¡Hola ${tienda.nombre}! Quiero hacer este pedido${extra.numero ? ` (n.º ${extra.numero})` : ''}:\n\n${detalle}${envio}\n\nTotal: ${formatoPrecio(total)}`;
}

export const linkWhatsApp = (numero: string, texto: string) =>
  `https://wa.me/${String(numero).replace(/\D/g, '')}?text=${encodeURIComponent(texto)}`;
