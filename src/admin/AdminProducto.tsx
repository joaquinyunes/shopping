import type { Producto, TipoMedida } from '../tipos';

interface Props {
  producto: Producto;
  categorias: string[];
  subiendo: boolean;
  alCambiar: (cambio: Partial<Producto>) => void;
  alBorrar: () => void;
  alElegirFoto: (archivo: File) => void;
}

const numeroOpcional = (v: string) => {
  const n = Number(v.replace(',', '.'));
  return v.trim() !== '' && Number.isFinite(n) && n > 0 ? n : undefined;
};

export function AdminProducto({ producto: p, categorias, subiendo, alCambiar, alBorrar, alElegirFoto }: Props) {
  return (
    <article className={`admin-item${subiendo ? ' subiendo' : ''}`}>
      <div className="admin-foto">
        {p.foto ? <img src={p.foto} alt="" /> : <span>Sin foto</span>}
        <label>
          {subiendo ? 'Subiendo…' : 'Cambiar foto'}
          <input
            type="file" accept="image/*" disabled={subiendo}
            onChange={e => { const f = e.target.files?.[0]; if (f) alElegirFoto(f); e.target.value = ''; }}
          />
        </label>
      </div>

      <div className="admin-campos">
        <label>Nombre
          <input value={p.nombre} maxLength={80} onChange={e => alCambiar({ nombre: e.target.value })} />
        </label>
        <div className="admin-dos">
          <label>Precio ($)
            <input type="number" inputMode="numeric" min={0} step={1} value={p.precio} onChange={e => alCambiar({ precio: Math.max(0, Number(e.target.value) || 0) })} />
          </label>
          <label>Categoría
            <input list="categorias" value={p.categoria} maxLength={30} onChange={e => alCambiar({ categoria: e.target.value })} />
            <datalist id="categorias">{categorias.map(c => <option key={c} value={c} />)}</datalist>
          </label>
        </div>
        <label className="admin-interruptor">
          <input type="checkbox" checked={!!p.agotado} onChange={e => alCambiar({ agotado: e.target.checked || undefined })} />
          Agotado
        </label>

        <details>
          <summary>Medidas y detalles (para "Ver en tu mesa")</summary>
          <div className="admin-dos">
            <label>Medida (cm)
              <input inputMode="decimal" value={p.tamanoCm ?? ''} placeholder="ej. 9" onChange={e => alCambiar({ tamanoCm: numeroOpcional(e.target.value) })} />
            </label>
            <label>¿Qué medida es?
              <select value={p.tipoMedida ?? ''} onChange={e => alCambiar({ tipoMedida: (e.target.value || undefined) as TipoMedida | undefined })}>
                <option value="">Automático</option>
                <option value="alto">Alto</option>
                <option value="largo">Largo</option>
                <option value="ancho">Ancho</option>
                <option value="diametro">Diámetro (Ø)</option>
              </select>
            </label>
          </div>
          <label>Peso (gramos)
            <input inputMode="numeric" value={p.pesoGr ?? ''} placeholder="ej. 350" onChange={e => alCambiar({ pesoGr: numeroOpcional(e.target.value) })} />
          </label>
          <label>Qué trae (uno por línea)
            <textarea rows={3} value={(p.incluye ?? []).join('\n')} onChange={e => alCambiar({ incluye: e.target.value.split('\n').filter(l => l.trim()) })} />
          </label>
          <label>Descripción corta
            <input value={p.descripcion ?? ''} maxLength={160} onChange={e => alCambiar({ descripcion: e.target.value || undefined })} />
          </label>
          {!p.tamanoCm && <p className="admin-nota">Sin medida cargada, la cámara usa una aproximada y lo avisa a la clienta.</p>}
        </details>

        <button type="button" className="admin-borrar" onClick={alBorrar}>Borrar producto</button>
      </div>
    </article>
  );
}
