import { useEffect, useRef, useState } from 'react';
import { BotonCamara } from '../camara/BotonCamara';
import { formatoPrecio } from '../lib/pedido';
import type { Producto } from '../tipos';

interface Props {
  producto: Producto;
  conCamara: boolean;
  alAgregar: (id: string) => void;
  indice: number;
}

export function ProductoTarjeta({ producto, conCamara, alAgregar, indice }: Props) {
  const [enVista, setEnVista] = useState(false);
  const [agregado, setAgregado] = useState(false);
  const ref = useRef<HTMLElement>(null);

  // Aparece con un giro 3D suave al entrar en pantalla (se ve de una si el navegador no soporta IntersectionObserver)
  useEffect(() => {
    const el = ref.current;
    if (!el || !('IntersectionObserver' in window)) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setEnVista(true); obs.disconnect(); } }, { threshold: 0.15 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  const visible = enVista || !('IntersectionObserver' in window);

  const agregar = () => {
    alAgregar(producto.id);
    setAgregado(true);
    setTimeout(() => setAgregado(false), 1000);
  };

  return (
    <article
      ref={ref} data-visible={visible}
      className={`producto${producto.agotado ? ' sin-stock' : ''}`} style={{ transitionDelay: `${(indice % 4) * 70}ms` }}
    >
      <div className="producto-foto">
        {producto.foto ? <img src={producto.foto} alt={producto.nombre} loading="lazy" decoding="async" /> : <span className="sin-foto">Sin foto</span>}
        <span className="etiqueta">{producto.categoria}</span>
        {producto.agotado && <span className="etiqueta etiqueta-agotado">Agotado</span>}
        {conCamara && producto.foto && (
          <BotonCamara producto={producto} variante="flotante" alPedir={() => alAgregar(producto.id)} />
        )}
      </div>
      <div className="producto-info">
        <h3>{producto.nombre}</h3>
        <div className="producto-fila">
          <span className="precio">{formatoPrecio(producto.precio)}</span>
          <button type="button" className="btn btn-primario btn-chico" onClick={agregar} disabled={producto.agotado}>
            {producto.agotado ? 'Sin stock' : agregado ? '¡Listo!' : 'Agregar'}
          </button>
        </div>
      </div>
    </article>
  );
}
