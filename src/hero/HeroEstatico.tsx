import type { Datos } from '../tipos';
import { categoriasDe, destacadoDe, HeroTextos, TarjetaDestacada } from './HeroPartes';

interface Props {
  datos: Datos;
  alAgregar: (id: string) => void;
  /** Si es posible, ofrece el botón para activar el viaje 3D. */
  alActivar?: () => void;
}

/** Hero de respaldo: sin WebGL, con reduced-motion, equipo limitado o si la dueña apagó el viaje. Mismo mensaje, sin animación. */
export function HeroEstatico({ datos, alAgregar, alActivar }: Props) {
  const { tienda, productos } = datos;
  const destacado = destacadoDe(productos);
  const tarjetas = productos.filter(p => !p.agotado && p.foto).slice(0, 4);
  return (
    <section className="hero-estatico" aria-label="Presentación">
      <div className="hero-estatico-contenido">
        <HeroTextos tienda={tienda} categorias={categoriasDe(productos)} />
        {destacado && <TarjetaDestacada producto={destacado} alAgregar={alAgregar} />}
        {alActivar && (
          <button type="button" className="btn btn-fantasma" onClick={alActivar}>Activar viaje 3D</button>
        )}
      </div>
      <div className="hero-estatico-arte" aria-hidden="true">
        <div className="arco-css" />
        {tarjetas.map((p, i) => <figure key={p.id} className={`tarjeta-css tarjeta-css-${i}`}><img src={p.foto} alt="" /></figure>)}
      </div>
    </section>
  );
}
