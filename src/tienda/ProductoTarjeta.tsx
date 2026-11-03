import { useEffect, useId, useRef, useState } from 'react';
import { BotonCamara } from '../camara/BotonCamara';
import { buscarVariante, enOferta, estaAgotado, etiquetaVariante, precioDe, precioVigente, rangoDePrecios } from '../lib/catalogo';
import { formatoPrecio } from '../lib/pedido';
import type { Producto } from '../tipos';

interface Props {
  producto: Producto;
  conCamara: boolean;
  alAgregar: (id: string, varianteId?: string) => void;
  indice: number;
}

export function ProductoTarjeta({ producto, conCamara, alAgregar, indice }: Props) {
  const [enVista, setEnVista] = useState(false);
  const [agregado, setAgregado] = useState(false);
  const [varianteId, setVarianteId] = useState('');
  const [fotoActiva, setFotoActiva] = useState(0);
  const [aviso, setAviso] = useState('');
  const ref = useRef<HTMLElement>(null);
  const selector = useRef<HTMLSelectElement>(null);
  const idSelector = useId();

  // Aparece con un giro 3D suave al entrar en pantalla (se ve de una si el navegador no soporta IntersectionObserver)
  useEffect(() => {
    const el = ref.current;
    if (!el || !('IntersectionObserver' in window)) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setEnVista(true); obs.disconnect(); } }, { threshold: 0.15 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  const visible = enVista || !('IntersectionObserver' in window);

  const agotado = estaAgotado(producto);
  const variantes = producto.variantes ?? [];
  const variante = buscarVariante(producto, varianteId);
  const fotos = [producto.foto, ...(producto.fotos ?? [])].filter(Boolean);
  const foto = fotos[Math.min(fotoActiva, fotos.length - 1)] ?? '';
  const oferta = enOferta(producto, variante);
  const [desde, hasta] = rangoDePrecios(producto);

  const agregar = () => {
    if (variantes.length && !variante) {
      setAviso(`Elegí ${(producto.propiedades ?? ['una opción']).join(' / ').toLowerCase()} antes de agregar.`);
      selector.current?.focus();
      return;
    }
    setAviso('');
    alAgregar(producto.id, variante?.id);
    setAgregado(true);
    setTimeout(() => setAgregado(false), 1000);
  };

  return (
    <article
      ref={ref} id={`p-${producto.id}`} data-visible={visible}
      className={`producto${agotado ? ' sin-stock' : ''}`} style={{ transitionDelay: `${(indice % 4) * 70}ms` }}
    >
      <div className="producto-foto">
        {foto ? <img src={foto} alt={producto.nombre} loading="lazy" decoding="async" /> : <span className="sin-foto">Sin foto</span>}
        <span className="etiqueta">{producto.categoria}</span>
        {agotado && <span className="etiqueta etiqueta-agotado">Agotado</span>}
        {!agotado && oferta && <span className="etiqueta etiqueta-oferta">Oferta</span>}
        {conCamara && producto.foto && (
          <BotonCamara producto={producto} variante="flotante" alPedir={() => alAgregar(producto.id, variante?.id)} />
        )}
      </div>
      {fotos.length > 1 && (
        <div className="miniaturas" role="group" aria-label={`Fotos de ${producto.nombre}`}>
          {fotos.map((f, i) => (
            <button key={f} type="button" aria-pressed={i === fotoActiva} aria-label={`Ver foto ${i + 1} de ${fotos.length}`} onClick={() => setFotoActiva(i)}>
              <img src={f} alt="" loading="lazy" decoding="async" />
            </button>
          ))}
        </div>
      )}
      <div className="producto-info">
        <h3>{producto.nombre}</h3>
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
        <div className="producto-fila">
          <span className="precio">
            {oferta && <s className="precio-tachado"><span className="solo-lectores">Precio normal </span>{formatoPrecio(producto.precio)}</s>}
            {variantes.length > 0 && !variante && desde !== hasta && <small className="precio-desde">Desde </small>}
            {formatoPrecio(variante ? precioDe(producto, variante) : variantes.length ? desde : precioVigente(producto))}
          </span>
          <button type="button" className="btn btn-primario btn-chico" onClick={agregar} disabled={agotado}>
            {agotado ? 'Sin stock' : agregado ? '¡Listo!' : 'Agregar'}
          </button>
        </div>
      </div>
    </article>
  );
}
