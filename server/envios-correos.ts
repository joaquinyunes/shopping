import type { EnviosProvider, OpcionEnvio, PedidoEnvio } from './envios.js';

// Adaptadores de correos detrás de la interfaz EnviosProvider. Se activan SOLO si están sus variables de entorno (ver docs/ENVIOS.md) y siempre van
// envueltos en `conRespaldo(…, tarifaPorZona)`: si el correo falla, tarda o devuelve algo raro, la clienta sigue viendo una tarifa y puede comprar.
//
// ⚠ SIN VERIFICAR CONTRA EL SERVICIO REAL: no hubo credenciales. Las direcciones y los campos salen de la documentación pública de cada correo tal como
// se la conoce; los tests usan respuestas simuladas con esa forma. Antes de activarlos en producción hay que cotizar un envío real con cada uno
// (`POST /api/envio` en el sitio desplegado, ver docs/ENVIOS.md) y comparar con la web del correo.

type Pedir = typeof fetch;
export interface Caja { largoCm: number; anchoCm: number; altoCm: number }
interface Base { fetch?: Pedir; caja?: Caja; diasMin?: number; diasMax?: number; esperaMs?: number }

const CAJA: Caja = { largoCm: 30, anchoCm: 20, altoCm: 15 };
const volumenCm3 = (c: Caja) => c.largoCm * c.anchoCm * c.altoCm;

/** Un precio de correo tiene que ser un número finito, no negativo; si no, el adaptador falla y manda el respaldo (nunca se muestra un precio raro). */
const precioValido = (v: unknown): number => {
  const n = typeof v === 'string' ? Number(v.replace(',', '.')) : Number(v);
  if (!Number.isFinite(n) || n < 0) throw new Error(`precio inválido del correo: ${String(v).slice(0, 20)}`);
  return Math.round(n);
};
const dias = (v: unknown, defecto: number) => (Number.isFinite(Number(v)) && Number(v) > 0 ? Math.round(Number(v)) : defecto);

async function pedirJson(f: Pedir, url: string, init: RequestInit, esperaMs = 4000): Promise<unknown> {
  const r = await f(url, { ...init, signal: AbortSignal.timeout(esperaMs) });
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  return r.json();
}

/** Guarda un token hasta poco antes de que venza (por instancia de la función). */
function conToken(obtener: () => Promise<{ token: string; vence: number }>) {
  let actual: { token: string; vence: number } | undefined;
  return async () => {
    if (!actual || actual.vence < Date.now() + 60_000) actual = await obtener();
    return actual.token;
  };
}

// ---------- Andreani ----------
export interface ConfigAndreani extends Base { usuario: string; clave: string; contrato: string; cliente: string; sucursalOrigen?: string; base?: string }

export function andreani(c: ConfigAndreani): EnviosProvider {
  const f = c.fetch ?? fetch, base = c.base ?? 'https://apis.andreani.com', caja = c.caja ?? CAJA;
  const token = conToken(async () => {
    const r = await f(`${base}/login`, { headers: { Authorization: `Basic ${Buffer.from(`${c.usuario}:${c.clave}`).toString('base64')}` }, signal: AbortSignal.timeout(c.esperaMs ?? 4000) });
    const t = r.headers.get('x-authorization-token');
    if (!r.ok || !t) throw new Error(`login Andreani HTTP ${r.status}`);
    return { token: t, vence: Date.now() + 50 * 60_000 };
  });
  return {
    nombre: 'andreani',
    async cotizar({ cp, pesoGr, valorDeclarado }: PedidoEnvio): Promise<OpcionEnvio[]> {
      const q = new URLSearchParams({ cpDestino: cp.replace(/\D/g, '').slice(-4), contrato: c.contrato, cliente: c.cliente, 'bultos[0][valorDeclarado]': String(valorDeclarado), 'bultos[0][volumen]': String(volumenCm3(caja)), 'bultos[0][kilos]': String(Math.max(pesoGr, 100) / 1000) });
      if (c.sucursalOrigen) q.set('sucursalOrigen', c.sucursalOrigen);
      const r = await pedirJson(f, `${base}/v1/tarifas?${q}`, { headers: { 'x-authorization-token': await token() } }, c.esperaMs) as { tarifaConIva?: { total?: unknown } };
      return [{ proveedor: 'andreani', servicio: 'Andreani a domicilio', precio: precioValido(r.tarifaConIva?.total), diasMin: c.diasMin ?? 3, diasMax: c.diasMax ?? 6 }];
    },
  };
}

// ---------- Correo Argentino (MiCorreo) ----------
export interface ConfigMiCorreo extends Base { usuario: string; clave: string; clienteId: string; cpOrigen: string; base?: string }

export function correoArgentino(c: ConfigMiCorreo): EnviosProvider {
  const f = c.fetch ?? fetch, base = c.base ?? 'https://api.correoargentino.com.ar/micorreo/v1', caja = c.caja ?? CAJA;
  const token = conToken(async () => {
    const r = await pedirJson(f, `${base}/token`, { method: 'POST', headers: { Authorization: `Basic ${Buffer.from(`${c.usuario}:${c.clave}`).toString('base64')}` } }, c.esperaMs) as { token?: string };
    if (!r.token) throw new Error('login MiCorreo sin token');
    return { token: r.token, vence: Date.now() + 50 * 60_000 };
  });
  return {
    nombre: 'correo-argentino',
    async cotizar({ cp, pesoGr }: PedidoEnvio): Promise<OpcionEnvio[]> {
      const cuerpo = {
        customerId: c.clienteId, postalCodeOrigin: c.cpOrigen, postalCodeDestination: cp.replace(/\D/g, '').slice(-4), deliveredType: 'D',
        dimensions: { weight: Math.max(pesoGr, 100), height: caja.altoCm, width: caja.anchoCm, length: caja.largoCm },
      };
      const r = await pedirJson(f, `${base}/rates`, { method: 'POST', headers: { Authorization: `Bearer ${await token()}`, 'Content-Type': 'application/json' }, body: JSON.stringify(cuerpo) }, c.esperaMs) as { rates?: Array<Record<string, unknown>> };
      return (r.rates ?? []).map(x => ({
        proveedor: 'correo-argentino', servicio: `Correo Argentino ${String(x.productName ?? 'a domicilio').slice(0, 40)}`, precio: precioValido(x.price),
        diasMin: dias(x.deliveryTimeMin, c.diasMin ?? 3), diasMax: dias(x.deliveryTimeMax, c.diasMax ?? 7),
      }));
    },
  };
}

// ---------- OCA e-Pak ----------
export interface ConfigOca extends Base { cuit: string; operativa: string; cpOrigen: string; base?: string }

export function oca(c: ConfigOca): EnviosProvider {
  const f = c.fetch ?? fetch, base = c.base ?? 'http://webservice.oca.com.ar/ePak_tracking/Oep_TrackEPak.asmx', caja = c.caja ?? CAJA;
  const etiqueta = (xml: string, nombre: string) => new RegExp(`<${nombre}>([^<]*)</${nombre}>`).exec(xml)?.[1];
  return {
    nombre: 'oca',
    async cotizar({ cp, pesoGr, valorDeclarado }: PedidoEnvio): Promise<OpcionEnvio[]> {
      const q = new URLSearchParams({
        PesoTotal: String(Math.max(pesoGr, 100) / 1000), VolumenTotal: String(volumenCm3(caja) / 1_000_000), CodigoPostalOrigen: c.cpOrigen,
        CodigoPostalDestino: cp.replace(/\D/g, '').slice(-4), CantidadPaquetes: '1', ValorDeclarado: String(valorDeclarado), Cuit: c.cuit, Operativa: c.operativa,
      });
      const r = await f(`${base}/Tarifar_Envio_Corporativo?${q}`, { signal: AbortSignal.timeout(c.esperaMs ?? 4000) });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const xml = await r.text();
      const total = etiqueta(xml, 'Total');
      if (total === undefined) throw new Error('OCA sin <Total>');
      const plazo = dias(etiqueta(xml, 'PlazoEntrega'), c.diasMax ?? 5);
      return [{ proveedor: 'oca', servicio: 'OCA a domicilio', precio: precioValido(total), diasMin: Math.min(c.diasMin ?? plazo, plazo), diasMax: plazo }];
    },
  };
}

/**
 * Junta lo que cotiza cada correo (en paralelo), ordenado por precio. Si un correo falla se ignora y se usan los demás; si fallan todos, lanza
 * y `conRespaldo` pasa a las tarifas propias.
 */
export function variosCorreos(proveedores: EnviosProvider[]): EnviosProvider {
  return {
    nombre: proveedores.map(p => p.nombre).join('+'),
    async cotizar(pedido) {
      const r = await Promise.allSettled(proveedores.map(p => p.cotizar(pedido)));
      const opciones = r.flatMap(x => (x.status === 'fulfilled' ? x.value : []));
      r.forEach((x, i) => { if (x.status === 'rejected') console.error(`${proveedores[i].nombre} no cotizó: ${x.reason instanceof Error ? x.reason.message : x.reason}`); });
      if (!opciones.length) throw new Error('ningún correo cotizó');
      return opciones.sort((a, b) => a.precio - b.precio);
    },
  };
}

/** Arma los correos que tienen TODAS sus variables de entorno; los que no, no se activan. */
export function correosDesdeEnv(env: Record<string, string | undefined> = process.env): EnviosProvider[] {
  const e = env;
  const caja = /^(\d+)x(\d+)x(\d+)$/.exec(e.ENVIO_CAJA_CM ?? '');
  const comun: Base = { ...(caja && { caja: { largoCm: +caja[1], anchoCm: +caja[2], altoCm: +caja[3] } }) };
  const lista: EnviosProvider[] = [];
  if (e.ANDREANI_USUARIO && e.ANDREANI_CLAVE && e.ANDREANI_CONTRATO && e.ANDREANI_CLIENTE) {
    lista.push(andreani({ ...comun, usuario: e.ANDREANI_USUARIO, clave: e.ANDREANI_CLAVE, contrato: e.ANDREANI_CONTRATO, cliente: e.ANDREANI_CLIENTE, sucursalOrigen: e.ANDREANI_SUCURSAL }));
  }
  if (e.MICORREO_USUARIO && e.MICORREO_CLAVE && e.MICORREO_CLIENTE_ID && e.ENVIO_CP_ORIGEN) {
    lista.push(correoArgentino({ ...comun, usuario: e.MICORREO_USUARIO, clave: e.MICORREO_CLAVE, clienteId: e.MICORREO_CLIENTE_ID, cpOrigen: e.ENVIO_CP_ORIGEN }));
  }
  if (e.OCA_CUIT && e.OCA_OPERATIVA && e.ENVIO_CP_ORIGEN) lista.push(oca({ ...comun, cuit: e.OCA_CUIT, operativa: e.OCA_OPERATIVA, cpOrigen: e.ENVIO_CP_ORIGEN }));
  return lista;
}
