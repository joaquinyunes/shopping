# Casa Nido — plan de venta (03/11/2026)
Leé primero `..\PLAN-VENTA-10K.md` (veredicto, paquetes **S** de seguridad y **V** de vendible). Este archivo es lo propio de Casa Nido. Rama de trabajo: `feat/pendientes-casa-nido` (sobre `integracion`). Sin `git push`.

**Frase de venta (a validar):** «Tienda online de hogar propia: tus clientas ven el producto en su mesa con la cámara, piden por WhatsApp o pagan, y el stock se descuenta solo.»

## Estado auditado
- ✅ tsc 0 · 161/161 tests · `npm audit` 0 vulnerabilidades · árbol limpio
- ✅ back-office (pedidos con stock transaccional, variantes, fotos múltiples, precio promocional, ocultar, CSV Tiendanube, cancelación automática, avisos por mail)
- ✅ diseño a11y (44 px, AA, foco), encabezados + CI
- ✅ rediseño visual «Taller cálido» (03/11/2026): portada clara, ambientes, ficha, 3D opcional — ver `docs/REDISENO.md`
- ☐ adaptadores de envío reales · ☐ prueba de mail real con Resend · ☐ deploy con Mongo real

## A. REDISEÑO de estructura (prioridad 1)
Lo que se ve hoy: portada oscura, titular serif enorme, tarjetas de producto inclinadas, «Activar viaje 3D». Se ve de «demo», no de tienda de hogar. Referencias reales para copiar patrones (mirar los sitios, no de memoria): HAY, Muuto, Ferm Living, Vitra, Rentfeather, Portaromana, Luminaire, Really Well Made, Humanscale, Awwwards «ecommerce furniture». Patrones que ya salieron de la búsqueda: categorías **por ambiente**, banner grande con foto de interior y poco texto, tarjetas con foto y **precio grande**, rotación/segunda foto al pasar el mouse, botón de compra siempre visible, paleta cálida coherente en todo el sitio, encabezado liviano.

- [x] **R1** 🤖 Investigar: abrir 8–10 sitios de referencia con el navegador, guardar capturas en `docs/inspiracion/` y escribir `docs/REDISENO.md` con 3 direcciones (paleta, tipografías, estructura de portada) y **elegir una** con motivos. No parar a preguntar: decidir.
- [x] **R2** 🤖 Nueva estructura de la portada (en este orden): encabezado liviano con buscador y carrito → héroe **claro y cálido** con foto de ambiente + 1 producto con precio + «Pedir por WhatsApp» → **«Comprá por ambiente»** (Cocina, Deco, Textiles, Baño, Living) → destacados con precio grande y segunda foto al pasar el mouse → «Cómo pedir» (3 pasos) → **«Ver en tu mesa»** (la cámara, que es el diferencial) → testimonios (reales o vacío si no hay) → pie con envíos, medios de pago y contacto.
- [x] **R3** 🤖 Ficha de producto nueva: galería grande, variantes, precio y stock a la vista, botón fijo en celular, «Ver en tu mesa», productos relacionados.
- [x] **R4** 🤖 El **viaje 3D** pasa a ser una sección secundaria opcional («Recorré la casa») debajo de «Comprá por ambiente», nunca el héroe; sigue apagable y con fallback. Si no mejora la venta en las capturas, dejarlo solo con enlace.
- [x] **R5** 🤖 Mantener: 161 tests en verde, 1 `<h1>`, `<main>`, 44 px, contraste AA, sin desborde a 375 px, `camera=(self)`. Re-medir LCP en celular (objetivo < 2,5 s) y peso (hoy 148 KB + 564 KB del 3D en chunk aparte).
- [x] **R6** 🤖 Antes/después: capturas a 375 px y 1280 px en `docs/REDISENO.md`, y pasar `design:design-critique` y `design:accessibility-review`.

## B. Lo que falta del plan anterior (PLAN-POR-PROYECTO §1)
- [~] 🤖 **6** Adaptadores de envío: Andreani, Correo Argentino y OCA escritos detrás de `EnviosProvider` con respaldo y 14 tests (respuestas simuladas); **sin verificar contra los correos reales** y **Zipnova no hecho** — ver `docs/ENVIOS.md`.
- [ ] 👤 **7** Vercel: `MONGODB_URI`, `ADMIN_PASSWORD`, `ORIGENES_PERMITIDOS`; Atlas con acceso de red.
- [ ] 👤 **8** Render estático: `VITE_API_URL` = URL de Vercel.
- [ ] 👤 **9** Credenciales de correos (Resend) y Mercado Pago — al final.

## C. Seguridad (de `..\PLAN-VENTA-10K.md` §3)
- [x] S2 CSP a «bloquear» (cuidado: 3D, cámara y fuentes) · [x] S3 rate limit en `/api/pedidos` y login admin · [x] S4 2FA del panel · [x] S5 sanear operadores `$` y límites de subida de fotos · [x] S7 registro de auditoría de precios/stock · [x] S8 gitleaks del historial · [x] S10 backup + restauración · [x] S11 Dependabot sin deploys bloqueados · [ ] S12 privacidad y términos (hecho: exportar/borrar datos y borradores legales; falta la revisión del abogado 👤) · [x] S13 `docs/SEGURIDAD.md`
- (S1 ya está: 0 vulnerabilidades)

## D. Vendible (de `..\PLAN-VENTA-10K.md` §4)
- [x] V1 paquetes y precios (`docs/VENTA.md`, propuesta a validar) · [x] V2 tabla a 3 años vs Tiendanube (precios leídos el 03/11/2026, fuente en el doc) · [x] V3 demo aparte con cartel (`npm run build:demo`; el proyecto en Vercel es 👤) · [~] V4 despliegue repetible (`docs/INSTANCIA-NUEVA.md` + `scripts/verificar-instancia.mjs` probado en local; la nube de cero no se cronometró) · [~] V5 manual (PDF con capturas y runbook hechos; **faltan los videos**) · [~] V7 uptime (`/api/salud` + workflow hechos; sin correr en GitHub y sin Sentry) · [~] V8 página de venta (`/venta/`, con COMPLETAR de contacto, demo y caso real) · [ ] V9 Lighthouse ≥ 90 (**no llegó: 71–83**, ver `docs/RENDIMIENTO.md`) · [ ] V10 piloto con la dueña real (👤)
- [x] **Extra** Importador (CSV de Excel con «;» y decimales con coma, plantilla de WhatsApp editable; `.xlsx` directo no: se guarda como CSV) de catálogo desde Tiendanube/Excel y plantilla de WhatsApp con el pedido (para que migrar sea fácil: es el argumento de venta).

## Salida: cuándo está listo
☐ portada y ficha rediseñadas con antes/después ☐ 161+ tests, tsc, build, eslint en verde ☐ CSP en bloqueo sin errores en consola ☐ backup restaurado una vez ☐ pedido de prueba descuenta stock en producción (requiere 👤 7 y 8) ☐ paquete de entrega (V5) listo
