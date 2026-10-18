import { describe, expect, it } from 'vitest';
import { dimensionesEnPx, escalaPorPellizco, limitarEscala, pxPorCmDesdeTarjeta, pxPorCmInicial, PX_POR_CM_MAX, PX_POR_CM_MIN } from './escala';

describe('escala', () => {
  it('la estimación inicial reparte el ancho visto (≈48,4 cm a 38 cm con FOV 65°) en el ancho de pantalla', () => {
    expect(pxPorCmInicial(484)).toBeCloseTo(10, 0);
    expect(pxPorCmInicial(968)).toBeCloseTo(20, 0);
  });

  it('limita la escala a un rango razonable', () => {
    expect(limitarEscala(0.1)).toBe(PX_POR_CM_MIN);
    expect(limitarEscala(1000)).toBe(PX_POR_CM_MAX);
  });

  it('calibrar con la tarjeta: un ancho de 171,2 px equivale a 20 px por cm', () => {
    expect(pxPorCmDesdeTarjeta(171.2)).toBeCloseTo(20, 5);
  });

  it('la medida aplica al alto o al ancho según el tipo', () => {
    expect(dimensionesEnPx(0.5, 10, 'alto', 10)).toEqual({ w: 50, h: 100 });
    expect(dimensionesEnPx(2, 10, 'largo', 10)).toEqual({ w: 100, h: 50 });
    expect(dimensionesEnPx(1, 26, 'diametro', 10)).toEqual({ w: 260, h: 260 });
  });

  it('el pellizco escala en proporción y no se rompe con distancia inicial cero', () => {
    expect(escalaPorPellizco(10, 100, 150)).toBe(15);
    expect(escalaPorPellizco(10, 0, 150)).toBe(10);
    expect(escalaPorPellizco(10, 100, 100000)).toBe(PX_POR_CM_MAX);
  });
});
