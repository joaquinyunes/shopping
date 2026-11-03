import { useState } from 'react';
import { BotonCamara } from '../camara/BotonCamara';
import { enOferta, estaAgotado, precioVigente, rangoDePrecios } from '../lib/catalogo';
import { formatoPrecio } from '../lib/pedido';
import { rutaFicha } from '../lib/tienda-vista';
import type { Producto } from '../tipos';

interface Props {
  producto: Producto;
  conCamara: boolean;
  alAgregar: (id: string, varianteId?: string) => void;
  /** Con variantes no se puede agregar desde la tarjeta: se lleva a la ficha a elegir. */
  alAbrir: (id: string) => void;
}

export function ProductoTarjeta({ producto, conCamara, alAgregar, alAbrir }: Props) {
  const [agregado, setAgregado] = useState(false);
  const agotado = estaAgotado(producto);
  const conVariantes = !!producto.variantes?.length;
  const oferta = enOferta(producto);
  const [desde, hasta] = rangoDePrecios(producto);
  const segundaFoto = producto.fotos?.[0];
  const ruta = rutaFicha(producto.id);

  const agregar = () => {
    if (conVariantes) return alAbrir(producto.id);
    alAgregar(producto.id);
    setAgregado(true);
    setTimeout(() => setAgregado(false), 1000);
  };

  return (
    <article id={`p-${producto.id}`} className={`tarjeta${agotado ? ' sin-stock' : ''}`}>
      <div className="tarjeta-foto">
        <a href={ruta} tabIndex={-1} aria-hidden="true">
          {producto.foto ? <img className="foto-1" src={producto.foto} alt="" loading="lazy" decoding="async" /> : <span className="sin-foto">Sin foto</span>}
          {segundaFoto && <img className="foto-2" src={segundaFoto} alt="" loading="lazy" decoding="async" />}
        </a>
        {agotado && <span className="etiqueta etiqueta-agotado">Agotado</span>}
        {!agotado && oferta && <span className="etiqueta etiqueta-oferta">Oferta</span>}
        {conCamara && producto.foto && !agotado && (
          <BotonCamara producto={producto} variante="flotante" alPedir={() => (conVariantes ? alAbrir(producto.id) : alAgregar(producto.id))} />
        )}
      </div>
      <div className="tarjeta-info">
        <p className="tarjeta-categoria">{producto.categoria}</p>
        <h3><a href={ruta}>{producto.nombre}</a></h3>
        <p className="precio">
          {oferta && <s className="precio-tachado"><span className="solo-lectores">Precio normal </span>{formatoPrecio(producto.precio)}</s>}
          {conVariantes && desde !== hasta && <small className="precio-desde">Desde </small>}
          {formatoPrecio(conVariantes ? desde : precioVigente(producto))}
        </p>
        <button type="button" className="btn btn-primario btn-chico" onClick={agregar} disabled={agotado}>
          {agotado ? 'Sin stock' : conVariantes ? 'Elegir opción' : agregado ? '¡Listo!' : 'Agregar'}
        </button>
      </div>
    </article>
  );
}
