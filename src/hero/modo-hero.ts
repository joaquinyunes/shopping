export type ModoHero = '3d' | 'estatico';
export type MotivoEstatico = 'apagado' | 'movimiento' | 'sin-webgl' | 'equipo' | 'elegido' | 'fallo';

export interface EntornoHero {
  /** Interruptor de la dueña en el admin. */
  heroActivo: boolean;
  reducedMotion: boolean;
  hayWebGL: boolean;
  /** Poca memoria/CPU o ahorro de datos: se arranca en estático. */
  equipoLimitado: boolean;
  /** Lo que la clienta eligió con el botón "Activar viaje 3D" / "Desactivar". */
  eleccion: 'on' | 'off' | null;
  /** La escena falló en esta visita (5 frames seguidos, contexto perdido, etc.). */
  fallo: boolean;
}

export interface DecisionHero {
  modo: ModoHero;
  motivo?: MotivoEstatico;
  /** ¿Tiene sentido ofrecer el botón "Activar viaje 3D"? Solo si nada técnico lo impide. */
  puedeActivar: boolean;
}

export function decidirModo(e: EntornoHero): DecisionHero {
  const estatico = (motivo: MotivoEstatico, puedeActivar: boolean): DecisionHero => ({ modo: 'estatico', motivo, puedeActivar });
  if (!e.heroActivo) return estatico('apagado', false);
  if (!e.hayWebGL) return estatico('sin-webgl', false);
  if (e.fallo) return estatico('fallo', false);
  if (e.eleccion === 'off') return estatico('elegido', true);
  if (e.eleccion === 'on') return { modo: '3d', puedeActivar: false };
  if (e.reducedMotion) return estatico('movimiento', true);
  if (e.equipoLimitado) return estatico('equipo', true);
  return { modo: '3d', puedeActivar: false };
}

interface NavegadorConMemoria extends Navigator {
  deviceMemory?: number;
  connection?: { saveData?: boolean; effectiveType?: string };
}

export function detectarEquipoLimitado(nav: NavegadorConMemoria): boolean {
  const memoria = nav.deviceMemory ?? 8;
  const nucleos = nav.hardwareConcurrency ?? 8;
  const lenta = nav.connection?.effectiveType === '2g' || nav.connection?.effectiveType === 'slow-2g';
  return memoria <= 2 || nucleos <= 3 || !!nav.connection?.saveData || lenta;
}

export function detectarWebGL(): boolean {
  try {
    return !!document.createElement('canvas').getContext('webgl2');
  } catch {
    return false;
  }
}
