-- Casa Nido: correr una sola vez en Supabase → SQL Editor (ya aplicado en el proyecto "capo").
-- Toda la tienda vive en una fila (id = 1) como JSON; las fotos en el bucket público "casanido".
-- Tablas con prefijo y solo escribe quien está en casanido_admins (el proyecto puede compartirse con otros sitios).

create table if not exists public.casanido_tienda (
  id int primary key,
  datos jsonb not null,
  actualizado timestamptz not null default now()
);

create table if not exists public.casanido_admins (
  user_id uuid primary key references auth.users (id) on delete cascade
);

alter table public.casanido_tienda enable row level security;
alter table public.casanido_admins enable row level security; -- sin policies: solo la lee casanido_es_admin()

create or replace function public.casanido_es_admin()
returns boolean
language sql
security definer
stable
set search_path = ''
as $$
  select exists (select 1 from public.casanido_admins where user_id = (select auth.uid()))
$$;

revoke execute on function public.casanido_es_admin() from public, anon;
grant execute on function public.casanido_es_admin() to authenticated;

create policy "casanido lee todo el mundo" on public.casanido_tienda
  for select to anon, authenticated using (true);
create policy "casanido escribe admin" on public.casanido_tienda
  for insert to authenticated with check (id = 1 and public.casanido_es_admin());
create policy "casanido edita admin" on public.casanido_tienda
  for update to authenticated using (id = 1 and public.casanido_es_admin()) with check (id = 1 and public.casanido_es_admin());

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('casanido', 'casanido', true, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

create policy "casanido sube admin" on storage.objects
  for insert to authenticated with check (bucket_id = 'casanido' and public.casanido_es_admin());
create policy "casanido cambia admin" on storage.objects
  for update to authenticated using (bucket_id = 'casanido' and public.casanido_es_admin());
create policy "casanido borra admin" on storage.objects
  for delete to authenticated using (bucket_id = 'casanido' and public.casanido_es_admin());

-- Después de crear el usuario de la dueña en Authentication → Users:
-- insert into public.casanido_admins (user_id) select id from auth.users where email = 'EMAIL_DE_LA_DUEÑA';
