// Prueba de humo de una instancia ya desplegada (la tuya o la de una clienta nueva): responde, tiene la base conectada, los encabezados de seguridad
// y cierra lo que tiene que cerrar. Solo hace pedidos de lectura o inválidos: no crea pedidos ni toca datos.
// Uso: node scripts/verificar-instancia.mjs https://casa-nido.vercel.app [--local]      (--local: no exige encabezados de Vercel; para dev:api)
// Sale con código 1 si algo falla.

const [base, ...flags] = process.argv.slice(2);
if (!base || !/^https?:\/\//.test(base)) { console.error('Uso: node scripts/verificar-instancia.mjs https://tu-sitio [--local]'); process.exit(2); }
const local = flags.includes('--local');
const url = p => new URL(p, base).toString();
const pedir = (p, init = {}) => fetch(url(p), { signal: AbortSignal.timeout(15000), redirect: 'manual', ...init });

const resultados = [];
const prueba = async (nombre, f, { aviso = false } = {}) => {
  try { const detalle = await f(); resultados.push({ nombre, ok: true, detalle }); } catch (e) { resultados.push({ nombre, ok: false, aviso, detalle: e instanceof Error ? e.message : String(e) }); }
};
const esperar = (cond, msg) => { if (!cond) throw new Error(msg); };

await prueba('La portada responde 200 y es la tienda', async () => {
  const r = await pedir('/'); esperar(r.status === 200, `HTTP ${r.status}`);
  esperar((await r.text()).includes('id="root"'), 'no parece la tienda');
});
await prueba('/api/salud: la API y la base responden', async () => {
  const r = await pedir('/api/salud'); esperar(r.status === 200, `HTTP ${r.status} (¿MONGODB_URI y acceso de red de Atlas?)`);
});
await prueba('/api/tienda: el catálogo se lee', async () => {
  const r = await pedir('/api/tienda'); esperar(r.status === 200, `HTTP ${r.status}`);
  const d = await r.json(); // null = todavía no se guardó nada (se usan los datos iniciales)
  esperar(d === null || Array.isArray(d.productos), 'forma inesperada');
  return d ? `${d.productos.length} productos` : 'sin catálogo guardado todavía';
});
await prueba('Un pedido vacío se rechaza con 400 (no 500)', async () => {
  const r = await pedir('/api/pedido', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' }); esperar(r.status === 400, `HTTP ${r.status}`);
});
await prueba('Pedidos, auditoría y datos personales exigen sesión (401)', async () => {
  for (const p of ['/api/pedidos', '/api/auditoria']) { const r = await pedir(p); esperar(r.status === 401 || r.status === 429, `${p}: HTTP ${r.status}`); }
  const r = await pedir('/api/datos', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{"accion":"exportar","email":"x@y.test"}' });
  esperar(r.status === 401 || r.status === 429, `/api/datos: HTTP ${r.status}`);
});
await prueba('Entrar al admin: el segundo paso está prendido', async () => {
  const d = await (await pedir('/api/login')).json(); esperar(d.dosPasos === true, 'ADMIN_TOTP_SECRET no está cargada: el admin queda solo con contraseña');
}, { aviso: true });
await prueba('Una foto inexistente es 404', async () => {
  const r = await pedir('/api/foto?id=00000000-0000-0000-0000-000000000000'); esperar(r.status === 404, `HTTP ${r.status}`);
});
await prueba('Privacidad y términos publicados', async () => {
  for (const p of ['/privacidad.html', '/terminos.html']) { const r = await pedir(p); esperar(r.status === 200, `${p}: HTTP ${r.status}`); }
});
await prueba('security.txt sin el mail de ejemplo', async () => {
  const r = await pedir('/.well-known/security.txt'); esperar(r.status === 200, `HTTP ${r.status}`);
  esperar(!(await r.text()).includes('COMPLETAR'), 'falta poner el mail real en security.txt');
}, { aviso: true });

if (!local) {
  await prueba('Encabezados de seguridad (CSP que bloquea, HSTS, nosniff, sin iframes)', async () => {
    const h = (await pedir('/')).headers;
    esperar(/default-src 'self'/.test(h.get('content-security-policy') ?? ''), 'falta Content-Security-Policy');
    esperar(!h.has('content-security-policy-report-only'), 'la CSP sigue en solo reporte');
    esperar(/max-age=\d{7,}/.test(h.get('strict-transport-security') ?? ''), 'falta HSTS');
    esperar(h.get('x-content-type-options') === 'nosniff', 'falta nosniff');
    esperar(h.get('x-frame-options') === 'DENY', 'falta X-Frame-Options');
  });
  await prueba('http se redirige a https', async () => {
    if (!base.startsWith('https://')) return 'omitido (la dirección no es https)';
    const r = await fetch(base.replace('https://', 'http://'), { redirect: 'manual', signal: AbortSignal.timeout(15000) });
    esperar([301, 302, 307, 308].includes(r.status) && (r.headers.get('location') ?? '').startsWith('https://'), `HTTP ${r.status}`);
  });
}

let fallos = 0;
for (const r of resultados) {
  const marca = r.ok ? '✔' : r.aviso ? '⚠' : '✘';
  console.log(`${marca} ${r.nombre}${r.detalle ? ` — ${r.detalle}` : ''}`);
  if (!r.ok && !r.aviso) fallos++;
}
console.log(fallos ? `\n${fallos} prueba(s) fallaron.` : '\nLa instancia pasó las pruebas de humo.');
process.exit(fallos ? 1 : 0);
