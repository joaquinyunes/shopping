# Deploy — Casa Nido

Front en Vercel (o estático en Render), API en `api/` (funciones de Vercel) y base en MongoDB Atlas. **No hay `.env.example`**: los nombres de las variables están en esta tabla y los valores se cargan solo en el panel de cada servicio (Vercel › Settings › Environment Variables). Nunca se versionan.

## Variables de entorno

| Variable | Dónde se carga | Obligatoria | Para qué |
|---|---|---|---|
| `MONGODB_URI` | Vercel (API) | Sí | Cadena de conexión de Atlas. Tiene que ser de un cluster **replica set** (todos los de Atlas lo son, también el gratis M0): los pedidos usan transacciones para descontar stock. |
| `MONGODB_DB` | Vercel (API) | No | Nombre de la base. Por defecto `casanido`. |
| `ADMIN_PASSWORD` | Vercel (API) | Sí | Clave de la dueña para `/#/admin` (catálogo, fotos, pedidos). |
| `ORIGENES_PERMITIDOS` | Vercel (API) | Solo si el front está en otro dominio | Sitios que pueden llamar a la API, separados por coma (ej. la copia estática en Render). Sin ella, solo el mismo sitio. |
| `VITE_API_URL` | Front en build (Render / `.env` local) | Solo si el front no está en el mismo dominio que la API | Dirección de la API (ej. la de Vercel). Sin ella, en desarrollo el admin funciona en modo demo. |
| `ENVIO_GRATIS_DESDE` | Vercel (API) | No | Monto en pesos desde el cual la cotización de envío da $0. Sin ella, nunca es gratis. |
| `ENVIO_TARIFAS` | Vercel (API) | No | Tarifas propias de envío en JSON: `{"amba":{"base":4500,"porKgExtra":1500,"diasMin":2,"diasMax":4},"interior":{"base":7000,"porKgExtra":2500,"diasMin":4,"diasMax":8}}`. Sin ella (o si está mal escrita, y queda en el log) rigen las de ejemplo del código. |
| `PEDIDO_VENCE_HORAS` | Vercel (API) | No | Horas que un pedido puede seguir pendiente antes de cancelarse solo y devolver el stock. **Sin ella no se cancela nada** (viene apagada). |
| `CRON_SECRET` | Vercel (API) | Solo si usás el cron | Vercel lo manda como `Authorization: Bearer` al cron diario de `/api/vencer` (definido en `vercel.json`, 07:00 UTC). Sin él, el cron recibe 401; igual los pendientes viejos se vencen cuando entra un pedido o se abre el panel. |
| `RESEND_API_KEY`, `RESEND_FROM` | Vercel (API) | No | Mails al cliente (pedido recibido, pagado, enviado, entregado, cancelado, vencido). Hacen falta las dos y un dominio verificado en Resend; sin ellas no se manda nada. |
| `MONGOD_BIN` | Solo tu compu (tests) | No | Ruta a un `mongod` para `npm test`. Por defecto `~/.cache/mongodb-binaries/mongod-x64-win32-5.0.19.exe`; si no existe, se saltean los tests contra Mongo. |

## Colecciones en Atlas

`tienda` (una fila: catálogo y datos de la tienda, con `stock` y `sku` por producto), `fotos` (imágenes subidas), `pedidos` (un documento por pedido, `_id` = número de pedido, con historial de estados) y `contadores` (numeración correlativa de pedidos). Se crean solas al primer uso.

## Funciones de la API

| Ruta | Quién | Qué hace |
|---|---|---|
| `GET/PUT /api/tienda` | GET público, PUT con clave | Catálogo. El GET trae `_v` (versión); el PUT debe mandarla y responde 409 si el catálogo cambió desde entonces. El PUT guarda la forma normalizada (variantes, ofertas y fotos validadas). |
| `POST /api/login` | Clave | Comprueba la clave. |
| `POST /api/foto`, `GET /api/foto?id=` | POST con clave | Fotos. |
| `POST /api/envio` | Público | Cotiza el envío de un carrito (`cp` + `items`). |
| `POST /api/pedido` | Público | Registra el pedido; el servidor fija precios y envío y descuenta el stock en una transacción. |
| `GET/PATCH /api/pedidos` | Clave | Lista pedidos y cambia su estado (cancelar repone el stock; reabrir lo vuelve a descontar). |
| `GET/POST /api/vencer` | Cron (`CRON_SECRET`) o clave | Cancela los pendientes vencidos (solo si hay `PEDIDO_VENCE_HORAS`). |
| `POST /api/csp` | Público | Recibe los reportes de la CSP «solo reporte» y los deja en el log de Vercel (`CSP: … bloquearía …`). |

## Pasos

1. Atlas › Network Access: permitir `0.0.0.0/0` (Vercel no tiene IP fija); la seguridad la da el usuario/contraseña de la base.
2. Cargar las variables de la tabla en Vercel (Production) y redeployar.
3. Entrar a `/#/admin`, cargar **stock** de los productos que lo llevan (vacío = ilimitado) y guardar.

## Probar la tienda completa en local

`npm run dev:api` levanta la tienda en `http://localhost:5501` con la API real contra un MongoDB local (replica set de un nodo, se borra al cerrar) y unos productos de prueba (uno con stock y otro con variantes). Admin en `/#/admin`, clave `dev-casa-nido` (solo vale en tu compu). Sirve para probar un pedido de punta a punta sin Atlas ni Vercel.

## Probar la API en local

`npm test` levanta un `mongod` 5.0.19 temporal como replica set de un nodo (sin descargar nada, usa el binario de `~/.cache/mongodb-binaries`) y prueba ahí las funciones de `api/`.
