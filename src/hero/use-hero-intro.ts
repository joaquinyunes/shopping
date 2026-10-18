import { useEffect, type RefObject } from 'react';
import { gsap } from 'gsap';

/**
 * Entrada del texto al cargar. Anima solo [data-intro] (elementos internos); el scroll es dueño de los
 * contenedores [data-sale-*], así ninguna propiedad tiene dos dueños.
 */
export function useHeroIntro(escenarioRef: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const escenario = escenarioRef.current;
    if (!escenario) return;
    const ctx = gsap.context(() => {
      gsap.from('[data-intro]', { opacity: 0, y: 28, duration: 0.8, stagger: 0.09, ease: 'power3.out', delay: 0.1 });
    }, escenario);
    return () => ctx.revert();
  }, [escenarioRef]);
}
