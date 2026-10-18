import { useMemo } from 'react';
import type { Datos } from '../tipos';
import { ProductoTarjeta } from './ProductoTarjeta';

interface Props {
  datos: Datos;
  filtro: string;
  alFiltrar: (categoria: string) => void;
  alAgregar: (id: string) => void;
}

export function Catalogo({ datos, filtro, alFiltrar, alAgregar }: Props) {
  const { productos, tienda } = datos;
  const categorias = useMemo(() => ['Todos', ...new Set(productos.map(p => p.categoria))], [productos]);
  const visibles = productos.filter(p => filtro === 'Todos' || p.categoria === filtro);
  // Mientras haya fotos de ejemplo (generadas con IA) se avisa; la dueña las reemplaza desde el admin
  const hayFotosIlustrativas = productos.some(p => p.foto.startsWith('/img/productos/'));

  return (
    <main id="catalogo" className="catalogo">
      <div className="catalogo-cabeza">
        <h2>Nuestros productos</h2>
        <p>Elegí, sumá al pedido y mandanos todo junto por WhatsApp.</p>
        {hayFotosIlustrativas && <p className="aviso-ia">Imágenes ilustrativas generadas con IA: el producto real puede variar levemente.</p>}
      </div>
      <div className="filtros" role="group" aria-label="Filtrar por categoría">
        {categorias.map(c => (
          <button key={c} type="button" aria-pressed={c === filtro} onClick={() => alFiltrar(c)}>{c}</button>
        ))}
      </div>
      <div className="grilla" aria-live="polite">
        {visibles.map((p, i) => (
          <ProductoTarjeta key={p.id} producto={p} indice={i} conCamara={tienda.camara} alAgregar={alAgregar} />
        ))}
        {visibles.length === 0 && <p className="vacio-catalogo">Todavía no hay productos en esta categoría.</p>}
      </div>
    </main>
  );
}
