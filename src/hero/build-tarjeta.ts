import * as THREE from 'three';
import { cargarImagen } from '../lib/cargar-imagen';
import { formatoPrecio } from '../lib/pedido';
import { cajaDelContenido, quitarFondo, tieneBordeTransparente } from '../lib/quitar-fondo';
import type { Producto } from '../tipos';
import { hexCss, PALETA } from './paleta';

const W = 640, H = 860; // píxeles del lienzo de la tarjeta (relación 3:4 aprox.)
const LADO_MAX = 512; // lado mayor de la foto dentro de la tarjeta

function lienzo(w: number, h: number) {
  const c = document.createElement('canvas');
  c.width = Math.max(1, Math.round(w));
  c.height = Math.max(1, Math.round(h));
  return c;
}

/** Foto del producto sin fondo y recortada al contenido. Si ya viene con alfa (nuestras fotos), no se toca. */
function productoRecortado(img: HTMLImageElement): HTMLCanvasElement {
  const k = Math.min(1, LADO_MAX / Math.max(img.naturalWidth, img.naturalHeight));
  const c = lienzo(img.naturalWidth * k, img.naturalHeight * k);
  const ctx = c.getContext('2d', { willReadFrequently: true })!;
  ctx.drawImage(img, 0, 0, c.width, c.height);
  const px = ctx.getImageData(0, 0, c.width, c.height);
  if (!tieneBordeTransparente(px)) {
    quitarFondo(px);
    ctx.putImageData(px, 0, 0);
  }
  const caja = cajaDelContenido(px);
  if (!caja) throw new Error('La imagen quedó vacía al recortar el fondo');
  const salida = lienzo(caja.w, caja.h);
  salida.getContext('2d')!.drawImage(c, caja.x, caja.y, caja.w, caja.h, 0, 0, caja.w, caja.h);
  return salida;
}

/** Recorta el nombre en hasta dos renglones que entren en `ancho`. */
function renglones(ctx: CanvasRenderingContext2D, texto: string, ancho: number): string[] {
  const palabras = texto.split(' '), salida: string[] = [];
  let actual = '';
  for (const p of palabras) {
    const prueba = actual ? `${actual} ${p}` : p;
    if (ctx.measureText(prueba).width > ancho && actual) { salida.push(actual); actual = p; } else actual = prueba;
  }
  salida.push(actual);
  return salida.slice(0, 2);
}

function dibujarTarjeta(producto: Producto, foto: HTMLCanvasElement): HTMLCanvasElement {
  const c = lienzo(W, H), g = c.getContext('2d')!;
  // Papel con esquinas redondeadas y un marco fino ámbar
  g.beginPath(); g.roundRect(6, 6, W - 12, H - 12, 46);
  g.fillStyle = hexCss(PALETA.papel); g.fill();
  g.lineWidth = 5; g.strokeStyle = hexCss(PALETA.ambar); g.stroke();

  // Ventana en arco donde vive la foto
  const ax = 44, ay = 44, aw = W - 88, ah = 520;
  g.beginPath();
  g.moveTo(ax, ay + ah); g.lineTo(ax, ay + aw / 2); g.arc(ax + aw / 2, ay + aw / 2, aw / 2, Math.PI, 0); g.lineTo(ax + aw, ay + ah); g.closePath();
  const fondo = g.createLinearGradient(0, ay, 0, ay + ah);
  fondo.addColorStop(0, '#fbe7c6'); fondo.addColorStop(1, '#efd2a6');
  g.fillStyle = fondo; g.fill();

  const k = Math.min((aw - 90) / foto.width, (ah - 110) / foto.height);
  const fw = foto.width * k, fh = foto.height * k, fx = ax + (aw - fw) / 2, fy = ay + ah - fh - 36;
  g.fillStyle = 'rgba(59,38,25,.2)'; // sombra suave de apoyo
  g.beginPath(); g.ellipse(ax + aw / 2, fy + fh + 6, fw * 0.4, 12, 0, 0, Math.PI * 2); g.fill();
  g.drawImage(foto, fx, fy, fw, fh);

  // Texto: categoría, nombre y precio
  g.textBaseline = 'alphabetic';
  g.fillStyle = hexCss(PALETA.terracota); g.font = '800 26px Inter, system-ui, sans-serif';
  g.fillText(producto.categoria.toUpperCase(), 52, 618);
  g.fillStyle = hexCss(PALETA.tinta); g.font = '700 46px Fraunces, Georgia, serif';
  renglones(g, producto.nombre, W - 104).forEach((r, i) => g.fillText(r, 52, 676 + i * 52));
  const precio = formatoPrecio(producto.precio);
  g.font = '800 40px Inter, system-ui, sans-serif';
  const pw = g.measureText(precio).width + 56;
  g.beginPath(); g.roundRect(52, 758, pw, 66, 33); g.fillStyle = hexCss(PALETA.terracota); g.fill();
  g.fillStyle = '#fff'; g.fillText(precio, 80, 805);
  g.fillStyle = 'rgba(111,98,90,.9)'; g.font = '600 20px Inter, system-ui, sans-serif';
  g.fillText('Imagen ilustrativa', W - 52 - g.measureText('Imagen ilustrativa').width, 805);
  return c;
}

/** Halo cálido detrás de la tarjeta, para separarla del fondo sin contornos duros. */
function texturaHalo() {
  const c = lienzo(128, 128), g = c.getContext('2d')!;
  const rad = g.createRadialGradient(64, 64, 6, 64, 64, 64);
  rad.addColorStop(0, 'rgba(243,201,139,.55)'); rad.addColorStop(1, 'rgba(243,201,139,0)');
  g.fillStyle = rad; g.fillRect(0, 0, 128, 128);
  return new THREE.CanvasTexture(c);
}

/** Tarjeta de producto (foto, nombre y precio) como plano 3D de ancho 1. Devuelve null si la foto no carga: una tarjeta rota no rompe la escena. */
export async function construirTarjeta(producto: Producto): Promise<THREE.Mesh | null> {
  try {
    const foto = productoRecortado(await cargarImagen(producto.foto));
    await Promise.all([document.fonts.load('700 46px Fraunces'), document.fonts.load('800 40px Inter')]).catch(() => undefined);
    const textura = new THREE.CanvasTexture(dibujarTarjeta(producto, foto));
    textura.colorSpace = THREE.SRGBColorSpace;
    textura.anisotropy = 4;
    const malla = new THREE.Mesh(
      new THREE.PlaneGeometry(1, H / W),
      new THREE.MeshBasicMaterial({ map: textura, transparent: true, depthWrite: false, fog: false }),
    );
    const halo = new THREE.Mesh(
      new THREE.PlaneGeometry(1.9, 1.9 * H / W),
      new THREE.MeshBasicMaterial({ map: texturaHalo(), transparent: true, depthWrite: false, fog: false, blending: THREE.AdditiveBlending }),
    );
    halo.position.z = -0.02;
    malla.add(halo);
    return malla;
  } catch (error) {
    console.warn(`Tarjeta omitida (${producto.id})`, error);
    return null;
  }
}
