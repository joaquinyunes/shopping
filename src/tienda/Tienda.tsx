import { useEffect, useMemo, useState } from 'react';
import { destacadosDe, idDeRuta, rutaFicha } from '../lib/tienda-vista';
import type { Datos } from '../tipos';
import { Ambientes } from './Ambientes';
import { Barra } from './Barra';
import { Carrito } from './Carrito';
import { Catalogo } from './Catalogo';
import { ComoPedir } from './ComoPedir';
import { Destacados } from './Destacados';
import { Ficha } from './Ficha';
import { Pie } from './Pie';
import { Portada } from './Portada';
import { Recorrido } from './Recorrido';
import { useCarrito } from './use-carrito';
import { VerEnTuMesa } from './VerEnTuMesa';

const suave = () => (matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth');

export function Tienda({ datos }: { datos: Datos }) {
  const [filtro, setFiltro] = useState('Todos');
  const [busqueda, setBusqueda] = useState('');
  const [carritoAbierto, setCarritoAbierto] = useState(false);
  const [fichaId, setFichaId] = useState(() => idDeRuta(location.hash));
  const carrito = useCarrito(datos.productos);
  // Los ocultos siguen en el panel pero la clienta no los ve (ni en la portada, ni en el catálogo, ni en la cámara).
  const visibles = useMemo<Datos>(() => ({ ...datos, productos: datos.productos.filter(p => !p.oculto) }), [datos]);
  const ficha = visibles.productos.find(p => p.id === fichaId) ?? null;
  const portada = destacadosDe(visibles.productos, 1)[0];

  // La ficha vive en el hash (#/producto/ID): se puede compartir y el botón «atrás» la cierra.
  useEffect(() => {
    const alCambiar = () => setFichaId(idDeRuta(location.hash));
    window.addEventListener('hashchange', alCambiar);
    return () => window.removeEventListener('hashchange', alCambiar);
  }, []);
  const abrirFicha = (id: string) => { location.hash = rutaFicha(id); };
  const cerrarFicha = () => {
    if (idDeRuta(location.hash) === null) return;
    history.replaceState(null, '', location.pathname + location.search);
    setFichaId(null);
  };

  // Desde la portada o la cámara no se puede elegir talle/color: con variantes se abre la ficha.
  const agregarDesdeAfuera = (id: string) => {
    if (datos.productos.find(p => p.id === id)?.variantes?.length) abrirFicha(id);
    else carrito.agregar(id);
  };

  const verCategoria = (categoria: string) => {
    setFiltro(categoria);
    document.getElementById('catalogo')?.scrollIntoView({ behavior: suave() });
  };

  return (
    <>
      <Barra tienda={datos.tienda} cuenta={carrito.cuenta} busqueda={busqueda} alBuscar={t => { setBusqueda(t); setFiltro('Todos'); }} alAbrirCarrito={() => setCarritoAbierto(true)} />
      <main>
        <Portada tienda={datos.tienda} destacado={portada} alAgregar={agregarDesdeAfuera} />
        <Ambientes productos={visibles.productos} alElegir={verCategoria} />
        <Recorrido datos={visibles} alAgregar={agregarDesdeAfuera} alVerCategoria={verCategoria} />
        <Destacados productos={visibles.productos} tienda={datos.tienda} alAgregar={carrito.agregar} alAbrir={abrirFicha} />
        <ComoPedir />
        {datos.tienda.camara && <VerEnTuMesa producto={portada} alPedir={agregarDesdeAfuera} />}
        <Catalogo
          datos={visibles} filtro={filtro} busqueda={busqueda} alFiltrar={setFiltro} alLimpiarBusqueda={() => setBusqueda('')}
          alAgregar={carrito.agregar} alAbrir={abrirFicha}
        />
      </main>
      <Pie tienda={datos.tienda} />
      <Ficha
        producto={ficha} datos={visibles} alCerrar={cerrarFicha} alAgregar={carrito.agregar}
        alVerPedido={() => { cerrarFicha(); setCarritoAbierto(true); }}
      />
      <Carrito
        abierto={carritoAbierto} alCerrar={() => setCarritoAbierto(false)} datos={datos}
        carrito={carrito.carrito} lineas={carrito.lineas} total={carrito.total} alCambiar={carrito.cambiar}
      />
    </>
  );
}
