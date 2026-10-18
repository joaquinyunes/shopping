import { useEffect, useRef, type RefObject } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import type { Hito } from './hitos';

gsap.registerPlugin(ScrollTrigger);

/**
 * Progreso del viaje (0..1) atado al scroll de la sección alta + timeline GSAP con scrub para los carteles HTML:
 * cada cartel entra justo antes de que la cámara pase por su producto y sale después.
 * Dueño de: opacidad/posición de [data-sale-*], [data-hito], [data-final], [data-pista] y [data-barra].
 */
export function useHeroScroll(seccionRef: RefObject<HTMLElement | null>, escenarioRef: RefObject<HTMLElement | null>, hitos: Hito[]) {
  const progresoRef = useRef(0);

  useEffect(() => {
    const seccion = seccionRef.current, escenario = escenarioRef.current;
    if (!seccion || !escenario) return;

    const ctx = gsap.context(() => {
      const linea = gsap.timeline({
        defaults: { ease: 'none' },
        scrollTrigger: {
          trigger: seccion, start: 'top top', end: 'bottom bottom', scrub: 0.5,
          onUpdate: self => { progresoRef.current = self.progress; },
        },
      });

      // Al arrancar, el texto sale volando hacia los costados
      linea.to('[data-sale-izq]', { xPercent: -140, autoAlpha: 0, duration: 0.07, ease: 'power2.in' }, 0);
      linea.to('[data-sale-der]', { xPercent: 140, autoAlpha: 0, duration: 0.07, ease: 'power2.in' }, 0);
      linea.to('[data-pista]', { autoAlpha: 0, duration: 0.03 }, 0);
      linea.fromTo('[data-barra]', { scaleX: 0 }, { scaleX: 1, duration: 1, transformOrigin: 'left center' }, 0);

      // Cada cartel entra mientras su tarjeta se materializa (la cámara pasa por t) y sale antes de que llegue el siguiente.
      // Entra deslizando desde su lado (opuesto a la tarjeta), con un leve giro.
      hitos.forEach((h, i) => {
        const sel = `[data-hito="${i}"]`;
        linea.fromTo(sel, { autoAlpha: 0, xPercent: -h.lado * 10, scale: 0.88, rotation: -h.lado * 3 },
          { autoAlpha: 1, xPercent: 0, scale: 1, rotation: 0, duration: 0.04, ease: 'power2.out' }, h.t - 0.095);
        linea.to(sel, { autoAlpha: 0, xPercent: h.lado * 10, duration: 0.035, ease: 'power2.in' }, h.t - 0.03);
      });

      linea.fromTo('[data-final]', { autoAlpha: 0, yPercent: 14 }, { autoAlpha: 1, yPercent: 0, duration: 0.06, ease: 'power2.out' }, 0.9);
      linea.set({}, {}, 1); // la línea dura exactamente 1 = 100% del scroll
    }, escenario);

    return () => ctx.revert();
  }, [seccionRef, escenarioRef, hitos]);

  return progresoRef;
}
