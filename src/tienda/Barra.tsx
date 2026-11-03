import { useRef, useState } from 'react';
import type { Tienda } from '../tipos';

interface Props {
  tienda: Tienda;
  cuenta: number;
  busqueda: string;
  alBuscar: (texto: string) => void;
  alAbrirCarrito: () => void;
}

const Lupa = () => (
  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
    <circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" />
  </svg>
);

/** Encabezado liviano: marca, accesos, buscador y carrito. Pegado arriba pero sin ocupar la pantalla. */
export function Barra({ tienda, cuenta, busqueda, alBuscar, alAbrirCarrito }: Props) {
  const [buscando, setBuscando] = useState(false); // solo celular: el buscador se despliega
  const campo = useRef<HTMLInputElement>(null);

  const irAlCatalogo = (e: React.FormEvent) => {
    e.preventDefault();
    document.getElementById('catalogo')?.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
  };

  return (
    <header className="barra">
      <a className="saltar" href="#catalogo">Saltar al catálogo</a>
      <a className="marca" href="#" aria-label={`${tienda.nombre}, inicio`}>{tienda.nombre}</a>
      <nav className="barra-nav" aria-label="Principal">
        <a href="#ambientes">Ambientes</a>
        <a href="#catalogo">Catálogo</a>
        <a href="#como-pedir">Cómo pedir</a>
        <a href="#ver-en-tu-mesa">Ver en tu mesa</a>
      </nav>
      <form className={`barra-buscar${buscando ? ' abierto' : ''}`} role="search" onSubmit={irAlCatalogo}>
        <label className="solo-lectores" htmlFor="buscar">Buscar productos</label>
        <input
          id="buscar" ref={campo} type="search" value={busqueda} placeholder="Buscar productos" autoComplete="off" maxLength={60}
          onChange={e => alBuscar(e.target.value)}
        />
      </form>
      <div className="barra-acciones">
        <button
          type="button" className="barra-icono barra-lupa" aria-expanded={buscando} aria-label="Buscar productos"
          onClick={() => { setBuscando(b => !b); setTimeout(() => campo.current?.focus(), 0); }}
        ><Lupa /></button>
        <button type="button" className="barra-icono btn-carrito" onClick={alAbrirCarrito} aria-label={`Ver mi pedido (${cuenta} productos)`}>
          <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" /><path d="M3 6h18" /><path d="M16 10a4 4 0 0 1-8 0" />
          </svg>
          <span className="contador" key={cuenta}>{cuenta}</span>
        </button>
      </div>
    </header>
  );
}
