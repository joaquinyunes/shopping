import { describe, expect, it } from 'vitest';
import { centroDelTunel } from './camera-path';
import { hitosDeTienda, MAX_HITOS } from './hitos';
import { escalaPorDistancia, posicionTarjeta } from './tarjeta-layout';
import type { Producto } from '../tipos';

const prod = (id: string, categoria: string, extra: Partial<Producto> = {}): Producto => ({ id, nombre: id, categoria, precio: 1, foto: `/${id}.webp`, ...extra });

describe('posicionTarjeta', () => {
  it('en escritorio la tarjeta queda del lado del hito, a cada lado del eje', () => {
    const der = posicionTarjeta({ t: 0.4, lado: 1 }, 16 / 9), izq = posicionTarjeta({ t: 0.4, lado: -1 }, 16 / 9);
    const cx = centroDelTunel(0.4)[0];
    expect(der.pos[0]).toBeGreaterThan(cx + 1);
    expect(izq.pos[0]).toBeLessThan(cx - 1);
  });

  it('en vertical queda centrada, más abajo y se usa el ancho de celular', () => {
    const hito = { t: 0.4, lado: 1 as const };
    const v = posicionTarjeta(hito, 390 / 844), e = posicionTarjeta(hito, 16 / 9);
    expect(v.pos[0]).toBeCloseTo(centroDelTunel(0.4)[0], 6);
    expect(v.pos[1]).toBeLessThan(e.pos[1]);
  });

  it('siempre vive exactamente en el z del hito', () => {
    expect(posicionTarjeta({ t: 0.4, lado: 1 }, 1.5).pos[2]).toBeCloseTo(centroDelTunel(0.4)[2], 6);
  });
});

describe('escalaPorDistancia', () => {
  it('es 0 lejos, 1 a distancia de lectura y crece de forma monótona entre medio', () => {
    expect(escalaPorDistancia(100)).toBe(0);
    expect(escalaPorDistancia(13)).toBe(1);
    let anterior = 0;
    for (let d = 38; d >= 13; d -= 1) {
      const s = escalaPorDistancia(d);
      expect(s).toBeGreaterThanOrEqual(anterior);
      anterior = s;
    }
  });

  it('se encoge hasta 0 al pasar junto a la cámara (no choca contra la pantalla)', () => {
    expect(escalaPorDistancia(6)).toBe(1);
    expect(escalaPorDistancia(3)).toBeLessThan(1);
    expect(escalaPorDistancia(0)).toBe(0);
    expect(escalaPorDistancia(-5)).toBe(0);
  });
});

describe('hitosDeTienda', () => {
  it('reparte por categoría, saltea agotados y sin foto, y respeta el máximo', () => {
    const hitos = hitosDeTienda([
      prod('a', 'Cocina', { agotado: true }), prod('b', 'Cocina'), prod('c', 'Deco', { foto: '' }), prod('d', 'Deco'),
      prod('e', 'Textiles'), prod('f', 'Baño'), prod('g', 'Cocina'), prod('h', 'Deco'),
      prod('i', 'Cocina'), prod('j', 'Deco'), prod('k', 'Cocina'),
    ]);
    expect(hitos.map(h => h.producto.id)).toEqual(['b', 'd', 'e', 'f', 'g', 'h', 'i']);
    expect(hitos).toHaveLength(MAX_HITOS);
  });

  it('los momentos del viaje van en orden creciente y dejan lugar al cierre', () => {
    const ts = hitosDeTienda(Array.from({ length: 9 }, (_, i) => prod(`p${i}`, `C${i % 3}`))).map(h => h.t);
    expect([...ts].sort((x, y) => x - y)).toEqual(ts);
    expect(ts[ts.length - 1]).toBeLessThan(0.85);
  });

  it('las tarjetas alternan de lado para que el texto vaya al opuesto', () => {
    const lados = hitosDeTienda([prod('a', 'X'), prod('b', 'X'), prod('c', 'X')]).map(h => h.lado);
    expect(lados).toEqual([1, -1, 1]);
  });

  it('usa la descripción del producto y, si falta, un texto de la categoría', () => {
    const [con, sin] = hitosDeTienda([prod('a', 'Cocina', { descripcion: 'Taza grande' }), prod('b', 'Jardín')]);
    expect(con.texto).toBe('Taza grande');
    expect(sin.texto).toContain('Jardín');
  });
});
