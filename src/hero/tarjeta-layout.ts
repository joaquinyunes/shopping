import { centroDelTunel, type Vec3 } from './camera-path';
import type { Hito } from './hitos';

export interface PosicionTarjeta {
  pos: Vec3;
  /** Ancho de la tarjeta en unidades de escena. */
  ancho: number;
  rotZ: number;
}

/**
 * Dónde vive cada tarjeta. Escritorio (apaisado): la tarjeta del lado `lado` y el cartel de texto del lado opuesto.
 * Vertical (celular): centrada y más abajo, con el texto arriba.
 */
export function posicionTarjeta(hito: Pick<Hito, 't' | 'lado'>, aspecto: number): PosicionTarjeta {
  const [cx, cy, cz] = centroDelTunel(hito.t);
  const vertical = aspecto < 0.9;
  const desplazamientoX = vertical ? 0 : 2.9 * hito.lado * Math.min(1.2, aspecto / 1.6);
  const desplazamientoY = vertical ? -1.7 : 0.2;
  return {
    pos: [cx + desplazamientoX, cy + desplazamientoY, cz],
    ancho: vertical ? 3.1 : 3.6,
    rotZ: (hito.lado === 1 ? -1 : 1) * 0.05,
  };
}

const suavizar = (t: number) => t * t * (3 - 2 * t);

/**
 * Las tarjetas se materializan al acercarse la cámara (0 lejos → 1 cerca) y se encogen suavemente en los
 * últimos metros para no chocar contra la pantalla al pasar. Función pura.
 */
export function escalaPorDistancia(distancia: number, lejos = 34, cerca = 13, pasada = 6) {
  if (distancia >= lejos) return 0;
  const entrada = distancia <= cerca ? 1 : suavizar((lejos - distancia) / (lejos - cerca));
  const salida = suavizar(Math.min(1, Math.max(0, distancia / pasada)));
  return entrada * salida;
}
