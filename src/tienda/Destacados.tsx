import { destacadosDe } from '../lib/tienda-vista';
import type { Producto, Tienda } from '../tipos';
import { ProductoTarjeta } from './ProductoTarjeta';

interface Props {
  productos: Producto[];
  tienda: Tienda;
  alAgregar: (id: string, varianteId?: string) => void;
  alAbrir: (id: string) => void;
}

export function Destacados({ productos, tienda, alAgregar, alAbrir }: Props) {
  const elegidos = destacadosDe(productos, 4);
  if (elegidos.length === 0) return null;
  return (
    <section className="seccion destacados" aria-labelledby="titulo-destacados">
      <div className="seccion-cabeza">
        <h2 id="titulo-destacados">Lo que más se lleva</h2>
        <a className="enlace-flecha" href="#catalogo">Ver todo →</a>
      </div>
      <div className="grilla">
        {elegidos.map(p => <ProductoTarjeta key={p.id} producto={p} conCamara={tienda.camara} alAgregar={alAgregar} alAbrir={alAbrir} />)}
      </div>
    </section>
  );
}
