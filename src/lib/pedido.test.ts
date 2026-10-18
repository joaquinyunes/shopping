import { describe, expect, it } from 'vitest';
import { armarMensaje, formatoPrecio, linkWhatsApp, totalDelCarrito } from './pedido';
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

  it('un carrito vacío o solo con agotados no arma mensaje', () => {
    expect(armarMensaje({}, productos, { nombre: 'X' })).toBeNull();
    expect(armarMensaje({ vela: 2 }, productos, { nombre: 'X' })).toBeNull();
  });

  it('ignora cantidades inválidas', () => expect(totalDelCarrito({ taza: 0 }, productos)).toBe(0));

  it('el link de WhatsApp limpia el número y codifica el texto', () =>
    expect(linkWhatsApp('+54 9 11 1234-5678', 'a b')).toBe('https://wa.me/5491112345678?text=a%20b'));
});
