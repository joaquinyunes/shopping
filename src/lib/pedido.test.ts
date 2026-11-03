import { describe, expect, it } from 'vitest';
import { armarMensaje, formatoPrecio, lineasDelCarrito, linkWhatsApp, totalDelCarrito } from './pedido';
import type { Producto } from '../tipos';

const p = (o: Partial<Producto>): Producto => ({ id: 'x', nombre: 'X', categoria: 'Deco', precio: 100, foto: '', ...o });
const productos = [p({ id: 'taza', nombre: 'Taza', precio: 8500 }), p({ id: 'vela', nombre: 'Vela', precio: 7200, agotado: true })];

describe('pedido', () => {
  it('formatea precios en pesos', () => expect(formatoPrecio(1234567)).toBe('$1.234.567'));

  it('arma el mensaje con total y saltea agotados y productos borrados', () => {
    const msg = armarMensaje({ taza: 2, vela: 1, borrado: 3 }, productos, { nombre: 'Casa Nido' })!;
    expect(msg).toContain('2 x Taza — $17.000');
    expect(msg).toContain('Total: $17.000');
    expect(msg).not.toContain('Vela');
  });

  it('si el pedido quedó registrado, el mensaje lleva número, envío y el total del servidor', () => {
    const msg = armarMensaje({ taza: 1 }, productos, { nombre: 'Casa Nido' }, { numero: 7, envio: { servicio: 'Envío a domicilio', precio: 4500 }, total: 13000 })!;
    expect(msg).toContain('(n.º 7)');
    expect(msg).toContain('Envío a domicilio: $4.500');
    expect(msg).toContain('Total: $13.000');
  });

  it('un carrito vacío o solo con agotados no arma mensaje', () => {
    expect(armarMensaje({}, productos, { nombre: 'X' })).toBeNull();
    expect(armarMensaje({ vela: 2 }, productos, { nombre: 'X' })).toBeNull();
  });

  it('ignora cantidades inválidas', () => expect(totalDelCarrito({ taza: 0 }, productos)).toBe(0));

  it('el link de WhatsApp limpia el número y codifica el texto', () =>
    expect(linkWhatsApp('+54 9 11 1234-5678', 'a b')).toBe('https://wa.me/5491112345678?text=a%20b'));

  describe('variantes, oferta y ocultos', () => {
    const remera = p({
      id: 'remera', nombre: 'Remera', precio: 10000, precioPromo: 8000, propiedades: ['Talle'],
      variantes: [{ id: 'm', valores: ['M'], stock: 2 }, { id: 'l', valores: ['L'], precio: 12000 }, { id: 's', valores: ['S'], stock: 0 }],
    });
    const todos = [...productos, remera, p({ id: 'oculta', nombre: 'Oculta', oculto: true })];

    it('cada variante es su propia línea y usa su precio, o la oferta del producto si no tiene', () => {
      const carrito = { 'remera::m': 2, 'remera::l': 1 };
      expect(lineasDelCarrito(carrito, todos).map(l => l.clave)).toEqual(['remera::m', 'remera::l']);
      expect(totalDelCarrito(carrito, todos)).toBe(2 * 8000 + 12000);
      const msg = armarMensaje(carrito, todos, { nombre: 'X' })!;
      expect(msg).toContain('2 x Remera (M) — $16.000');
      expect(msg).toContain('1 x Remera (L) — $12.000');
    });
    it('saltea la variante agotada o inexistente, la línea sin variante elegida y los ocultos', () => {
      expect(lineasDelCarrito({ 'remera::s': 1, 'remera::zz': 1, remera: 1, oculta: 2 }, todos)).toEqual([]);
    });
  });
});
