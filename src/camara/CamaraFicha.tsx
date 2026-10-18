import type { Producto } from '../tipos';
import { formatoPrecio } from '../lib/pedido';
import { PX_POR_CM_MAX, PX_POR_CM_MIN } from './escala';
import { etiquetaMedida, type Medida } from './tamano-estimado';
import { loQueTrae } from './trae';

interface Props {
  producto: Producto;
  medida: Medida;
  pxPorCm: number;
  alCambiarEscala: (pxPorCm: number) => void;
  alPedir: () => void;
  pedido: boolean;
}

const formatoPeso = (g: number) => (g >= 1000 ? `${(g / 1000).toString().replace('.', ',')} kg` : `${g} g`);

/** Ficha del producto: abajo en el celular, columna lateral en escritorio. */
export function CamaraFicha({ producto, medida, pxPorCm, alCambiarEscala, alPedir, pedido }: Props) {
  const trae = loQueTrae(producto);
  return (
    <aside className="cam-ficha">
      <div className="cam-ficha-cabeza">
        <h2>{producto.nombre}</h2>
        <strong>{formatoPrecio(producto.precio)}</strong>
      </div>
      <dl className="cam-datos">
        <div><dt>Medida</dt><dd>{etiquetaMedida(medida)}</dd></div>
        {producto.pesoGr ? <div><dt>Peso</dt><dd>{formatoPeso(producto.pesoGr)}</dd></div> : null}
      </dl>
      {trae.length > 0 && (
        <div>
          <p className="cam-sub">Trae</p>
          <ul className="chips">{trae.map(t => <li key={t}>{t}</li>)}</ul>
        </div>
      )}
      <label className="cam-calibrar">
        <span>Apoyá una tarjeta y ajustá hasta que la silueta coincida</span>
        <input
          type="range" min={PX_POR_CM_MIN} max={PX_POR_CM_MAX} step={0.1} value={pxPorCm}
          onChange={e => alCambiarEscala(Number(e.target.value))} aria-label="Ajustar la escala"
        />
      </label>
      {medida.estimada && <p className="cam-aviso">La medida es aproximada: confirmala con la tienda antes de comprar.</p>}
      <button type="button" className="btn btn-primario cam-pedir" onClick={alPedir} disabled={producto.agotado}>
        {producto.agotado ? 'Sin stock' : pedido ? '¡Agregado! Ver mi pedido' : 'Agregar al pedido'}
      </button>
    </aside>
  );
}
