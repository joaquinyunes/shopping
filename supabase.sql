-- Correr una sola vez en Supabase → SQL Editor.
-- Toda la tienda vive en una fila (id = 1) como JSON; las fotos en el bucket público "fotos".

create table if not exists public.tienda (
  id int primary key,
  datos jsonb not null,
  actualizado timestamptz not null default now()
);

alter table public.tienda enable row level security;

create policy "cualquiera ve la tienda" on public.tienda
  for select using (true);
create policy "la dueña crea" on public.tienda
  for insert to authenticated with check (id = 1);
create policy "la dueña edita" on public.tienda
  for update to authenticated using (id = 1) with check (id = 1);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('fotos', 'fotos', true, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

create policy "la dueña sube fotos" on storage.objects
  for insert to authenticated with check (bucket_id = 'fotos');
