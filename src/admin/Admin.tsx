import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import { borrarLocal, cargarDatos, guardarLocal, hayNube } from '../data/almacen';
import { DATOS_INICIALES } from '../data/seed';
import type { Datos, Producto, Tienda } from '../tipos';
import { AdminProducto } from './AdminProducto';
import { crearCliente, guardarEnNube, subirFotoANube, type ClienteNube } from './nube';
import { achicarFoto, blobComoDataUrl } from './subir-foto';

type EstadoSesion = 'cargando' | 'login' | 'listo';

/** Panel para la dueña: pensado para usarse desde el celular, con letra grande y un solo botón de guardar. */
export default function Admin() {
  const [sesion, setSesion] = useState<EstadoSesion>(hayNube ? 'cargando' : 'listo');
  const [cliente, setCliente] = useState<ClienteNube | null>(null);
  const [datos, setDatos] = useState<Datos | null>(null);
  const [cambios, setCambios] = useState(false);
  const [mensaje, setMensaje] = useState('Sin cambios');
  const [error, setError] = useState<string | null>(null);
  const [subiendo, setSubiendo] = useState<string | null>(null);

  // Con Supabase: ¿ya hay sesión iniciada?
  useEffect(() => {
    if (!hayNube) return;
    let vigente = true;
    crearCliente().then(async c => {
      const { data } = await c.auth.getSession();
      if (!vigente) return;
      setCliente(c);
      setSesion(data.session ? 'listo' : 'login');
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

  const cambiarFoto = async (id: string, archivo: File) => {
    setSubiendo(id);
    setError(null);
    try {
      const blob = await achicarFoto(archivo, hayNube ? 1000 : 700);
      const url = hayNube && cliente ? await subirFotoANube(cliente, blob) : await blobComoDataUrl(blob);
      editarProducto(id, { foto: url });
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
      if (hayNube && cliente) await guardarEnNube(cliente, datos);
      else guardarLocal(datos);
      setCambios(false);
      setMensaje('Guardado ✓');
    } catch (e) {
      const cuota = e instanceof DOMException && e.name === 'QuotaExceededError';
      setError(cuota ? 'No entra en el modo demo: usá fotos más chicas o conectá Supabase.' : 'No se pudo guardar. Revisá la conexión y probá de nuevo.');
      setMensaje('Tenés cambios sin guardar');
    }
  };

  const iniciarSesion = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!cliente) return;
    const f = new FormData(e.currentTarget);
    const { error: err } = await cliente.auth.signInWithPassword({ email: String(f.get('email')), password: String(f.get('clave')) });
    if (err) setError('Email o contraseña incorrectos.');
    else { setError(null); setSesion('listo'); }
  };

  const categorias = useMemo(() => [...new Set([...(datos?.productos.map(p => p.categoria) ?? []), ...DATOS_INICIALES.productos.map(p => p.categoria)])], [datos]);

  if (sesion === 'cargando') return <p className="cargando" role="status">Cargando…</p>;

  if (sesion === 'login') {
    return (
      <main className="admin admin-login">
        <form className="admin-tarjeta" onSubmit={iniciarSesion}>
          <h1>Entrar al admin</h1>
          <label>Email<input type="email" name="email" autoComplete="username" required /></label>
          <label>Contraseña<input type="password" name="clave" autoComplete="current-password" required /></label>
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
          Modo demo: los cambios se guardan solo en este navegador. Para que los vean tus clientas, conectá Supabase (ver LEEME.md).{' '}
          <button type="button" className="admin-link" onClick={() => { if (confirm('¿Volver a los datos de ejemplo?')) { borrarLocal(); setDatos(structuredClone(DATOS_INICIALES)); setCambios(false); setMensaje('Datos de ejemplo restaurados'); } }}>
            Restaurar ejemplo
          </button>
        </p>
      )}
      {hayNube && cliente && (
        <button type="button" className="admin-link" onClick={async () => { await cliente.auth.signOut(); setSesion('login'); }}>Cerrar sesión</button>
      )}

      <h2>Tu tienda</h2>
      <section className="admin-tarjeta admin-tienda">
        <label>Nombre<input value={datos.tienda.nombre} maxLength={40} onChange={e => editarTienda({ nombre: e.target.value })} /></label>
        <label>Frase<input value={datos.tienda.lema} maxLength={60} onChange={e => editarTienda({ lema: e.target.value })} /></label>
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
      {datos.productos.map(p => (
        <AdminProducto
          key={p.id} producto={p} categorias={categorias} subiendo={subiendo === p.id}
          alCambiar={c => editarProducto(p.id, c)} alBorrar={() => borrar(p)} alElegirFoto={f => cambiarFoto(p.id, f)}
        />
      ))}

      <div className="admin-barra">
        <span role="status">{error ?? mensaje}</span>
        <button type="button" className="btn btn-primario btn-grande" onClick={guardar} disabled={!cambios}>Guardar</button>
      </div>
    </main>
  );
}
