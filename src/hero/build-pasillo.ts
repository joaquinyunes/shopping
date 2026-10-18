import * as THREE from 'three';
import { centroDelTunel, LARGO, PASILLO } from './camera-path';
import { instanciar } from './instanciar';
import { PALETA } from './paleta';
import { texturaLino, texturaMadera } from './texturas-hogar';

const { medioAncho: W, piso, techo, tramo } = PASILLO;
const LARGO_TOTAL = LARGO + 30;
export const N_TRAMOS = Math.ceil(LARGO_TOTAL / tramo);
/** z del centro de cada tramo: arranca detrás de la cámara (z=10) y termina pasado el portal. */
const zTramo = (i: number) => 10 - tramo * (i + 0.5);
/** El pasillo serpentea igual que la cámara: x e y del eje en un z dado. */
export const ejeEn = (z: number) => centroDelTunel(-z / LARGO);

/** Piso de tablones, paredes de lino, techo con vigas y zócalos. Todo con InstancedMesh: pocas llamadas de dibujo. */
export function construirPasillo(): THREE.Group {
  const grupo = new THREE.Group();
  const alto = techo - piso;

  const piso3 = instanciar(
    new THREE.PlaneGeometry(2 * W, tramo).rotateX(-Math.PI / 2),
    new THREE.MeshStandardMaterial({ map: texturaMadera(2, 1), roughness: 0.55 }),
    N_TRAMOS, (i, o) => { const z = zTramo(i); o.position.set(ejeEn(z)[0], piso, z); },
  );

  const paredes = instanciar(
    new THREE.PlaneGeometry(tramo, alto),
    new THREE.MeshStandardMaterial({ map: texturaLino(3, 2), roughness: 0.95, side: THREE.DoubleSide }),
    2 * N_TRAMOS,
    (i, o) => {
      const lado = i < N_TRAMOS ? -1 : 1, z = zTramo(i % N_TRAMOS);
      o.position.set(ejeEn(z)[0] + lado * W, piso + alto / 2, z);
      o.rotation.y = -lado * Math.PI / 2; // la cara mira hacia el centro del pasillo
    },
  );

  const techoMalla = instanciar(
    new THREE.PlaneGeometry(2 * W, tramo).rotateX(Math.PI / 2),
    new THREE.MeshStandardMaterial({ color: PALETA.maderaOsc, roughness: 0.9 }),
    N_TRAMOS, (i, o) => { const z = zTramo(i); o.position.set(ejeEn(z)[0], techo, z); },
  );

  const madera = new THREE.MeshStandardMaterial({ color: PALETA.maderaOsc, roughness: 0.7 });
  const nVigas = Math.floor(LARGO_TOTAL / 5);
  const vigas = instanciar(new THREE.BoxGeometry(2 * W, 0.3, 0.35), madera, nVigas, (i, o) => {
    const z = 10 - 5 * (i + 0.5);
    o.position.set(ejeEn(z)[0], techo - 0.15, z);
  });
  const zocalos = instanciar(new THREE.BoxGeometry(0.12, 0.45, tramo), madera, 2 * N_TRAMOS, (i, o) => {
    const lado = i < N_TRAMOS ? -1 : 1, z = zTramo(i % N_TRAMOS);
    o.position.set(ejeEn(z)[0] + lado * (W - 0.06), piso + 0.22, z);
  });

  // Pared del fondo, detrás del portal
  const fondo = new THREE.Mesh(
    new THREE.PlaneGeometry(2 * W, alto),
    new THREE.MeshStandardMaterial({ color: PALETA.maderaOsc, roughness: 1 }),
  );
  const zFondo = 10 - tramo * N_TRAMOS;
  fondo.position.set(ejeEn(zFondo)[0], piso + alto / 2, zFondo);

  grupo.add(piso3, paredes, techoMalla, vigas, zocalos, fondo);
  return grupo;
}
