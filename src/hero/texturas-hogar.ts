import * as THREE from 'three';
import { mulberry32 } from './aleatorio';

function lienzo(w: number, h: number) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  return c;
}

function repetible(c: HTMLCanvasElement, repX: number, repY: number) {
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(repX, repY);
  t.anisotropy = 4;
  return t;
}

/** Tablones de madera con veta y juntas, dibujados por código (sin archivos de imagen). Los tablones corren a lo largo del eje v. */
export function texturaMadera(repX: number, repY: number) {
  const c = lienzo(512, 512), g = c.getContext('2d')!, rnd = mulberry32(11);
  const tablones = 16, ancho = c.width / tablones;
  for (let i = 0; i < tablones; i++) {
    const x0 = i * ancho, tono = 0.8 + rnd() * 0.4;
    g.fillStyle = `rgb(${(122 * tono) | 0},${(78 * tono) | 0},${(50 * tono) | 0})`;
    g.fillRect(x0, 0, ancho, c.height);
    for (let k = 0; k < 14; k++) {
      const x = x0 + rnd() * ancho;
      g.strokeStyle = `rgba(40,22,12,${0.08 + rnd() * 0.12})`;
      g.lineWidth = 0.6 + rnd() * 1.2;
      g.beginPath(); g.moveTo(x, 0);
      for (let y = 64; y <= c.height; y += 64) g.lineTo(x + Math.sin(y * 0.02 + k + i) * 2.5, y);
      g.stroke();
    }
    g.fillStyle = 'rgba(20,10,5,.55)';
    g.fillRect(x0, 0, 1.5, c.height);
    g.fillRect(x0, rnd() * c.height, ancho, 1.5);
  }
  return repetible(c, repX, repY);
}

/** Trama de lino: hilos finos cruzados sobre un beige cálido. */
export function texturaLino(repX: number, repY: number) {
  const c = lienzo(256, 256), g = c.getContext('2d')!, rnd = mulberry32(5);
  g.fillStyle = '#d9c8a9';
  g.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 2600; i++) {
    const claro = rnd() > 0.5, x = rnd() * 256, y = rnd() * 256, largo = 6 + rnd() * 22;
    g.strokeStyle = claro ? 'rgba(255,248,232,.16)' : 'rgba(110,84,52,.13)';
    g.lineWidth = 0.7;
    g.beginPath(); g.moveTo(x, y);
    if (rnd() > 0.5) g.lineTo(x + largo, y); else g.lineTo(x, y + largo);
    g.stroke();
  }
  return repetible(c, repX, repY);
}

/** Ventana con luz cálida de atardecer y travesaños. */
export function texturaVentana() {
  const c = lienzo(128, 256), g = c.getContext('2d')!;
  const grad = g.createLinearGradient(0, 0, 0, 256);
  grad.addColorStop(0, '#fff3d6'); grad.addColorStop(1, '#f3c98b');
  g.fillStyle = grad; g.fillRect(0, 0, 128, 256);
  g.fillStyle = 'rgba(59,38,25,.9)';
  g.fillRect(0, 0, 128, 7); g.fillRect(0, 249, 128, 7); g.fillRect(0, 0, 7, 256); g.fillRect(121, 0, 7, 256);
  g.fillRect(61, 0, 6, 256); g.fillRect(0, 124, 128, 6);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}
