import { useMemo, useRef } from 'react';
import { formatoPrecio, linkWhatsApp } from '../lib/pedido';
import type { Datos } from '../tipos';
import { categoriasDe, destacadoDe, HeroTextos, TarjetaDestacada } from './HeroPartes';
import { hitosDeTienda } from './hitos';
import { useHeroIntro } from './use-hero-intro';
import { useHeroScene } from './use-hero-scene';
import { useHeroScroll } from './use-hero-scroll';

interface Props {
  datos: Datos;
  limitado: boolean;
  alAgregar: (id: string) => void;
  alVerCategoria: (categoria: string) => void;
  /** La escena falló: la UI cae al hero estático. */
  alAbandonar: (motivo: string) => void;
  /** La clienta pidió la versión simple (se recuerda). */
  alSimplificar: () => void;
}

/** Hero cinematográfico: sección alta (~500vh) con escenario sticky; el scroll mueve una cámara 3D por el pasillo de la casa. */
export default function Hero3D({ datos, limitado, alAgregar, alVerCategoria, alAbandonar, alSimplificar }: Props) {
  const seccionRef = useRef<HTMLElement>(null);
  const escenarioRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const hitos = useMemo(() => hitosDeTienda(datos.productos), [datos.productos]);
  const destacado = destacadoDe(datos.productos);
  const { tienda } = datos;

  const progresoRef = useHeroScroll(seccionRef, escenarioRef, hitos);
  useHeroIntro(escenarioRef);
  useHeroScene({
    canvasRef, contenedorRef: escenarioRef, hitos, progresoRef, limitado, alAbandonar,
    urlFrente: '/img/ambientes/frente.jpg',
  });

  return (
    <section ref={seccionRef} className="hero3d" aria-label="Recorrido por la casa">
      <div className="escenario" ref={escenarioRef}>
        <canvas ref={canvasRef} className="hero-canvas" aria-hidden="true" />

        <div className="hero-capa">
          <div className="hero-izq" data-sale-izq>
            <HeroTextos tienda={tienda} categorias={categoriasDe(datos.productos)} />
          </div>
          {destacado && (
            <div className="hero-der" data-sale-der>
              <TarjetaDestacada producto={destacado} alAgregar={alAgregar} />
            </div>
          )}

          {hitos.map((h, i) => (
            <article key={h.id} className="hito" data-hito={i} data-lado={h.lado}>
              <p className="sobre">{h.categoria}</p>
              <h2>{h.titulo}</h2>
              <p>{h.texto}</p>
              <p className="hito-producto"><strong>{formatoPrecio(h.producto.precio)}</strong></p>
              <div className="hito-botones">
                <a
                  className="btn btn-wpp btn-chico" target="_blank" rel="noopener noreferrer"
                  href={linkWhatsApp(tienda.whatsapp, `¡Hola ${tienda.nombre}! Quiero pedir: ${h.producto.nombre} (${formatoPrecio(h.producto.precio)})`)}
                >Pedir por WhatsApp</a>
                <button type="button" className="btn btn-fantasma btn-chico" onClick={() => alVerCategoria(h.categoria)}>Ver {h.categoria} →</button>
              </div>
            </article>
          ))}

          <div className="hito-final" data-final>
            <h2>Pasá, está abierto</h2>
            <a className="btn btn-primario" href="#catalogo">Ver todos los productos ↓</a>
          </div>
        </div>

        <div className="escena-acciones">
          <a
            className="pedir-fijo" target="_blank" rel="noopener noreferrer"
            href={linkWhatsApp(tienda.whatsapp, `¡Hola ${tienda.nombre}! Quería hacer una consulta.`)}
          >Pedir por WhatsApp</a>
          <a className="ir-directo" href="#catalogo">Ir al catálogo ↓</a>
          <button type="button" className="ver-simple" onClick={alSimplificar}>Versión simple</button>
        </div>
        <p className="pista" data-pista>Scrolleá para recorrer la casa · tocá lo que flota <span aria-hidden="true">↓</span></p>
        <div className="progreso" aria-hidden="true"><i data-barra /></div>
      </div>
    </section>
  );
}
