import * as THREE from 'three';
import { LARGO, PASILLO } from './camera-path';
import { ejeEn } from './build-pasillo';
import { instanciar } from './instanciar';
import { PALETA } from './paleta';
import { texturaVentana } from './texturas-hogar';

const { medioAncho: W, piso, techo } = PASILLO;
const SEPARACION = 15;
const ALTO_CORTINA = techo - piso - 0.2;

export interface Cortinas {
  grupo: THREE.Group;
  /** viento 0..1: se mueven más cuando el scroll es rápido. */
  actualizar(tiempo: number, viento: number): void;
}

const VERTEX = /* glsl */ `
  uniform float uT; uniform float uViento;
  varying vec2 vUv; varying float vPliegue; varying float vProf;
  void main() {
    vUv = uv;
    mat4 m = modelMatrix * instanceMatrix;
    vec3 p = position;
    float pliegue = sin(p.x * 14.0);
    float cae = 1.0 - uv.y; // 0 arriba (colgada), 1 abajo (se mueve más)
    p.z += pliegue * 0.07 + sin(uT * 0.9 + p.y * 0.5 + m[3].z) * (0.03 + uViento * 0.14) * cae;
    vPliegue = pliegue;
    vec4 mv = viewMatrix * m * vec4(p, 1.0);
    vProf = -mv.z;
    gl_Position = projectionMatrix * mv;
  }`;

const FRAGMENT = /* glsl */ `
  uniform vec3 uColor; uniform vec3 uNiebla; uniform float uCerca; uniform float uLejos;
  varying vec2 vUv; varying float vPliegue; varying float vProf;
  void main() {
    float luz = (0.72 + 0.28 * vPliegue) * (0.7 + 0.3 * vUv.y);
    vec3 c = mix(uColor * luz, uNiebla, smoothstep(uCerca, uLejos, vProf));
    gl_FragColor = vec4(c, 1.0);
    #include <colorspace_fragment>
  }`;

/** Ventanas con luz cálida y dos paneles de cortina de lino a cada lado, con pliegues y balanceo en el vertex shader. */
export function construirCortinas(niebla: THREE.Fog): Cortinas {
  const grupo = new THREE.Group();
  const n = Math.floor((LARGO - 10) / SEPARACION);
  const zVentana = (k: number) => -10 - k * SEPARACION;
  const ladoDe = (k: number) => (k % 2 ? 1 : -1);

  const ventanas = instanciar(
    new THREE.PlaneGeometry(3.4, 5.2),
    new THREE.MeshBasicMaterial({ map: texturaVentana() }),
    n,
    (k, o) => {
      const z = zVentana(k), lado = ladoDe(k);
      o.position.set(ejeEn(z)[0] + lado * (W - 0.03), 0.9, z);
      o.rotation.y = -lado * Math.PI / 2;
    },
  );

  const material = new THREE.ShaderMaterial({
    side: THREE.DoubleSide,
    uniforms: {
      uT: { value: 0 }, uViento: { value: 0 }, uColor: { value: new THREE.Color(PALETA.lino) },
      uNiebla: { value: new THREE.Color(niebla.color) }, uCerca: { value: niebla.near }, uLejos: { value: niebla.far },
    },
    vertexShader: VERTEX, fragmentShader: FRAGMENT,
  });
  const paneles = instanciar(
    new THREE.PlaneGeometry(1.5, ALTO_CORTINA, 40, 2),
    material, 2 * n,
    (i, o) => {
      const k = i >> 1, z = zVentana(k) + (i & 1 ? 1.15 : -1.15), lado = ladoDe(k);
      o.position.set(ejeEn(z)[0] + lado * (W - 0.3), techo - 0.1 - ALTO_CORTINA / 2, z);
      o.rotation.y = -lado * Math.PI / 2;
    },
  );

  grupo.add(ventanas, paneles);
  return {
    grupo,
    actualizar(t, viento) {
      material.uniforms.uT.value = t;
      material.uniforms.uViento.value = viento;
    },
  };
}
