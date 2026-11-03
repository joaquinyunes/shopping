# Casa Nido — tienda con viaje 3D

Vite + React + TypeScript. three.js y GSAP solo se cargan si hay viaje 3D. Acta del tribunal: `ACTA-tienda-shopping.md`.

## Probar en la compu

```
npm install
npm run dev      # http://localhost:5500 (modo demo, sin servidor)
npm run dev:api  # http://localhost:5501 con la API real y un MongoDB local (admin: clave dev-casa-nido)
npm test         # tests de funciones puras
npm run typecheck
npm run lint
```

- Admin: `http://localhost:5500/#/admin`. En desarrollo funciona en modo demo (los cambios quedan en ese navegador).
- En el viaje 3D, los objetos que flotan y las tarjetas rebotan al tocarlos (o al pasar el mouse se marcan).
- Si tu Windows tiene "reducir movimiento" activado, la web arranca en el hero estático. Para ver el viaje 3D: botón "Activar viaje 3D".

## Fotos

Las fotos de producto son provisorias, generadas con IA (Gemini) y recortadas con `npm run recortar` (lee `_origen/*.jpg`, escribe `public/img/productos/*.webp`). La dueña las reemplaza desde el admin; las fotos reales con fondo liso se recortan solas en el navegador.

## Publicarla (Vercel + MongoDB Atlas)

Variables de entorno, colecciones y rutas de la API: `docs/DEPLOY.md`. Qué cubre el panel frente a Tiendanube: `docs/BACKOFFICE.md`. (Lo que sigue es el resumen original; si difiere, manda `docs/DEPLOY.md`.)

La tienda es estática y una API chica (`api/`, funciones de Vercel) habla con MongoDB Atlas (driver `mongodb` 6.7). Colecciones: `tienda` (una fila con todo el catálogo) y `fotos` (las imágenes que sube la dueña, servidas desde `/api/foto?id=…`).

1. En Atlas → Network Access, permitir `0.0.0.0/0` (Vercel no tiene IP fija). La seguridad la da el usuario/contraseña de la base.
2. En Vercel → proyecto → Settings → Environment Variables (Production), cargar:
   - `MONGODB_URI`: la cadena de conexión de Atlas (con el usuario y la contraseña de la base).
   - `ADMIN_PASSWORD`: la contraseña que usará la dueña en `/#/admin`.
   - `ORIGENES_PERMITIDOS`: sitios que pueden usar la API desde otro dominio, separados por coma (la copia en Render: `https://casa-nido.onrender.com`). Sin ella, solo el mismo sitio.
   - Opcional: `MONGODB_DB` (por defecto `casanido`).
3. Redeploy. Entrar a `/#/admin`, cambiar el WhatsApp y guardar una vez.
4. La copia en Render es estática: su variable `VITE_API_URL` apunta a la API de Vercel (`https://casa-nido.vercel.app`).

La cámara "Ver en tu mesa" exige https. Las fotos viejas no se borran al reemplazarlas (la base gratis de Atlas da 512 MB).

## Pendiente / sin verificar

- No probado en un celular real ni dentro del navegador de Instagram.
- `npm run build`, tests y lint pasan (2026-10-18). Falta probar el admin conectado a Atlas (hacen falta `MONGODB_URI` y `ADMIN_PASSWORD` en Vercel).
- `_viejo/` tiene la versión anterior (se puede borrar).
- Estado al 03/11/2026 (variantes, ofertas, avisos, vencimiento de pedidos, qué se probó y qué no): `docs/MEJORAS-Y-ESTADO.md`.
