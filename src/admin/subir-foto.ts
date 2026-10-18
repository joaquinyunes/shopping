/** Achica la foto en el teléfono antes de subirla: pesa menos y se sube rápido con datos móviles. */
export async function achicarFoto(archivo: File, ladoMax = 1000): Promise<Blob> {
  if (!archivo.type.startsWith('image/')) throw new Error('Ese archivo no es una imagen.');
  const bmp = await createImageBitmap(archivo, { imageOrientation: 'from-image' });
  const k = Math.min(1, ladoMax / Math.max(bmp.width, bmp.height));
  const lienzo = document.createElement('canvas');
  lienzo.width = Math.round(bmp.width * k);
  lienzo.height = Math.round(bmp.height * k);
  lienzo.getContext('2d')!.drawImage(bmp, 0, 0, lienzo.width, lienzo.height);
  bmp.close();
  return new Promise((ok, mal) => lienzo.toBlob(b => (b ? ok(b) : mal(new Error('No se pudo procesar la foto.'))), 'image/jpeg', 0.84));
}

export function blobComoDataUrl(blob: Blob): Promise<string> {
  return new Promise((ok, mal) => {
    const lector = new FileReader();
    lector.onload = () => ok(String(lector.result));
    lector.onerror = () => mal(new Error('No se pudo leer la foto.'));
    lector.readAsDataURL(blob);
  });
}
