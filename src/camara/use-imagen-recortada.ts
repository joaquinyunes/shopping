import { useEffect, useState } from 'react';
import { recortarImagen, type ImagenRecortada } from '../lib/recortar-imagen';

/** Foto del producto sin fondo, para superponerla sobre la cámara sin un cuadrado blanco. */
export function useImagenRecortada(url: string): ImagenRecortada | null {
  const [resultado, setResultado] = useState<{ url: string; imagen: ImagenRecortada } | null>(null);

  useEffect(() => {
    let cancelado = false;
    let objeto: string | null = null;
    recortarImagen(url)
      .then(imagen => {
        if (cancelado) { if (imagen.src.startsWith('blob:')) URL.revokeObjectURL(imagen.src); return; }
        if (imagen.src.startsWith('blob:')) objeto = imagen.src;
        setResultado({ url, imagen });
      })
      .catch(() => { if (!cancelado) setResultado({ url, imagen: { src: url, aspecto: 1, multiply: true } }); });
    return () => { cancelado = true; if (objeto) URL.revokeObjectURL(objeto); };
  }, [url]);

  return resultado && resultado.url === url ? resultado.imagen : null;
}
