import * as THREE from 'three';
import { mulberry32 } from './aleatorio';
import { ejeEn } from './build-pasillo';
import { LARGO, PASILLO } from './camera-path';
import { instanciar } from './instanciar';
import { PALETA } from './paleta';

export interface Luces {
  grupo: THREE.Group;
  /** velocidad 0..1: las motas de polvo brillan más cuando el scroll es rápido. */
  actualizar(tiempo: number, velocidad: number): void;
}

const SEPARACION = 14;

/** Lámparas colgantes de luz cálida y motas de polvo flotando en el aire. */
export function construirLuces(limitado: boolean): Luces {
  const grupo = new THREE.Group();
  const n = Math.floor((LARGO + 10) / SEPARACION);
  const zLampara = (i: number) => 5 - i * SEPARACION;
  const xLampara = (i: number, z: number) => ejeEn(z)[0] + (i % 2 ? 2.8 : -2.8);
  const largoCable = 1.3;

  const cables = instanciar(
    new THREE.CylinderGeometry(0.012, 0.012, largoCable, 4),
    new THREE.MeshBasicMaterial({ color: PALETA.maderaOsc }), n,
    (i, o) => { const z = zLampara(i); o.position.set(xLampara(i, z), PASILLO.techo - largoCable / 2, z); },
  );
  const pantallas = instanciar(
    new THREE.SphereGeometry(0.4, 16, 8, 0, Math.PI * 2, 0, Math.PI * 0.6),
    new THREE.MeshBasicMaterial({ color: PALETA.ambar, side: THREE.DoubleSide }), n,
    (i, o) => { const z = zLampara(i); o.position.set(xLampara(i, z), PASILLO.techo - largoCable - 0.25, z); },
  );
  const bombillas = instanciar(
    new THREE.SphereGeometry(0.13, 8, 6),
    new THREE.MeshBasicMaterial({ color: 0xfff3d6 }), n,
    (i, o) => { const z = zLampara(i); o.position.set(xLampara(i, z), PASILLO.techo - largoCable - 0.2, z); },
  );

  const rnd = mulberry32(3);
  const cantidad = limitado ? 250 : 550;
  const pos = new Float32Array(cantidad * 3);
  for (let i = 0; i < cantidad; i++) {
    const z = 10 - rnd() * (LARGO + 20), [cx, cy] = ejeEn(z);
    pos.set([cx + (rnd() - 0.5) * 2 * (PASILLO.medioAncho - 0.5), cy - 2 + rnd() * 6, z], i * 3);
  }
  const geometria = new THREE.BufferGeometry();
  geometria.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const materialMotas = new THREE.PointsMaterial({
    color: PALETA.ambar, size: 0.09, transparent: true, opacity: 0.5, depthWrite: false, blending: THREE.AdditiveBlending,
  });
  const motas = new THREE.Points(geometria, materialMotas);

  grupo.add(cables, pantallas, bombillas, motas);
  return {
    grupo,
    actualizar(t, velocidad) {
      motas.position.y = Math.sin(t * 0.3) * 0.15;
      materialMotas.opacity = 0.4 + velocidad * 0.45;
    },
  };
}
