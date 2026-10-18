import type { Producto } from '../tipos';

export interface Hito {
  id: string;
  categoria: string;
  titulo: string;
  texto: string;
  /** Momento del viaje (0..1) en que la cámara pasa por el producto. */
  t: number;
  /** Lado de la tarjeta en escritorio (1 = derecha, -1 = izquierda); el cartel de texto va del lado opuesto. */
  lado: 1 | -1;
  producto: Producto;
}

const TEXTOS: Record<string, string> = {
  Cocina: 'Cerámica, madera y vidrio para el día a día.',
  Deco: 'Pequeños detalles que hacen hogar.',
  Textiles: 'Lino, lana y algodón para abrigar.',
  'Baño': 'Toallas y accesorios que se sienten bien.',
};

export const MAX_HITOS = 7;
const momento = (i: number) => 0.14 + i * 0.11;

/**
 * Hasta MAX_HITOS productos disponibles y con foto, repartidos por categoría (uno de cada una, después la segunda ronda…),
 * así el recorrido muestra variedad. Se arma con el catálogo real: lo que la dueña edita en el admin es lo que se ve. Función pura.
 */
export function hitosDeTienda(productos: Producto[]): Hito[] {
  const porCategoria = new Map<string, Producto[]>();
  for (const p of productos) {
    if (p.agotado || !p.foto) continue;
    const lista = porCategoria.get(p.categoria) ?? [];
    lista.push(p);
    porCategoria.set(p.categoria, lista);
  }
  const colas = [...porCategoria.values()];
  const elegidos: Producto[] = [];
  for (let ronda = 0; elegidos.length < MAX_HITOS && colas.some(c => ronda < c.length); ronda++) {
    for (const cola of colas) if (ronda < cola.length && elegidos.length < MAX_HITOS) elegidos.push(cola[ronda]);
  }
  return elegidos.map((producto, i) => ({
    id: `hito-${i}`,
    categoria: producto.categoria,
    titulo: producto.nombre,
    texto: producto.descripcion || TEXTOS[producto.categoria] || `Mirá lo nuevo en ${producto.categoria}.`,
    t: momento(i),
    lado: i % 2 === 0 ? 1 : -1,
    producto,
  }));
}
