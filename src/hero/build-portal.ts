import * as THREE from 'three';
import { centroDelTunel, Z_PORTAL } from './camera-path';
import { cargarTextura } from './load-texture';
import { PALETA } from './paleta';

export interface Portal {
  grupo: THREE.Group;
  actualizar(tiempo: number, progreso: number): void;
}

/** Portal final: anillos que giran alrededor de un disco con el frente del local. Sin la foto, queda un disco ámbar. */
export async function construirPortal(urlFrente: string): Promise<Portal> {
  const grupo = new THREE.Group();
  const [cx, cy] = centroDelTunel(1);
  grupo.position.set(cx, cy, Z_PORTAL);

  const textura = await cargarTextura(urlFrente);
  const disco = new THREE.Mesh(
    new THREE.CircleGeometry(4.2, 64),
    textura
      ? new THREE.ShaderMaterial({
          uniforms: { uMap: { value: textura }, uAbre: { value: 0 } },
          vertexShader: /* glsl */ `
            varying vec2 vUv;
            void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
          fragmentShader: /* glsl */ `
            varying vec2 vUv; uniform sampler2D uMap; uniform float uAbre;
            void main() {
              vec2 c = vUv - 0.5;
              // la foto (16:9) se recorta al círculo y respira un poco
              vec2 uv = vec2(0.5 + c.x * 0.5625 * (1.0 - 0.15 * uAbre), 0.5 + c.y * (1.0 - 0.15 * uAbre));
              vec3 tex = texture2D(uMap, uv).rgb;
              float v = smoothstep(0.5, 0.2, length(c));
              gl_FragColor = vec4(mix(vec3(0.95, 0.79, 0.55), tex, 0.55 + 0.45 * uAbre) * (0.65 + 0.35 * v), 1.0);
            }`,
        })
      : new THREE.MeshBasicMaterial({ color: PALETA.ambar }),
  );
  grupo.add(disco);

  const anillos = [
    { r: 4.45, g: 0.2, color: PALETA.terracota, vel: 0.35 },
    { r: 5.0, g: 0.11, color: PALETA.salvia, vel: -0.5 },
    { r: 5.5, g: 0.07, color: PALETA.crema, vel: 0.7 },
  ].map(({ r, g, color, vel }) => {
    const m = new THREE.Mesh(new THREE.TorusGeometry(r, g, 16, 96), new THREE.MeshBasicMaterial({ color }));
    m.userData.vel = vel;
    grupo.add(m);
    return m;
  });

  return {
    grupo,
    actualizar(t, progreso) {
      for (const a of anillos) a.rotation.z = t * a.userData.vel;
      // La puerta recién se insinúa en el fondo cuando el pasillo ya va por la mitad: no tapa el arranque.
      const aparece = Math.min(1, Math.max(0, (progreso - 0.45) / 0.45));
      grupo.visible = aparece > 0;
      grupo.scale.setScalar(0.4 + 0.6 * aparece * aparece * (3 - 2 * aparece));
      if (disco.material instanceof THREE.ShaderMaterial) {
        disco.material.uniforms.uAbre.value = Math.max(0, Math.min(1, (progreso - 0.9) / 0.1));
      }
    },
  };
}
