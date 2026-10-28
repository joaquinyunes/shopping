export type TipoMedida = 'alto' | 'largo' | 'ancho' | 'diametro';

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
}

export type EstadoPedido = 'pendiente' | 'pagado' | 'enviado' | 'entregado' | 'cancelado';

/** Pedido tal como lo devuelve /api/pedidos (las fechas llegan como texto ISO). */
export interface PedidoRegistrado {
  numero: number;
  estado: EstadoPedido;
  items: Array<{ id: string; nombre: string; precio: number; cant: number }>;
  subtotal: number;
  envio?: { proveedor: string; servicio: string; precio: number };
  total: number;
  cliente: { nombre: string; telefono?: string; cp?: string };
  creado: string;
}

export interface OpcionEnvio { servicio: string; precio: number; diasMin: number; diasMax: number }
