import { describe, expect, it } from 'vitest';
import { LARGO, centroDelTunel, distanciaZ, poseCamara } from './camera-path';

describe('poseCamara', () => {
  it('empieza en el origen y termina al final del túnel', () => {
    const [x, y, z] = poseCamara(0).pos;
    expect(x).toBeCloseTo(0, 6);
    expect(y).toBeCloseTo(0.5 * Math.sin(1), 6);
    expect(z).toBeCloseTo(0, 6);
    expect(poseCamara(1).pos[2]).toBeCloseTo(-LARGO, 6);
  });

  it('el progreso fuera de rango se acota a 0..1', () => {
    expect(poseCamara(-3).pos[2]).toBeCloseTo(0, 6);
    expect(poseCamara(7).pos[2]).toBeCloseTo(-LARGO, 6);
  });

  it('avanza siempre hacia -z (nunca retrocede)', () => {
    let anterior = poseCamara(0).pos[2];
    for (let p = 0.01; p <= 1; p += 0.01) {
      const z = poseCamara(p).pos[2];
      expect(z).toBeLessThanOrEqual(anterior);
      anterior = z;
    }
  });

  it('es continua: dos progresos vecinos dan poses vecinas', () => {
    for (let p = 0; p < 0.99; p += 0.01) {
      const a = poseCamara(p).pos, b = poseCamara(p + 0.001).pos;
      expect(Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2])).toBeLessThan(0.6);
    }
  });

  it('siempre mira hacia adelante', () => {
    for (let p = 0; p <= 1; p += 0.05) {
      const { pos, mira } = poseCamara(p);
      expect(mira[2]).toBeLessThan(pos[2]);
    }
  });

  it('la distancia a un objeto baja a cero al pasar por su z', () => {
    const z = centroDelTunel(0.4)[2];
    expect(distanciaZ(0.4, z)).toBeCloseTo(0, 6);
    expect(distanciaZ(0.2, z)).toBeGreaterThan(0);
  });
});
