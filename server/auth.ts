import { timingSafeEqual, createHash } from 'node:crypto';
import type { Db } from 'mongodb';
import { ErrorHttp, esAdmin, ipDe, type Req } from './http.js';
import { contar, valorDe } from './limites.js';
import { huellaDeOrigen } from './pedidos.js';
import { DURACION_SESION_MS, firmarSesion, sesionValida } from './sesion.js';
import { pasoValido } from './totp.js';

/** Intentos fallidos por origen antes del bloqueo temporal, y cuánto dura. */
export const MAX_FALLOS = 5;
export const BLOQUEO_MS = 15 * 60_000;
export const LARGO_MIN_CLAVE = 12;
/** Claves que están en el repo (solo para desarrollo y tests): en Vercel no se aceptan. */
const CLAVES_DE_EJEMPLO = ['dev-casa-nido', 'clave-de-prueba'];

/** ¿Está prendido el segundo paso? Con ADMIN_TOTP_SECRET en el entorno, la clave sola no alcanza. */
export const dosPasos = () => Boolean(process.env.ADMIN_TOTP_SECRET);

const huella = (s: string) => createHash('sha256').update(s).digest();
const claveOk = (dada: unknown) => typeof dada === 'string' && Boolean(process.env.ADMIN_PASSWORD) && timingSafeEqual(huella(process.env.ADMIN_PASSWORD!), huella(dada));

interface Ajustes { _id: string; desde?: Date; ultimoPaso?: number }
const ajustes = (db: Db) => db.collection<Ajustes>('ajustes');
const claveDeFallos = (req: Req) => `fallos-admin:${huellaDeOrigen(ipDe(req) ?? 'sin-ip')}`;
const encabezado = (req: Req, nombre: string) => { const v = req.headers[nombre]; return typeof v === 'string' ? v : undefined; };
const bearer = (req: Req) => encabezado(req, 'authorization')?.replace(/^Bearer /, '');

async function bloqueado(db: Db, req: Req) {
  if (await valorDe(db, claveDeFallos(req)) >= MAX_FALLOS) throw new ErrorHttp(429, 'Demasiados intentos fallidos. Esperá 15 minutos y probá de nuevo.');
}
const fallar = async (db: Db, req: Req, mensaje: string): Promise<never> => {
  await contar(db, claveDeFallos(req), BLOQUEO_MS);
  throw new ErrorHttp(401, mensaje);
};

/**
 * Entrada de la dueña: clave (cabecera x-admin-clave) y, si hay segundo paso, el código de la app (x-admin-codigo).
 * Devuelve la sesión. Los intentos fallidos se cuentan por origen y bloquean 15 minutos; un código ya usado no sirve otra vez.
 */
export async function iniciarSesion(req: Req, db: Db): Promise<{ token: string; expira: number }> {
  if (!process.env.ADMIN_PASSWORD) throw new ErrorHttp(503, 'El admin no está configurado');
  if (process.env.VERCEL && (process.env.ADMIN_PASSWORD.length < LARGO_MIN_CLAVE || CLAVES_DE_EJEMPLO.includes(process.env.ADMIN_PASSWORD))) {
    throw new ErrorHttp(503, `La contraseña del admin tiene que tener al menos ${LARGO_MIN_CLAVE} caracteres y no ser una de ejemplo`);
  }
  await bloqueado(db, req);
  await new Promise(r => setTimeout(r, 400)); // frena los intentos al azar
  const incorrecto = 'Contraseña o código incorrectos';
  if (!claveOk(req.headers['x-admin-clave'])) return fallar(db, req, incorrecto);
  if (dosPasos()) {
    const paso = pasoValido(process.env.ADMIN_TOTP_SECRET!, encabezado(req, 'x-admin-codigo')?.trim() ?? '');
    if (paso === null) return fallar(db, req, incorrecto);
    try {
      // atómico: solo avanza si este paso es más nuevo que el último usado (un código espiado no se puede repetir)
      await ajustes(db).updateOne({ _id: '2fa', $or: [{ ultimoPaso: { $lt: paso } }, { ultimoPaso: { $exists: false } }] }, { $set: { ultimoPaso: paso } }, { upsert: true });
    } catch (e) {
      if ((e as { code?: number }).code !== 11000) throw e;
      return fallar(db, req, incorrecto);
    }
  }
  return firmarSesion();
}

/** Corta a las demás: toda sesión emitida antes de ahora deja de valer (en todos los dispositivos). */
export async function cerrarTodasLasSesiones(db: Db, ahora = new Date()) {
  await ajustes(db).updateOne({ _id: 'sesion' }, { $set: { desde: ahora } }, { upsert: true });
}

/** ¿Trae una sesión vigente? (sin contar el fallo si no: lo usa el panel para saber si hay que pedir la clave). */
export async function haySesion(req: Req, db: Db): Promise<boolean> {
  const token = bearer(req);
  if (!token) return false;
  const desde = (await ajustes(db).findOne({ _id: 'sesion' }))?.desde;
  return sesionValida(token, desde);
}

/**
 * Pide ser la dueña: sesión vigente o, si no hay segundo paso, la clave en la cabecera (la usan los scripts).
 * Cada intento fallido suma al bloqueo del origen: no se puede adivinar la clave saltándose el login.
 */
export async function exigirAdmin(req: Req, db: Db): Promise<void> {
  await bloqueado(db, req);
  if (await haySesion(req, db)) return;
  if (!dosPasos() && esAdmin(req)) return;
  await fallar(db, req, 'Clave incorrecta');
}

export { DURACION_SESION_MS };
