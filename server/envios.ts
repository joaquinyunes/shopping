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

/** Proveedor configurado en este deploy. `ENVIO_GRATIS_DESDE` (pesos, opcional) activa el envío gratis sobre ese monto. */
export function enviosDesdeEnv(): EnviosProvider {
  const gratisDesde = Number(process.env.ENVIO_GRATIS_DESDE);
  return tarifaPorZona(Number.isFinite(gratisDesde) && gratisDesde > 0 ? { gratisDesde } : {});
}

export async function cotizarEnvio(proveedor: EnviosProvider, pedido: PedidoEnvio): Promise<OpcionEnvio[]> {
  if (!zonaDeCp(pedido.cp)) throw new ErrorHttp(400, 'Código postal inválido');
  return proveedor.cotizar(pedido);
}
