import type { ClientSession, Collection, Db } from 'mongodb';
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
export interface ProductoServidor { id: string; nombre: string; precio: number; stock?: number; agotado?: boolean; pesoGr?: number }

export interface Item { id: string; cant: number }
export interface Cliente { nombre: string; telefono?: string; cp?: string }
export interface EntradaPedido { items: Item[]; cliente: Cliente }
export interface ItemPedido extends Item { nombre: string; precio: number }
export interface OpcionElegida { proveedor: string; servicio: string; precio: number }
export interface Pedido {
  _id: number;
  estado: EstadoPedido;
  items: ItemPedido[];
  subtotal: number;
  envio?: OpcionElegida;
  total: number;
  cliente: Cliente;
  creado: Date;
  actualizado: Date;
  historial: Array<{ estado: EstadoPedido; fecha: Date }>;
}

const texto = (v: unknown, max: number) => (typeof v === 'string' ? v.trim().slice(0, max) : '');

export function validarItems(raw: unknown): Item[] | string {
  if (!Array.isArray(raw) || raw.length < 1 || raw.length > 50) return 'El pedido debe tener entre 1 y 50 productos';
  const porId = new Map<string, number>();
  for (const it of raw) {
    const { id, cant } = (it ?? {}) as Record<string, unknown>;
    if (typeof id !== 'string' || !id || id.length > 80) return 'Producto inválido';
    if (typeof cant !== 'number' || !Number.isInteger(cant) || cant < 1 || cant > 99) return 'Cantidad inválida (1 a 99)';
    porId.set(id, (porId.get(id) ?? 0) + cant);
  }
  if ([...porId.values()].some(c => c > 99)) return 'Cantidad inválida (1 a 99)';
  return [...porId].map(([id, cant]) => ({ id, cant }));
}

export function validarEntrada(raw: unknown): EntradaPedido | string {
  const r = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
  const items = validarItems(r.items);
  if (typeof items === 'string') return items;
  const c = (r.cliente && typeof r.cliente === 'object' ? r.cliente : {}) as Record<string, unknown>;
  const nombre = texto(c.nombre, 60), telefono = texto(c.telefono, 25).replace(/[^\d+]/g, ''), cp = texto(c.cp, 10);
  if (!nombre) return 'Falta tu nombre';
  return { items, cliente: { nombre, ...(telefono && { telefono }), ...(cp && { cp }) } };
}

/** Líneas del pedido con nombre y precio del catálogo del servidor. Devuelve un mensaje si algo no se puede vender. */
export function resolverItems(catalogo: ProductoServidor[], items: Item[]) {
  const lineas: ItemPedido[] = [];
  let pesoGr = 0;
  for (const { id, cant } of items) {
    const p = catalogo.find(x => x.id === id);
    if (!p) return `El producto "${id}" ya no existe`;
    if (p.agotado || p.stock === 0) return `"${p.nombre}" está agotado`;
    if (p.stock !== undefined && cant > p.stock) return `No hay stock suficiente de "${p.nombre}" (quedan ${p.stock})`;
    lineas.push({ id, cant, nombre: p.nombre, precio: p.precio });
    pesoGr += (p.pesoGr ?? 0) * cant;
  }
  return { items: lineas, subtotal: lineas.reduce((s, l) => s + l.precio * l.cant, 0), pesoGr };
}

export function armarPedido(catalogo: ProductoServidor[], entrada: EntradaPedido) {
  const r = resolverItems(catalogo, entrada.items);
  return typeof r === 'string' ? r : { ...r, cliente: entrada.cliente };
}

// ---- Base de datos (hace falta un replica set: Atlas lo es; en local, ver server/mongo-local.ts) ----

interface FilaTienda { _id: number; datos?: { productos?: unknown[] }; actualizado?: Date }

const tiendaDe = (db: Db): Collection<FilaTienda> => db.collection<FilaTienda>('tienda');
const pedidosDe = (db: Db): Collection<Pedido> => db.collection<Pedido>('pedidos');

export async function leerCatalogo(db: Db): Promise<ProductoServidor[]> {
  const fila = await tiendaDe(db).findOne({ _id: 1 });
  return (fila?.datos?.productos ?? []).flatMap(raw => {
    const p = (raw ?? {}) as Record<string, unknown>;
    if (typeof p.id !== 'string' || typeof p.nombre !== 'string' || typeof p.precio !== 'number') return [];
    return [{
      id: p.id, nombre: p.nombre, precio: p.precio, agotado: p.agotado === true,
      stock: typeof p.stock === 'number' ? p.stock : undefined,
      pesoGr: typeof p.pesoGr === 'number' ? p.pesoGr : undefined,
    }];
  });
}

/** Descuenta (signo -1) o repone (+1) el stock de los productos que lo llevan. Sin stock cargado = ilimitado, no se toca. */
async function moverStock(tienda: Collection<FilaTienda>, session: ClientSession, items: Item[], signo: 1 | -1) {
  for (const { id, cant } of items) {
    const filtro = signo === -1 ? { stock: { $gte: cant } } : { stock: { $type: 'number' } };
    const r = await tienda.updateOne(
      { _id: 1, 'datos.productos': { $elemMatch: { id, ...filtro } } },
      { $inc: { 'datos.productos.$[p].stock': signo * cant }, $set: { actualizado: new Date() } },
      { session, arrayFilters: [{ 'p.id': id }] },
    );
    if (r.matchedCount === 0 && signo === -1) {
      // ¿Es que no alcanza, o el producto es ilimitado / ya no existe?
      const lleva = await tienda.countDocuments({ _id: 1, 'datos.productos': { $elemMatch: { id, stock: { $type: 'number' } } } }, { session });
      if (lleva) throw new ErrorHttp(409, 'Se agotó el stock de un producto del pedido');
    }
  }
}

export async function guardarPedido({ client, db }: Conexion, armado: { items: ItemPedido[]; subtotal: number; cliente: Cliente }, envio?: OpcionElegida): Promise<Pedido> {
  let creado!: Pedido;
  await client.withSession(session => session.withTransaction(async () => {
    await moverStock(tiendaDe(db), session, armado.items, -1);
    const contador = await db.collection<{ _id: string; n: number }>('contadores')
      .findOneAndUpdate({ _id: 'pedido' }, { $inc: { n: 1 } }, { upsert: true, returnDocument: 'after', session });
    const ahora = new Date();
    creado = {
      _id: contador!.n, estado: 'pendiente', items: armado.items, subtotal: armado.subtotal,
      ...(envio && { envio }), total: armado.subtotal + (envio?.precio ?? 0), cliente: armado.cliente,
      creado: ahora, actualizado: ahora, historial: [{ estado: 'pendiente', fecha: ahora }],
    };
    await pedidosDe(db).insertOne(creado, { session });
  }));
  return creado;
}

/** Valida, calcula todo con el catálogo y el cotizador del servidor y guarda el pedido descontando stock en una transacción. */
export async function registrarPedido(cx: Conexion, raw: unknown, proveedor: EnviosProvider): Promise<Pedido> {
  const entrada = validarEntrada(raw);
  if (typeof entrada === 'string') throw new ErrorHttp(400, entrada);
  const armado = armarPedido(await leerCatalogo(cx.db), entrada);
  // stock/agotado es un conflicto con el estado de la tienda (409); producto inexistente es un pedido mal armado (400)
  if (typeof armado === 'string') throw new ErrorHttp(/stock|agotado/i.test(armado) ? 409 : 400, armado);

  let envio: OpcionElegida | undefined;
  const servicio = ((raw as { envio?: { servicio?: unknown } }).envio ?? {}).servicio;
  if (servicio !== undefined) {
    if (!entrada.cliente.cp) throw new ErrorHttp(400, 'Falta el código postal para el envío');
    const opciones = await cotizarEnvio(proveedor, { cp: entrada.cliente.cp, pesoGr: armado.pesoGr, valorDeclarado: armado.subtotal });
    const elegida = opciones.find(o => o.servicio === servicio);
    if (!elegida) throw new ErrorHttp(400, 'Ese envío no está disponible');
    envio = { proveedor: elegida.proveedor, servicio: elegida.servicio, precio: elegida.precio };
  }
  return guardarPedido(cx, armado, envio);
}

export async function cambiarEstado({ client, db }: Conexion, numero: number, nuevo: EstadoPedido): Promise<Pedido> {
  let actualizado!: Pedido;
  await client.withSession(session => session.withTransaction(async () => {
    const pedidos = pedidosDe(db);
    const p = await pedidos.findOne({ _id: numero }, { session });
    if (!p) throw new ErrorHttp(404, 'No existe ese pedido');
    if (!puedePasar(p.estado, nuevo)) throw new ErrorHttp(409, `Un pedido ${p.estado} no puede pasar a ${nuevo}`);
    if (nuevo === 'cancelado') await moverStock(tiendaDe(db), session, p.items, 1);
    if (p.estado === 'cancelado') await moverStock(tiendaDe(db), session, p.items, -1); // reabrir
    const ahora = new Date();
    actualizado = (await pedidos.findOneAndUpdate(
      { _id: numero },
      { $set: { estado: nuevo, actualizado: ahora }, $push: { historial: { estado: nuevo, fecha: ahora } } },
      { session, returnDocument: 'after' },
    ))!;
  }));
  return actualizado;
}

export async function listarPedidos(db: Db, estado?: EstadoPedido): Promise<Pedido[]> {
  return pedidosDe(db).find(estado ? { estado } : {}).sort({ _id: -1 }).limit(200).toArray();
}

/** Forma pública de un pedido: `numero` en lugar de `_id`. */
export const salida = ({ _id, ...resto }: Pedido) => ({ numero: _id, ...resto });
