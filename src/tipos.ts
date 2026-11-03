export type TipoMedida = 'alto' | 'largo' | 'ancho' | 'diametro';

/** Combinación de las propiedades del producto (ej. talle M / color rojo), con precio y stock propios. */
export interface Variante {
  /** Sale de los valores (sin tildes, en minúsculas): dos variantes del mismo producto nunca lo repiten. */
  id: string;
  /** Un valor por cada propiedad del producto, en el mismo orden. */
  valores: string[];
  /** Sin valor = el precio del producto. */
  precio?: number;
  /** Sin valor = ilimitado. */
  stock?: number;
  sku?: string;
}

export interface Producto {
  id: string;
  nombre: string;
  categoria: string;
  precio: number;
  foto: string;
  descripcion?: string;
  agotado?: boolean;
  /** Unidades disponibles. Sin valor = ilimitado (igual que Tiendanube); los pedidos lo descuentan. */
  stock?: number;
  sku?: string;
  /** Medida principal en cm, cargada por la dueña. Si falta, la cámara estima por el nombre y la marca "aprox." */
  tamanoCm?: number;
  tipoMedida?: TipoMedida;
  pesoGr?: number;
  incluye?: string[];
  /** Fotos extra además de `foto` (que es la principal). */
  fotos?: string[];
  /** Precio de oferta: solo vale si es menor a `precio`. */
  precioPromo?: number;
  /** Oculto en la tienda (sigue en el panel y no se puede pedir). */
  oculto?: boolean;
  /** Nombres de las propiedades (hasta 3), ej. ['Talle', 'Color']. Van con `variantes`. */
  propiedades?: string[];
  /** Si hay variantes, el stock y el precio de cada una mandan sobre los del producto. */
  variantes?: Variante[];
}

export interface Tienda {
  nombre: string;
  lema: string;
  whatsapp: string;
  /** Interruptores: la tienda funciona completa con ambos apagados. */
  hero3d: boolean;
  camara: boolean;
}

export interface Datos {
  tienda: Tienda;
  productos: Producto[];
  /** Versión del catálogo en la nube: el servidor rechaza guardar sobre una versión vieja (entró un pedido o se editó en otro lado). */
  version?: number;
}

export type EstadoPedido = 'pendiente' | 'pagado' | 'enviado' | 'entregado' | 'cancelado';

/** Pedido tal como lo devuelve /api/pedidos (las fechas llegan como texto ISO). */
export interface PedidoRegistrado {
  numero: number;
  estado: EstadoPedido;
  items: Array<{ id: string; nombre: string; precio: number; cant: number; variante?: { id: string; nombre: string } }>;
  subtotal: number;
  envio?: { proveedor: string; servicio: string; precio: number };
  total: number;
  cliente: { nombre: string; telefono?: string; email?: string; cp?: string };
  creado: string;
  historial?: Array<{ estado: EstadoPedido; fecha: string; motivo?: string }>;
}

export interface OpcionEnvio { servicio: string; precio: number; diasMin: number; diasMax: number }
