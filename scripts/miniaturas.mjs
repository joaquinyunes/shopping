// Genera public/img/productos/<id>-400.webp (400 px de lado mayor) a partir de las fotos de 640 px: las tarjetas piden la chica en celulares.
// Uso: node scripts/miniaturas.mjs   (después de `npm run recortar`)
import sharp from 'sharp';
import { readdirSync } from 'node:fs';
import { join } from 'node:path';

const DIR = 'public/img/productos';
for (const f of readdirSync(DIR).filter(n => /^[a-z0-9-]+\.webp$/.test(n) && !n.endsWith('-400.webp'))) {
  const salida = join(DIR, f.replace('.webp', '-400.webp'));
  await sharp(join(DIR, f)).resize({ width: 400, height: 400, fit: 'inside' }).webp({ quality: 80 }).toFile(salida);
  console.log(salida);
}
