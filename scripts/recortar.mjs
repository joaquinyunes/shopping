// Recorta el fondo claro de las fotos de producto (flood fill desde los bordes) y exporta WebP con alfa.
// Uso: node scripts/recortar.mjs   (lee _origen/*.jpg, escribe public/img/productos/*.webp)
import sharp from 'sharp';
import { mkdirSync, readdirSync } from 'node:fs';
import { join, basename } from 'node:path';

const ORIGEN = '_origen';
const SALIDA = 'public/img/productos';
const LADO = 640; // lado mayor del sticker final
const UMBRAL = 14; // distancia máxima al blanco para contar como fondo
// Objetos casi blancos: criterio estricto para no comerse sus zonas iluminadas.
const CLAROS = new Set(['taza', 'lampara', 'manta', 'platos', 'toallas']);
const AJUSTE = {
  // SAT_GRIS: un gris es "sin color" si max-min de canales es chico; GRIS_MIN: lo bastante claro para ser sombra de estudio;
  // SALTO: salto máximo de luminosidad entre vecinos (más que eso = borde del objeto)
  claro: { SAT_GRIS: 9, GRIS_MIN: 205, SALTO: 4 },
  oscuro: { SAT_GRIS: 12, GRIS_MIN: 190, SALTO: 6 },
  // Fotos con sombra cálida proyectada (rubros nuevos): tolera más color y más oscuridad en la sombra
  sombra: { SAT_GRIS: 34, GRIS_MIN: 165, SALTO: 5 },
};
const SOMBRA = new Set(['cubiertos', 'cortinas', 'organizador', 'bandeja', 'manijas', 'espejo']);
// Objetos del mismo color que el fondo (lino crema) o transparentes (vidrio): el flood fill los destruye.
// Se exportan como foto completa con esquinas redondeadas transparentes, así la tienda no intenta recortarlos de nuevo.
const FOTO_COMPLETA = new Set(['cortinas', 'copas']);
mkdirSync(SALIDA, { recursive: true });

async function fotoConEsquinas(origen, destino) {
  const base = await sharp(origen).removeAlpha().resize({ width: LADO, height: LADO, fit: 'inside' }).toBuffer({ resolveWithObject: true });
  const { width: w, height: h } = base.info;
  const radio = Math.round(Math.min(w, h) * 0.06);
  const mascara = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}"><rect width="${w}" height="${h}" rx="${radio}" fill="#fff"/></svg>`);
  await sharp(base.data).composite([{ input: mascara, blend: 'dest-in' }]).webp({ quality: 86, alphaQuality: 95 }).toFile(destino);
}

// Fondo = píxel conectado al borde cuya distancia al blanco es chica (sigue degradados suaves).
function mascaraFondo(rgb, w, h, { SAT_GRIS, GRIS_MIN, SALTO }) {
  const esFondo = new Uint8Array(w * h);
  const min = i => Math.min(rgb[i * 3], rgb[i * 3 + 1], rgb[i * 3 + 2]);
  const sat = i => Math.max(rgb[i * 3], rgb[i * 3 + 1], rgb[i * 3 + 2]) - min(i);
  const lum = i => (rgb[i * 3] + rgb[i * 3 + 1] + rgb[i * 3 + 2]) / 3;
  // "parece fondo": casi blanco, o gris claro sin color (las sombras suaves del estudio)
  const parece = i => 255 - min(i) <= UMBRAL || (sat(i) <= SAT_GRIS && min(i) >= GRIS_MIN);
  const cola = [];
  const siembra = i => { if (!esFondo[i] && parece(i)) { esFondo[i] = 1; cola.push(i); } };
  // Un vecino entra solo si parece fondo y no hay un salto marcado de luminosidad (un borde del objeto)
  const avanza = (desde, i) => { if (!esFondo[i] && parece(i) && Math.abs(lum(i) - lum(desde)) <= SALTO) { esFondo[i] = 1; cola.push(i); } };
  for (let x = 0; x < w; x++) { siembra(x); siembra((h - 1) * w + x); }
  for (let y = 0; y < h; y++) { siembra(y * w); siembra(y * w + w - 1); }
  while (cola.length) {
    const i = cola.pop(), x = i % w, y = (i / w) | 0;
    if (x > 0) avanza(i, i - 1);
    if (x < w - 1) avanza(i, i + 1);
    if (y > 0) avanza(i, i - w);
    if (y < h - 1) avanza(i, i + w);
  }
  return esFondo;
}

// Suaviza el borde: blur + contraste, siempre devolviendo 1 canal por píxel.
async function suavizar(alfa, w, h) {
  const { data, info } = await sharp(alfa, { raw: { width: w, height: h, channels: 1 } })
    .blur(1.2).linear(1.8, -110).toColourspace('b-w').raw().toBuffer({ resolveWithObject: true });
  const paso = info.channels;
  const salida = Buffer.alloc(w * h);
  for (let i = 0; i < w * h; i++) salida[i] = data[i * paso];
  return salida;
}

for (const archivo of readdirSync(ORIGEN).filter(f => f.endsWith('.jpg'))) {
  const id = basename(archivo, '.jpg');
  if (FOTO_COMPLETA.has(id)) { await fotoConEsquinas(join(ORIGEN, archivo), join(SALIDA, `${id}.webp`)); console.log('ok', id, 'foto completa'); continue; }
  const { data, info } = await sharp(join(ORIGEN, archivo)).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width: w, height: h } = info;
  const fondo = mascaraFondo(data, w, h, SOMBRA.has(id) ? AJUSTE.sombra : CLAROS.has(id) ? AJUSTE.claro : AJUSTE.oscuro);

  const duro = Buffer.alloc(w * h);
  for (let i = 0; i < w * h; i++) duro[i] = fondo[i] ? 0 : 255;
  const alfa = await suavizar(duro, w, h);

  // Recuadro del objeto, a partir del alfa
  let x0 = w, y0 = h, x1 = 0, y1 = 0;
  const rgba = Buffer.alloc(w * h * 4);
  for (let i = 0; i < w * h; i++) {
    rgba[i * 4] = data[i * 3]; rgba[i * 4 + 1] = data[i * 3 + 1]; rgba[i * 4 + 2] = data[i * 3 + 2]; rgba[i * 4 + 3] = alfa[i];
    if (alfa[i] > 16) {
      const x = i % w, y = (i / w) | 0;
      if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y;
    }
  }
  const margen = 4;
  x0 = Math.max(0, x0 - margen); y0 = Math.max(0, y0 - margen); x1 = Math.min(w - 1, x1 + margen); y1 = Math.min(h - 1, y1 + margen);

  await sharp(rgba, { raw: { width: w, height: h, channels: 4 } })
    .extract({ left: x0, top: y0, width: x1 - x0 + 1, height: y1 - y0 + 1 })
    .resize({ width: LADO, height: LADO, fit: 'inside' })
    .webp({ quality: 86, alphaQuality: 95 })
    .toFile(join(SALIDA, `${id}.webp`));
  const ocupado = (100 * alfa.filter(v => v > 128).length / (w * h)).toFixed(0);
  console.log('ok', id, `${x1 - x0 + 1}x${y1 - y0 + 1}`, `objeto=${ocupado}% de la foto`);
}
