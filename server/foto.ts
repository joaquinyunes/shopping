/** Tipo de imagen según los primeros bytes (no se confía en lo que diga el navegador). */
export function tipoDeImagen(b: Uint8Array): 'image/jpeg' | 'image/png' | 'image/webp' | null {
  if (b.length > 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return 'image/jpeg';
  if (b.length > 7 && b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47) return 'image/png';
  const ascii = (desde: number, texto: string) => [...texto].every((c, i) => b[desde + i] === c.charCodeAt(0));
  if (b.length > 11 && ascii(0, 'RIFF') && ascii(8, 'WEBP')) return 'image/webp';
  return null;
}

/** Forma mínima que debe tener lo que guarda la dueña; el detalle se normaliza al leer. */
export function datosValidos(d: unknown): d is { tienda: object; productos: unknown[] } {
  if (!d || typeof d !== 'object') return false;
  const { tienda, productos } = d as Record<string, unknown>;
  return !!tienda && typeof tienda === 'object' && Array.isArray(productos) && productos.length <= 500;
}
