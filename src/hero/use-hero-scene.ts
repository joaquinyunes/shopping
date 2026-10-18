import { useEffect, type RefObject } from 'react';
import type { Hito } from './hitos';

interface Opciones {
  canvasRef: RefObject<HTMLCanvasElement | null>;
  contenedorRef: RefObject<HTMLElement | null>;
  hitos: Hito[];
  urlFrente: string;
  progresoRef: RefObject<number>;
  limitado: boolean;
  alAbandonar: (motivo: string) => void;
}

/** Monta la escena three.js (importada de forma diferida) y la desmonta liberando todo. */
export function useHeroScene({ canvasRef, contenedorRef, hitos, urlFrente, progresoRef, limitado, alAbandonar }: Opciones) {
  useEffect(() => {
    const canvas = canvasRef.current, contenedor = contenedorRef.current;
    if (!canvas || !contenedor) return;
    let cancelado = false;
    let escena: { destruir(): void } | null = null;

    import('./create-hero-scene')
      .then(m => m.crearEscenaHero({
        canvas, contenedor, hitos, urlFrente, limitado, alAbandonar,
        estaCancelado: () => cancelado, leerProgreso: () => progresoRef.current,
      }))
      .then(e => { if (cancelado) e.destruir(); else escena = e; })
      .catch(error => { if (!cancelado) alAbandonar(`no pudo iniciar: ${String(error)}`); });

    return () => { cancelado = true; escena?.destruir(); };
    // La escena se crea una sola vez por montaje: las props cambian solo si cambia la tienda (se remonta el hero).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
