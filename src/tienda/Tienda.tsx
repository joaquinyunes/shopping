import { useMemo, useState } from 'react';
import { Hero } from '../hero/Hero';
import type { Datos } from '../tipos';
import { Barra } from './Barra';
import { Carrito } from './Carrito';
import { Catalogo } from './Catalogo';
import { Pie } from './Pie';
import { useCarrito } from './use-carrito';

export function Tienda({ datos }: { datos: Datos }) {
  const [filtro, setFiltro] = useState('Todos');
  const [carritoAbierto, setCarritoAbierto] = useState(false);
  const carrito = useCarrito(datos.productos);
  // Los ocultos siguen en el panel pero la clienta no los ve (ni en el héroe, ni en el catálogo, ni en la cámara).
  const visibles = useMemo<Datos>(() => ({ ...datos, productos: datos.productos.filter(p => !p.oculto) }), [datos]);

  // Desde el héroe o la cámara no se puede elegir talle/color: si el producto tiene variantes, se lleva a la clienta a su tarjeta.
  const agregarDesdeAfuera = (id: string) => {
    if (!datos.productos.find(p => p.id === id)?.variantes?.length) return carrito.agregar(id);
    setFiltro('Todos');
    setTimeout(() => {
      const tarjeta = document.getElementById(`p-${id}`);
      tarjeta?.scrollIntoView({ block: 'center', behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
      tarjeta?.querySelector('select')?.focus({ preventScroll: true });
    }, 50);
  };

  const verCategoria = (categoria: string) => {
    setFiltro(categoria);
    document.getElementById('catalogo')?.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
  };

  return (
    <>
      <Barra tienda={datos.tienda} cuenta={carrito.cuenta} alAbrirCarrito={() => setCarritoAbierto(true)} />
      <main>
        <Hero datos={visibles} alAgregar={agregarDesdeAfuera} alVerCategoria={verCategoria} />
        <Catalogo datos={visibles} filtro={filtro} alFiltrar={setFiltro} alAgregar={carrito.agregar} />
      </main>
      <Pie tienda={datos.tienda} />
      <Carrito
        abierto={carritoAbierto} alCerrar={() => setCarritoAbierto(false)} datos={datos}
        carrito={carrito.carrito} lineas={carrito.lineas} total={carrito.total} alCambiar={carrito.cambiar}
      />
    </>
  );
}
