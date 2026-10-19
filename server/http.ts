import { createHash, timingSafeEqual } from 'node:crypto';
import type { IncomingMessage as Req, ServerResponse as Res } from 'node:http';

export type { Req, Res };

/** Sitios que pueden llamar a la API desde otro dominio (ej. la copia en Render). Mismo sitio no necesita nada. */
const origenes = () => (process.env.ORIGENES_PERMITIDOS ?? 'https://casa-nido.onrender.com').split(',').map(s => s.trim()).filter(Boolean);

/** Pone los encabezados CORS y responde el preflight; devuelve true si el pedido ya quedó resuelto. */
export function cors(req: Req, res: Res): boolean {
  const origen = req.headers.origin;
  if (origen && origenes().includes(origen)) {
    res.setHeader('Access-Control-Allow-Origin', origen);
    res.setHeader('Vary', 'Origin');
  }
  res.setHeader('Access-Control-Allow-Headers', 'content-type, x-admin-clave');
  res.setHeader('Access-Control-Allow-Methods', 'GET, PUT, POST, OPTIONS');
  if (req.method !== 'OPTIONS') return false;
  res.statusCode = 204;
  res.end();
  return true;
}

export function json(res: Res, estado: number, cuerpo: unknown) {
  res.statusCode = estado;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(cuerpo));
}

const huella = (s: string) => createHash('sha256').update(s).digest();

/** ¿Vino la clave de la dueña (ADMIN_PASSWORD)? Se compara en tiempo constante. */
export function esAdmin(req: Req): boolean {
  const clave = process.env.ADMIN_PASSWORD, dada = req.headers['x-admin-clave'];
  return Boolean(clave) && typeof dada === 'string' && timingSafeEqual(huella(clave!), huella(dada));
}

export class CuerpoGrande extends Error {}

/** Lee el cuerpo del pedido y corta si pasa de `max` bytes. */
export async function leerCuerpo(req: Req, max: number): Promise<Buffer> {
  const partes: Buffer[] = [];
  let total = 0;
  for await (const parte of req) {
    total += (parte as Buffer).length;
    if (total > max) throw new CuerpoGrande();
    partes.push(parte as Buffer);
  }
  return Buffer.concat(partes);
}

/** Envuelve un handler: CORS, errores a JSON y nada de detalles internos hacia afuera. */
export function ruta(f: (req: Req, res: Res) => Promise<void>) {
  return async (req: Req, res: Res) => {
    if (cors(req, res)) return;
    try {
      await f(req, res);
    } catch (error) {
      if (error instanceof CuerpoGrande) return json(res, 413, { error: 'Archivo demasiado grande' });
      console.error(error);
      json(res, 500, { error: 'Error del servidor' });
    }
  };
}
