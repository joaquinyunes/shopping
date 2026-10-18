import { BUCKET, SUPABASE_KEY, SUPABASE_URL, TABLA } from '../data/almacen';
import type { Datos } from '../tipos';

// El SDK se descarga solo al entrar al admin: la tienda pública lee por REST y no lo necesita.
export async function crearCliente() {
  const { createClient } = await import('@supabase/supabase-js');
  return createClient(SUPABASE_URL, SUPABASE_KEY);
}
export type ClienteNube = Awaited<ReturnType<typeof crearCliente>>;

export async function guardarEnNube(cliente: ClienteNube, datos: Datos) {
  const { error } = await cliente.from(TABLA).upsert({ id: 1, datos });
  if (error) throw error;
}

/** Sube la foto al bucket público y devuelve su URL pública. */
export async function subirFotoANube(cliente: ClienteNube, blob: Blob): Promise<string> {
  const nombre = `${crypto.randomUUID()}.jpg`;
  const { error } = await cliente.storage.from(BUCKET).upload(nombre, blob, { contentType: 'image/jpeg' });
  if (error) throw error;
  return cliente.storage.from(BUCKET).getPublicUrl(nombre).data.publicUrl;
}
