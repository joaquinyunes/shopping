import { describe, expect, it } from 'vitest';
import { decidirModo, detectarEquipoLimitado, type EntornoHero } from './modo-hero';

const base: EntornoHero = { heroActivo: true, reducedMotion: false, hayWebGL: true, equipoLimitado: false, eleccion: null, fallo: false };

describe('decidirModo', () => {
  it('con todo en orden muestra el viaje 3D', () => expect(decidirModo(base).modo).toBe('3d'));

  it('si la dueña apaga el hero, es estático y sin botón para activar', () => {
    expect(decidirModo({ ...base, heroActivo: false })).toEqual({ modo: 'estatico', motivo: 'apagado', puedeActivar: false });
  });

  it('sin WebGL o tras una falla es estático y no ofrece activar (no serviría)', () => {
    expect(decidirModo({ ...base, hayWebGL: false })).toMatchObject({ modo: 'estatico', motivo: 'sin-webgl', puedeActivar: false });
    expect(decidirModo({ ...base, fallo: true })).toMatchObject({ modo: 'estatico', motivo: 'fallo', puedeActivar: false });
  });

  it('reduced-motion y equipo limitado arrancan estáticos pero ofrecen activar', () => {
    expect(decidirModo({ ...base, reducedMotion: true })).toMatchObject({ modo: 'estatico', motivo: 'movimiento', puedeActivar: true });
    expect(decidirModo({ ...base, equipoLimitado: true })).toMatchObject({ modo: 'estatico', motivo: 'equipo', puedeActivar: true });
  });

  it('la elección de la clienta gana sobre reduced-motion y equipo limitado', () => {
    expect(decidirModo({ ...base, reducedMotion: true, equipoLimitado: true, eleccion: 'on' }).modo).toBe('3d');
    expect(decidirModo({ ...base, eleccion: 'off' })).toMatchObject({ modo: 'estatico', motivo: 'elegido', puedeActivar: true });
  });

  it('pero elegir "on" no puede forzar 3D si no hay WebGL', () => {
    expect(decidirModo({ ...base, hayWebGL: false, eleccion: 'on' }).modo).toBe('estatico');
  });
});

describe('detectarEquipoLimitado', () => {
  const nav = (o: object) => o as Navigator;
  it('detecta poca memoria, pocos núcleos, ahorro de datos y 2g', () => {
    expect(detectarEquipoLimitado(nav({ deviceMemory: 2 }))).toBe(true);
    expect(detectarEquipoLimitado(nav({ hardwareConcurrency: 2 }))).toBe(true);
    expect(detectarEquipoLimitado(nav({ connection: { saveData: true } }))).toBe(true);
    expect(detectarEquipoLimitado(nav({ connection: { effectiveType: '2g' } }))).toBe(true);
  });
  it('un equipo normal no se marca como limitado', () => {
    expect(detectarEquipoLimitado(nav({ deviceMemory: 8, hardwareConcurrency: 8 }))).toBe(false);
    expect(detectarEquipoLimitado(nav({}))).toBe(false);
  });
});
