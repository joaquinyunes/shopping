# Plan de este proyecto (copia del 02/11/2026)

> Sacado de `soluciones-repos/PLAN-POR-PROYECTO.md` (la maestra, con tablero y reglas de todas las sesiones). Marcá `[x]` acá y en la maestra. Reglas: sin `git push`, sin secretos, credenciales de prueba al final, no tocar `veterinaria-system`.

## 1. shopping-casa-nido (Casa Nido) — el más cerca de terminar
Ramas: base `main` `942090f` · `feat/backoffice-tienda` `2c61f6e` · `feat/diseno-a11y` `56a750e` · `chore/seguridad-ci` `13855b8`.
Hecho: pedidos con stock transaccional, CSV Tiendanube, cotización de envío, diseño 44 px/AA/foco, encabezados y CI.

- [x] 1 **Integrado (02/11):** rama `integracion` `c29f1c7` = back-office + diseño + seguridad, sin conflictos. 🔎 `npx tsc --noEmit` código 0 · `npx vitest run` **109 de 109** (14 archivos) · `npm run build` OK (aviso: un chunk de 564 KB, el 3D). Sin push.
- [x] 2 **Hecho (03/11):** `<main>` envuelve héroe y catálogo (#8), aviso «N productos» y grilla sin `aria-live` (#9), enlace «Saltar al catálogo» (#10). Re-medido a 375 px: 1 `<h1>`, 1 `<main>`, 0 controles de menos de 44 px, sin desborde. No se corrió `design:accessibility-review` (skill de otro plugin); la medición fue por DOM.
- [x] 3 **Hecho (03/11)** con `npm run dev:api` (API real + Mongo local) en el navegador integrado: pedido con variante y envío, stock 3→2 y 2→0, cancelar devuelve el stock, exportar CSV con variantes. Importar CSV: cubierto por tests, no por clics en el navegador.
- [x] 4 **Hecho (03/11):** variantes, varias fotos, precio promocional y ocultar producto, con tests (161 en total) y soporte en CSV. Acta del tribunal: `ACTA-mejoras-pendientes.md`.
- [x] 5 **Hecho (03/11):** `PEDIDO_VENCE_HORAS` (apagada por defecto) + cron diario + disparo al entrar un pedido; avisos por mail con Resend. **Mail sin probar contra Resend real.**
- [ ] 6 🤖 Adaptadores reales de envío (Correo Argentino, Andreani, OCA, Zipnova) — **al final**, cuando haya credenciales. *Preparado (03/11):* `conRespaldo` (si el correo falla o tarda, cae a la tarifa por zona) y `ENVIO_TARIFAS` (tarifas propias sin tocar código). Falta cada adaptador: no se encontró documentación oficial de sus APIs.
- [ ] 7 👤 Vercel: `MONGODB_URI`, `ADMIN_PASSWORD`, `ORIGENES_PERMITIDOS`. Atlas con `0.0.0.0/0`.
- [ ] 8 👤 Render (estático, no se duerme): `VITE_API_URL` = URL de Vercel.
- [ ] 9 👤 Credenciales de correos y Mercado Pago (al final).

Salida: ☑ commits (rama `feat/pendientes-casa-nido`, sin push) ☑ tests/tsc/build verdes (161 de 161) ☑ `casa-nido.vercel.app` y `casa-nido.onrender.com` responden 200 (03/11, versión anterior al deploy de esta rama) ☐ un pedido de prueba descuenta stock en producción (falta tu paso 7 y 8).

Pasos 🤖 = los hace una sesión. 👤 = solo el dueño.
