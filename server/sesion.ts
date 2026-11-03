import { createHash, createHmac, timingSafeEqual } from 'node:crypto';

// Sesión de la dueña: un token firmado con vencimiento. Se guarda solo en la pestaña del navegador.
// El secreto sale de SESION_SECRET (o, si no está, de ADMIN_PASSWORD): al cambiar la contraseña todas las sesiones dejan de valer.

export const DURACION_SESION_MS = 8 * 3_600_000;

const secreto = () => createHash('sha256').update(`sesion:${process.env.SESION_SECRET ?? process.env.ADMIN_PASSWORD ?? ''}`).digest();
const firma = (cuerpo: string) => createHmac('sha256', secreto()).update(cuerpo).digest('base64url');

export function firmarSesion(ahora = Date.now()): { token: string; expira: number } {
  const expira = ahora + DURACION_SESION_MS;
  const cuerpo = `${ahora}.${expira}`;
  return { token: `${cuerpo}.${firma(cuerpo)}`, expira };
}

/** `desde`: si la dueña pidió «cerrar todas las sesiones», lo emitido antes de ese momento ya no vale. */
export function sesionValida(token: string, desde?: Date, ahora = Date.now()): boolean {
  const [emitido, expira, f, ...resto] = token.split('.');
  if (!emitido || !expira || !f || resto.length) return false;
  const esperada = Buffer.from(firma(`${emitido}.${expira}`)), dada = Buffer.from(f);
  if (esperada.length !== dada.length || !timingSafeEqual(esperada, dada)) return false;
  return Number(expira) > ahora && Number(emitido) >= (desde?.getTime() ?? 0);
}
