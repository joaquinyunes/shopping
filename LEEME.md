# Casa Nido — tienda con viaje 3D

Vite + React + TypeScript. three.js y GSAP solo se cargan si hay viaje 3D. Acta del tribunal: `ACTA-tienda-shopping.md`.

## Probar en la compu

```
npm install
npm run dev      # http://localhost:5500
npm test         # tests de funciones puras
npm run typecheck
npm run lint
```

- Admin: `http://localhost:5500/#/admin`. Sin Supabase funciona en modo demo (los cambios quedan en ese navegador).
- Si tu Windows tiene "reducir movimiento" activado, la web arranca en el hero estático. Para ver el viaje 3D: botón "Activar viaje 3D".

## Fotos

Las fotos de producto son provisorias, generadas con IA (Gemini) y recortadas con `npm run recortar` (lee `_origen/*.jpg`, escribe `public/img/productos/*.webp`). La dueña las reemplaza desde el admin; las fotos reales con fondo liso se recortan solas en el navegador.

## Publicarla gratis

1. Proyecto gratis en https://supabase.com y correr `supabase.sql` en el SQL Editor.
2. Authentication → crear el usuario de la dueña y desactivar "Allow new users to sign up".
3. Copiar `.env.example` a `.env` y completar `VITE_SUPABASE_URL` y `VITE_SUPABASE_KEY` (anon/publishable).
4. `npm run build` y subir `dist/` a Vercel, Netlify o GitHub Pages. La cámara "Ver en tu mesa" exige https.
5. Entrar a `/#/admin`, cambiar el WhatsApp y guardar una vez.

## Pendiente / sin verificar

- No probado en un celular real ni dentro del navegador de Instagram.
- No se corrió `npm run build` ni el admin conectado a Supabase.
- `_viejo/` tiene la versión anterior (se puede borrar).
