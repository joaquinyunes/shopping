import type { Producto, TipoMedida } from '../tipos';

export interface Medida {
  cm: number;
  tipo: TipoMedida;
  /** true = la estimó el sistema por el nombre; la UI la muestra como "aprox." */
  estimada: boolean;
}

// Palabras clave del nombre → medida principal típica. Se usa solo si la dueña no cargó la medida real.
const TABLA: Array<[RegExp, number, TipoMedida]> = [
  [/\b(plato|platos|bandeja|fuente)\b/, 26, 'diametro'],
  [/\b(canasto|cesto|cesta)\b/, 32, 'diametro'],
  [/\b(maceta|macetero)\b/, 18, 'diametro'],
  [/\b(taza|mug|pocillo)\b/, 9, 'alto'],
  [/\b(vaso|copa)\b/, 12, 'alto'],
  [/\b(florero|jarron)\b/, 30, 'alto'],
  [/\b(vela|velas)\b/, 10, 'alto'],
  [/\b(frasco|pote|tarro)\b/, 18, 'alto'],
  [/\b(cafetera|tetera|jarra)\b/, 22, 'alto'],
  [/\b(lampara|velador)\b/, 40, 'alto'],
  [/\b(almohadon|almohada|cojin)\b/, 45, 'ancho'],
  [/\b(toalla|toallas|toallon)\b/, 30, 'ancho'],
  [/\b(manta|frazada|plaid|cubrecama)\b/, 60, 'largo'],
  [/\b(tabla|tablas)\b/, 40, 'largo'],
  [/\b(cuchara|tenedor|cuchillo|espatula)\b/, 25, 'largo'],
];

const sinAcentos = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

export function medidaDelProducto(p: Pick<Producto, 'nombre' | 'tamanoCm' | 'tipoMedida'>): Medida {
  if (p.tamanoCm && p.tamanoCm > 0) return { cm: p.tamanoCm, tipo: p.tipoMedida ?? tipoPorNombre(p.nombre), estimada: false };
  const nombre = sinAcentos(p.nombre);
  const hallada = TABLA.find(([re]) => re.test(nombre));
  return hallada ? { cm: hallada[1], tipo: hallada[2], estimada: true } : { cm: 20, tipo: 'alto', estimada: true };
}

function tipoPorNombre(nombre: string): TipoMedida {
  const n = sinAcentos(nombre);
  return TABLA.find(([re]) => re.test(n))?.[2] ?? 'alto';
}

export const etiquetaMedida = (m: Medida) =>
  `${m.tipo === 'diametro' ? 'Ø ' : ''}${String(m.cm).replace('.', ',')} cm${m.tipo === 'diametro' ? '' : ` de ${m.tipo}`}${m.estimada ? ' (aprox.)' : ''}`;
