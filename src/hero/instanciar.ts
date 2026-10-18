import * as THREE from 'three';

/** InstancedMesh con las matrices fijas que arma `colocar` sobre un Object3D limpio en cada instancia. */
export function instanciar(
  geometria: THREE.BufferGeometry, material: THREE.Material, n: number,
  colocar: (i: number, o: THREE.Object3D) => void,
) {
  const malla = new THREE.InstancedMesh(geometria, material, n);
  const o = new THREE.Object3D();
  for (let i = 0; i < n; i++) {
    o.position.set(0, 0, 0); o.rotation.set(0, 0, 0); o.scale.set(1, 1, 1);
    colocar(i, o);
    o.updateMatrix();
    malla.setMatrixAt(i, o.matrix);
  }
  malla.instanceMatrix.needsUpdate = true;
  return malla;
}
