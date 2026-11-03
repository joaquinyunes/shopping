import { useEffect, useId, useRef, useState } from 'react';
import { BotonCamara } from '../camara/BotonCamara';
import { buscarVariante, enOferta, estaAgotado, etiquetaVariante, precioDe, precioVigente, rangoDePrecios } from '../lib/catalogo';
import { formatoPrecio, linkWhatsApp } from '../lib/pedido';
import { relacionadosDe, rutaFicha, stockVisible } from '../lib/tienda-vista';
import type { Datos, Producto } from '../tipos';

interface Props {
  /** `null` = cerrada. */
  producto: Producto | null;
  datos: Datos;
  alCerrar: () => void;
  alAgregar: (id: string, varianteId?: string) => void;
  alVerPedido: () => void;
}

/** Ficha de producto en un diálogo con ruta propia (#/producto/ID): se comparte el enlace y «atrás» la cierra. */
export function Ficha({ producto, datos, alCerrar, alAgregar, alVerPedido }: Props) {
  const dialogo = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const d = dialogo.current;
    if (!d) return;
    if (producto && !d.open) d.showModal();
    if (!producto && d.open) d.close();
    if (producto) d.scrollTo({ top: 0 });
  }, [producto]);

  return (
    <dialog ref={dialogo} className="ficha" aria-label={producto?.nombre ?? 'Producto'} onClose={alCerrar} onClick={e => { if (e.target === e.currentTarget) alCerrar(); }}>
      {producto && <FichaContenido key={producto.id} producto={producto} datos={datos} alCerrar={alCerrar} alAgregar={alAgregar} alVerPedido={alVerPedido} />}
    </dialog>
  );
}

function FichaContenido({ producto, datos, alCerrar, alAgregar, alVerPedido }: Omit<Props, 'producto'> & { producto: Producto }) {
  const [varianteId, setVarianteId] = useState('');
  const [fotoActiva, setFotoActiva] = useState(0);
  const [aviso, setAviso] = useState('');
  const [agregados, setAgregados] = useState(0);
  const selector = useRef<HTMLSelectElement>(null);
  const idSelector = useId();
  const { tienda, productos } = datos;

  const variantes = producto.variantes ?? [];
  const variante = buscarVariante(producto, varianteId);
  const agotado = estaAgotado(producto);
  const oferta = enOferta(producto, variante);
  const [desde, hasta] = rangoDePrecios(producto);
  const fotos = [producto.foto, ...(producto.fotos ?? [])].filter(Boolean);
  const foto = fotos[Math.min(fotoActiva, fotos.length - 1)] ?? '';
  const stock = stockVisible(producto, variante);
  const relacionados = relacionadosDe(productos, producto, 4);
  const nombrePropiedades = (producto.propiedades ?? ['una opción']).join(' / ').toLowerCase();
  const precio = variante ? precioDe(producto, variante) : variantes.length ? desde : precioVigente(producto);

  const agregar = () => {
    if (variantes.length && !variante) {
      setAviso(`Elegí ${nombrePropiedades} antes de agregar.`);
      selector.current?.focus();
      return;
    }
    setAviso('');
    alAgregar(producto.id, variante?.id);
    setAgregados(n => n + 1);
  };

  const medida = producto.tamanoCm ? `${producto.tamanoCm} cm de ${producto.tipoMedida ?? 'alto'}` : null;

  return (
    <>
      <button type="button" className="ficha-cerrar" onClick={alCerrar} aria-label="Cerrar ficha">✕</button>
      <div className="ficha-grilla">
        <div className="ficha-galeria">
          <div className="ficha-foto">{foto ? <img src={foto} alt={producto.nombre} /> : <span className="sin-foto">Sin foto</span>}</div>
          {fotos.length > 1 && (
            <div className="miniaturas" role="group" aria-label={`Fotos de ${producto.nombre}`}>
              {fotos.map((f, i) => (
                <button key={f} type="button" aria-pressed={i === fotoActiva} aria-label={`Ver foto ${i + 1} de ${fotos.length}`} onClick={() => setFotoActiva(i)}>
                  <img src={f} alt="" loading="lazy" decoding="async" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="ficha-info">
          <p className="tarjeta-categoria">{producto.categoria}</p>
          <h2 className="ficha-titulo">{producto.nombre}</h2>
          <p className="precio precio-grande">
            {oferta && <s className="precio-tachado"><span className="solo-lectores">Precio normal </span>{formatoPrecio(producto.precio)}</s>}
            {variantes.length > 0 && !variante && desde !== hasta && <small className="precio-desde">Desde </small>}
            {formatoPrecio(precio)}
          </p>
          <p className={`ficha-stock${agotado ? ' ficha-stock-agotado' : ''}`} role="status">
            {agotado ? 'Agotado por ahora'
              : stock !== undefined && stock <= 5 ? `Quedan ${stock} ${stock === 1 ? 'unidad' : 'unidades'}`
              : 'Disponible'}
          </p>
          {producto.descripcion && <p className="ficha-descripcion">{producto.descripcion}</p>}

          {variantes.length > 0 && (
            <div className="producto-opcion">
              <label htmlFor={idSelector}>{(producto.propiedades ?? ['Opción']).join(' / ')}</label>
              <select id={idSelector} ref={selector} value={varianteId} disabled={agotado} onChange={e => { setVarianteId(e.target.value); setAviso(''); }}>
                <option value="">Elegir…</option>
                {variantes.map(v => (
                  <option key={v.id} value={v.id} disabled={v.stock === 0}>
                    {etiquetaVariante(v)}{v.precio !== undefined && v.precio !== precioVigente(producto) ? ` — ${formatoPrecio(v.precio)}` : ''}{v.stock === 0 ? ' (agotado)' : ''}
                  </option>
                ))}
              </select>
            </div>
          )}
          {aviso && <p className="producto-aviso" role="alert">{aviso}</p>}

          {(medida || producto.pesoGr || producto.incluye?.length) && (
            <dl className="ficha-datos">
              {medida && <div><dt>Medida</dt><dd>{medida}</dd></div>}
              {producto.pesoGr && <div><dt>Peso</dt><dd>{producto.pesoGr} g</dd></div>}
              {producto.incluye?.length ? <div><dt>Incluye</dt><dd>{producto.incluye.join(', ')}</dd></div> : null}
            </dl>
          )}

          <div className="ficha-compra">
            <button type="button" className="btn btn-primario btn-grande" onClick={agregar} disabled={agotado}>
              {agotado ? 'Sin stock' : agregados > 0 ? 'Agregar otro' : 'Agregar al pedido'}
            </button>
            {agregados > 0 && (
              <p className="ficha-agregado" role="status">
                ¡Agregado! <button type="button" className="enlace-btn" onClick={alVerPedido}>Ver mi pedido</button>
              </p>
            )}
          </div>

          <div className="ficha-extra">
            {tienda.camara && producto.foto && !agotado && (
              <BotonCamara producto={producto} variante="fila" alPedir={() => alAgregar(producto.id, variante?.id)} />
            )}
            <a className="btn" href={linkWhatsApp(tienda.whatsapp, `¡Hola ${tienda.nombre}! Quería consultar por: ${producto.nombre}`)} target="_blank" rel="noopener noreferrer">
              Consultar por WhatsApp
            </a>
          </div>
        </div>
      </div>

      {relacionados.length > 0 && (
        <section className="ficha-relacionados" aria-labelledby="titulo-relacionados">
          <h3 id="titulo-relacionados">También te puede gustar</h3>
          <ul>
            {relacionados.map(r => (
              <li key={r.id}>
                <a href={rutaFicha(r.id)}>
                  <img src={r.foto} alt="" loading="lazy" decoding="async" />
                  <span>{r.nombre}</span>
                  <strong>{formatoPrecio(precioVigente(r))}</strong>
                </a>
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
  );
}
