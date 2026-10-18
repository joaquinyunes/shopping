import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { mulberry32 } from './aleatorio';
import { ejeEn } from './build-pasillo';
import { LARGO } from './camera-path';
import { PALETA } from './paleta';

export interface Objetos {
  grupo: THREE.Group;
  actualizar(tiempo: number, camaraZ: number): void;
  /** Con pantallas angostas los objetos se acercan al eje para que entren en cuadro. */
  ajustarAspecto(aspecto: number, tiempo: number): void;
  /** Objeto flotante más cercano que atraviesa el rayo (con margen para dedos), o null. */
  elegir(rayo: THREE.Ray): { id: number; distancia: number } | null;
  /** Lo marca con el mouse encima (o null). */
  resaltar(id: number | null): void;
  /** Lo hace rebotar y girar. */
  golpear(id: number, tiempo: number): void;
}

const caja = (x: number, y: number, z: number, px = 0, py = 0, pz = 0) => new THREE.BoxGeometry(x, y, z).translate(px, py, pz);
const unir = (partes: THREE.BufferGeometry[]) => mergeGeometries(partes)!;

/** Perfil de revolución (copas, floreros): puntos [radio, altura]. */
const torno = (puntos: Array<[number, number]>) => new THREE.LatheGeometry(puntos.map(([r, y]) => new THREE.Vector2(r, y)), 20);

interface Tipo {
  nombre: string;
  geometria: THREE.BufferGeometry;
  material: THREE.Material;
  colores: number[];
  escala: number;
}

/** Cosas de casa sencillas, hechas con primitivas: platos, copas, bandejas, cubiertos, manijas, organizadores y floreros. */
function tipos(): Tipo[] {
  const mate = (extra: THREE.MeshStandardMaterialParameters = {}) => new THREE.MeshStandardMaterial({ roughness: 0.65, ...extra });
  const metal = new THREE.MeshStandardMaterial({ color: 0xc9a15b, roughness: 0.35, metalness: 0.55 });
  const vidrio = new THREE.MeshStandardMaterial({ color: 0xdfeee9, roughness: 0.1, transparent: true, opacity: 0.55 });
  const cuchara = unir([
    new THREE.CapsuleGeometry(0.035, 0.8, 4, 8).rotateZ(Math.PI / 2),
    new THREE.SphereGeometry(0.17, 12, 8).scale(1.1, 0.25, 0.8).translate(0.55, 0, 0),
  ]);
  const tenedor = unir([
    new THREE.CapsuleGeometry(0.035, 0.7, 4, 8).rotateZ(Math.PI / 2),
    caja(0.26, 0.03, 0.22, 0.5, 0, 0),
    ...[-0.08, 0, 0.08].map(z => caja(0.26, 0.03, 0.03, 0.74, 0, z)),
  ]);
  const manija = unir([
    new THREE.TorusGeometry(0.3, 0.045, 8, 18, Math.PI).translate(0, 0.2, 0),
    new THREE.CylinderGeometry(0.05, 0.05, 0.2, 8).translate(-0.3, 0.1, 0),
    new THREE.CylinderGeometry(0.05, 0.05, 0.2, 8).translate(0.3, 0.1, 0),
  ]);
  const organizador = unir([
    caja(1.1, 0.06, 0.75), caja(1.1, 0.35, 0.05, 0, 0.18, 0.35), caja(1.1, 0.35, 0.05, 0, 0.18, -0.35),
    caja(0.05, 0.35, 0.75, 0.52, 0.18, 0), caja(0.05, 0.35, 0.75, -0.52, 0.18, 0), caja(0.05, 0.3, 0.7, 0.1, 0.17, 0),
  ]);
  return [
    { nombre: 'plato', geometria: new THREE.CylinderGeometry(0.6, 0.42, 0.09, 28), material: mate(), colores: [PALETA.crema, PALETA.terracota, PALETA.salvia], escala: 1.3 },
    { nombre: 'copa', geometria: torno([[0, 0], [0.24, 0], [0.24, 0.02], [0.03, 0.05], [0.03, 0.34], [0.2, 0.45], [0.26, 0.7], [0.21, 0.82]]), material: vidrio, colores: [0xffffff], escala: 1.5 },
    { nombre: 'bandeja', geometria: unir([caja(1.7, 0.07, 1.05), caja(1.7, 0.14, 0.06, 0, 0.07, 0.5), caja(1.7, 0.14, 0.06, 0, 0.07, -0.5)]), material: mate(), colores: [PALETA.madera, PALETA.lino], escala: 1.2 },
    { nombre: 'cuchara', geometria: cuchara, material: metal, colores: [0xffffff], escala: 1.6 },
    { nombre: 'tenedor', geometria: tenedor, material: metal, colores: [0xffffff], escala: 1.6 },
    { nombre: 'manija', geometria: manija, material: metal, colores: [0xffffff], escala: 1.8 },
    { nombre: 'organizador', geometria: organizador, material: mate(), colores: [PALETA.salvia, PALETA.crema, PALETA.terracota], escala: 1.2 },
    { nombre: 'florero', geometria: torno([[0, 0], [0.26, 0], [0.36, 0.25], [0.3, 0.55], [0.14, 0.75], [0.17, 0.9]]), material: mate(), colores: [PALETA.salvia, PALETA.ambar, PALETA.crema], escala: 1.2 },
  ];
}

interface Estado {
  /** Eje del túnel en z y distancia lateral al eje: así se puede reacomodar según el aspecto sin rehacer el azar. */
  cx: number; dx: number; y: number; z: number; rx: number; ry: number; giro: number; fase: number;
  /** Instante del último golpe y sentido del giro que dejó. */
  golpe: number; sentido: number; giroExtra: number;
  /** 0..1: cuánto está resaltado por el mouse. */
  realce: number;
}

/** Margen sobre el radio real del objeto y tamaño mínimo (proporción de la distancia): los dedos no apuntan con precisión. */
const MARGEN_TOQUE = 1.15, MIN_TOQUE = 0.045;
/** Vueltas (en radianes) que da un objeto al tocarlo, y hasta qué distancia de la cámara se puede tocar. */
const GIRO_GOLPE = 14, DISTANCIA_TOQUE = 40;

/**
 * Objetos de casa flotando a los costados del pasillo. Se reparten con semilla fija y se saltean los tramos donde
 * va una tarjeta de producto, para no tapar lo que se vende.
 */
export function construirObjetos(zTarjetas: number[], limitado: boolean): Objetos {
  const grupo = new THREE.Group();
  const rnd = mulberry32(21);
  const porTipo = limitado ? 4 : 9;
  const lista = tipos().map(tipo => {
    const malla = new THREE.InstancedMesh(tipo.geometria, tipo.material, porTipo);
    const estados: Estado[] = [];
    for (let i = 0; i < porTipo; i++) {
      let z = 0;
      do { z = -4 - rnd() * (LARGO - 8); } while (zTarjetas.some(zt => Math.abs(z - zt) < 5.5));
      const lado = rnd() < 0.5 ? -1 : 1, [cx, cy] = ejeEn(z);
      estados.push({ cx, dx: lado * (2.5 + rnd() * 2.3), y: cy - 1.2 + rnd() * 4, z, rx: rnd() * 6, ry: rnd() * 6, giro: 0.15 + rnd() * 0.4, fase: rnd() * 6, golpe: -1e9, sentido: 1, giroExtra: 0, realce: 0 });
      malla.setColorAt(i, new THREE.Color(tipo.colores[i % tipo.colores.length]));
    }
    grupo.add(malla);
    tipo.geometria.computeBoundingSphere();
    return { malla, estados, escala: tipo.escala, radio: tipo.geometria.boundingSphere!.radius * tipo.escala };
  });
  // Cada objeto tiene un id plano (tipo * porTipo + índice) para que la escena no conozca la estructura interna.
  const deId = (id: number) => ({ lote: lista[Math.floor(id / porTipo)], i: id % porTipo });
  let lateral = 1, resaltado: number | null = null;

  const o = new THREE.Object3D(), centro = new THREE.Vector3(), esfera = new THREE.Sphere();
  /** Con `soloCerca` los objetos lejanos no se recalculan: quedan como los dejó la pasada inicial. */
  function colocar(t: number, camaraZ: number, soloCerca: boolean) {
    lista.forEach(({ malla, estados, escala }, tipo) => {
      estados.forEach((e, i) => {
        if (soloCerca && Math.abs(e.z - camaraZ) > 80) return;
        e.realce += ((resaltado === tipo * porTipo + i ? 1 : 0) - e.realce) * 0.2;
        // Golpe: rebote que se apaga rápido, giro extra que se frena y un "pop" de tamaño.
        const k = Math.max(0, t - e.golpe), vivo = Math.exp(-k * 3);
        o.position.set(e.cx + e.dx * lateral, e.y + Math.sin(t * 0.8 + e.fase) * 0.18 + Math.abs(Math.sin(k * 9)) * vivo * 0.9, e.z);
        o.rotation.set(e.rx + t * e.giro * 0.4, e.ry + t * e.giro + e.giroExtra + e.sentido * GIRO_GOLPE * (1 - Math.exp(-k * 2.2)), 0);
        o.scale.setScalar(escala * (1 + 0.55 * vivo * Math.cos(k * 11) + 0.18 * e.realce));
        o.updateMatrix();
        malla.setMatrixAt(i, o.matrix);
      });
      malla.instanceMatrix.needsUpdate = true;
    });
  }
  colocar(0, 0, false); // sin esto, los lejanos quedarían con la matriz identidad: en el origen, pegados a la cámara
  return {
    grupo,
    actualizar: (t, camaraZ) => colocar(t, camaraZ, true),
    ajustarAspecto(aspecto, t) {
      lateral = Math.min(1, Math.max(0.55, aspecto / 1.4));
      colocar(t, 0, false);
    },
    elegir(rayo) {
      let mejor: { id: number; distancia: number } | null = null;
      lista.forEach(({ estados, radio }, tipo) => {
        estados.forEach((e, i) => {
          centro.set(e.cx + e.dx * lateral, e.y, e.z);
          const cerca = rayo.origin.distanceTo(centro);
          if (cerca > DISTANCIA_TOQUE) return;
          esfera.set(centro, Math.max(radio * MARGEN_TOQUE, cerca * MIN_TOQUE));
          const punto = rayo.intersectSphere(esfera, centro.clone());
          if (!punto) return;
          const d = rayo.origin.distanceTo(punto);
          if (!mejor || d < mejor.distancia) mejor = { id: tipo * porTipo + i, distancia: d };
        });
      });
      return mejor;
    },
    resaltar(id) { resaltado = id; },
    golpear(id, t) {
      const { lote, i } = deId(id), e = lote.estados[i];
      // Lo que ya giró se guarda: el nuevo golpe sigue desde donde está, sin saltos.
      e.giroExtra += e.sentido * GIRO_GOLPE * (1 - Math.exp(-Math.max(0, t - e.golpe) * 2.2));
      e.sentido = Math.random() < 0.5 ? -1 : 1;
      e.golpe = t;
    },
  };
}
