> Archivo vivo: qué se hizo y qué falta en este proyecto. Misma base que `soluciones-repos/ESTADO-PROYECTOS/shopping-casa-nido.md`. Cada sesión lo actualiza al terminar. Última actualización: 03/11/2026.

# shopping-casa-nido (casa-nido, tienda hogar) — rama `feat/pendientes-casa-nido` (sobre `integracion` `c29f1c7`)

## Hecho
- **Back-office (rama `feat/backoffice-tienda`):** pedidos con stock descontado en transacción de Mongo (probado con dos compradores simultáneos), cancelar repone stock, historial de estados, importar/exportar CSV compatible con Tiendanube, cotización de envío detrás de `EnviosProvider`, envío gratis desde un monto.
- **Diseño y seguridad:** botones de 44 px, contraste AA, foco visible; encabezados, CSP en «solo reporte» y CI.
- **Esta rama (03/11):**
  - Variantes (hasta 3 propiedades; precio, stock y SKU por variante), varias fotos por producto (hasta 5 extra), precio promocional y ocultar producto, en la tienda, el panel, el servidor y el CSV (con tests antes).
  - Control de versión del catálogo: el panel ya no pisa el stock descontado por un pedido.
  - Límite de pedidos pendientes por origen (429), cancelación automática opcional de pedidos sin pago (`PEDIDO_VENCE_HORAS`, apagada por defecto) y avisos por mail al cliente detrás de `NotificacionesProvider` (Resend).
  - Tarifas de envío propias por variable (`ENVIO_TARIFAS`) y `conRespaldo` ante fallas de un correo.
  - Accesibilidad pendiente cerrada: `<main>` envuelve héroe y catálogo, aviso «N productos», enlace «Saltar al catálogo».
  - Bug de producción corregido: `Permissions-Policy: camera=()` bloqueaba «Ver en tu mesa»; ahora `camera=(self)`. La CSP reporta a `/api/csp`.
  - `npm run dev:api`: la tienda con la API real contra un Mongo local, para probar de punta a punta.
- **Verificado (03/11):** `tsc` 0 · eslint 0 · `vitest` 161 de 161 (16 archivos, 21 contra MongoDB real con replica set) · `npm run build` OK · navegador integrado a 375 px con `dev:api`: elegir variante, agregar, pedir (stock 3→2 y 2→0), cancelar (el stock vuelve), guardar desde el panel con versión vieja (aviso y «Recargar tienda»), ocultar un producto (desaparece y no se puede pedir), exportar CSV con variantes.

## No verificado
- Atlas real (los tests usan `mongod` 5.0 local con replica set); Vercel sirviendo `api/` y la SPA con el `vercel.json` nuevo (solo agrega encabezados y un cron; el sitio actual responde 200, pero ese `vercel.json` todavía no se desplegó).
- Mails contra Resend real, el cron de Vercel, la cámara en vivo, el héroe 3D con GPU real, lector de pantalla.
- Importar a mano una planilla real descargada de Tiendanube (los encabezados salen de su guía).
- La copia estática de Render no recibe los encabezados de `vercel.json`.

## Falta (código)
- **Adaptadores reales de correo** (Correo Argentino, Andreani, OCA, Zipnova): la interfaz, el respaldo ante fallas y las tarifas propias están; falta cada adaptador, que necesita las credenciales de la cuenta y la documentación oficial de su API (no se encontró; no se escribió ninguno a ciegas).
- Cupones, cobro online (Mercado Pago), estados separados de pago y envío, libreta de clientes, facturación.

## Te toca a vos
1. **Vercel:** `MONGODB_URI`, `ADMIN_PASSWORD` y `ORIGENES_PERMITIDOS=https://casa-nido.onrender.com`. Atlas con `0.0.0.0/0` (Vercel no tiene IP fija). Opcionales: `ENVIO_TARIFAS`, `ENVIO_GRATIS_DESDE`, `PEDIDO_VENCE_HORAS`, `CRON_SECRET`, `RESEND_API_KEY` + `RESEND_FROM` (ver `docs/DEPLOY.md`). Hoy `https://casa-nido.vercel.app/api/tienda` responde 200 con `null`: conecta a la base pero todavía no hay catálogo guardado.
2. **Render (estático):** `VITE_API_URL` = URL de Vercel.
3. Después del primer deploy: mirar unos días el log de Vercel (`CSP: …`) y recién entonces pasar la CSP de «solo reporte» a «bloquear».
4. Cargar `stock` de los productos que lo llevan y probar un pedido de prueba en producción.
5. Credenciales de los correos, Resend y Mercado Pago: al final.
