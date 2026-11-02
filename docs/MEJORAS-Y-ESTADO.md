> Archivo vivo: qué se hizo y qué falta en este proyecto. Misma base que `soluciones-repos/ESTADO-PROYECTOS/shopping-casa-nido.md` (31/10/2026). Cada sesión lo actualiza al terminar.

# shopping-casa-nido (casa-nido, tienda hogar) — rama `feat/backoffice-tienda` · `2c61f6e`

## Hecho
- Back-office: pedidos con stock descontado en transacción de Mongo (probado con dos compradores simultáneos), cancelar repone stock, historial de estados, **importar/exportar CSV compatible con Tiendanube**, cotización de envío detrás de `EnviosProvider`, envío gratis desde un monto.
- Base: 64 tests, `tsc` y build OK. `docs/BACKOFFICE.md` y `docs/DEPLOY.md`. Árbol limpio.
- Una sesión de diseño (WP-40) ya tiene 1 commit en `feat/diseno-a11y`.

## Falta (código)
- Variantes (talle/color con stock propio): la mayor brecha estructural; varias fotos por producto; precio promocional; ocultar producto sin borrarlo.
- Adaptadores reales de correo (Correo Argentino, Andreani, OCA, Zipnova): las tarifas actuales son **valores de ejemplo**.
- Cancelación automática de pedidos sin pago (hoy retienen stock hasta que la dueña cancele); avisos por mail al cliente.
- Probar en navegador; 52 de 56 controles táctiles chicos (WP-40).

## Te toca a vos
1. **Host:** decisión del dueño = Vercel **y** Render. Casa Nido ya está en ambos: Render es `static_site` (no se duerme) y Vercel tiene las funciones `api/`. Para que Render funcione: `VITE_API_URL=<URL de Vercel>` en Render y `ORIGENES_PERMITIDOS=https://casa-nido.onrender.com` en Vercel.
2. Vercel: `MONGODB_URI`, `ADMIN_PASSWORD`. Atlas con `0.0.0.0/0` (Vercel no tiene IP fija).
3. Credenciales de los correos y Mercado Pago: al final.
