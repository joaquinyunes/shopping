import { lazy, Suspense, useCallback, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import type { Producto } from '../tipos';

// El visor se descarga recién cuando alguien toca el botón: no pesa en la carga inicial.
const CamaraVisor = lazy(() => import('./CamaraVisor'));

export type VarianteBotonCamara = 'flotante' | 'fila' | 'miniatura';

interface Props {
  producto: Producto;
  alPedir: () => void;
  variante?: VarianteBotonCamara;
}

function IconoCamara() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 8h3l2-3h6l2 3h3a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1z" />
      <circle cx="12" cy="13" r="3.5" />
    </svg>
  );
}

/** Botón "Ver en tu mesa". Se enchufa con una línea en cualquier tarjeta: <BotonCamara producto={p} alPedir={...} />. */
export function BotonCamara({ producto, alPedir, variante = 'fila' }: Props) {
  const [abierto, setAbierto] = useState(false);
  const botonRef = useRef<HTMLButtonElement>(null);

  const cerrar = useCallback(() => {
    setAbierto(false);
    setTimeout(() => botonRef.current?.focus(), 0); // devuelve el foco al botón que abrió el visor
  }, []);

  return (
    <>
      <button
        type="button" ref={botonRef} className={`btn-camara btn-camara-${variante}`}
        onClick={() => setAbierto(true)} aria-label={`Ver ${producto.nombre} en tu mesa`} title="Ver en tu mesa"
      >
        <IconoCamara />
        {variante === 'fila' && <span>Ver en tu mesa</span>}
      </button>
      {abierto && createPortal(
        <Suspense fallback={<div className="visor visor-cargando-pantalla" role="status">Abriendo…</div>}>
          <CamaraVisor producto={producto} alCerrar={cerrar} alPedir={alPedir} />
        </Suspense>,
        document.body,
      )}
    </>
  );
}
