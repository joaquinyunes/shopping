import { formatoPrecio, linkWhatsApp } from '../lib/pedido';
import type { Producto, Tienda } from '../tipos';

/** Lo primero que se ve, con scroll o sin él: qué es, qué vende, un producto con precio y cómo pedir. */
export function HeroTextos({ tienda, categorias }: { tienda: Tienda; categorias: string[] }) {
  return (
    <div className="hero-textos">
      <p className="sobre" data-intro>Tienda online</p>
      <h1 data-intro>{tienda.nombre}</h1>
      <p className="hero-lema" data-intro>{categorias.join(' · ')}</p>
      <p className="hero-sub" data-intro>{tienda.lema}. Elegí, armá tu pedido y mandalo por WhatsApp.</p>
      <div className="hero-botones" data-intro>
        <a className="btn btn-primario" href="#catalogo">Ver productos</a>
        <a className="btn btn-wpp" href={linkWhatsApp(tienda.whatsapp, `¡Hola ${tienda.nombre}! Quería hacer una consulta.`)} target="_blank" rel="noopener noreferrer">
          Pedir por WhatsApp
        </a>
      </div>
    </div>
  );
}

export function TarjetaDestacada({ producto, alAgregar }: { producto: Producto; alAgregar: (id: string) => void }) {
  return (
    <div className="destacado" data-intro>
      <img src={producto.foto} alt="" />
      <div>
        <p>Para empezar</p>
        <strong>{producto.nombre}</strong>
        <span>{formatoPrecio(producto.precio)}</span>
      </div>
      <button type="button" className="btn btn-primario btn-chico" onClick={() => alAgregar(producto.id)}>Agregar</button>
    </div>
  );
}

export const categoriasDe = (productos: Producto[]) => [...new Set(productos.map(p => p.categoria))].slice(0, 4);
export const destacadoDe = (productos: Producto[]) => productos.find(p => !p.agotado && p.foto);
