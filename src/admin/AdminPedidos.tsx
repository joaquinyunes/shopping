import { useCallback, useEffect, useState } from 'react';
import { formatoPrecio, linkWhatsApp } from '../lib/pedido';
import type { EstadoPedido, PedidoRegistrado } from '../tipos';
import { cambiarEstadoPedido, listarPedidos } from './nube';

// Mismo recorrido que valida el servidor (server/pedidos.ts); acá solo decide qué botones se muestran.
const SIGUIENTES: Record<EstadoPedido, Array<[EstadoPedido, string]>> = {
  pendiente: [['pagado', 'Marcar pagado'], ['cancelado', 'Cancelar']],
  pagado: [['enviado', 'Marcar enviado'], ['cancelado', 'Cancelar']],
  enviado: [['entregado', 'Marcar entregado']],
  entregado: [],
  cancelado: [['pendiente', 'Reabrir']],
};

export function AdminPedidos({ clave }: { clave: string }) {
  const [pedidos, setPedidos] = useState<PedidoRegistrado[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const cargar = useCallback(() => listarPedidos(clave).then(setPedidos, () => setError('No se pudieron cargar los pedidos.')), [clave]);
  useEffect(() => { cargar(); }, [cargar]);

  const cambiar = async (numero: number, estado: EstadoPedido) => {
    setError(null);
    try { await cambiarEstadoPedido(clave, numero, estado); } catch (e) { setError(e instanceof Error ? e.message : 'No se pudo cambiar el estado.'); }
    await cargar();
  };

  return (
    <section>
      <h2>Pedidos {pedidos && `(${pedidos.length})`}</h2>
      {error && <p className="admin-error" role="alert">{error}</p>}
      {pedidos?.length === 0 && <p className="admin-nota">Todavía no hay pedidos. Cuando una clienta pida desde la tienda, aparece acá y se descuenta el stock.</p>}
      {pedidos?.map(p => (
        <article key={p.numero} className="admin-tarjeta admin-pedido">
          <header>
            <strong>#{p.numero} · {p.cliente.nombre}</strong>
            <span className={`pedido-estado pedido-${p.estado}`}>{p.estado}</span>
          </header>
          <p className="admin-nota">{new Date(p.creado).toLocaleString('es-AR')}{p.cliente.cp && ` · CP ${p.cliente.cp}`}{p.cliente.email && ` · ${p.cliente.email}`}{p.historial?.at(-1)?.motivo === 'vencido' && ' · venció sin pago'}</p>
          <ul>{p.items.map(i => <li key={`${i.id}/${i.variante?.id ?? ''}`}>{i.cant} x {i.nombre}{i.variante && ` (${i.variante.nombre})`} — {formatoPrecio(i.precio * i.cant)}</li>)}</ul>
          {p.envio && <p>{p.envio.servicio}: {p.envio.precio ? formatoPrecio(p.envio.precio) : 'gratis'}</p>}
          <p><strong>Total: {formatoPrecio(p.total)}</strong></p>
          <div className="admin-acciones">
            {p.cliente.telefono && <a className="admin-link" href={linkWhatsApp(p.cliente.telefono, `Hola ${p.cliente.nombre}, sobre tu pedido n.º ${p.numero}`)} target="_blank" rel="noopener noreferrer">Escribirle</a>}
            {SIGUIENTES[p.estado].map(([estado, texto]) => (
              <button key={estado} type="button" className="btn btn-chico" onClick={() => cambiar(p.numero, estado)}>{texto}</button>
            ))}
          </div>
        </article>
      ))}
    </section>
  );
}
