import { useState } from 'react';
import { listarAuditoria, type EventoAuditoria } from './nube';

const fecha = (iso: string) => new Date(iso).toLocaleString('es-AR', { dateStyle: 'short', timeStyle: 'short' });
const valor = (v: unknown) => (v === undefined || v === null ? '—' : String(v));

/** Quién cambió precios, stock y pedidos. Solo lectura: no hay forma de editarlo ni borrarlo desde el panel. */
export function AdminAuditoria({ sesion }: { sesion: string }) {
  const [eventos, setEventos] = useState<EventoAuditoria[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  return (
    <details onToggle={e => { if ((e.currentTarget as HTMLDetailsElement).open && !eventos) listarAuditoria(sesion).then(setEventos, () => setError('No se pudo cargar el historial.')); }}>
      <summary>Historial de cambios</summary>
      {error && <p className="admin-error" role="alert">{error}</p>}
      {eventos?.length === 0 && <p className="admin-nota">Todavía no hay cambios registrados.</p>}
      <ul className="admin-historial">
        {eventos?.slice(0, 50).map((ev, i) => (
          <li key={i}>
            <strong>{fecha(ev.creado)}</strong> · {ev.tipo === 'pedido' ? 'pedido' : 'catálogo'}
            <ul>{ev.cambios.slice(0, 12).map((c, j) => <li key={j}>{c.producto ? `${c.producto}: ` : ''}{c.campo} {valor(c.antes)} → {valor(c.despues)}</li>)}</ul>
          </li>
        ))}
      </ul>
    </details>
  );
}
