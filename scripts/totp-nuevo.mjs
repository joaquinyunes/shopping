// Genera el secreto del segundo paso del admin. Uso: node scripts/totp-nuevo.mjs [cuenta]
// Pegá el secreto en la variable ADMIN_TOTP_SECRET de Vercel y cargalo en tu app (Google Authenticator, Authy, 1Password: «ingresar clave manualmente»).
import { randomBytes } from 'node:crypto';

const ALFABETO = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
const bits = [...randomBytes(20)].map(b => b.toString(2).padStart(8, '0')).join('');
const secreto = bits.match(/.{5}/g).map(c => ALFABETO[parseInt(c, 2)]).join('');
const cuenta = process.argv[2] ?? 'admin';
console.log(`ADMIN_TOTP_SECRET=${secreto}`);
console.log(`otpauth://totp/${encodeURIComponent(`Casa Nido:${cuenta}`)}?secret=${secreto}&issuer=${encodeURIComponent('Casa Nido')}&digits=6&period=30`);
console.error('Guardalo ahora: no se vuelve a mostrar. No lo subas al repositorio.');
