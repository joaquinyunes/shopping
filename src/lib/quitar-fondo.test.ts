import { describe, expect, it } from 'vitest';
import { cajaDelContenido, colorDeFondo, quitarFondo, tieneBordeTransparente, type PixelesRgba } from './quitar-fondo';

function imagen(w: number, h: number, fondo: [number, number, number]): PixelesRgba {
  const data = new Uint8ClampedArray(w * h * 4);
  for (let i = 0; i < w * h; i++) data.set([...fondo, 255], i * 4);
  return { data, width: w, height: h };
}
function rect(img: PixelesRgba, x0: number, y0: number, w: number, h: number, c: [number, number, number]) {
  for (let y = y0; y < y0 + h; y++) for (let x = x0; x < x0 + w; x++) img.data.set([...c, 255], (y * img.width + x) * 4);
}
const alfa = (img: PixelesRgba, x: number, y: number) => img.data[(y * img.width + x) * 4 + 3];

describe('quitarFondo', () => {
  it('detecta el color de fondo por el borde', () => {
    expect(colorDeFondo(imagen(10, 10, [250, 248, 245]))).toEqual([250, 248, 245]);
  });

  it('deja transparente el fondo liso y opaco el objeto', () => {
    const img = imagen(30, 30, [255, 255, 255]);
    rect(img, 10, 10, 10, 10, [200, 40, 40]);
    quitarFondo(img);
    expect(alfa(img, 0, 0)).toBe(0);
    expect(alfa(img, 29, 29)).toBe(0);
    expect(alfa(img, 15, 15)).toBe(255);
  });

  it('no toca un hueco claro encerrado dentro del objeto', () => {
    const img = imagen(40, 40, [255, 255, 255]);
    rect(img, 8, 8, 24, 24, [60, 60, 60]);
    rect(img, 16, 16, 8, 8, [255, 255, 255]);
    quitarFondo(img);
    expect(alfa(img, 20, 20)).toBe(255);
    expect(alfa(img, 0, 0)).toBe(0);
  });

  it('sigue un degradé suave del fondo (sombra de estudio)', () => {
    const img = imagen(40, 20, [255, 255, 255]);
    for (let y = 0; y < 20; y++) for (let x = 0; x < 40; x++) img.data.set([255 - y * 2, 255 - y * 2, 255 - y * 2, 255], (y * 40 + x) * 4);
    rect(img, 15, 5, 10, 10, [30, 90, 200]);
    quitarFondo(img);
    expect(alfa(img, 0, 19)).toBe(0);
    expect(alfa(img, 20, 10)).toBe(255);
  });

  it('el borde del objeto queda semitransparente para no dejar halo', () => {
    const img = imagen(30, 30, [255, 255, 255]);
    rect(img, 10, 10, 10, 10, [200, 40, 40]);
    quitarFondo(img);
    expect(alfa(img, 10, 10)).toBeLessThan(255);
    expect(alfa(img, 10, 10)).toBeGreaterThan(0);
  });
});

describe('tieneBordeTransparente / cajaDelContenido', () => {
  it('una foto opaca no está recortada; una recortada sí', () => {
    const img = imagen(10, 10, [255, 255, 255]);
    expect(tieneBordeTransparente(img)).toBe(false);
    quitarFondo(img);
    expect(tieneBordeTransparente(img)).toBe(true);
  });

  it('la caja rodea exactamente el contenido visible', () => {
    const img = imagen(30, 30, [255, 255, 255]);
    rect(img, 10, 12, 8, 6, [10, 10, 10]);
    quitarFondo(img);
    // el borde semitransparente (alfa 150) cuenta como contenido
    expect(cajaDelContenido(img)).toEqual({ x: 10, y: 12, w: 8, h: 6 });
  });

  it('una imagen totalmente transparente no tiene caja', () => {
    const img = imagen(5, 5, [0, 0, 0]);
    for (let i = 0; i < 25; i++) img.data[i * 4 + 3] = 0;
    expect(cajaDelContenido(img)).toBeNull();
  });
});
