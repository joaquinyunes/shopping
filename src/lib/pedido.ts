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

export function armarMensaje(carrito: Carrito, productos: Producto[], tienda: Pick<Tienda, 'nombre'>): string | null {
  const lineas = lineasDelCarrito(carrito, productos);
  if (!lineas.length) return null;
  const detalle = lineas.map(l => `• ${l.cant} x ${l.producto.nombre} — ${formatoPrecio(l.producto.precio * l.cant)}`).join('\n');
  return `¡Hola ${tienda.nombre}! Quiero hacer este pedido:\n\n${detalle}\n\nTotal: ${formatoPrecio(totalDelCarrito(carrito, productos))}`;
}

export const linkWhatsApp = (numero: string, texto: string) =>
  `https://wa.me/${String(numero).replace(/\D/g, '')}?text=${encodeURIComponent(texto)}`;
