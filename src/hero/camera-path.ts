export type Vec3 = [number, number, number];

export interface PoseCamara {
  pos: Vec3;
  mira: Vec3;
  fov: number;
  /** Inclinación lateral en radianes: da sensación de vuelo sin marear. */
  roll: number;
}

/** Largo del túnel en unidades de escena. La cámara viaja de z=0 a z=-LARGO. */
export const LARGO = 240;
/** Medidas del pasillo de hogar (unidades de escena). El eje central sigue centroDelTunel. */
export const PASILLO = { medioAncho: 7, piso: -2.6, techo: 4.4, tramo: 10 } as const;
/** El portal vive un poco más allá del final del recorrido. */
export const Z_PORTAL = -LARGO - 9;

const clamp01 = (x: number) => Math.min(1, Math.max(0, x));

/** Línea central del túnel: serpentea suave en x e y y avanza recto en z. Acepta p > 1 para mirar hacia adelante. */
export function centroDelTunel(p: number): Vec3 {
  return [1.2 * Math.sin(p * Math.PI * 3), 0.5 * Math.sin(p * Math.PI * 2.2 + 1), -LARGO * p];
}

/** progreso (0..1) → pose de cámara. Función pura: la escena solo aplica el resultado. */
export function poseCamara(progreso: number): PoseCamara {
  const p = clamp01(progreso);
  return {
    pos: centroDelTunel(p),
    mira: centroDelTunel(p + 0.03),
    fov: 62,
    roll: 0.04 * Math.sin(p * Math.PI * 4),
  };
}

/** Distancia (en z) desde la cámara a un punto de la escena para un progreso dado. */
export const distanciaZ = (progreso: number, zObjeto: number) => poseCamara(progreso).pos[2] - zObjeto;
