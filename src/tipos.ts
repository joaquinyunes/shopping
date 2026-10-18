export type TipoMedida = 'alto' | 'largo' | 'ancho' | 'diametro';

export interface Producto {
  id: string;
  nombre: string;
  categoria: string;
  precio: number;
  foto: string;
  descripcion?: string;
  agotado?: boolean;
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
