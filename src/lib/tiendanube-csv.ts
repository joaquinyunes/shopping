import { normalizarProducto } from '../data/producto';
import type { Producto } from '../tipos';
import { idVariante } from './catalogo';

/** Columnas de la planilla de carga masiva de Tiendanube (ayuda.tiendanube.com › "Cómo completar el Excel de carga masiva"). Los nombres exactos salen de esa guía, no de una plantilla descargada. */
const COLUMNAS = [
  'Identificador de URL', 'Nombre', 'Categorías',
  'Nombre de propiedad 1', 'Valor de propiedad 1', 'Nombre de propiedad 2', 'Valor de propiedad 2', 'Nombre de propiedad 3', 'Valor de propiedad 3',
  'Precio', 'Precio promocional', 'Peso', 'Alto', 'Ancho', 'Profundidad', 'Stock', 'SKU', 'Código de barras',
  'Mostrar en tienda', 'Envío sin cargo', 'Descripción', 'Tags', 'Título para SEO', 'Descripción para SEO', 'Marca', 'Producto físico', 'MPN', 'Sexo', 'Rango de edad', 'Costo',
] as const;

const MAX_PRODUCTOS = 500; // mismo tope que datosValidos en el servidor

/** Excel en español guarda el CSV con «;» y Tiendanube con «,»: se usa el que más aparece en la primera línea (fuera de comillas no importa: es solo la cabecera). */
const separadorDe = (s: string) => { const l = s.split(/\r?\n/, 1)[0]; return l.split(';').length > l.split(',').length ? ';' : ','; };

/** CSV (RFC 4180): comillas, separador `,` o `;` y saltos de línea dentro de una celda; ignora el BOM. */
export function leerCsv(texto: string): string[][] {
  const filas: string[][] = [];
  let fila: string[] = [], celda = '', entre = false;
  const s = texto.charCodeAt(0) === 0xfeff ? texto.slice(1) : texto; // BOM de Excel
  const sep = separadorDe(s);
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (entre) {
      if (c === '"' && s[i + 1] === '"') { celda += '"'; i++; } else if (c === '"') entre = false; else celda += c;
    } else if (c === '"') entre = true;
    else if (c === sep) { fila.push(celda); celda = ''; } else if (c === '\n' || c === '\r') {
      if (c === '\r' && s[i + 1] === '\n') i++;
      fila.push(celda); filas.push(fila); fila = []; celda = '';
    } else celda += c;
  }
  if (celda !== '' || fila.length) { fila.push(celda); filas.push(fila); }
  return filas;
}

const celdaCsv = (v: string) => (/[",\r\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v);

const sinTildes = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '');
const HANDLE = /^[a-z0-9][a-z0-9-]*$/;
const slugCsv = (s: string) => sinTildes(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

type Fila = Record<string, string>;
const filaCsv = (v: Fila) => COLUMNAS.map(c => celdaCsv(v[c] ?? '')).join(',');

/**
 * Una fila por producto; con variantes, una por variante: la primera lleva los datos del producto y las demás repiten
 * el identificador con sus propiedades, precio, stock y SKU (así lo arma Tiendanube).
 */
export function exportarCsv(productos: Producto[]): string {
  const filas = productos.flatMap(p => {
    const handle = HANDLE.test(p.id) ? p.id : slugCsv(p.nombre) || slugCsv(p.id);
    const comun: Fila = {
      'Identificador de URL': handle,
      'Nombre': p.nombre,
      'Categorías': p.categoria,
      'Peso': p.pesoGr ? String(p.pesoGr / 1000) : '',
      'Mostrar en tienda': p.oculto ? 'NO' : 'SI',
      'Descripción': p.descripcion ?? '',
    };
    if (!p.variantes?.length) {
      return [{
        ...comun, 'Precio': String(p.precio), 'Precio promocional': p.precioPromo !== undefined ? String(p.precioPromo) : '',
        'Stock': p.stock !== undefined ? String(p.stock) : p.agotado ? '0' : '', // vacío = ilimitado, como en Tiendanube
        'SKU': p.sku ?? '',
      }];
    }
    return p.variantes.map((v, i): Fila => {
      const propiedades: Fila = {};
      (p.propiedades ?? []).forEach((nombre, k) => { propiedades[`Nombre de propiedad ${k + 1}`] = nombre; propiedades[`Valor de propiedad ${k + 1}`] = v.valores[k] ?? ''; });
      return {
        ...(i === 0 ? comun : { 'Identificador de URL': handle }), ...propiedades,
        'Precio': String(v.precio ?? p.precio),
        'Precio promocional': i === 0 && p.precioPromo !== undefined ? String(p.precioPromo) : '',
        'Stock': v.stock !== undefined ? String(v.stock) : '',
        'SKU': v.sku ?? p.sku ?? '',
      };
    });
  });
  return [COLUMNAS.join(','), ...filas.map(filaCsv)].join('\n') + '\n';
}

export interface ResultadoImportacion {
  productos: Producto[];
  errores: string[];
  avisos: string[];
}

const clave = (s: string) => sinTildes(s).toLowerCase().trim();
const NUMERO = /^\d+(\.\d+)?$/;
/** Excel en español escribe 8500,50: se lee como 8500.50. (Con miles, «8.500», no se adivina: se avisa del error.) */
const decimal = (v: string) => (/^\d+,\d+$/.test(v) ? v.replace(',', '.') : v);

interface VarianteCsv { valores: string[]; precio?: number; stock?: number | null; sku?: string }

/**
 * Mezcla la planilla con el catálogo actual. Lo que ya existe (mismo Identificador de URL) se actualiza celda por celda,
 * conservando foto y medidas; una celda vacía no cambia nada, como en Tiendanube. Las filas con error se saltean enteras.
 * Las filas que repiten el identificador son variantes del mismo producto (hasta 3 propiedades); `Mostrar en tienda` = NO oculta el producto.
 */
export function importarCsv(texto: string, actuales: Producto[]): ResultadoImportacion {
  const errores: string[] = [], avisos: string[] = [];
  const filas = leerCsv(texto);
  const cabeza = (filas[0] ?? []).map(clave);
  const col = (n: string) => cabeza.indexOf(n);
  const iHandle = col('identificador de url');
  if (iHandle < 0) return { productos: actuales, errores: ['Falta la columna "Identificador de URL": usá la planilla que descarga Tiendanube o la de este panel.'], avisos };

  const idx = { nombre: col('nombre'), cat: col('categorias'), precio: col('precio'), promo: col('precio promocional'), peso: col('peso'), stock: col('stock'), sku: col('sku'), mostrar: col('mostrar en tienda'), desc: col('descripcion') };
  const props = [1, 2, 3].map(k => ({ nombre: col(`nombre de propiedad ${k}`), valor: col(`valor de propiedad ${k}`) }));
  const productos = actuales.map(p => ({ ...p }));
  const variantesPorId = new Map<string, { nombres: string[]; lista: VarianteCsv[] }>();
  const vistos = new Set<string>();

  filas.slice(1).forEach((f, n) => {
    if (f.every(c => !c.trim())) return;
    const fila = n + 2;
    const cel = (i: number) => (i < 0 ? '' : (f[i] ?? '').trim());
    const id = cel(iHandle);
    if (!id) { errores.push(`Fila ${fila}: falta el Identificador de URL.`); return; }
    if (!HANDLE.test(id) || id.length > 80) { errores.push(`Fila ${fila}: el Identificador de URL "${id}" solo puede tener minúsculas, números y guiones.`); return; }

    const primera = !vistos.has(id);
    const actual = productos.find(p => p.id === id);
    const nombre = cel(idx.nombre).slice(0, 80);
    if (primera && !actual && !nombre) { errores.push(`Fila ${fila}: "${id}" es nuevo y no tiene Nombre.`); return; }

    const crudoPrecio = decimal(cel(idx.precio));
    if (crudoPrecio && !NUMERO.test(crudoPrecio)) { errores.push(`Fila ${fila}: Precio inválido "${crudoPrecio}" (número con punto decimal, sin $).`); return; }
    if (primera && !actual && !crudoPrecio) { errores.push(`Fila ${fila}: "${id}" es nuevo y no tiene Precio.`); return; }
    const crudoPromo = decimal(cel(idx.promo));
    if (crudoPromo && !NUMERO.test(crudoPromo)) { errores.push(`Fila ${fila}: Precio promocional inválido "${crudoPromo}" (número con punto decimal, sin $).`); return; }
    const crudoStock = cel(idx.stock);
    if (crudoStock && crudoStock !== '-' && !/^\d+$/.test(crudoStock)) { errores.push(`Fila ${fila}: Stock inválido "${crudoStock}" (entero, vacío o "-").`); return; }
    const crudoPeso = decimal(cel(idx.peso));
    if (crudoPeso && !NUMERO.test(crudoPeso)) { errores.push(`Fila ${fila}: Peso inválido "${crudoPeso}" (kilos con punto decimal).`); return; }

    // ¿Esta fila describe una variante? Sí si trae algún valor de propiedad.
    const nombresProp = props.map(p => cel(p.nombre));
    const esVariante = props.some(p => cel(p.valor) !== '');
    if (esVariante) {
      const hasta = props.reduce((m, p, k) => (cel(p.valor) !== '' || cel(p.nombre) !== '' ? k + 1 : m), 0);
      const valoresFila = props.slice(0, hasta).map(p => cel(p.valor));
      if (valoresFila.some(v => !v)) { errores.push(`Fila ${fila}: la variante tiene propiedades sin valor.`); return; }
      const acum = variantesPorId.get(id) ?? { nombres: [], lista: [] };
      if (!acum.nombres.length) acum.nombres = nombresProp.slice(0, hasta).map((x, k) => x || `Propiedad ${k + 1}`);
      acum.lista.push({
        valores: valoresFila,
        ...(crudoPrecio && { precio: Number(crudoPrecio) }),
        ...(crudoStock && { stock: crudoStock === '-' ? null : Number(crudoStock) }),
        ...(cel(idx.sku) && { sku: cel(idx.sku).slice(0, 40) }),
      });
      variantesPorId.set(id, acum);
    } else if (!primera) {
      errores.push(`Fila ${fila}: "${id}" ya apareció y esta fila no trae valores de propiedad; no se tomó.`);
      return;
    }

    vistos.add(id);
    if (!primera) return; // las filas siguientes solo aportan variantes

    const p: Producto = actual ?? { id, nombre, categoria: 'Otros', precio: 0, foto: '' };
    if (nombre) p.nombre = nombre;
    if (cel(idx.cat)) p.categoria = cel(idx.cat).slice(0, 30);
    if (crudoPrecio) p.precio = Number(crudoPrecio);
    if (crudoPromo) p.precioPromo = Number(crudoPromo);
    const mostrar = clave(cel(idx.mostrar));
    if (mostrar === 'no') p.oculto = true; else if (mostrar === 'si') delete p.oculto;
    if (crudoPeso && Number(crudoPeso) > 0) p.pesoGr = Math.round(Number(crudoPeso) * 1000);
    if (cel(idx.sku) && !esVariante) p.sku = cel(idx.sku).slice(0, 40); // en un producto con variantes el SKU es de cada variante
    if (cel(idx.desc)) p.descripcion = cel(idx.desc).slice(0, 160);
    if (!esVariante) {
      if (crudoStock === '-') { delete p.stock; delete p.agotado; } else if (crudoStock) {
        p.stock = Number(crudoStock);
        if (p.stock === 0) p.agotado = true; else delete p.agotado;
      }
    }
    if (!actual) productos.push(p);
  });

  // Variantes: se unen a las que ya tenía el producto (mismo id = mismos valores): celda vacía = sin cambios.
  for (const [id, { nombres, lista }] of variantesPorId) {
    const p = productos.find(x => x.id === id);
    if (!p) continue;
    const previas = new Map((p.variantes ?? []).map(v => [v.id, v]));
    const nuevas = normalizarProducto({
      id, nombre: p.nombre, precio: p.precio,
      propiedades: nombres,
      variantes: lista.map(v => {
        const previa = previas.get(idVariante(v.valores));
        const stock = v.stock === null ? undefined : v.stock !== undefined ? v.stock : previa?.stock;
        // Una variante con el mismo precio que el producto no tiene precio propio.
        const precio = v.precio !== undefined && v.precio !== p.precio ? v.precio : v.precio === undefined ? previa?.precio : undefined;
        return { valores: v.valores, precio, stock, sku: v.sku ?? previa?.sku };
      }),
    });
    if (!nuevas?.variantes) { avisos.push(`"${p.nombre}": no se pudieron leer sus variantes, se dejó sin cambios.`); continue; }
    p.propiedades = nuevas.propiedades;
    p.variantes = nuevas.variantes;
    delete p.stock;
    if (nuevas.agotado) p.agotado = true; else delete p.agotado;
    if (lista.length > nuevas.variantes.length) avisos.push(`"${p.nombre}": ${lista.length - nuevas.variantes.length} variantes repetidas o incompletas se ignoraron.`);
  }

  if (productos.length > MAX_PRODUCTOS) return { productos: actuales, errores: [...errores, `El catálogo no puede pasar de ${MAX_PRODUCTOS} productos; no se importó nada.`], avisos };
  return { productos, errores, avisos };
}
