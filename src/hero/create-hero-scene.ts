import * as THREE from 'three';
import { construirCortinas } from './build-cortinas';
import { construirLuces } from './build-luces';
import { construirObjetos } from './build-objetos';
import { construirPasillo } from './build-pasillo';
import { construirPortal } from './build-portal';
import { construirTarjeta } from './build-tarjeta';
import { centroDelTunel, poseCamara } from './camera-path';
import type { Hito } from './hitos';
import { PALETA } from './paleta';
import { escalaPorDistancia, posicionTarjeta } from './tarjeta-layout';

export interface OpcionesEscena {
  canvas: HTMLCanvasElement;
  contenedor: HTMLElement;
  hitos: Hito[];
  urlFrente: string;
  /** Progreso del viaje (0..1) según el scroll: la escena lo lee en cada cuadro. */
  leerProgreso: () => number;
  /** La escena no puede seguir (fallas repetidas o contexto perdido): la UI vuelve al hero estático. */
  alAbandonar: (motivo: string) => void;
  /** ¿El componente se desmontó mientras la escena cargaba? */
  estaCancelado: () => boolean;
  limitado: boolean;
}

export interface EscenaHero { destruir(): void }

const MAX_FALLOS_SEGUIDOS = 5;

interface TarjetaEnEscena { malla: THREE.Mesh; hito: Hito; base: THREE.Vector3; ancho: number; rotZ: number; golpe: number }

/** Libera geometrías, materiales y texturas de todo lo que cuelga de la escena. */
function liberar(raiz: THREE.Object3D) {
  raiz.traverse(obj => {
    const o = obj as THREE.Mesh;
    o.geometry?.dispose();
    const materiales = Array.isArray(o.material) ? o.material : o.material ? [o.material] : [];
    for (const m of materiales) {
      const dato = m as THREE.Material & { map?: THREE.Texture | null; uniforms?: Record<string, { value: unknown }> };
      dato.map?.dispose();
      for (const u of Object.values(dato.uniforms ?? {})) if (u.value instanceof THREE.Texture) u.value.dispose();
      m.dispose();
    }
    if (obj instanceof THREE.InstancedMesh) obj.dispose();
  });
}

/** Orquesta renderer, bucle, resize y limpieza. Cada pieza visual vive en su propio build-*.ts. */
export async function crearEscenaHero(op: OpcionesEscena): Promise<EscenaHero> {
  const dpr = Math.min(window.devicePixelRatio || 1, op.limitado ? 1.5 : 2);

  // Primero lo que no necesita WebGL (fotos y portal). Si el montaje se canceló mientras cargaba, no se crea
  // el renderer: dos escenas sobre el mismo canvas se pisarían el contexto (pasa en desarrollo con StrictMode).
  // Una tarjeta o el portal que no cargan se omiten; la escena sigue.
  const [mallas, portal] = await Promise.all([
    Promise.all(op.hitos.map(h => construirTarjeta(h.producto))),
    construirPortal(op.urlFrente).catch(() => null),
  ]);
  if (op.estaCancelado()) {
    for (const m of mallas) if (m) liberar(m);
    if (portal) liberar(portal.grupo);
    return { destruir() { /* nada que liberar */ } };
  }

  const renderer = new THREE.WebGLRenderer({ canvas: op.canvas, antialias: !op.limitado, powerPreference: 'high-performance' });
  renderer.setPixelRatio(dpr);
  renderer.setClearColor(PALETA.fondo, 1);

  const escena = new THREE.Scene();
  escena.fog = new THREE.Fog(PALETA.fondo, 40, 130);
  const camara = new THREE.PerspectiveCamera(62, 1, 0.1, 400);
  escena.add(new THREE.AmbientLight(0xffe9cf, 0.55));
  // Una sola luz cálida que acompaña a la cámara: el pasillo se ilumina donde se mira, sin sombras ni reflejos en tiempo real.
  const luzCamara = new THREE.PointLight(0xffd9a8, 80, 48, 1.4);
  escena.add(luzCamara);

  const pasillo = construirPasillo();
  const cortinas = construirCortinas(escena.fog);
  const luces = construirLuces(op.limitado);
  const objetos = construirObjetos(op.hitos.map(h => centroDelTunel(h.t)[2]), op.limitado);
  escena.add(pasillo, cortinas.grupo, luces.grupo, objetos.grupo);

  const tarjetas: TarjetaEnEscena[] = [];
  mallas.forEach((malla, i) => {
    if (!malla) return;
    escena.add(malla);
    tarjetas.push({ malla, hito: op.hitos[i], base: new THREE.Vector3(), ancho: 1, rotZ: 0, golpe: -1e9 });
  });
  if (portal) escena.add(portal.grupo);

  let destruida = false;
  let aspecto = 1, tiempo = 0;
  function ubicarEnLayout() {
    for (const s of tarjetas) {
      const p = posicionTarjeta(s.hito, aspecto);
      s.base.set(...p.pos);
      s.ancho = p.ancho;
      s.rotZ = p.rotZ;
      s.malla.position.copy(s.base);
    }
  }

  function redimensionar() {
    const w = Math.max(1, op.contenedor.clientWidth), h = Math.max(1, op.contenedor.clientHeight);
    renderer.setSize(w, h, false);
    camara.aspect = w / h;
    camara.updateProjectionMatrix();
    aspecto = w / h;
    ubicarEnLayout();
    objetos.ajustarAspecto(aspecto, tiempo);
  }
  redimensionar();
  const observadorTamano = new ResizeObserver(redimensionar);
  observadorTamano.observe(op.contenedor);

  // Parallax con el mouse (en pantallas táctiles no hay hover y queda en 0)
  let mxObjetivo = 0, myObjetivo = 0, mx = 0, my = 0;
  // Mouse sobre el canvas (no sobre botones): se resalta lo que queda debajo. Se evalúa en cada cuadro porque la cámara se mueve sola.
  let mouseEnCanvas = false, mouseX = 0, mouseY = 0;
  const alMoverMouse = (e: PointerEvent) => {
    if (e.pointerType !== 'mouse') return;
    mxObjetivo = (e.clientX / window.innerWidth - 0.5) * 2;
    myObjetivo = (e.clientY / window.innerHeight - 0.5) * 2;
    mouseEnCanvas = e.target === op.canvas;
    mouseX = e.clientX; mouseY = e.clientY;
  };
  window.addEventListener('pointermove', alMoverMouse, { passive: true });

  // Tocar lo que flota: objetos y tarjetas rebotan. Cuenta como toque solo si el dedo casi no se movió, así el scroll no se toca.
  const rayo = new THREE.Raycaster(), ndc = new THREE.Vector2();
  type Tocado = { objeto: number } | { tarjeta: TarjetaEnEscena };
  function tocadoEn(x: number, y: number): Tocado | null {
    const r = op.canvas.getBoundingClientRect();
    ndc.set(((x - r.left) / r.width) * 2 - 1, -((y - r.top) / r.height) * 2 + 1);
    rayo.setFromCamera(ndc, camara);
    const visibles = tarjetas.filter(s => s.malla.visible);
    const tarjeta = rayo.intersectObjects(visibles.map(s => s.malla), false)[0];
    const objeto = objetos.elegir(rayo.ray);
    if (tarjeta && (!objeto || tarjeta.distance < objeto.distancia)) return { tarjeta: visibles.find(s => s.malla === tarjeta.object)! };
    return objeto ? { objeto: objeto.id } : null;
  }
  let toque: { x: number; y: number; ms: number } | null = null;
  const alBajar = (e: PointerEvent) => { if (e.isPrimary) toque = { x: e.clientX, y: e.clientY, ms: performance.now() }; };
  const alSubir = (e: PointerEvent) => {
    const t = toque;
    toque = null;
    if (!t || performance.now() - t.ms > 500 || Math.hypot(e.clientX - t.x, e.clientY - t.y) > 10) return;
    const tocado = tocadoEn(e.clientX, e.clientY);
    if (!tocado) return;
    if ('objeto' in tocado) objetos.golpear(tocado.objeto, tiempo); else tocado.tarjeta.golpe = tiempo;
  };
  const alCancelarToque = () => { toque = null; };
  const alSalirMouse = () => { mouseEnCanvas = false; };
  op.canvas.addEventListener('pointerdown', alBajar);
  op.canvas.addEventListener('pointerup', alSubir);
  op.canvas.addEventListener('pointercancel', alCancelarToque);
  op.canvas.addEventListener('pointerleave', alSalirMouse);

  function abandonar(motivo: string) {
    if (destruida) return;
    console.warn(`Hero 3D abandonado: ${motivo}`);
    op.alAbandonar(motivo);
  }
  const alPerderContexto = (e: Event) => { e.preventDefault(); abandonar('se perdió el contexto WebGL'); };
  op.canvas.addEventListener('webglcontextlost', alPerderContexto);

  // Bucle: se pausa fuera de pantalla y con la pestaña oculta
  let rafId = 0, ultimo = 0, pActual = op.leerProgreso(), velocidad = 0, fallosSeguidos = 0;
  let enPantalla = true;

  function cuadro(ahora: number) {
    rafId = requestAnimationFrame(cuadro);
    const dt = Math.min(0.05, (ahora - ultimo) / 1000 || 0.016);
    ultimo = ahora;
    tiempo += dt;
    try {
      const previo = pActual;
      pActual += (op.leerProgreso() - pActual) * (1 - Math.exp(-dt * 7)); // inercia del progreso
      const instantanea = Math.min(1, Math.abs(pActual - previo) / dt / 0.35);
      velocidad += (instantanea - velocidad) * (1 - Math.exp(-dt * 8));
      mx += (mxObjetivo - mx) * (1 - Math.exp(-dt * 4));
      my += (myObjetivo - my) * (1 - Math.exp(-dt * 4));

      const pose = poseCamara(pActual);
      camara.fov = pose.fov + velocidad * 9;
      camara.updateProjectionMatrix();
      camara.position.set(pose.pos[0] + mx * 0.4, pose.pos[1] - my * 0.25, pose.pos[2]);
      camara.lookAt(pose.mira[0] - mx * 0.25, pose.mira[1] + my * 0.12, pose.mira[2]);
      camara.rotateZ(pose.roll);
      luzCamara.position.set(camara.position.x, camara.position.y + 1.4, camara.position.z - 4);

      cortinas.actualizar(tiempo, velocidad);
      luces.actualizar(tiempo, velocidad);
      objetos.actualizar(tiempo, camara.position.z);
      const bajoMouse = mouseEnCanvas ? tocadoEn(mouseX, mouseY) : null;
      objetos.resaltar(bajoMouse && 'objeto' in bajoMouse ? bajoMouse.objeto : null);
      op.canvas.style.cursor = bajoMouse ? 'pointer' : '';
      portal?.actualizar(tiempo, pActual);

      tarjetas.forEach((s, i) => {
        const distancia = camara.position.z - s.base.z;
        const k = escalaPorDistancia(distancia);
        s.malla.visible = k > 0.001 && distancia > -4;
        if (!s.malla.visible) return;
        const desdeGolpe = Math.max(0, tiempo - s.golpe), vivo = Math.exp(-desdeGolpe * 4);
        s.malla.position.y = s.base.y + Math.sin(tiempo * 1.2 + i * 1.7) * 0.09 + Math.abs(Math.sin(desdeGolpe * 8)) * vivo * 0.35;
        s.malla.scale.setScalar(s.ancho * k * (1 + 0.12 * vivo * Math.cos(desdeGolpe * 14)));
        s.malla.lookAt(camara.position);
        s.malla.rotateZ(s.rotZ + Math.sin(tiempo * 0.8 + i) * 0.02 + Math.sin(desdeGolpe * 12) * vivo * 0.25);
      });

      renderer.render(escena, camara);
      fallosSeguidos = 0;
    } catch (error) {
      console.warn('Falló un cuadro del hero 3D', error);
      if (++fallosSeguidos >= MAX_FALLOS_SEGUIDOS) abandonar(`${MAX_FALLOS_SEGUIDOS} fallos seguidos`);
    }
  }

  function sincronizarBucle() {
    const debeCorrer = enPantalla && !document.hidden && !destruida;
    if (debeCorrer && !rafId) { ultimo = performance.now(); rafId = requestAnimationFrame(cuadro); }
    if (!debeCorrer && rafId) { cancelAnimationFrame(rafId); rafId = 0; }
  }
  const observadorVisible = new IntersectionObserver(entradas => { enPantalla = entradas[0]?.isIntersecting ?? true; sincronizarBucle(); });
  observadorVisible.observe(op.contenedor);
  document.addEventListener('visibilitychange', sincronizarBucle);
  sincronizarBucle();

  return {
    destruir() {
      if (destruida) return;
      destruida = true;
      sincronizarBucle();
      observadorTamano.disconnect();
      observadorVisible.disconnect();
      document.removeEventListener('visibilitychange', sincronizarBucle);
      window.removeEventListener('pointermove', alMoverMouse);
      op.canvas.removeEventListener('pointerdown', alBajar);
      op.canvas.removeEventListener('pointerup', alSubir);
      op.canvas.removeEventListener('pointercancel', alCancelarToque);
      op.canvas.removeEventListener('pointerleave', alSalirMouse);
      op.canvas.removeEventListener('webglcontextlost', alPerderContexto);
      liberar(escena);
      renderer.dispose();
      renderer.forceContextLoss();
    },
  };
}
