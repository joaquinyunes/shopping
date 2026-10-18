import * as THREE from 'three';
import { cargarImagen } from '../lib/cargar-imagen';

/** Textura sRGB desde una URL; devuelve null si falla (la escena sigue sin esa pieza). */
export async function cargarTextura(url: string): Promise<THREE.Texture | null> {
  try {
    const textura = new THREE.Texture(await cargarImagen(url));
    textura.colorSpace = THREE.SRGBColorSpace;
    textura.anisotropy = 4;
    textura.needsUpdate = true;
    return textura;
  } catch {
    return null;
  }
}
