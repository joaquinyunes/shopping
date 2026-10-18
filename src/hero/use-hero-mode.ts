import { useCallback, useState } from 'react';
import { decidirModo, detectarEquipoLimitado, detectarWebGL, type DecisionHero } from './modo-hero';

const CLAVE = 'casa-nido:hero3d';

function leerEleccion(): 'on' | 'off' | null {
  try {
    const v = localStorage.getItem(CLAVE);
    return v === 'on' || v === 'off' ? v : null;
  } catch {
    return null; // sin storage (modo privado): no se recuerda la elección
  }
}

function guardarEleccion(v: 'on' | 'off') {
  try { localStorage.setItem(CLAVE, v); } catch { /* sin storage */ }
}

export interface ModoHeroUI extends DecisionHero {
  activar: () => void;
  desactivar: () => void;
  marcarFallo: () => void;
  equipoLimitado: boolean;
}

/** Qué hero mostrar: el viaje 3D o el estático. La elección de la clienta se recuerda en localStorage. */
export function useHeroMode(heroActivo: boolean): ModoHeroUI {
  const [eleccion, setEleccion] = useState(leerEleccion);
  const [fallo, setFallo] = useState(false);

  const equipoLimitado = detectarEquipoLimitado(navigator);
  const decision = decidirModo({
    heroActivo,
    reducedMotion: matchMedia('(prefers-reduced-motion: reduce)').matches,
    hayWebGL: detectarWebGL(),
    equipoLimitado,
    eleccion,
    fallo,
  });

  const activar = useCallback(() => { guardarEleccion('on'); setFallo(false); setEleccion('on'); }, []);
  const desactivar = useCallback(() => { guardarEleccion('off'); setEleccion('off'); }, []);
  const marcarFallo = useCallback(() => setFallo(true), []);

  return { ...decision, activar, desactivar, marcarFallo, equipoLimitado };
}
