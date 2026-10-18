/** Carga una imagen lista para dibujar en un canvas (con CORS, para poder leer sus píxeles). */
export function cargarImagen(url: string): Promise<HTMLImageElement> {
  return new Promise((ok, mal) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.decoding = 'async';
    img.onload = () => ok(img);
    img.onerror = () => mal(new Error(`No se pudo cargar ${url}`));
    img.src = url;
  });
}
