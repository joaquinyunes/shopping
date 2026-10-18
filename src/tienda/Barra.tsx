import type { Tienda } from '../tipos';

interface Props {
  tienda: Tienda;
  cuenta: number;
  alAbrirCarrito: () => void;
}

/** Barra fija sobre fondo oscuro propio: los links claros se leen igual sobre el hero y sobre el catálogo. */
export function Barra({ tienda, cuenta, alAbrirCarrito }: Props) {
  return (
    <header className="barra">
      <a className="marca" href="#">
        <strong>{tienda.nombre}</strong>
        <span>{tienda.lema}</span>
      </a>
      <nav className="barra-acciones" aria-label="Principal">
        <a className="barra-link" href="#catalogo">Catálogo</a>
        <button type="button" className="btn-carrito" onClick={alAbrirCarrito} aria-label={`Ver mi pedido (${cuenta} productos)`}>
          <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" /><path d="M3 6h18" /><path d="M16 10a4 4 0 0 1-8 0" />
          </svg>
          <span className="contador" key={cuenta}>{cuenta}</span>
        </button>
      </nav>
    </header>
  );
}
