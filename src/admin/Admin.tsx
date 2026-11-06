import './admin.css';
import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import { borrarLocal, cargarDatos, guardarLocal, hayNube } from '../data/almacen';
import { normalizarDatos } from '../data/normalizar';
import { MAX_FOTOS_EXTRA } from '../data/producto';
import { DATOS_INICIALES } from '../data/seed';
import type { Datos, Producto, Tienda } from '../tipos';
import { exportarCsv, importarCsv } from '../lib/tiendanube-csv';
import { AdminPedidos } from './AdminPedidos';
import { AdminProducto } from './AdminProducto';
import { AdminAuditoria } from './AdminAuditoria';
import { AdminDatos } from './AdminDatos';
import { CatalogoDesactualizado, cerrarTodasLasSesiones, entrar, estadoDeSesion, guardarEnNube, subirFotoANube } from './nube';
import { achicarFoto, blobComoDataUrl } from './subir-foto';

type EstadoSesion = 'cargando' | 'login' | 'listo';

/** La sesión (un token que vence a las 8 horas) vive solo en esta pestaña (sessionStorage): al cerrarla hay que volver a entrar. La contraseña no se guarda. */
const CLAVE_SESION = 'casa-nido:sesion';
const leerClave = () => { try { return sessionStorage.getItem(CLAVE_SESION); } catch { return null; } };
const guardarClave = (c: string | null) => { try { if (c) sessionStorage.setItem(CLAVE_SESION, c); else sessionStorage.removeItem(CLAVE_SESION); } catch { /* sin storage */ } };

/** Panel para la dueña: pensado para usarse desde el celular, con letra grande y un solo botón de guardar. */
export default function Admin() {
  const [sesion, setSesion] = useState<EstadoSesion>(hayNube ? 'cargando' : 'listo');
  const [clave, setClave] = useState(''); // la sesión, no la contraseña
  const [pideCodigo, setPideCodigo] = useState(false);
  const [datos, setDatos] = useState<Datos | null>(null);
  const [cambios, setCambios] = useState(false);
  const [mensaje, setMensaje] = useState('Sin cambios');
  const [error, setError] = useState<string | null>(null);
  const [subiendo, setSubiendo] = useState<string | null>(null);
  const [informe, setInforme] = useState<string[]>([]);
  const [desactualizado, setDesactualizado] = useState(false);

  // Con la API: ¿la sesión guardada en esta pestaña sigue valiendo? (y ¿hay que pedir el código de la app?)
  useEffect(() => {
    if (!hayNube) return;
    let vigente = true;
    const guardada = leerClave();
    estadoDeSesion(guardada ?? undefined).then(({ dosPasos, sesion: ok }) => {
      if (!vigente) return;
      setPideCodigo(dosPasos);
      if (ok) setClave(guardada!);
      setSesion(ok ? 'listo' : 'login');
    }).catch(() => { if (vigente) { setError('No se pudo conectar con la base de datos.'); setSesion('login'); } });
    return () => { vigente = false; };
  }, []);

  useEffect(() => {
    if (sesion !== 'listo') return;
    let vigente = true;
    cargarDatos().then(d => { if (vigente) setDatos(d); });
    return () => { vigente = false; };
  }, [sesion]);

  useEffect(() => {
    if (!cambios) return;
    const aviso = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener('beforeunload', aviso);
    return () => window.removeEventListener('beforeunload', aviso);
  }, [cambios]);

  const modificar = useCallback((f: (d: Datos) => Datos) => {
    setDatos(d => (d ? f(d) : d));
    setCambios(true);
    setMensaje('Tenés cambios sin guardar');
  }, []);

  const editarTienda = (cambio: Partial<Tienda>) => modificar(d => ({ ...d, tienda: { ...d.tienda, ...cambio } }));
  const editarProducto = (id: string, cambio: Partial<Producto>) =>
    modificar(d => ({ ...d, productos: d.productos.map(p => (p.id === id ? { ...p, ...cambio } : p)) }));

  const agregar = () => modificar(d => ({
    ...d,
    productos: [{ id: crypto.randomUUID(), nombre: 'Producto nuevo', categoria: d.productos[0]?.categoria ?? 'Otros', precio: 0, foto: '' }, ...d.productos],
  }));

  const borrar = (p: Producto) => {
    if (confirm(`¿Borrar "${p.nombre}"?`)) modificar(d => ({ ...d, productos: d.productos.filter(x => x.id !== p.id) }));
  };

  const exportar = () => {
    if (!datos) return;
    const enlace = Object.assign(document.createElement('a'), {
      href: URL.createObjectURL(new Blob([exportarCsv(datos.productos)], { type: 'text/csv;charset=utf-8' })), download: 'productos-casa-nido.csv',
    });
    enlace.click();
    setTimeout(() => URL.revokeObjectURL(enlace.href), 1000);
  };

  const importar = async (archivo: File) => {
    if (!datos) return;
    const r = importarCsv(await archivo.text(), datos.productos);
    if (r.productos !== datos.productos) modificar(d => ({ ...d, productos: r.productos }));
    setInforme([r.productos === datos.productos ? 'No se importó nada.' : `Planilla leída: ahora hay ${r.productos.length} productos. Revisá y tocá Guardar.`, ...r.errores, ...r.avisos]);
  };

  const cambiarFoto = async (id: string, archivo: File, comoExtra = false) => {
    setSubiendo(id);
    setError(null);
    try {
      const blob = await achicarFoto(archivo, hayNube ? 1000 : 700);
      const url = hayNube ? await subirFotoANube(clave, blob) : await blobComoDataUrl(blob);
      if (comoExtra) modificar(d => ({ ...d, productos: d.productos.map(p => (p.id === id ? { ...p, fotos: [...(p.fotos ?? []), url].slice(0, MAX_FOTOS_EXTRA) } : p)) }));
      else editarProducto(id, { foto: url });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo cargar la foto. Probá con otra.');
    } finally {
      setSubiendo(null);
    }
  };

  const guardar = async () => {
    if (!datos) return;
    setMensaje('Guardando…');
    setError(null);
    try {
      if (hayNube) {
        const version = await guardarEnNube(clave, datos);
        setDatos(d => (d ? { ...normalizarDatos(d), version } : d)); // lo mismo que dejó el servidor: sin variantes incompletas ni ofertas inválidas
      } else guardarLocal(datos);
      setCambios(false);
      setDesactualizado(false);
      setMensaje('Guardado ✓');
    } catch (e) {
      if (e instanceof CatalogoDesactualizado) {
        setDesactualizado(true);
        setError(e.message || 'La tienda cambió mientras editabas. Recargá para ver el stock actual.');
        setMensaje('Tenés cambios sin guardar');
        return;
      }
      const cuota = e instanceof DOMException && e.name === 'QuotaExceededError';
      setError(cuota ? 'No entra en el modo demo: usá fotos más chicas o conectá la base de datos.' : 'No se pudo guardar. Revisá la conexión y probá de nuevo.');
      setMensaje('Tenés cambios sin guardar');
    }
  };

  const recargar = () => {
    if (cambios && !confirm('Se pierden los cambios que todavía no guardaste. ¿Recargar?')) return;
    setDatos(null); setCambios(false); setDesactualizado(false); setError(null); setMensaje('Sin cambios');
    cargarDatos().then(setDatos);
  };

  const iniciarSesion = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    try {
      const token = await entrar(String(f.get('clave')), pideCodigo ? String(f.get('codigo')).trim() : undefined);
      if (token) { guardarClave(token); setClave(token); setError(null); setSesion('listo'); }
      else setError(pideCodigo ? 'La contraseña o el código no son correctos.' : 'Contraseña incorrecta.');
    } catch (err) {
      setError(err instanceof Error && err.message && !/^Failed|NetworkError|Load failed/i.test(err.message) ? err.message : 'No se pudo conectar. Revisá la conexión y probá de nuevo.');
    }
  };

  const categorias = useMemo(() => [...new Set([...(datos?.productos.map(p => p.categoria) ?? []), ...DATOS_INICIALES.productos.map(p => p.categoria)])], [datos]);

  if (sesion === 'cargando') return <p className="cargando" role="status">Cargando…</p>;

  if (sesion === 'login') {
    return (
      <main className="admin admin-login">
        <form className="admin-tarjeta" onSubmit={iniciarSesion}>
          <h1>Entrar al admin</h1>
          <label>Contraseña<input type="password" name="clave" autoComplete="current-password" required /></label>
          {pideCodigo && <label>Código de la app (6 dígitos)<input name="codigo" inputMode="numeric" pattern="[0-9]{6}" maxLength={6} autoComplete="one-time-code" required /></label>}
          <button className="btn btn-primario btn-grande" type="submit">Entrar</button>
          {error && <p className="admin-error" role="alert">{error}</p>}
          <a href="#/">← Volver a la tienda</a>
        </form>
      </main>
    );
  }

  if (!datos) return <p className="cargando" role="status">Cargando…</p>;

  return (
    <main className="admin">
      <div className="admin-cabeza">
        <h1>Admin</h1>
        <a href="#/">Ver la tienda ↗</a>
      </div>
      {!hayNube && (
        <p className="admin-aviso">
          Modo demo: los cambios se guardan solo en este navegador. Para que los vean tus clientas, conectá la base de datos (ver LEEME.md).{' '}
          <button type="button" className="admin-link" onClick={() => { if (confirm('¿Volver a los datos de ejemplo?')) { borrarLocal(); setDatos(structuredClone(DATOS_INICIALES)); setCambios(false); setMensaje('Datos de ejemplo restaurados'); } }}>
            Restaurar ejemplo
          </button>
        </p>
      )}
      {hayNube && (
        <div className="admin-acciones">
          <button type="button" className="admin-link" onClick={() => { guardarClave(null); setClave(''); setSesion('login'); }}>Cerrar sesión</button>
          <button
            type="button" className="admin-link"
            onClick={() => { if (confirm('Se cierra la sesión en todos tus dispositivos. ¿Seguro?')) cerrarTodasLasSesiones(clave).then(() => { guardarClave(null); setClave(''); setSesion('login'); }, e => setError(e instanceof Error ? e.message : 'No se pudo cerrar.')); }}
          >Cerrar en todos los dispositivos</button>
        </div>
      )}

      {hayNube && <AdminPedidos clave={clave} />}
      {hayNube && <AdminAuditoria sesion={clave} />}
      {hayNube && <AdminDatos sesion={clave} />}

      <h2>Tu tienda</h2>
      <section className="admin-tarjeta admin-tienda">
        <label>Nombre<input value={datos.tienda.nombre} maxLength={40} onChange={e => editarTienda({ nombre: e.target.value })} /></label>
        <label>Frase<input value={datos.tienda.lema} maxLength={60} onChange={e => editarTienda({ lema: e.target.value })} /></label>
        <label>Mensaje de WhatsApp del pedido (opcional)
          <textarea rows={4} maxLength={600} value={datos.tienda.plantillaPedido ?? ''} placeholder="¡Hola {nombre}! Quiero hacer este pedido{numero}:&#10;&#10;{detalle}{envio}&#10;&#10;Total: {total}" onChange={e => editarTienda({ plantillaPedido: e.target.value || undefined })} />
          <span className="admin-nota">Usá {'{nombre}'}, {'{numero}'}, {'{detalle}'} (lista de productos), {'{envio}'} y {'{total}'}. Vacío = el mensaje de siempre.</span>
        </label>
        <label>WhatsApp (con código de país, ej. 5491123456789)
          <input value={datos.tienda.whatsapp} inputMode="tel" maxLength={20} onChange={e => editarTienda({ whatsapp: e.target.value })} />
        </label>
        <label className="admin-interruptor">
          <input type="checkbox" checked={datos.tienda.hero3d} onChange={e => editarTienda({ hero3d: e.target.checked })} />
          Viaje 3D en el inicio (se apaga solo en celulares lentos)
        </label>
        <label className="admin-interruptor">
          <input type="checkbox" checked={datos.tienda.camara} onChange={e => editarTienda({ camara: e.target.checked })} />
          Botón "Ver en tu mesa" (cámara a tamaño real)
        </label>
      </section>

      <div className="admin-titulo-fila">
        <h2>Productos ({datos.productos.length})</h2>
        <button type="button" className="btn btn-primario btn-chico" onClick={agregar}>+ Agregar producto</button>
      </div>
      <div className="admin-acciones">
        <button type="button" className="admin-link" onClick={exportar}>Descargar planilla (Tiendanube .csv)</button>
        <label className="admin-link">
          Cargar planilla .csv
          <input type="file" accept=".csv,text/csv" hidden onChange={e => { const f = e.target.files?.[0]; if (f) importar(f); e.target.value = ''; }} />
        </label>
      </div>
      {informe.length > 0 && (
        <ul className="admin-informe" role="status">{informe.map((l, i) => <li key={i}>{l}</li>)}</ul>
      )}
      {datos.productos.map(p => (
        <AdminProducto
          key={p.id} producto={p} categorias={categorias} subiendo={subiendo === p.id}
          alCambiar={c => editarProducto(p.id, c)} alBorrar={() => borrar(p)} alElegirFoto={f => cambiarFoto(p.id, f)} alElegirFotoExtra={f => cambiarFoto(p.id, f, true)}
        />
      ))}

      <div className="admin-barra">
        <span role="status">{error ?? mensaje}</span>
        {desactualizado
          ? <button type="button" className="btn btn-grande" onClick={recargar}>Recargar tienda</button>
          : <button type="button" className="btn btn-primario btn-grande" onClick={guardar} disabled={!cambios}>Guardar</button>}
      </div>
    </main>
  );
}
