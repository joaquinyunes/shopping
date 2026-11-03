import { useState } from 'react';
import { MAX_FOTOS_EXTRA, MAX_PROPIEDADES, MAX_VARIANTES } from '../data/producto';
import { idVariante } from '../lib/catalogo';
import type { Producto, TipoMedida, Variante } from '../tipos';

interface Props {
  producto: Producto;
  categorias: string[];
  subiendo: boolean;
  alCambiar: (cambio: Partial<Producto>) => void;
  alBorrar: () => void;
  alElegirFoto: (archivo: File) => void;
  alElegirFotoExtra: (archivo: File) => void;
}

const numeroOpcional = (v: string) => {
  const n = Number(v.replace(',', '.'));
  return v.trim() !== '' && Number.isFinite(n) && n > 0 ? n : undefined;
};

const enteroOpcional = (v: string) => { const n = parseInt(v, 10); return Number.isFinite(n) ? Math.max(0, n) : undefined; };

/** Variante con el id que le toca por sus valores; mientras falte algún valor lleva un id provisorio (el servidor descarta las incompletas al guardar). */
const conId = (v: Variante, i: number): Variante => ({ ...v, id: idVariante(v.valores) || `nueva-${i}` });

export function AdminProducto({ producto: p, categorias, subiendo, alCambiar, alBorrar, alElegirFoto, alElegirFotoExtra }: Props) {
  const [propiedadesTexto, setPropiedadesTexto] = useState((p.propiedades ?? []).join(', '));
  const propiedades = p.propiedades ?? [];
  const variantes = p.variantes ?? [];
  const incompletas = variantes.filter(v => !idVariante(v.valores)).length;
  const sobreOferta = p.precioPromo !== undefined && p.precioPromo >= p.precio;

  const guardarVariantes = (lista: Variante[], props = propiedades) =>
    alCambiar(lista.length ? { variantes: lista.map(conId), propiedades: props.length ? props : ['Opción'], stock: undefined } : { variantes: undefined, propiedades: undefined });

  const cambiarPropiedades = (texto: string) => {
    setPropiedadesTexto(texto);
    const nuevas = texto.split(',').map(s => s.trim()).filter(Boolean).slice(0, MAX_PROPIEDADES);
    const ajustadas = variantes.map(v => ({ ...v, valores: nuevas.map((_, i) => v.valores[i] ?? '') }));
    if (nuevas.length === 0) return; // campo vacío mientras escribe: se conservan las propiedades y variantes actuales
    guardarVariantes(ajustadas, nuevas);
  };

  const agregarVariante = () => {
    const props = propiedades.length ? propiedades : ['Opción'];
    if (!propiedades.length) setPropiedadesTexto('Opción');
    guardarVariantes([...variantes, { id: '', valores: props.map(() => '') }], props);
  };

  const cambiarVariante = (i: number, cambio: Partial<Variante>) => guardarVariantes(variantes.map((v, j) => (j === i ? { ...v, ...cambio } : v)));

  return (
    <article className={`admin-item${subiendo ? ' subiendo' : ''}${p.oculto ? ' admin-oculto' : ''}`}>
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
          <label>Precio de oferta ($, vacío = sin oferta)
            <input
              type="number" inputMode="numeric" min={0} step={1} value={p.precioPromo ?? ''} aria-invalid={sobreOferta} aria-describedby={sobreOferta ? `oferta-${p.id}` : undefined}
              onChange={e => alCambiar({ precioPromo: numeroOpcional(e.target.value) })}
            />
          </label>
        </div>
        {sobreOferta && <p className="admin-nota" id={`oferta-${p.id}`}>La oferta tiene que ser menor al precio; si no, no se aplica.</p>}
        <label>Categoría
          <input list="categorias" value={p.categoria} maxLength={30} onChange={e => alCambiar({ categoria: e.target.value })} />
          <datalist id="categorias">{categorias.map(c => <option key={c} value={c} />)}</datalist>
        </label>
        <div className="admin-dos">
          <label>Stock (vacío = sin límite)
            <input
              inputMode="numeric" value={variantes.length ? '' : p.stock ?? ''} placeholder={variantes.length ? 'por variante' : 'ilimitado'} disabled={variantes.length > 0}
              onChange={e => alCambiar({ stock: enteroOpcional(e.target.value) })}
            />
          </label>
          <label>SKU (código interno)
            <input value={p.sku ?? ''} maxLength={40} onChange={e => alCambiar({ sku: e.target.value || undefined })} />
          </label>
        </div>
        <label className="admin-interruptor">
          <input type="checkbox" checked={!!p.agotado} onChange={e => alCambiar({ agotado: e.target.checked || undefined })} />
          Agotado
        </label>
        <label className="admin-interruptor">
          <input type="checkbox" checked={!!p.oculto} onChange={e => alCambiar({ oculto: e.target.checked || undefined })} />
          Ocultar en la tienda (sigue acá, pero nadie lo ve ni lo puede pedir)
        </label>

        <details open={variantes.length > 0}>
          <summary>Variantes (talle, color…){variantes.length > 0 && ` · ${variantes.length}`}</summary>
          <label>Propiedades, separadas por coma (hasta {MAX_PROPIEDADES})
            <input value={propiedadesTexto} placeholder="ej. Talle, Color" maxLength={80} onChange={e => cambiarPropiedades(e.target.value)} />
          </label>
          {variantes.map((v, i) => (
            <fieldset key={i} className="admin-variante">
              <legend className="solo-lectores">Variante {i + 1}</legend>
              {propiedades.map((nombre, k) => (
                <label key={k}>{nombre}
                  <input value={v.valores[k] ?? ''} maxLength={30} onChange={e => cambiarVariante(i, { valores: propiedades.map((_, j) => (j === k ? e.target.value : v.valores[j] ?? '')) })} />
                </label>
              ))}
              <label>Precio propio ($)
                <input inputMode="numeric" value={v.precio ?? ''} placeholder="el del producto" onChange={e => cambiarVariante(i, { precio: numeroOpcional(e.target.value) })} />
              </label>
              <label>Stock
                <input inputMode="numeric" value={v.stock ?? ''} placeholder="ilimitado" onChange={e => cambiarVariante(i, { stock: enteroOpcional(e.target.value) })} />
              </label>
              <label>SKU
                <input value={v.sku ?? ''} maxLength={40} onChange={e => cambiarVariante(i, { sku: e.target.value || undefined })} />
              </label>
              <button type="button" className="admin-borrar" onClick={() => guardarVariantes(variantes.filter((_, j) => j !== i))}>Quitar</button>
            </fieldset>
          ))}
          {incompletas > 0 && <p className="admin-nota" role="status">Completá todos los valores: las variantes incompletas no se guardan.</p>}
          {variantes.length > 0 && <p className="admin-nota">Una variante con precio propio no toma la oferta del producto.</p>}
          <button type="button" className="btn btn-chico" onClick={agregarVariante} disabled={variantes.length >= MAX_VARIANTES}>+ Agregar variante</button>
        </details>

        <details>
          <summary>Más fotos{p.fotos?.length ? ` · ${p.fotos.length}` : ''}</summary>
          {p.fotos && p.fotos.length > 0 && (
            <div className="admin-fotos">
              {p.fotos.map((f, i) => (
                <figure key={f}>
                  <img src={f} alt={`Foto extra ${i + 1}`} />
                  <button type="button" aria-label={`Quitar la foto extra ${i + 1}`} onClick={() => alCambiar({ fotos: p.fotos!.length > 1 ? p.fotos!.filter((_, j) => j !== i) : undefined })}><span aria-hidden="true">✕</span></button>
                </figure>
              ))}
            </div>
          )}
          {(p.fotos?.length ?? 0) < MAX_FOTOS_EXTRA
            ? (
              <label className="admin-link">
                {subiendo ? 'Subiendo…' : '+ Sumar una foto'}
                <input type="file" accept="image/*" hidden disabled={subiendo} onChange={e => { const f = e.target.files?.[0]; if (f) alElegirFotoExtra(f); e.target.value = ''; }} />
              </label>
            )
            : <p className="admin-nota">Llegaste al máximo de {MAX_FOTOS_EXTRA} fotos extra.</p>}
        </details>

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
