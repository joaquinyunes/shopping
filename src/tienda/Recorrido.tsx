import { lazy, Suspense, useRef, useState } from 'react';
import { useHeroMode } from '../hero/use-hero-mode';
import type { Datos } from '../tipos';

// El viaje 3D (three.js + GSAP, ~190 KB gzip) solo se descarga si la clienta lo abre.
const Hero3D = lazy(() => import('../hero/Hero3D'));

interface Props {
  datos: Datos;
  alAgregar: (id: string) => void;
  alVerCategoria: (categoria: string) => void;
}

/** «Recorré la casa»: el viaje 3D como extra opcional. Aparece solo si la dueña lo dejó prendido y el equipo tiene WebGL; la tienda no depende de él. */
export function Recorrido({ datos, alAgregar, alVerCategoria }: Props) {
  const modo = useHeroMode(datos.tienda.hero3d);
  const [abierto, setAbierto] = useState(false);
  const seccion = useRef<HTMLElement>(null);
  const hayProductos = datos.productos.some(p => !p.agotado && p.foto);

  if (!hayProductos || modo.motivo === 'apagado' || modo.motivo === 'sin-webgl' || modo.motivo === 'fallo') return null;

  const cerrar = () => {
    setAbierto(false);
    seccion.current?.scrollIntoView({ behavior: 'instant' });
  };

  return (
    <>
      <section ref={seccion} id="recorrido" className="seccion recorrido" aria-labelledby="titulo-recorrido">
        <div>
          <h2 id="titulo-recorrido">Recorré la casa</h2>
          <p>Un paseo en 3D por el pasillo de Casa Nido: scrolleás y la cámara pasa por cada producto. Es opcional; la tienda funciona igual sin él.</p>
        </div>
        {!abierto && <button type="button" className="btn" onClick={() => setAbierto(true)}>Abrir el recorrido 3D</button>}
      </section>
      {abierto && (
        <Suspense fallback={<p className="cargando cargando-recorrido" role="status">Preparando el recorrido…</p>}>
          <Hero3D
            datos={datos} limitado={modo.equipoLimitado} alAgregar={alAgregar} alVerCategoria={alVerCategoria}
            alAbandonar={modo.marcarFallo} alSimplificar={cerrar}
          />
        </Suspense>
      )}
    </>
  );
}
