import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';

// TOTP (RFC 6238, HMAC-SHA1, 6 dígitos, 30 s): lo que leen Google Authenticator, Authy, 1Password, etc.

const ALFABETO = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
export const PASO_SEGUNDOS = 30;

export function base32Codificar(bytes: Uint8Array): string {
  let bits = '';
  for (const b of bytes) bits += b.toString(2).padStart(8, '0');
  return (bits.match(/.{1,5}/g) ?? []).map(c => ALFABETO[parseInt(c.padEnd(5, '0'), 2)]).join('');
}

export function base32Decodificar(texto: string): Buffer {
  const limpio = texto.replace(/[\s=]/g, '').toUpperCase();
  let bits = '';
  for (const c of limpio) {
    const i = ALFABETO.indexOf(c);
    if (i < 0) throw new Error('Secreto TOTP inválido: solo letras A-Z y números 2-7');
    bits += i.toString(2).padStart(5, '0');
  }
  return Buffer.from((bits.match(/.{8}/g) ?? []).map(b => parseInt(b, 2)));
}

/** Secreto nuevo de 160 bits en base32 (el largo que recomienda el RFC). */
export const generarSecreto = () => base32Codificar(randomBytes(20));

/** Número de paso de 30 s en el instante `ms`. */
export const pasoDe = (ms: number) => Math.floor(ms / 1000 / PASO_SEGUNDOS);

export function codigoDePaso(secreto: string, paso: number, digitos = 6): string {
  const contador = Buffer.alloc(8);
  contador.writeBigUInt64BE(BigInt(paso));
  const h = createHmac('sha1', base32Decodificar(secreto)).update(contador).digest();
  const o = h[h.length - 1] & 0xf;
  const n = ((h[o] & 0x7f) << 24) | (h[o + 1] << 16) | (h[o + 2] << 8) | h[o + 3];
  return String(n % 10 ** digitos).padStart(digitos, '0');
}

/** Paso en el que el código es válido (tolera ±1 paso por relojes desfasados) o `null`. Compara en tiempo constante. */
export function pasoValido(secreto: string, codigo: string, ms = Date.now(), tolerancia = 1): number | null {
  if (!/^\d{6}$/.test(codigo)) return null;
  const dado = Buffer.from(codigo);
  let acierto: number | null = null;
  for (let d = -tolerancia; d <= tolerancia; d++) {
    const paso = pasoDe(ms) + d;
    if (timingSafeEqual(Buffer.from(codigoDePaso(secreto, paso)), dado)) acierto = paso;
  }
  return acierto;
}

/** Dirección que se muestra como QR o se pega en la app del celular. */
export const uriOtpauth = (secreto: string, cuenta: string, emisor: string) =>
  `otpauth://totp/${encodeURIComponent(`${emisor}:${cuenta}`)}?secret=${secreto}&issuer=${encodeURIComponent(emisor)}&digits=6&period=${PASO_SEGUNDOS}`;
