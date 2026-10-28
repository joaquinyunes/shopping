import type { Producto } from '../tipos';

/** Columnas de la planilla de carga masiva de Tiendanube (ayuda.tiendanube.com › "Cómo completar el Excel de carga masiva"). Los nombres exactos salen de esa guía, no de una plantilla descargada. */
const COLUMNAS = [
  'Identificador de URL', 'Nombre', 'Categorías',
  'Nombre de propiedad 1', 'Valor de propiedad 1', 'Nombre de propiedad 2', 'Valor de propiedad 2', 'Nombre de propiedad 3', 'Valor de propiedad 3',
  'Precio', 'Precio promocional', 'Peso', 'Alto', 'Ancho', 'Profundidad', 'Stock', 'SKU', 'Código de barras',
  'Mostrar en tienda', 'Envío sin cargo', 'Descripción', 'Tags', 'Título para SEO', 'Descripción para SEO', 'Marca', 'Producto físico', 'MPN', 'Sexo', 'Rango de edad', 'Costo',
] as const;

const MAX_PRODUCTOS = 500; // mismo tope que datosValidos en el servidor

/** CSV (RFC 4180): comillas, comas y saltos de línea dentro de una celda; ignora el BOM. */
export function leerCsv(texto: string): string[][] {
  const filas: string[][] = [];
  let fila: string[] = [], celda = '', entre = false;
  const s = texto.charCodeAt(0) === 0xfeff ? texto.slice(1) : texto; // BOM de Excel
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (entre) {
      if (c === '"' && s[i + 1] === '"') { celda += '"'; i++; } else if (c === '"') entre = false; else celda += c;
    } else if (c === '"') entre = true;
    else if (c === ',') { fila.push(celda); celda = ''; } else if (c === '\n' || c === '\r') {
      if (c === '\r' && s[i + 1] === '\n') i++;
      fila.push(celda); filas.push(fila); fila = []; celda = '';
    } else celda += c;
  }
  if (celda !== '' || fila.length) { fila.push(celda); filas.push(fila); }
  return filas;
}

const celdaCsv = (v: string) => (/[",\r\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v);

const sinTildes = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '');
const slug = (s: string) => sinTildes(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
const HANDLE = /^[a-z0-9][a-z0-9-]*$/;

export function exportarCsv(productos: Producto[]): string {
  const filas = productos.map(p => {
    const v: Record<string, string> = {
      'Identificador de URL': HANDLE.test(p.id) ? p.id : slug(p.nombre) || slug(p.id),
      'Nombre': p.nombre,
      'Categorías': p.categoria,
      'Precio': String(p.precio),
      'Peso': p.pesoGr ? String(p.pesoGr / 1000) : '',
      'Stock': p.stock !== undefined ? String(p.stock) : p.agotado ? '0' : '', // vacío = ilimitado, como en Tiendanube
      'SKU': p.sku ?? '',
      'Mostrar en tienda': 'SI',
      'Descripción': p.descripcion ?? '',
    };
    return COLUMNAS.map(c => celdaCsv(v[c] ?? '')).join(',');
  });
  return [COLUMNAS.join(','), ...filas].join('\n') + '\n';
}

export interface ResultadoImportacion {
  productos: Producto[];
  errores: string[];
  avisos: string[];
}

const clave = (s: string) => sinTildes(s).toLowerCase().trim();
const NUMERO = /^\d+(\.\d+)?$/;

/**
 * Mezcla la planilla con el catálogo actual. Lo que ya existe (mismo Identificador de URL) se actualiza celda por celda,
 * conservando foto y medidas; una celda vacía no cambia nada, como en Tiendanube. Las filas con error se saltean enteras.
 * Variantes (varias filas por producto) no existen en este catálogo: se importa solo la primera fila de cada producto.
 */
export function importarCsv(texto: string, actuales: Producto[]): ResultadoImportacion {
  const errores: string[] = [], avisos: string[] = [];
  const filas = leerCsv(texto);
  const cabeza = (filas[0] ?? []).map(clave);
  const col = (n: string) => cabeza.indexOf(n);
  const iHandle = col('identificador de url');
  if (iHandle < 0) return { productos: actuales, errores: ['Falta la columna "Identificador de URL": usá la planilla que descarga Tiendanube o la de este panel.'], avisos };

  const idx = { nombre: col('nombre'), cat: col('categorias'), precio: col('precio'), peso: col('peso'), stock: col('stock'), sku: col('sku'), mostrar: col('mostrar en tienda'), desc: col('descripcion') };
  const productos = actuales.map(p => ({ ...p }));
  const vistos = new Set<string>();
  let variantes = 0, ocultos = 0;

  filas.slice(1).forEach((f, n) => {
    if (f.every(c => !c.trim())) return;
    const fila = n + 2;
    const cel = (i: number) => (i < 0 ? '' : (f[i] ?? '').trim());
    const id = cel(iHandle);
    if (!id) { errores.push(`Fila ${fila}: falta el Identificador de URL.`); return; }
    if (!HANDLE.test(id) || id.length > 80) { errores.push(`Fila ${fila}: el Identificador de URL "${id}" solo puede tener minúsculas, números y guiones.`); return; }
    if (vistos.has(id)) { variantes++; return; }

    const actual = productos.find(p => p.id === id);
    const nombre = cel(idx.nombre).slice(0, 80);
    if (!actual && !nombre) { errores.push(`Fila ${fila}: "${id}" es nuevo y no tiene Nombre.`); return; }

    const crudoPrecio = cel(idx.precio);
    if (crudoPrecio && !NUMERO.test(crudoPrecio)) { errores.push(`Fila ${fila}: Precio inválido "${crudoPrecio}" (número con punto decimal, sin $).`); return; }
    if (!actual && !crudoPrecio) { errores.push(`Fila ${fila}: "${id}" es nuevo y no tiene Precio.`); return; }

    const crudoStock = cel(idx.stock);
    if (crudoStock && crudoStock !== '-' && !/^\d+$/.test(crudoStock)) { errores.push(`Fila ${fila}: Stock inválido "${crudoStock}" (entero, vacío o "-").`); return; }
    const crudoPeso = cel(idx.peso);
    if (crudoPeso && !NUMERO.test(crudoPeso)) { errores.push(`Fila ${fila}: Peso inválido "${crudoPeso}" (kilos con punto decimal).`); return; }

    vistos.add(id);
    if (clave(cel(idx.mostrar)) === 'no') ocultos++;

    const p: Producto = actual ?? { id, nombre, categoria: 'Otros', precio: 0, foto: '' };
    if (nombre) p.nombre = nombre;
    if (cel(idx.cat)) p.categoria = cel(idx.cat).slice(0, 30);
    if (crudoPrecio) p.precio = Number(crudoPrecio);
    if (crudoPeso && Number(crudoPeso) > 0) p.pesoGr = Math.round(Number(crudoPeso) * 1000);
    if (cel(idx.sku)) p.sku = cel(idx.sku).slice(0, 40);
    if (cel(idx.desc)) p.descripcion = cel(idx.desc).slice(0, 160);
    if (crudoStock === '-') { delete p.stock; delete p.agotado; } else if (crudoStock) {
      p.stock = Number(crudoStock);
      if (p.stock === 0) p.agotado = true; else delete p.agotado;
    }
    if (!actual) productos.push(p);
  });

  if (variantes) avisos.push(`${variantes} ${variantes === 1 ? 'fila de variante ignorada' : 'filas de variantes ignoradas'}: este panel todavía no maneja variantes, se importó la primera fila de cada producto.`);
  if (ocultos) avisos.push(`${ocultos} ${ocultos === 1 ? 'producto oculto' : 'productos ocultos'} en Tiendanube (Mostrar en tienda = NO) se importaron visibles: este panel todavía no oculta productos.`);
  if (productos.length > MAX_PRODUCTOS) return { productos: actuales, errores: [...errores, `El catálogo no puede pasar de ${MAX_PRODUCTOS} productos; no se importó nada.`], avisos };
  return { productos, errores, avisos };
}
