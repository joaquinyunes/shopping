import { useEffect, useRef, useState } from 'react';

export type EstadoCamara = 'pidiendo' | 'activa' | 'denegada' | 'sin-camara' | 'sin-https' | 'error';

/** Mensaje claro para cada situación en que no hay cámara; en todas se usa la mesa con cuadrícula de 5 cm. */
export const MENSAJES_CAMARA: Record<Exclude<EstadoCamara, 'pidiendo' | 'activa'>, string> = {
  denegada: 'No diste permiso a la cámara. Podés habilitarlo en el candado del navegador, o usar la mesa de abajo.',
  'sin-camara': 'Este dispositivo no tiene cámara disponible. Te mostramos el producto sobre una mesa con cuadrícula de 5 cm.',
  'sin-https': 'La cámara solo funciona en una página segura (https). Te mostramos el producto sobre una mesa con cuadrícula de 5 cm.',
  error: 'No pudimos abrir la cámara. Te mostramos el producto sobre una mesa con cuadrícula de 5 cm.',
};

function estadoInicial(): EstadoCamara {
  if (!window.isSecureContext) return 'sin-https';
  if (!navigator.mediaDevices?.getUserMedia) return 'sin-camara';
  return 'pidiendo';
}

/** Cámara trasera en vivo. Al desmontar apaga todas las pistas (se apaga la luz de la cámara). */
export function useCamaraStream() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [estado, setEstado] = useState<EstadoCamara>(estadoInicial);

  useEffect(() => {
    if (estado !== 'pidiendo') return;
    let cancelado = false;
    let flujo: MediaStream | null = null;

    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } }, audio: false })
      .then(s => {
        if (cancelado) { s.getTracks().forEach(t => t.stop()); return; }
        flujo = s;
        const video = videoRef.current;
        if (video) { video.srcObject = s; video.play().catch(() => { /* autoplay bloqueado: el usuario toca y se ve */ }); }
        setEstado('activa');
      })
      .catch((e: unknown) => {
        if (cancelado) return;
        const nombre = e instanceof DOMException ? e.name : '';
        setEstado(nombre === 'NotAllowedError' || nombre === 'SecurityError' ? 'denegada'
          : nombre === 'NotFoundError' || nombre === 'OverconstrainedError' ? 'sin-camara' : 'error');
      });

    return () => { cancelado = true; flujo?.getTracks().forEach(t => t.stop()); };
    // solo al montar: el estado inicial decide si se pide la cámara
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { videoRef, estado };
}
