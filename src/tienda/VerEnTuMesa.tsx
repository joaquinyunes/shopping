import { BotonCamara } from '../camara/BotonCamara';
import type { Producto } from '../tipos';

interface Props {
  producto?: Producto;
  alPedir: (id: string) => void;
}

/** El diferencial: probar el producto en la mesa de casa con la cámara del celular, a tamaño real. */
export function VerEnTuMesa({ producto, alPedir }: Props) {
  return (
    <section id="ver-en-tu-mesa" className="seccion mesa" aria-labelledby="titulo-mesa">
      <div className="mesa-texto">
        <p className="sobre">Con la cámara de tu celular</p>
        <h2 id="titulo-mesa">Ver en tu mesa</h2>
        <p>Apuntá a tu mesa o tu estante y mirá cómo queda cada producto, al tamaño real, antes de pedirlo. Solo necesitás una tarjeta de banco para calibrar la medida.</p>
        {producto && <BotonCamara producto={producto} variante="fila" alPedir={() => alPedir(producto.id)} />}
        {producto && <p className="mesa-nota">Probalo con «{producto.nombre}». En cada producto vas a encontrar el mismo botón.</p>}
      </div>
      {producto && <img src={producto.foto} alt="" width="320" height="320" loading="lazy" decoding="async" />}
    </section>
  );
}
