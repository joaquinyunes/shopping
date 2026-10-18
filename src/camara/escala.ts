import type { TipoMedida } from '../tipos';

/** Tarjeta de crédito/débito estándar (ISO 7810 ID-1): se usa como regla para calibrar. */
export const TARJETA_CM = { ancho: 8.56, alto: 5.4 };

export const PX_POR_CM_MIN = 2;
export const PX_POR_CM_MAX = 80;

export const limitarEscala = (pxPorCm: number) => Math.min(PX_POR_CM_MAX, Math.max(PX_POR_CM_MIN, pxPorCm));

/**
 * Estimación inicial sin calibrar: una cámara con FOV horizontal ~65° y el objeto a ~38 cm
 * ve un ancho de 2·d·tan(fov/2) cm, repartido en los píxeles del ancho de la pantalla.
 */
export function pxPorCmInicial(anchoPantallaPx: number, fovGrados = 65, distanciaCm = 38) {
  const anchoVistoCm = 2 * distanciaCm * Math.tan((fovGrados * Math.PI) / 360);
  return limitarEscala(anchoPantallaPx / anchoVistoCm);
}

export const anchoEnPx = (cm: number, pxPorCm: number) => cm * pxPorCm;

/** Tamaño en pantalla del producto: la medida principal aplica al alto o al ancho según el tipo. */
export function dimensionesEnPx(aspectoImagen: number, cm: number, tipo: TipoMedida, pxPorCm: number) {
  const px = anchoEnPx(cm, pxPorCm);
  return tipo === 'alto' ? { w: px * aspectoImagen, h: px } : { w: px, h: px / aspectoImagen };
}

/** Escala que hace coincidir la silueta de la tarjeta con una tarjeta real apoyada, dado su ancho en pantalla. */
export const pxPorCmDesdeTarjeta = (anchoTarjetaPx: number) => limitarEscala(anchoTarjetaPx / TARJETA_CM.ancho);

/** Pellizco de dos dedos: la escala cambia en proporción a lo que cambió la distancia entre dedos. */
export function escalaPorPellizco(escalaInicial: number, distanciaInicial: number, distanciaActual: number) {
  if (distanciaInicial <= 0) return escalaInicial;
  return limitarEscala(escalaInicial * (distanciaActual / distanciaInicial));
}
