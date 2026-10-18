/** Imagen en bruto (como un ImageData) para poder probar el recorte en Node sin canvas. */
export interface PixelesRgba {
  data: Uint8ClampedArray;
  width: number;
  height: number;
}

export interface Caja { x: number; y: number; w: number; h: number }

const idx = (img: PixelesRgba, x: number, y: number) => (y * img.width + x) * 4;

/** ¿La foto ya viene recortada (alguna esquina transparente)? Entonces no hay que tocarla. */
export function tieneBordeTransparente(img: PixelesRgba): boolean {
  const { width: w, height: h, data } = img;
  return [[0, 0], [w - 1, 0], [0, h - 1], [w - 1, h - 1]].some(([x, y]) => data[idx(img, x, y) + 3] < 250);
}

const mediana = (v: number[]) => v.sort((a, b) => a - b)[v.length >> 1];

/** Color típico del fondo: mediana de los píxeles del borde de la foto. */
export function colorDeFondo(img: PixelesRgba): [number, number, number] {
  const { width: w, height: h, data } = img;
  const r: number[] = [], g: number[] = [], b: number[] = [];
  const tomar = (x: number, y: number) => { const i = idx(img, x, y); r.push(data[i]); g.push(data[i + 1]); b.push(data[i + 2]); };
  for (let x = 0; x < w; x++) { tomar(x, 0); tomar(x, h - 1); }
  for (let y = 1; y < h - 1; y++) { tomar(0, y); tomar(w - 1, y); }
  return [mediana(r), mediana(g), mediana(b)];
}

/**
 * Quita el fondo liso por flood fill desde los bordes: un píxel entra si se parece al color de fondo y no hay
 * un salto brusco respecto de su vecino (así no se cuela por el borde del objeto). Muta el alfa y devuelve
 * cuántos píxeles quitó.
 * shortcut: solo funciona con fondos lisos o con degradés suaves; para fondos con textura, recortar a mano antes de subir.
 */
export function quitarFondo(img: PixelesRgba, { tolerancia = 34, salto = 9 } = {}): number {
  const { width: w, height: h, data } = img;
  const [fr, fg, fb] = colorDeFondo(img);
  const quitado = new Uint8Array(w * h);
  const cola: number[] = [];
  const cercaDelFondo = (i: number) =>
    Math.max(Math.abs(data[i] - fr), Math.abs(data[i + 1] - fg), Math.abs(data[i + 2] - fb)) <= tolerancia;
  const salto4 = (a: number, b: number) =>
    Math.max(Math.abs(data[a] - data[b]), Math.abs(data[a + 1] - data[b + 1]), Math.abs(data[a + 2] - data[b + 2])) <= salto;

  const sembrar = (x: number, y: number) => {
    const p = y * w + x;
    if (!quitado[p] && cercaDelFondo(p * 4)) { quitado[p] = 1; cola.push(p); }
  };
  for (let x = 0; x < w; x++) { sembrar(x, 0); sembrar(x, h - 1); }
  for (let y = 0; y < h; y++) { sembrar(0, y); sembrar(w - 1, y); }

  const avanzar = (desde: number, p: number) => {
    if (!quitado[p] && cercaDelFondo(p * 4) && salto4(desde * 4, p * 4)) { quitado[p] = 1; cola.push(p); }
  };
  while (cola.length) {
    const p = cola.pop()!, x = p % w, y = (p / w) | 0;
    if (x > 0) avanzar(p, p - 1);
    if (x < w - 1) avanzar(p, p + 1);
    if (y > 0) avanzar(p, p - w);
    if (y < h - 1) avanzar(p, p + w);
  }

  let n = 0;
  for (let p = 0; p < w * h; p++) {
    if (quitado[p]) { data[p * 4 + 3] = 0; n++; }
  }
  // Borde suave: los píxeles del objeto que tocan el fondo quitado quedan semitransparentes (come el halo claro).
  const borde: number[] = [];
  for (let p = 0; p < w * h; p++) {
    if (quitado[p]) continue;
    const x = p % w, y = (p / w) | 0;
    if ((x > 0 && quitado[p - 1]) || (x < w - 1 && quitado[p + 1]) || (y > 0 && quitado[p - w]) || (y < h - 1 && quitado[p + w])) borde.push(p);
  }
  for (const p of borde) data[p * 4 + 3] = 150;
  return n;
}

/** Rectángulo mínimo que contiene los píxeles visibles (alfa > umbral), o null si no queda nada. */
export function cajaDelContenido(img: PixelesRgba, umbral = 16): Caja | null {
  const { width: w, height: h, data } = img;
  let x0 = w, y0 = h, x1 = -1, y1 = -1;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (data[(y * w + x) * 4 + 3] > umbral) {
        if (x < x0) x0 = x;
        if (x > x1) x1 = x;
        if (y < y0) y0 = y;
        if (y > y1) y1 = y;
      }
    }
  }
  return x1 < 0 ? null : { x: x0, y: y0, w: x1 - x0 + 1, h: y1 - y0 + 1 };
}
