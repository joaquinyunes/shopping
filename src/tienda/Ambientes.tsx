import type { Producto } from '../tipos';

// Foto por ambiente. Una categoría sin foto aquí (Organización, Herrajes, las que cree la dueña) se muestra con la foto de uno de sus productos.
const FOTOS: Record<string, string> = {
  Cocina: '/img/ambientes/cocina.webp',
  Deco: '/img/ambientes/deco.webp',
  Textiles: '/img/ambientes/textiles.webp',
  'Baño': '/img/ambientes/bano.webp',
};

interface Props {
  productos: Producto[];
  alElegir: (categoria: string) => void;
}

/** «Comprá por ambiente»: una entrada por categoría que tenga productos a la vista. */
export function Ambientes({ productos, alElegir }: Props) {
  const categorias = [...new Set(productos.map(p => p.categoria))];
  if (categorias.length === 0) return null;
  return (
    <section id="ambientes" className="seccion ambientes" aria-labelledby="titulo-ambientes">
      <h2 id="titulo-ambientes">Comprá por ambiente</h2>
      <ul className="ambientes-lista">
        {categorias.map(c => {
          const cantidad = productos.filter(p => p.categoria === c).length;
          const foto = FOTOS[c];
          return (
            <li key={c}>
              <button type="button" className={foto ? 'ambiente' : 'ambiente ambiente-producto'} onClick={() => alElegir(c)}>
                <img src={foto ?? productos.find(p => p.categoria === c && p.foto)?.foto ?? ''} alt="" loading="lazy" decoding="async" />
                <span className="ambiente-nombre">{c}</span>
                <span className="ambiente-cuenta">{cantidad === 1 ? '1 producto' : `${cantidad} productos`}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
