import type { Producto, Tienda, Variante } from '../tipos';
import { buscarVariante, estaAgotado, etiquetaVariante, precioDe, separarClave } from './catalogo';

export type Carrito = Record<string, number>;

export const formatoPrecio = (n: number) => '$' + Math.round(n).toLocaleString('es-AR');

export interface LineaCarrito { clave: string; producto: Producto; variante?: Variante; cant: number }

/** Líneas del carrito sin productos ocultos, agotados, borrados, sin la variante elegida o con cantidad inválida. */
export function lineasDelCarrito(carrito: Carrito, productos: Producto[]): LineaCarrito[] {
  return Object.entries(carrito).flatMap(([clave, cant]) => {
    const { id, varianteId } = separarClave(clave);
    const producto = productos.find(p => p.id === id);
    if (!producto || producto.oculto || estaAgotado(producto) || !(cant >= 1)) return [];
    if (!varianteId) return producto.variantes?.length ? [] : [{ clave, producto, cant }];
    const variante = buscarVariante(producto, varianteId);
    return variante && variante.stock !== 0 ? [{ clave, producto, variante, cant }] : [];
  });
}

export const nombreDeLinea = (l: Pick<LineaCarrito, 'producto' | 'variante'>) =>
  l.variante ? `${l.producto.nombre} (${etiquetaVariante(l.variante)})` : l.producto.nombre;

export const precioDeLinea = (l: Pick<LineaCarrito, 'producto' | 'variante'>) => precioDe(l.producto, l.variante);

export function totalDelCarrito(carrito: Carrito, productos: Producto[]) {
  return lineasDelCarrito(carrito, productos).reduce((s, l) => s + precioDeLinea(l) * l.cant, 0);
}

/** Lo que devuelve el servidor cuando el pedido quedó registrado: número, envío cotizado y total final. */
export interface ExtraMensaje { numero?: number; envio?: { servicio: string; precio: number }; total?: number }

export function armarMensaje(carrito: Carrito, productos: Producto[], tienda: Pick<Tienda, 'nombre'>, extra: ExtraMensaje = {}): string | null {
  const lineas = lineasDelCarrito(carrito, productos);
  if (!lineas.length) return null;
  const detalle = lineas.map(l => `• ${l.cant} x ${nombreDeLinea(l)} — ${formatoPrecio(precioDeLinea(l) * l.cant)}`).join('\n');
  const envio = extra.envio ? `\n${extra.envio.servicio}: ${extra.envio.precio ? formatoPrecio(extra.envio.precio) : 'gratis'}` : '';
  const total = extra.total ?? totalDelCarrito(carrito, productos);
  return `¡Hola ${tienda.nombre}! Quiero hacer este pedido${extra.numero ? ` (n.º ${extra.numero})` : ''}:\n\n${detalle}${envio}\n\nTotal: ${formatoPrecio(total)}`;
}

export const linkWhatsApp = (numero: string, texto: string) =>
  `https://wa.me/${String(numero).replace(/\D/g, '')}?text=${encodeURIComponent(texto)}`;
