import { useMemo } from 'react';
import { buscarProductos } from '../lib/tienda-vista';
import type { Datos } from '../tipos';
import { ProductoTarjeta } from './ProductoTarjeta';

interface Props {
  datos: Datos;
  filtro: string;
  busqueda: string;
  alFiltrar: (categoria: string) => void;
  alLimpiarBusqueda: () => void;
  alAgregar: (id: string, varianteId?: string) => void;
  alAbrir: (id: string) => void;
}

export function Catalogo({ datos, filtro, busqueda, alFiltrar, alLimpiarBusqueda, alAgregar, alAbrir }: Props) {
  const { productos, tienda } = datos;
  const categorias = useMemo(() => ['Todos', ...new Set(productos.map(p => p.categoria))], [productos]);
  const visibles = buscarProductos(productos.filter(p => filtro === 'Todos' || p.categoria === filtro), busqueda);
  // Mientras haya fotos de ejemplo (generadas con IA) se avisa; la dueña las reemplaza desde el admin
  const hayFotosIlustrativas = productos.some(p => p.foto.startsWith('/img/productos/'));
  const hayBusqueda = busqueda.trim() !== '';

  return (
    <section id="catalogo" className="seccion catalogo" tabIndex={-1} aria-labelledby="titulo-catalogo">
      <div className="seccion-cabeza">
        <h2 id="titulo-catalogo">Todos los productos</h2>
        {hayFotosIlustrativas && <p className="aviso-ia">Imágenes ilustrativas generadas con IA: el producto real puede variar levemente.</p>}
      </div>
      <div className="filtros" role="group" aria-label="Filtrar por categoría">
        {categorias.map(c => (
          <button key={c} type="button" aria-pressed={c === filtro} onClick={() => alFiltrar(c)}>{c}</button>
        ))}
      </div>
      <p className="catalogo-cuenta" role="status">
        {visibles.length === 1 ? '1 producto' : `${visibles.length} productos`}
        {hayBusqueda && <> para «{busqueda.trim()}» <button type="button" className="enlace-btn" onClick={alLimpiarBusqueda}>Borrar búsqueda</button></>}
      </p>
      <div className="grilla">
        {visibles.map(p => <ProductoTarjeta key={p.id} producto={p} conCamara={tienda.camara} alAgregar={alAgregar} alAbrir={alAbrir} />)}
        {visibles.length === 0 && (
          <p className="vacio-catalogo">{hayBusqueda ? 'No encontramos productos con esa búsqueda. Probá con otra palabra.' : 'Todavía no hay productos en esta categoría.'}</p>
        )}
      </div>
    </section>
  );
}
