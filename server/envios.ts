import { ErrorHttp } from './http.js';

export interface PedidoEnvio { cp: string; pesoGr: number; valorDeclarado: number }
export interface OpcionEnvio { proveedor: string; servicio: string; precio: number; diasMin: number; diasMax: number }

/**
 * Cotizador de envíos. Hoy hay un solo adaptador, `tarifaPorZona`, que no necesita credenciales.
 * Correo Argentino (MiCorreo), Andreani, OCA e-Pak y Zipnova se enchufan implementando esta interfaz
 * (con sus credenciales en variables de entorno) sin tocar pedidos ni el front.
 */
export interface EnviosProvider {
  nombre: string;
  cotizar(pedido: PedidoEnvio): Promise<OpcionEnvio[]>;
}

export type Zona = 'amba' | 'interior';

/** Acepta 1425 y el CPA (C1425ABC). 1000–1999 se toma como CABA/GBA; el resto, interior. */
export function zonaDeCp(cp: string): Zona | null {
  const m = /^[A-Za-z]?(\d{4})(?:[A-Za-z]{3})?$/.exec(cp.trim());
  if (!m) return null;
  return m[1][0] === '1' ? 'amba' : 'interior';
}

interface Tarifa { base: number; porKgExtra: number; diasMin: number; diasMax: number }

// shortcut: tarifas de ejemplo fijas en el código, no son las de ningún correo; cambiarlas por las de la dueña o por un adaptador real antes de cobrar envíos.
const TARIFAS: Record<Zona, Tarifa> = {
  amba: { base: 4500, porKgExtra: 1500, diasMin: 2, diasMax: 4 },
  interior: { base: 7000, porKgExtra: 2500, diasMin: 4, diasMax: 8 },
};

export function tarifaPorZona(config: { gratisDesde?: number; tarifas?: Record<Zona, Tarifa> } = {}): EnviosProvider {
  const tarifas = config.tarifas ?? TARIFAS;
  return {
    nombre: 'tarifa-por-zona',
    async cotizar({ cp, pesoGr, valorDeclarado }) {
      const zona = zonaDeCp(cp);
      if (!zona) throw new ErrorHttp(400, 'Código postal inválido');
      const t = tarifas[zona];
      const kilos = Math.max(1, Math.ceil(pesoGr / 1000)); // peso desconocido cuenta como 1 kg
      const gratis = config.gratisDesde !== undefined && valorDeclarado >= config.gratisDesde;
      return [{
        proveedor: 'tarifa-por-zona', servicio: 'Envío a domicilio',
        precio: gratis ? 0 : t.base + t.porKgExtra * (kilos - 1), diasMin: t.diasMin, diasMax: t.diasMax,
      }];
    },
  };
}

const esTarifa = (t: unknown): t is Tarifa => {
  const r = (t ?? {}) as Record<string, unknown>;
  return ['base', 'porKgExtra', 'diasMin', 'diasMax'].every(k => typeof r[k] === 'number' && Number.isFinite(r[k]) && (r[k] as number) >= 0) && (r.diasMin as number) <= (r.diasMax as number);
};

/**
 * Tarifas propias de la dueña sin tocar el código: ENVIO_TARIFAS = {"amba":{"base":4500,"porKgExtra":1500,"diasMin":2,"diasMax":4},"interior":{...}}.
 * Devuelve `undefined` si falta o está mal escrita (entonces rigen las de ejemplo y se avisa en el log).
 */
export function tarifasDesdeTexto(texto: string | undefined): Record<Zona, Tarifa> | undefined {
  if (!texto) return undefined;
  try {
    const t = JSON.parse(texto) as Record<string, unknown>;
    if (esTarifa(t.amba) && esTarifa(t.interior)) return { amba: t.amba, interior: t.interior };
  } catch { /* cae al aviso de abajo */ }
  console.error('ENVIO_TARIFAS no es válida (hacen falta amba e interior con base, porKgExtra, diasMin y diasMax); se usan las tarifas de ejemplo.');
  return undefined;
}

/**
 * Prueba `principal` y, si falla o tarda más de `esperaMs`, cae a `respaldo`: una clienta nunca se queda sin poder comprar porque un correo no responde.
 * Un código postal inválido (error del cliente, 4xx) no cae al respaldo: se propaga.
 */
export function conRespaldo(principal: EnviosProvider, respaldo: EnviosProvider, esperaMs = 5000): EnviosProvider {
  return {
    nombre: `${principal.nombre}+${respaldo.nombre}`,
    async cotizar(pedido) {
      try {
        const opciones = await Promise.race([
          principal.cotizar(pedido),
          new Promise<never>((_, no) => setTimeout(() => no(new Error(`${principal.nombre} tardó más de ${esperaMs} ms`)), esperaMs).unref?.()),
        ]);
        if (opciones.length) return opciones;
        console.error(`${principal.nombre} no devolvió opciones; se usa ${respaldo.nombre}.`);
      } catch (error) {
        if (error instanceof ErrorHttp && error.estado < 500) throw error;
        console.error(`${principal.nombre} falló (${error instanceof Error ? error.message : error}); se usa ${respaldo.nombre}.`);
      }
      return respaldo.cotizar(pedido);
    },
  };
}

/**
 * Proveedor configurado en este deploy: tarifas por zona. `ENVIO_GRATIS_DESDE` (pesos) activa el envío gratis sobre ese monto
 * y `ENVIO_TARIFAS` (JSON) reemplaza las tarifas de ejemplo. Los adaptadores de Correo Argentino, Andreani, OCA y Zipnova
 * se agregan acá envueltos en `conRespaldo(adaptador, tarifaPorZona(...))` cuando haya credenciales y su documentación oficial.
 */
export function enviosDesdeEnv(): EnviosProvider {
  const gratisDesde = Number(process.env.ENVIO_GRATIS_DESDE);
  return tarifaPorZona({ ...(Number.isFinite(gratisDesde) && gratisDesde > 0 && { gratisDesde }), tarifas: tarifasDesdeTexto(process.env.ENVIO_TARIFAS) });
}

export async function cotizarEnvio(proveedor: EnviosProvider, pedido: PedidoEnvio): Promise<OpcionEnvio[]> {
  if (!zonaDeCp(pedido.cp)) throw new ErrorHttp(400, 'Código postal inválido');
  return proveedor.cotizar(pedido);
}
