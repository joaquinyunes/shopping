import { cargarImagen } from './cargar-imagen';
import { cajaDelContenido, quitarFondo, tieneBordeTransparente } from './quitar-fondo';

export interface ImagenRecortada {
  src: string;
  /** ancho / alto del contenido recortado */
  aspecto: number;
  /** true si no se pudo leer la imagen (CORS): se usa la original y el fondo claro se funde con mix-blend-mode: multiply */
  multiply: boolean;
}

const LADO_MAX = 900;

/** Recorta el fondo claro y el espacio sobrante (flood fill desde los bordes) y devuelve una URL lista para <img>. */
export async function recortarImagen(url: string): Promise<ImagenRecortada> {
  const img = await cargarImagen(url);
  const k = Math.min(1, LADO_MAX / Math.max(img.naturalWidth, img.naturalHeight));
  const w = Math.max(1, Math.round(img.naturalWidth * k)), h = Math.max(1, Math.round(img.naturalHeight * k));
  const lienzo = document.createElement('canvas');
  lienzo.width = w; lienzo.height = h;
  const ctx = lienzo.getContext('2d', { willReadFrequently: true })!;
  ctx.drawImage(img, 0, 0, w, h);

  let px: ImageData;
  try {
    px = ctx.getImageData(0, 0, w, h);
  } catch {
    // Canvas "tainted" (la imagen no permite CORS): usamos la original tal cual y el fondo claro se funde con multiply.
    return { src: url, aspecto: img.naturalWidth / img.naturalHeight, multiply: true };
  }
  if (!tieneBordeTransparente(px)) {
    quitarFondo(px);
    ctx.putImageData(px, 0, 0);
  }
  const caja = cajaDelContenido(px);
  if (!caja) return { src: url, aspecto: w / h, multiply: true };

  const salida = document.createElement('canvas');
  salida.width = caja.w; salida.height = caja.h;
  salida.getContext('2d')!.drawImage(lienzo, caja.x, caja.y, caja.w, caja.h, 0, 0, caja.w, caja.h);
  const blob = await new Promise<Blob | null>(ok => salida.toBlob(ok, 'image/png'));
  return blob
    ? { src: URL.createObjectURL(blob), aspecto: caja.w / caja.h, multiply: false }
    : { src: url, aspecto: w / h, multiply: true };
}
