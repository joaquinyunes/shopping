import { describe, expect, it } from 'vitest';
import { importarCsv, leerCsv } from './tiendanube-csv';
import { armarMensaje } from './pedido';
import type { Producto } from '../tipos';

describe('importar desde Excel en español (CSV con «;» y decimales con coma)', () => {
  const planilla = '\uFEFFIdentificador de URL;Nombre;Categorías;Precio;Precio promocional;Peso;Stock;Descripción\r\n'
    + 'taza-blanca;Taza blanca;Cocina;8500,50;7000;0,35;12;"Taza; esmalte mate"\r\n'
    + 'vela;Vela de soja;Deco;4200;;;-;\r\n';

  it('detecta el separador y lee las celdas con «;» entre comillas', () => {
    expect(leerCsv(planilla)[1]).toEqual(['taza-blanca', 'Taza blanca', 'Cocina', '8500,50', '7000', '0,35', '12', 'Taza; esmalte mate']);
  });
  it('sigue leyendo bien el CSV con comas de Tiendanube', () => {
    expect(leerCsv('a,b\n1,"2,5"\n')).toEqual([['a', 'b'], ['1', '2,5']]);
  });
  it('importa precio con coma, peso en kilos y stock', () => {
    const r = importarCsv(planilla, []);
    expect(r.errores).toEqual([]);
    expect(r.productos).toHaveLength(2);
    expect(r.productos[0]).toMatchObject({ id: 'taza-blanca', precio: 8500.5, precioPromo: 7000, pesoGr: 350, stock: 12, categoria: 'Cocina', descripcion: 'Taza; esmalte mate' });
    expect(r.productos[1].stock).toBeUndefined(); // «-» = ilimitado
  });
  it('un precio con separador de miles se rechaza con un mensaje claro en vez de adivinarse', () => {
    const r = importarCsv('Identificador de URL;Nombre;Precio\nx;X;8.500,50\n', []);
    expect(r.productos).toHaveLength(0);
    expect(r.errores[0]).toMatch(/Precio inválido/);
  });
});

describe('plantilla del mensaje de WhatsApp', () => {
  const taza: Producto = { id: 'taza', nombre: 'Taza', categoria: 'Cocina', precio: 8500, foto: '' };
  const carrito = { taza: 2 };

  it('sin plantilla, el mensaje de siempre', () => {
    expect(armarMensaje(carrito, [taza], { nombre: 'Casa Nido' }, { numero: 7 }))
      .toBe('¡Hola Casa Nido! Quiero hacer este pedido (n.º 7):\n\n• 2 x Taza — $17.000\n\nTotal: $17.000');
  });
  it('con plantilla propia reemplaza las etiquetas y lo demás queda igual', () => {
    const m = armarMensaje(carrito, [taza], { nombre: 'Casa Nido', plantillaPedido: 'Pedido{numero} para {nombre}:\n{detalle}{envio}\nTotal {total}. ¡Gracias!' }, { numero: 7, envio: { servicio: 'Envío', precio: 4500 }, total: 21500 });
    expect(m).toBe('Pedido (n.º 7) para Casa Nido:\n• 2 x Taza — $17.000\nEnvío: $4.500\nTotal $21.500. ¡Gracias!');
  });
  it('un producto llamado «{total}» no se vuelve a reemplazar, y una plantilla en blanco usa la de siempre', () => {
    const raro = { ...taza, nombre: '{total}' };
    expect(armarMensaje({ taza: 1 }, [raro], { nombre: 'X', plantillaPedido: '{detalle}' })).toBe('• 1 x {total} — $8.500');
    expect(armarMensaje(carrito, [taza], { nombre: 'X', plantillaPedido: '   ' })).toMatch(/Quiero hacer este pedido/);
  });
});
