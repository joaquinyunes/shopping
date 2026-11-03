import { useEffect, useRef, useState } from 'react';
import { hayNube } from '../data/almacen';
import { armarMensaje, formatoPrecio, linkWhatsApp, nombreDeLinea, precioDeLinea, type Carrito as TipoCarrito, type LineaCarrito } from '../lib/pedido';
import type { Datos, OpcionEnvio } from '../tipos';
import { cotizarEnvio, registrarPedido } from './api-pedidos';

interface Props {
  abierto: boolean;
  alCerrar: () => void;
  datos: Datos;
  carrito: TipoCarrito;
  lineas: LineaCarrito[];
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

  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [cp, setCp] = useState('');
  const [opciones, setOpciones] = useState<OpcionEnvio[]>([]);
  const [servicio, setServicio] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [ocupado, setOcupado] = useState(false);

  const items = lineas.map(l => ({ id: l.producto.id, cant: l.cant, ...(l.variante && { variante: l.variante.id }) }));
  const envio = opciones.find(o => o.servicio === servicio);

  const calcularEnvio = async () => {
    setError(null); setOcupado(true);
    try {
      const o = await cotizarEnvio(cp, items);
      setOpciones(o); setServicio(o[0]?.servicio ?? '');
    } catch (e) { setError(e instanceof Error ? e.message : 'No se pudo calcular el envío.'); } finally { setOcupado(false); }
  };

  const pedir = async () => {
    const abrir = (mensaje: string | null) => mensaje && linkWhatsApp(datos.tienda.whatsapp, mensaje);
    if (!hayNube) { // modo demo, sin servidor: solo WhatsApp
      const link = abrir(armarMensaje(carrito, datos.productos, datos.tienda));
      if (link) window.open(link, '_blank', 'noopener');
      return;
    }
    if (!nombre.trim()) { setError('Contanos tu nombre para el pedido.'); return; }
    setError(null); setOcupado(true);
    const ventana = window.open('about:blank', '_blank'); // se abre ya, con el toque: después del fetch los celulares la bloquearían
    try {
      const r = await registrarPedido(items, { nombre, ...(email.trim() && { email: email.trim() }), ...(cp.trim() && { cp }) }, envio?.servicio);
      const link = abrir(armarMensaje(carrito, datos.productos, datos.tienda, { numero: r.numero, envio: r.envio, total: r.total }));
      if (ventana && link) { ventana.opener = null; ventana.location.href = link; }
      else if (link) window.location.href = link;
    } catch (e) {
      ventana?.close();
      setError(e instanceof Error ? e.message : 'No se pudo registrar el pedido.');
    } finally { setOcupado(false); }
  };

  return (
    <dialog ref={dialogo} className="carrito" aria-labelledby="titulo-carrito" onClose={alCerrar} onClick={e => { if (e.target === e.currentTarget) alCerrar(); }}>
      <div className="carrito-cabeza">
        <h2 id="titulo-carrito">Tu pedido</h2>
        <button type="button" className="cerrar" onClick={alCerrar} aria-label="Cerrar">✕</button>
      </div>
      <ul className="carrito-lista">
        {lineas.length === 0 && <li className="vacio">Tu pedido está vacío. Sumá productos desde el catálogo.</li>}
        {lineas.map(l => (
          <li key={l.clave}>
            {l.producto.foto ? <img src={l.producto.foto} alt="" /> : <span className="sin-foto" />}
            <div>
              <div className="nombre">{nombreDeLinea(l)}</div>
              <div className="sub">{formatoPrecio(precioDeLinea(l))} c/u</div>
            </div>
            <div className="cantidad">
              <button type="button" onClick={() => alCambiar(l.clave, -1)} aria-label={`Quitar uno de ${nombreDeLinea(l)}`}>−</button>
              <span>{l.cant}</span>
              <button type="button" onClick={() => alCambiar(l.clave, 1)} aria-label={`Agregar uno de ${nombreDeLinea(l)}`}>+</button>
            </div>
          </li>
        ))}
      </ul>
      {hayNube && lineas.length > 0 && (
        <div className="carrito-datos">
          <label>Tu nombre<input value={nombre} maxLength={60} autoComplete="name" onChange={e => setNombre(e.target.value)} /></label>
          <label>Tu mail (opcional, para avisarte cómo va el pedido)
            <input type="email" value={email} maxLength={80} autoComplete="email" onChange={e => setEmail(e.target.value)} />
          </label>
          <label>Código postal (para calcular el envío)
            <input value={cp} inputMode="text" maxLength={10} autoComplete="postal-code" onChange={e => { setCp(e.target.value); setOpciones([]); setServicio(''); }} />
          </label>
          <button type="button" className="btn btn-chico" onClick={calcularEnvio} disabled={ocupado || !cp.trim()}>Calcular envío</button>
          {opciones.length > 0 && (
            <fieldset className="carrito-envio">
              <legend>Envío</legend>
              {opciones.map(o => (
                <label key={o.servicio}>
                  <input type="radio" name="envio" checked={servicio === o.servicio} onChange={() => setServicio(o.servicio)} />{' '}
                  {o.servicio} — {o.precio ? formatoPrecio(o.precio) : 'gratis'} ({o.diasMin} a {o.diasMax} días)
                </label>
              ))}
            </fieldset>
          )}
        </div>
      )}
      {error && <p className="admin-error" role="alert">{error}</p>}
      <p className="total">Total: <strong>{formatoPrecio(total + (envio?.precio ?? 0))}</strong></p>
      <button type="button" className="btn btn-wpp btn-grande" onClick={pedir} disabled={lineas.length === 0 || ocupado}>Pedir por WhatsApp</button>
    </dialog>
  );
}
