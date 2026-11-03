import { createHash } from 'node:crypto';
import type { ClientSession, Collection, Db } from 'mongodb';
import { normalizarProducto } from '../src/data/producto.js';
import { buscarVariante, estaAgotado, etiquetaVariante, precioDe } from '../src/lib/catalogo.js';
import type { Producto } from '../src/tipos.js';
import type { Conexion } from './db.js';
import { cotizarEnvio, type EnviosProvider } from './envios.js';
import { ErrorHttp } from './http.js';

export type EstadoPedido = 'pendiente' | 'pagado' | 'enviado' | 'entregado' | 'cancelado';
export const ESTADOS: EstadoPedido[] = ['pendiente', 'pagado', 'enviado', 'entregado', 'cancelado'];

// Cancelar solo antes de enviar; reabrir una cancelada la deja pendiente (y vuelve a descontar el stock), como en Tiendanube.
const SIGUIENTES: Record<EstadoPedido, EstadoPedido[]> = {
  pendiente: ['pagado', 'cancelado'],
  pagado: ['enviado', 'cancelado'],
  enviado: ['entregado'],
  entregado: [],
  cancelado: ['pendiente'],
};
export const puedePasar = (de: EstadoPedido, a: EstadoPedido) => SIGUIENTES[de].includes(a);

/** Lo mínimo del producto que necesita el servidor; el precio y el stock se leen siempre de la base, nunca del cliente. */
export type ProductoServidor = Pick<Producto, 'id' | 'nombre' | 'precio'> & Partial<Producto>;

export interface Item { id: string; cant: number; variante?: string }
export interface Cliente { nombre: string; telefono?: string; email?: string; cp?: string }
export interface EntradaPedido { items: Item[]; cliente: Cliente }
export interface ItemPedido { id: string; cant: number; nombre: string; precio: number; variante?: { id: string; nombre: string } }
export interface OpcionElegida { proveedor: string; servicio: string; precio: number }
export interface Pedido {
  _id: number;
  estado: EstadoPedido;
  items: ItemPedido[];
  subtotal: number;
  envio?: OpcionElegida;
  total: number;
  cliente: Cliente;
  /** Huella (no la IP) de quien hizo el pedido, para frenar a quien llena la tienda de pedidos que retienen stock. */
  origen?: string;
  creado: Date;
  actualizado: Date;
  historial: Array<{ estado: EstadoPedido; fecha: Date; motivo?: string }>;
}

const texto = (v: unknown, max: number) => (typeof v === 'string' ? v.trim().slice(0, max) : '');
const EMAIL = /^[^\s@]{1,64}@[^\s@]{1,200}\.[^\s@]{2,}$/;

export function validarItems(raw: unknown): Item[] | string {
  if (!Array.isArray(raw) || raw.length < 1 || raw.length > 50) return 'El pedido debe tener entre 1 y 50 productos';
  const porLinea = new Map<string, Item & { cant: number }>();
  for (const it of raw) {
    const { id, cant, variante } = (it ?? {}) as Record<string, unknown>;
    if (typeof id !== 'string' || !id || id.length > 80) return 'Producto inválido';
    if (variante !== undefined && (typeof variante !== 'string' || !variante || variante.length > 80)) return 'Opción inválida';
    if (typeof cant !== 'number' || !Number.isInteger(cant) || cant < 1 || cant > 99) return 'Cantidad inválida (1 a 99)';
    const clave = `${id}\0${variante ?? ''}`;
    const previo = porLinea.get(clave);
    porLinea.set(clave, { id, cant: (previo?.cant ?? 0) + cant, ...(variante !== undefined && { variante: variante as string }) });
  }
  if ([...porLinea.values()].some(l => l.cant > 99)) return 'Cantidad inválida (1 a 99)';
  return [...porLinea.values()];
}

export function validarEntrada(raw: unknown): EntradaPedido | string {
  const r = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
  const items = validarItems(r.items);
  if (typeof items === 'string') return items;
  const c = (r.cliente && typeof r.cliente === 'object' ? r.cliente : {}) as Record<string, unknown>;
  const nombre = texto(c.nombre, 60), telefono = texto(c.telefono, 25).replace(/[^\d+]/g, ''), cp = texto(c.cp, 10), email = texto(c.email, 80).toLowerCase();
  if (!nombre) return 'Falta tu nombre';
  if (email && !EMAIL.test(email)) return 'El mail no parece válido';
  return { items, cliente: { nombre, ...(telefono && { telefono }), ...(email && { email }), ...(cp && { cp }) } };
}

/** Líneas del pedido con nombre y precio del catálogo del servidor. Devuelve un mensaje si algo no se puede vender. */
export function resolverItems(catalogo: ProductoServidor[], items: Item[]) {
  const lineas: ItemPedido[] = [];
  let pesoGr = 0;
  for (const { id, cant, variante: varianteId } of items) {
    const p = catalogo.find(x => x.id === id);
    if (!p || p.oculto) return `El producto "${id}" ya no existe`;
    if (estaAgotado(p)) return `"${p.nombre}" está agotado`;
    const variante = buscarVariante(p, varianteId);
    if (p.variantes?.length) {
      if (!varianteId) return `Elegí una opción de "${p.nombre}"`;
      if (!variante) return `La opción elegida de "${p.nombre}" ya no existe`;
    } else if (varianteId) return `La opción elegida de "${p.nombre}" ya no existe`;
    const nombreVariante = variante ? etiquetaVariante(variante) : undefined;
    const stock = variante ? variante.stock : p.stock;
    const nombreCompleto = nombreVariante ? `${p.nombre} (${nombreVariante})` : p.nombre;
    if (stock === 0) return `"${nombreCompleto}" está agotado`;
    if (stock !== undefined && cant > stock) return `No hay stock suficiente de "${nombreCompleto}" (quedan ${stock})`;
    lineas.push({ id, cant, nombre: p.nombre, precio: precioDe(p, variante), ...(variante && { variante: { id: variante.id, nombre: nombreVariante! } }) });
    pesoGr += (p.pesoGr ?? 0) * cant;
  }
  return { items: lineas, subtotal: lineas.reduce((s, l) => s + l.precio * l.cant, 0), pesoGr };
}

export function armarPedido(catalogo: ProductoServidor[], entrada: EntradaPedido) {
  const r = resolverItems(catalogo, entrada.items);
  return typeof r === 'string' ? r : { ...r, cliente: entrada.cliente };
}

// ---- Base de datos (hace falta un replica set: Atlas lo es; en local, ver server/mongo-local.ts) ----

/** `version` sube con cada cambio del catálogo (guardado de la dueña o stock movido por un pedido): ver api/tienda.ts. */
export interface FilaTienda { _id: number; datos?: { tienda?: Record<string, unknown>; productos?: unknown[] }; actualizado?: Date; version?: number }

const tiendaDe = (db: Db): Collection<FilaTienda> => db.collection<FilaTienda>('tienda');
export const pedidosDe = (db: Db): Collection<Pedido> => db.collection<Pedido>('pedidos');

export async function leerCatalogo(db: Db): Promise<Producto[]> {
  const fila = await tiendaDe(db).findOne({ _id: 1 });
  return (fila?.datos?.productos ?? []).flatMap(raw => normalizarProducto(raw) ?? []);
}

export async function leerNombreTienda(db: Db): Promise<string> {
  const nombre = (await tiendaDe(db).findOne({ _id: 1 }))?.datos?.tienda?.nombre;
  return typeof nombre === 'string' && nombre.trim() ? nombre.trim() : 'Casa Nido';
}

/** Descuenta (signo -1) o repone (+1) el stock de los productos o variantes que lo llevan. Sin stock cargado = ilimitado, no se toca. */
async function moverStock(tienda: Collection<FilaTienda>, session: ClientSession, items: ItemPedido[], signo: 1 | -1) {
  for (const { id, cant, variante } of items) {
    const condicion = (stock: object) => ({ 'datos.productos': { $elemMatch: variante ? { id, variantes: { $elemMatch: { id: variante.id, stock } } } : { id, stock } } });
    const campo = variante ? 'datos.productos.$[p].variantes.$[v].stock' : 'datos.productos.$[p].stock';
    const arrayFilters = variante ? [{ 'p.id': id }, { 'v.id': variante.id }] : [{ 'p.id': id }];
    const r = await tienda.updateOne(
      { _id: 1, ...condicion(signo === -1 ? { $gte: cant } : { $type: 'number' }) },
      { $inc: { [campo]: signo * cant, version: 1 }, $set: { actualizado: new Date() } },
      { session, arrayFilters },
    );
    if (r.matchedCount === 0 && signo === -1) {
      // ¿Es que no alcanza, o el producto es ilimitado / ya no existe?
      const lleva = await tienda.countDocuments({ _id: 1, ...condicion({ $type: 'number' }) }, { session });
      if (lleva) throw new ErrorHttp(409, 'Se agotó el stock de un producto del pedido');
    }
  }
}

export async function guardarPedido({ client, db }: Conexion, armado: { items: ItemPedido[]; subtotal: number; cliente: Cliente }, envio?: OpcionElegida, origen?: string): Promise<Pedido> {
  let creado!: Pedido;
  await client.withSession(session => session.withTransaction(async () => {
    await moverStock(tiendaDe(db), session, armado.items, -1);
    const contador = await db.collection<{ _id: string; n: number }>('contadores')
      .findOneAndUpdate({ _id: 'pedido' }, { $inc: { n: 1 } }, { upsert: true, returnDocument: 'after', session });
    const ahora = new Date();
    creado = {
      _id: contador!.n, estado: 'pendiente', items: armado.items, subtotal: armado.subtotal,
      ...(envio && { envio }), total: armado.subtotal + (envio?.precio ?? 0), cliente: armado.cliente,
      ...(origen && { origen }), creado: ahora, actualizado: ahora, historial: [{ estado: 'pendiente', fecha: ahora }],
    };
    await pedidosDe(db).insertOne(creado, { session });
  }));
  return creado;
}

/** Cuántos pedidos pendientes puede tener a la vez un mismo origen en una hora antes de que la API le diga que espere. */
export const MAX_PENDIENTES_POR_ORIGEN = 5;

/** Huella de la IP: alcanza para contar pedidos del mismo origen sin guardar el dato personal. */
export const huellaDeOrigen = (ip: string) => createHash('sha256').update(`${process.env.MONGODB_DB ?? 'casanido'}:${ip}`).digest('hex').slice(0, 24);

/** Valida, calcula todo con el catálogo y el cotizador del servidor y guarda el pedido descontando stock en una transacción. */
export async function registrarPedido(cx: Conexion, raw: unknown, proveedor: EnviosProvider, ip?: string): Promise<Pedido> {
  const entrada = validarEntrada(raw);
  if (typeof entrada === 'string') throw new ErrorHttp(400, entrada);
  const armado = armarPedido(await leerCatalogo(cx.db), entrada);
  // stock/agotado es un conflicto con el estado de la tienda (409); producto inexistente es un pedido mal armado (400)
  if (typeof armado === 'string') throw new ErrorHttp(/stock|agotado/i.test(armado) ? 409 : 400, armado);

  // shortcut: cuenta y guarda sin transacción entre sí, dos pedidos simultáneos del mismo origen pueden pasar el tope por 1; cambiar por un contador atómico si hace falta.
  const origen = ip ? huellaDeOrigen(ip) : undefined;
  if (origen) {
    const hace1h = new Date(Date.now() - 3_600_000);
    const abiertos = await pedidosDe(cx.db).countDocuments({ origen, estado: 'pendiente', creado: { $gte: hace1h } });
    if (abiertos >= MAX_PENDIENTES_POR_ORIGEN) throw new ErrorHttp(429, 'Ya tenés varios pedidos pendientes. Esperá a que la tienda los confirme o escribinos por WhatsApp.');
  }

  let envio: OpcionElegida | undefined;
  const servicio = ((raw as { envio?: { servicio?: unknown } }).envio ?? {}).servicio;
  if (servicio !== undefined) {
    if (!entrada.cliente.cp) throw new ErrorHttp(400, 'Falta el código postal para el envío');
    const opciones = await cotizarEnvio(proveedor, { cp: entrada.cliente.cp, pesoGr: armado.pesoGr, valorDeclarado: armado.subtotal });
    const elegida = opciones.find(o => o.servicio === servicio);
    if (!elegida) throw new ErrorHttp(400, 'Ese envío no está disponible');
    envio = { proveedor: elegida.proveedor, servicio: elegida.servicio, precio: elegida.precio };
  }
  return guardarPedido(cx, armado, envio, origen);
}

/**
 * Cambia el estado dentro de una transacción (cancelar repone stock; reabrir lo vuelve a descontar).
 * `soloDesde` evita pisar un cambio que la dueña hizo un instante antes (lo usa el vencimiento automático).
 */
export async function cambiarEstado({ client, db }: Conexion, numero: number, nuevo: EstadoPedido, opciones: { soloDesde?: EstadoPedido; motivo?: string } = {}): Promise<Pedido> {
  let actualizado!: Pedido;
  await client.withSession(session => session.withTransaction(async () => {
    const pedidos = pedidosDe(db);
    const p = await pedidos.findOne({ _id: numero }, { session });
    if (!p) throw new ErrorHttp(404, 'No existe ese pedido');
    if (opciones.soloDesde && p.estado !== opciones.soloDesde) throw new ErrorHttp(409, `El pedido ya no está ${opciones.soloDesde}`);
    if (!puedePasar(p.estado, nuevo)) throw new ErrorHttp(409, `Un pedido ${p.estado} no puede pasar a ${nuevo}`);
    if (nuevo === 'cancelado') await moverStock(tiendaDe(db), session, p.items, 1);
    if (p.estado === 'cancelado') await moverStock(tiendaDe(db), session, p.items, -1); // reabrir
    const ahora = new Date();
    actualizado = (await pedidos.findOneAndUpdate(
      { _id: numero },
      { $set: { estado: nuevo, actualizado: ahora }, $push: { historial: { estado: nuevo, fecha: ahora, ...(opciones.motivo && { motivo: opciones.motivo }) } } },
      { session, returnDocument: 'after' },
    ))!;
  }));
  return actualizado;
}

export async function listarPedidos(db: Db, estado?: EstadoPedido): Promise<Pedido[]> {
  return pedidosDe(db).find(estado ? { estado } : {}).sort({ _id: -1 }).limit(200).toArray();
}

/** Forma pública de un pedido: `numero` en lugar de `_id`, y sin la huella de origen. */
export const salida = ({ _id, origen: _origen, ...resto }: Pedido) => ({ numero: _id, ...resto }); // eslint-disable-line @typescript-eslint/no-unused-vars
