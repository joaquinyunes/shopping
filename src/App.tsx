import { lazy, Suspense, useEffect, useState } from 'react';
import { cargarDatos } from './data/almacen';
import { Tienda } from './tienda/Tienda';
import type { Datos } from './tipos';

// El admin es otra pantalla: no entra en la carga de las clientas.
const Admin = lazy(() => import('./admin/Admin'));

const esAdmin = () => location.hash.startsWith('#/admin');

export default function App() {
  const [admin, setAdmin] = useState(esAdmin);
  const [datos, setDatos] = useState<Datos | null>(null);

  useEffect(() => {
    const alCambiarHash = () => setAdmin(esAdmin());
    window.addEventListener('hashchange', alCambiarHash);
    return () => window.removeEventListener('hashchange', alCambiarHash);
  }, []);

  useEffect(() => {
    let vigente = true;
    cargarDatos().then(d => { if (vigente) setDatos(d); });
    return () => { vigente = false; };
  }, [admin]); // al volver del admin se relee lo que se guardó

  if (admin) return <Suspense fallback={<p className="cargando">Cargando…</p>}><Admin /></Suspense>;
  if (!datos) return <p className="cargando" role="status">Cargando la tienda…</p>;
  return <Tienda datos={datos} />;
}
