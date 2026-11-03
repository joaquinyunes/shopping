import { useState } from 'react';
import { datosDePersona } from './nube';

/** Cuando una clienta pide ver o borrar sus datos (Ley 25.326): se busca por mail o teléfono y se descarga o se anonimiza. */
export function AdminDatos({ sesion }: { sesion: string }) {
  const [mensaje, setMensaje] = useState('');
  const [error, setError] = useState<string | null>(null);

  const actuar = async (form: HTMLFormElement, accion: 'exportar' | 'borrar') => {
    const f = new FormData(form);
    const persona = { email: String(f.get('email') ?? '').trim(), telefono: String(f.get('telefono') ?? '').trim() };
    setError(null); setMensaje('');
    if (!persona.email && !persona.telefono) return setError('Escribí el mail o el teléfono de la clienta.');
    if (accion === 'borrar' && !confirm('Se borran el nombre, el mail y el teléfono de todos sus pedidos. No se puede deshacer. ¿Seguro?')) return;
    try {
      const r = await datosDePersona(sesion, accion, persona);
      if (accion === 'borrar') return setMensaje(`Listo: se borraron los datos de ${r.anonimizados} pedido(s).`);
      const url = URL.createObjectURL(new Blob([JSON.stringify(r.pedidos, null, 2)], { type: 'application/json' }));
      Object.assign(document.createElement('a'), { href: url, download: 'datos-de-la-clienta.json' }).click();
      URL.revokeObjectURL(url);
      setMensaje(`Se descargaron ${r.pedidos?.length ?? 0} pedido(s).`);
    } catch (err) { setError(err instanceof Error ? err.message : 'No se pudo completar.'); }
  };

  return (
    <details>
      <summary>Datos de una clienta (ver o borrar a pedido)</summary>
      <form className="admin-tarjeta admin-tienda" onSubmit={e => { e.preventDefault(); void actuar(e.currentTarget, 'exportar'); }}>
        <p className="admin-nota">Si una clienta te pide ver o borrar sus datos, buscala por el mail o el teléfono con que pidió.</p>
        <label>Mail<input name="email" type="email" maxLength={80} autoComplete="off" /></label>
        <label>Teléfono<input name="telefono" inputMode="tel" maxLength={25} autoComplete="off" /></label>
        <div className="admin-acciones">
          <button type="submit" className="btn btn-chico">Descargar sus datos</button>
          <button type="button" className="admin-borrar" onClick={e => void actuar(e.currentTarget.form!, 'borrar')}>Borrar sus datos</button>
        </div>
        {mensaje && <p className="admin-nota" role="status">{mensaje}</p>}
        {error && <p className="admin-error" role="alert">{error}</p>}
      </form>
    </details>
  );
}
