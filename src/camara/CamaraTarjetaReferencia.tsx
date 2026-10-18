import { TARJETA_CM } from './escala';

/** Silueta de una tarjeta de 8,56 × 5,4 cm a la misma escala: se apoya una tarjeta real y se ajusta hasta que coincidan. */
export function CamaraTarjetaReferencia({ pxPorCm }: { pxPorCm: number }) {
  return (
    <div className="cam-tarjeta" style={{ width: TARJETA_CM.ancho * pxPorCm, height: TARJETA_CM.alto * pxPorCm }} aria-hidden="true">
      <span>Tarjeta 8,56 × 5,4 cm</span>
    </div>
  );
}
