import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Producto } from '../tipos';
import { CamaraFicha } from './CamaraFicha';
import { CamaraProducto } from './CamaraProducto';
import { CamaraTarjetaReferencia } from './CamaraTarjetaReferencia';
import { limitarEscala, pxPorCmInicial } from './escala';
import { medidaDelProducto } from './tamano-estimado';
import { MENSAJES_CAMARA, useCamaraStream } from './use-camara-stream';
import { useGestoEscala } from './use-gesto-escala';
import { useImagenRecortada } from './use-imagen-recortada';

interface Props {
  producto: Producto;
  alCerrar: () => void;
  alPedir: () => void;
}

const FOCUSABLES = 'button:not([disabled]), [href], input, select, [tabindex]:not([tabindex="-1"])';

/** Visor a pantalla completa: cámara trasera en vivo (o mesa con cuadrícula) y el producto a tamaño real encima. */
export default function CamaraVisor({ producto, alCerrar, alPedir }: Props) {
  const raizRef = useRef<HTMLDivElement>(null);
  const cerrarRef = useRef<HTMLButtonElement>(null);
  const superficieRef = useRef<HTMLDivElement>(null);
  const { videoRef, estado } = useCamaraStream();
  const imagen = useImagenRecortada(producto.foto);
  const medida = useMemo(() => medidaDelProducto(producto), [producto]);

  const [pxPorCm, setPxPorCm] = useState(() => pxPorCmInicial(Math.min(window.innerWidth, 900)));
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [pedido, setPedido] = useState(false);

  const mover = useCallback((dx: number, dy: number) => setPos(p => ({ x: p.x + dx, y: p.y + dy })), []);
  useGestoEscala({ superficieRef, pxPorCm, alCambiarEscala: e => setPxPorCm(limitarEscala(e)), alMover: mover });

  // Esc cierra, el scroll de fondo queda bloqueado y el foco queda dentro del visor
  useEffect(() => {
    const previo = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    cerrarRef.current?.focus();
    const teclas = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { e.stopPropagation(); alCerrar(); return; }
      if (e.key !== 'Tab' || !raizRef.current) return;
      const items = [...raizRef.current.querySelectorAll<HTMLElement>(FOCUSABLES)];
      if (!items.length) return;
      const primero = items[0], ultimo = items[items.length - 1];
      if (e.shiftKey && document.activeElement === primero) { e.preventDefault(); ultimo.focus(); }
      else if (!e.shiftKey && document.activeElement === ultimo) { e.preventDefault(); primero.focus(); }
    };
    document.addEventListener('keydown', teclas);
    return () => { document.body.style.overflow = previo; document.removeEventListener('keydown', teclas); };
  }, [alCerrar]);

  const hayVideo = estado === 'activa';
  const aviso = estado !== 'pidiendo' && estado !== 'activa' ? MENSAJES_CAMARA[estado] : null;

  return (
    <div className="visor" role="dialog" aria-modal="true" aria-label={`Ver ${producto.nombre} en tu mesa`} ref={raizRef}>
      <video ref={videoRef} className="visor-video" playsInline muted autoPlay hidden={!hayVideo} />
      {/* Sin cámara: mesa con cuadrícula de 5 cm a la misma escala que el producto */}
      {!hayVideo && estado !== 'pidiendo' && (
        <div className="visor-mesa" style={{ backgroundSize: `${5 * pxPorCm}px ${5 * pxPorCm}px` }} aria-hidden="true" />
      )}
      <div className="visor-superficie" ref={superficieRef}>
        <CamaraTarjetaReferencia pxPorCm={pxPorCm} />
        <CamaraProducto imagen={imagen} medida={medida} pxPorCm={pxPorCm} x={pos.x} y={pos.y} />
      </div>
      <button type="button" className="visor-cerrar" onClick={alCerrar} ref={cerrarRef} aria-label="Cerrar">✕</button>
      {estado === 'pidiendo' && <p className="visor-aviso" role="status">Pidiendo acceso a la cámara…</p>}
      {aviso && <p className="visor-aviso" role="status">{aviso}</p>}
      <CamaraFicha
        producto={producto} medida={medida} pxPorCm={pxPorCm} alCambiarEscala={e => setPxPorCm(limitarEscala(e))}
        pedido={pedido} alPedir={() => { alPedir(); setPedido(true); }}
      />
    </div>
  );
}
