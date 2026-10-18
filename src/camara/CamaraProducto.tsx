import type { ImagenRecortada } from '../lib/recortar-imagen';
import { dimensionesEnPx } from './escala';
import { etiquetaMedida, type Medida } from './tamano-estimado';

interface Props {
  imagen: ImagenRecortada | null;
  medida: Medida;
  pxPorCm: number;
  /** Desplazamiento respecto del centro de la superficie, en px. */
  x: number;
  y: number;
}

/** El producto a tamaño real (ancho en px = cm × px_por_cm) con su línea de cota. */
export function CamaraProducto({ imagen, medida, pxPorCm, x, y }: Props) {
  if (!imagen) return <p className="visor-cargando" role="status">Preparando la foto…</p>;
  const { w, h } = dimensionesEnPx(imagen.aspecto, medida.cm, medida.tipo, pxPorCm);
  const vertical = medida.tipo === 'alto';
  return (
    <div className="cam-producto" style={{ width: w, height: h, transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))` }}>
      <img src={imagen.src} alt="" draggable={false} style={imagen.multiply ? { mixBlendMode: 'multiply' } : undefined} />
      <div className={vertical ? 'cota cota-v' : 'cota cota-h'}>
        <span>{etiquetaMedida(medida)}</span>
      </div>
    </div>
  );
}
