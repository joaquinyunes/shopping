import { precioVigente } from '../lib/catalogo';
import { formatoPrecio, linkWhatsApp } from '../lib/pedido';
import { rutaFicha } from '../lib/tienda-vista';
import type { Producto, Tienda } from '../tipos';

interface Props {
  tienda: Tienda;
  /** Producto que se muestra con su precio al lado de la foto del local; sin él, la portada va sin tarjeta. */
  destacado?: Producto;
  alAgregar: (id: string) => void;
}

/** Lo primero que se ve: qué es, una foto real de ambiente, un producto con precio y las dos formas de avanzar. */
export function Portada({ tienda, destacado, alAgregar }: Props) {
  return (
    <section className="portada" aria-label="Presentación">
      <div className="portada-texto">
        <p className="sobre">Tienda online · Hogar</p>
        <h1>{tienda.nombre}</h1>
        <p className="portada-lema">{tienda.lema}. Elegí, armá tu pedido y mandalo por WhatsApp.</p>
        <div className="portada-botones">
          <a className="btn btn-primario" href="#catalogo">Ver productos</a>
          <a className="btn btn-wpp" href={linkWhatsApp(tienda.whatsapp, `¡Hola ${tienda.nombre}! Quería hacer una consulta.`)} target="_blank" rel="noopener noreferrer">
            Pedir por WhatsApp
          </a>
        </div>
      </div>
      <div className="portada-arte">
        <img src="/img/ambientes/interior.webp" srcSet="/img/ambientes/interior-800.webp 800w, /img/ambientes/interior.webp 1200w" sizes="(max-width: 720px) 100vw, 55vw" width="1200" height="670" alt="Estantes con cerámica, textiles y plantas dentro del local de Casa Nido" fetchPriority="high" />
        {destacado && (
          <div className="portada-producto">
            <img src={destacado.foto} alt="" width="64" height="64" />
            <div>
              <p>Para empezar</p>
              <a href={rutaFicha(destacado.id)}>{destacado.nombre}</a>
              <strong>{formatoPrecio(precioVigente(destacado))}</strong>
            </div>
            <button type="button" className="btn btn-primario btn-chico" onClick={() => alAgregar(destacado.id)}>Agregar</button>
          </div>
        )}
      </div>
    </section>
  );
}
