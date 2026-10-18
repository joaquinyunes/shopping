import { lazy, Suspense } from 'react';
import type { Datos } from '../tipos';
import { HeroEstatico } from './HeroEstatico';
import { useHeroMode } from './use-hero-mode';

// El viaje 3D (three.js + GSAP) se descarga aparte: la carga inicial es solo el hero estático.
const Hero3D = lazy(() => import('./Hero3D'));

interface Props {
  datos: Datos;
  alAgregar: (id: string) => void;
  alVerCategoria: (categoria: string) => void;
}

/** Elige entre el viaje 3D y el hero estático según el interruptor de la dueña, el dispositivo y la elección de la clienta. */
export function Hero({ datos, alAgregar, alVerCategoria }: Props) {
  const modo = useHeroMode(datos.tienda.hero3d);
  const hayProductosConFoto = datos.productos.some(p => !p.agotado && p.foto);

  if (modo.modo === '3d' && hayProductosConFoto) {
    return (
      <Suspense fallback={<HeroEstatico datos={datos} alAgregar={alAgregar} />}>
        <Hero3D
          datos={datos} limitado={modo.equipoLimitado} alAgregar={alAgregar} alVerCategoria={alVerCategoria}
          alAbandonar={modo.marcarFallo} alSimplificar={modo.desactivar}
        />
      </Suspense>
    );
  }
  return <HeroEstatico datos={datos} alAgregar={alAgregar} alActivar={modo.puedeActivar && hayProductosConFoto ? modo.activar : undefined} />;
}
