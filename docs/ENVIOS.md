# Envíos (B6)

## Cómo funciona
`server/envios.ts` define la interfaz `EnviosProvider` (`cotizar(pedido) → opciones`). El servidor **recalcula siempre el envío** al registrar el pedido: lo que mande el navegador no cuenta.
- **Sin variables de correos** (hoy): rige `tarifaPorZona` (AMBA / interior, con `ENVIO_TARIFAS` y `ENVIO_GRATIS_DESDE`). Las tarifas por defecto son **de ejemplo**: hay que poner las de la dueña antes de cobrar envíos.
- **Con variables de un correo**: `server/envios-correos.ts` lo activa y lo envuelve en `conRespaldo(…, tarifaPorZona)`. Si el correo falla, tarda más de 5 s, devuelve algo raro (precio negativo o no numérico) o no devuelve opciones, la clienta ve la tarifa por zona y puede comprar. Un código postal inválido (400) no cae al respaldo.
- Con varios correos activos se muestran todas las opciones, ordenadas por precio; el que falla se ignora.

## Estado de cada correo — ⚠ SIN VERIFICAR contra el servicio real
No hubo credenciales. Los adaptadores se escribieron con la forma de la documentación pública de cada correo y se probaron con **respuestas simuladas** (`server/envios-correos.test.ts`, 14 tests). Antes de activar uno en producción hay que cotizar un envío real y compararlo con la web del correo.
| Correo | Variables (todas) | Qué usa | Estado |
|---|---|---|---|
| Andreani | `ANDREANI_USUARIO`, `ANDREANI_CLAVE`, `ANDREANI_CONTRATO`, `ANDREANI_CLIENTE` (opcional `ANDREANI_SUCURSAL`) | `GET /login` (token) y `GET /v1/tarifas` con CP, kilos, volumen y valor declarado; toma `tarifaConIva.total` | escrito, sin probar contra Andreani |
| Correo Argentino (MiCorreo) | `MICORREO_USUARIO`, `MICORREO_CLAVE`, `MICORREO_CLIENTE_ID`, `ENVIO_CP_ORIGEN` | `POST /token` y `POST /rates` (a domicilio); una opción por servicio con sus plazos | escrito, sin probar |
| OCA e-Pak | `OCA_CUIT`, `OCA_OPERATIVA`, `ENVIO_CP_ORIGEN` | `Tarifar_Envio_Corporativo` (XML): `Total` y `PlazoEntrega` | escrito, sin probar |
| Zipnova | — | — | **no hecho**: falta su documentación oficial |
Comunes: `ENVIO_CAJA_CM` (ej. `30x20x15`, por defecto 30×20×15) es la caja que se cotiza: los productos no tienen medidas de bulto, solo peso. Si el pedido trae productos de formas muy distintas, hay que ajustarla o agregar medidas por producto.

## Cómo verificar un correo (👤 con credenciales)
1. Cargar las variables en Vercel y redeploy.
2. `curl -X POST https://TU-SITIO/api/envio -H 'content-type: application/json' -d '{"cp":"5000","items":[{"id":"taza","cant":1}]}'`
3. Comparar `opciones[].precio` con la cotización de la web del correo para el mismo CP y peso. Si no coinciden, no dejarlo activo: sacar las variables (vuelve la tarifa por zona).
4. Mirar el log de Vercel: una línea «no cotizó» significa que ese correo falló y se usó el respaldo.
