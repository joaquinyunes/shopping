import { useEffect, useRef } from 'react';
import { armarMensaje, formatoPrecio, linkWhatsApp, type Carrito as TipoCarrito } from '../lib/pedido';
import type { Datos } from '../tipos';

interface Props {
  abierto: boolean;
  alCerrar: () => void;
  datos: Datos;
  carrito: TipoCarrito;
  lineas: Array<{ producto: Datos['productos'][number]; cant: number }>;
  total: number;
  alCambiar: (id: string, delta: number) => void;
}

export function Carrito({ abierto, alCerrar, datos, carrito, lineas, total, alCambiar }: Props) {
  const dialogo = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const d = dialogo.current;
    if (!d) return;
    if (abierto && !d.open) d.showModal();
    if (!abierto && d.open) d.close();
  }, [abierto]);

  const pedir = () => {
    const mensaje = armarMensaje(carrito, datos.productos, datos.tienda);
    if (mensaje) window.open(linkWhatsApp(datos.tienda.whatsapp, mensaje), '_blank', 'noopener');
  };

  return (
    <dialog ref={dialogo} className="carrito" aria-labelledby="titulo-carrito" onClose={alCerrar} onClick={e => { if (e.target === e.currentTarget) alCerrar(); }}>
      <div className="carrito-cabeza">
        <h2 id="titulo-carrito">Tu pedido</h2>
        <button type="button" className="cerrar" onClick={alCerrar} aria-label="Cerrar">✕</button>
      </div>
      <ul className="carrito-lista">
        {lineas.length === 0 && <li className="vacio">Todavía no agregaste nada.</li>}
        {lineas.map(({ producto, cant }) => (
          <li key={producto.id}>
            {producto.foto ? <img src={producto.foto} alt="" /> : <span className="sin-foto" />}
            <div>
              <div className="nombre">{producto.nombre}</div>
              <div className="sub">{formatoPrecio(producto.precio)} c/u</div>
            </div>
            <div className="cantidad">
              <button type="button" onClick={() => alCambiar(producto.id, -1)} aria-label={`Quitar uno de ${producto.nombre}`}>−</button>
              <span>{cant}</span>
              <button type="button" onClick={() => alCambiar(producto.id, 1)} aria-label={`Agregar uno de ${producto.nombre}`}>+</button>
            </div>
          </li>
        ))}
      </ul>
      <p className="total">Total: <strong>{formatoPrecio(total)}</strong></p>
      <button type="button" className="btn btn-wpp btn-grande" onClick={pedir} disabled={lineas.length === 0}>Pedir por WhatsApp</button>
    </dialog>
  );
}
