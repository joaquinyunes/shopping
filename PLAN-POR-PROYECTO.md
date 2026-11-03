# Plan de este proyecto (copia del 02/11/2026)

> Sacado de `soluciones-repos/PLAN-POR-PROYECTO.md` (la maestra, con tablero y reglas de todas las sesiones). Marcá `[x]` acá y en la maestra. Reglas: sin `git push`, sin secretos, credenciales de prueba al final, no tocar `veterinaria-system`.

## 1. shopping-casa-nido (Casa Nido) — el más cerca de terminar
Ramas: base `main` `942090f` · `feat/backoffice-tienda` `2c61f6e` · `feat/diseno-a11y` `56a750e` · `chore/seguridad-ci` `13855b8`.
Hecho: pedidos con stock transaccional, CSV Tiendanube, cotización de envío, diseño 44 px/AA/foco, encabezados y CI.

- [x] 1 **Integrado (02/11):** rama `integracion` `c29f1c7` = back-office + diseño + seguridad, sin conflictos. 🔎 `npx tsc --noEmit` código 0 · `npx vitest run` **109 de 109** (14 archivos) · `npm run build` OK (aviso: un chunk de 564 KB, el 3D). Sin push.
- [ ] 2 🤖 Pendientes de diseño: `<main>` envuelve héroe y barra (#8), `aria-live` solo anuncia «N productos» (#9), enlace «Saltar al contenido» (#10). Verif.: re-medir con `design:accessibility-review`.
- [ ] 3 🤖 Probar en navegador a 375 px: crear pedido, ver stock bajar, cancelar y ver stock volver, exportar e importar CSV.
- [ ] 4 🤖 Variantes (talle/color con precio y stock propios), varias fotos por producto, precio promocional, ocultar producto sin borrarlo. Cada una con tests antes.
- [ ] 5 🤖 Cancelación automática de pedidos sin pago y aviso por mail al cliente.
- [ ] 6 🤖 Adaptadores reales de envío (Correo Argentino, Andreani, OCA, Zipnova) detrás de `EnviosProvider` — **al final**, cuando haya credenciales.
- [ ] 7 👤 Vercel: `MONGODB_URI`, `ADMIN_PASSWORD`, `ORIGENES_PERMITIDOS`. Atlas con `0.0.0.0/0`.
- [ ] 8 👤 Render (estático, no se duerme): `VITE_API_URL` = URL de Vercel.
- [ ] 9 👤 Credenciales de correos y Mercado Pago (al final).

Salida: ☐ commits en `integracion` ☐ tests/tsc/build verdes ☐ `casa-nido.vercel.app` y `casa-nido.onrender.com` responden 200 ☐ un pedido de prueba descuenta stock en producción.

Pasos 🤖 = los hace una sesión. 👤 = solo el dueño.
