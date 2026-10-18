import { useEffect, useRef, type RefObject } from 'react';
import { escalaPorPellizco, limitarEscala } from './escala';

interface Opciones {
  superficieRef: RefObject<HTMLElement | null>;
  pxPorCm: number;
  alCambiarEscala: (pxPorCm: number) => void;
  alMover: (dx: number, dy: number) => void;
}

/**
 * Gestos sobre la superficie del visor: un dedo arrastra el producto, dos dedos (pellizco) o la rueda del
 * mouse cambian la escala px/cm. Usa Pointer Events, así sirve igual con dedo, lápiz o mouse.
 */
export function useGestoEscala({ superficieRef, pxPorCm, alCambiarEscala, alMover }: Opciones) {
  // Refs con los últimos valores: los listeners nativos se registran una sola vez
  const ultima = useRef({ pxPorCm, alCambiarEscala, alMover });
  useEffect(() => { ultima.current = { pxPorCm, alCambiarEscala, alMover }; });

  useEffect(() => {
    const el = superficieRef.current;
    if (!el) return;
    const punteros = new Map<number, { x: number; y: number }>();
    let base: { distancia: number; escala: number } | null = null;

    const distancia = () => {
      const [a, b] = [...punteros.values()];
      return Math.hypot(a.x - b.x, a.y - b.y);
    };

    const abajo = (e: PointerEvent) => {
      el.setPointerCapture(e.pointerId);
      punteros.set(e.pointerId, { x: e.clientX, y: e.clientY });
      base = punteros.size === 2 ? { distancia: distancia(), escala: ultima.current.pxPorCm } : null;
    };
    const mover = (e: PointerEvent) => {
      const previo = punteros.get(e.pointerId);
      if (!previo) return;
      const actual = { x: e.clientX, y: e.clientY };
      punteros.set(e.pointerId, actual);
      if (punteros.size === 2 && base) {
        ultima.current.alCambiarEscala(escalaPorPellizco(base.escala, base.distancia, distancia()));
      } else if (punteros.size === 1) {
        ultima.current.alMover(actual.x - previo.x, actual.y - previo.y);
      }
    };
    const arriba = (e: PointerEvent) => {
      punteros.delete(e.pointerId);
      base = punteros.size === 2 ? { distancia: distancia(), escala: ultima.current.pxPorCm } : null;
    };
    const rueda = (e: WheelEvent) => {
      e.preventDefault();
      ultima.current.alCambiarEscala(limitarEscala(ultima.current.pxPorCm * Math.exp(-e.deltaY * 0.0015)));
    };

    el.addEventListener('pointerdown', abajo);
    el.addEventListener('pointermove', mover);
    el.addEventListener('pointerup', arriba);
    el.addEventListener('pointercancel', arriba);
    el.addEventListener('wheel', rueda, { passive: false });
    return () => {
      el.removeEventListener('pointerdown', abajo);
      el.removeEventListener('pointermove', mover);
      el.removeEventListener('pointerup', arriba);
      el.removeEventListener('pointercancel', arriba);
      el.removeEventListener('wheel', rueda);
    };
  }, [superficieRef]);
}
