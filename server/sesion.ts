import { createHmac, scryptSync, timingSafeEqual } from 'node:crypto';

// Sesión de la dueña: un token firmado con vencimiento. Se guarda solo en la pestaña del navegador.
// La clave de firma se deriva con scrypt (lento a propósito, para que un token capturado no permita adivinar la contraseña sin conexión) de ADMIN_PASSWORD,
// ADMIN_TOTP_SECRET y SESION_SECRET juntos: con el segundo paso prendido, saber la contraseña no alcanza para fabricar una sesión.
// Al cambiar cualquiera de los tres, todas las sesiones dejan de valer.

export const DURACION_SESION_MS = 8 * 3_600_000;

let derivada: { fuente: string; clave: Buffer } | undefined;
function secreto(): Buffer {
  const fuente = [process.env.ADMIN_PASSWORD, process.env.ADMIN_TOTP_SECRET, process.env.SESION_SECRET].map(v => v ?? '').join('\0');
  if (derivada?.fuente !== fuente) derivada = { fuente, clave: scryptSync(fuente, 'casa-nido-sesion', 32) }; // una vez por instancia
  return derivada.clave;
}
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
