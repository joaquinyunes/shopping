// Sirve dist/ con compresión gzip y caché larga en /assets, parecido a Vercel: para medir (Lighthouse) sin el sesgo de `vite preview`, que no comprime.
// Uso: node scripts/servir-dist.mjs [puerto]
import { createServer } from 'node:http';
import { createReadStream, existsSync, statSync } from 'node:fs';
import { extname, join, normalize } from 'node:path';
import { createGzip } from 'node:zlib';

const RAIZ = join(process.cwd(), 'dist');
const TIPOS = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.webp': 'image/webp', '.jpg': 'image/jpeg', '.png': 'image/png', '.json': 'application/json', '.txt': 'text/plain' };
const COMPRIMIBLES = new Set(['.html', '.js', '.css', '.json', '.txt']);

createServer((req, res) => {
  const ruta = normalize(decodeURIComponent(new URL(req.url, 'http://x').pathname)).replace(/^([/\\])+/, '');
  let archivo = join(RAIZ, ruta);
  if (!archivo.startsWith(RAIZ)) { res.statusCode = 403; return res.end(); }
  if (!existsSync(archivo) || statSync(archivo).isDirectory()) archivo = existsSync(join(archivo, 'index.html')) ? join(archivo, 'index.html') : join(RAIZ, 'index.html');
  const ext = extname(archivo);
  res.setHeader('Content-Type', TIPOS[ext] ?? 'application/octet-stream');
  res.setHeader('Cache-Control', ruta.startsWith('assets/') ? 'public, max-age=31536000, immutable' : 'public, max-age=0, must-revalidate');
  const salida = createReadStream(archivo);
  if (COMPRIMIBLES.has(ext) && /gzip/.test(req.headers['accept-encoding'] ?? '')) { res.setHeader('Content-Encoding', 'gzip'); salida.pipe(createGzip()).pipe(res); } else salida.pipe(res);
}).listen(Number(process.argv[2]) || 4174, () => console.log(`dist/ en http://localhost:${process.argv[2] || 4174}`));
