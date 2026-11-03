// Busca formas de claves reales en TODO el historial de git (todas las ramas, todos los commits), no solo en lo que hay hoy.
// Imprime commit, tipo y cantidad: nunca el valor. Sale con código 1 si encuentra algo: hay que rotar la clave, no solo borrarla.
// Uso: node scripts/escanear-secretos.mjs            (en CI hay que clonar con fetch-depth: 0)
import { spawn } from 'node:child_process';

export const PATRONES = [
  ['clave privada', /-----BEGIN (RSA |EC |OPENSSH |DSA |PGP )?PRIVATE KEY-----/],
  ['AWS AKIA', /AKIA[0-9A-Z]{16}/],
  ['token de GitHub', /gh[pousr]_[A-Za-z0-9]{36,}|github_pat_[A-Za-z0-9_]{30,}/],
  ['Stripe sk_live', /sk_live_[A-Za-z0-9]{10,}/],
  ['Mercado Pago APP_USR', /APP_USR-[0-9A-Za-z-]{30,}/],
  ['JWT eyJ', /eyJ[A-Za-z0-9_-]{15,}\.eyJ[A-Za-z0-9_-]{15,}\.[A-Za-z0-9_-]{15,}/],
  ['Supabase sb_secret', /sb_secret_[A-Za-z0-9_-]{20,}/],
  ['Google AIza', /AIza[0-9A-Za-z_-]{35}/],
  ['Slack', /xox[abprs]-[0-9A-Za-z-]{10,}/],
  ['Resend re_', /\bre_[A-Za-z0-9]{20,}\b/],
  ['URL de base con clave', /(mongodb(\+srv)?|postgres(ql)?):\/\/[^:/@\s"'<$]+:(?!(password|clave|contrase|xxx|tu_|your))[^@\s"'<${]{6,}@[A-Za-z0-9.-]+\.(mongodb\.net|neon\.tech|supabase\.(co|com)|render\.com|rds\.amazonaws\.com)/i],
];

/** Tipos de secreto que aparecen en una línea (sin devolver el valor). */
export const tiposEn = linea => PATRONES.filter(([, re]) => re.test(linea)).map(([nombre]) => nombre);

async function escanear() {
  const git = spawn('git', ['log', '-p', '--all', '--no-color', '--format=commit %H'], { stdio: ['ignore', 'pipe', 'inherit'] });
  let resto = '', commit = '', archivo = '', lineas = 0;
  const hallazgos = new Map();
  const revisar = l => {
    lineas++;
    if (l.startsWith('commit ')) { commit = l.slice(7, 15); return; }
    if (l.startsWith('+++ ')) { archivo = l.slice(6); return; }
    if (!l.startsWith('+') || /package-lock\.json$|composer\.lock$/.test(archivo)) return; // solo lo agregado
    for (const tipo of tiposEn(l)) {
      const clave = `${commit} ${archivo} [${tipo}]`;
      hallazgos.set(clave, (hallazgos.get(clave) ?? 0) + 1);
    }
  };
  for await (const trozo of git.stdout) {
    const partes = (resto + trozo.toString('utf8')).split('\n');
    resto = partes.pop() ?? '';
    partes.forEach(revisar);
  }
  if (resto) revisar(resto);
  return { hallazgos, lineas };
}

if (import.meta.url === `file://${process.argv[1].replace(/\\/g, '/')}` || process.argv[1]?.endsWith('escanear-secretos.mjs')) {
  const { hallazgos, lineas } = await escanear();
  for (const [clave, n] of hallazgos) console.log(`${clave} x${n}`);
  console.log(`${lineas} líneas de historial revisadas, ${hallazgos.size} hallazgo(s).`);
  process.exit(hallazgos.size ? 1 : 0);
}
