import { useState } from 'react';
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

  const verCategoria = (categoria: string) => {
    setFiltro(categoria);
    document.getElementById('catalogo')?.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
  };

  return (
    <>
      <Barra tienda={datos.tienda} cuenta={carrito.cuenta} alAbrirCarrito={() => setCarritoAbierto(true)} />
      <Hero datos={datos} alAgregar={carrito.agregar} alVerCategoria={verCategoria} />
      <Catalogo datos={datos} filtro={filtro} alFiltrar={setFiltro} alAgregar={carrito.agregar} />
      <Pie tienda={datos.tienda} />
      <Carrito
        abierto={carritoAbierto} alCerrar={() => setCarritoAbierto(false)} datos={datos}
        carrito={carrito.carrito} lineas={carrito.lineas} total={carrito.total} alCambiar={carrito.cambiar}
      />
    </>
  );
}
