# Seguridad de Casa Nido — informe del 03/11/2026

Método: revisión con la skill `security-and-hardening` (modelo de amenazas + lista de verificación), pruebas automáticas (199 tests, 40 contra un MongoDB real con replica set), escaneo de todo el historial de git, `npm audit`, y la política CSP probada en navegador sobre el build de producción (ficha, cámara, carrito, recorrido 3D, panel, páginas legales).
No es una auditoría externa ni una prueba de penetración. Qué **no** se verificó está al final.

## 1. Modelo de amenazas (resumen)
| Frontera | Quién escribe | Qué se protege | Control |
|---|---|---|---|
| `POST /api/pedido`, `/api/envio` (públicas) | cualquiera | stock, base de pedidos, costo del servidor | validación por tipo, precios y stock siempre del servidor, límite de frecuencia por origen, tope de pendientes, 429 |
| `/api/login` | cualquiera | acceso de la dueña | clave + código TOTP, 5 fallos = 15 min de bloqueo, código de un solo uso, mensaje único |
| `/api/tienda` (PUT), `/api/foto` (POST), `/api/pedidos`, `/api/datos`, `/api/auditoria` | la dueña | catálogo, fotos, datos personales | sesión firmada o clave; cada fallo suma al bloqueo; sin operadores `$` |
| Navegador de la clienta | cualquiera | integridad de la página | CSP bloqueante sin `unsafe-inline`/`unsafe-eval`, sin `innerHTML`/`dangerouslySetInnerHTML` en el código |
| Base de datos y respaldos | la plataforma | datos personales de clientas | usuario de la base con mínimo privilegio (👤), respaldo con permisos 0600, repositorio privado |

## 2. Qué se hizo (paquete S de `..\PLAN-VENTA-10K.md`)
| Paso | Estado | Detalle |
|---|---|---|
| S1 dependencias | ✅ | `npm audit --omit=dev`: 0 vulnerabilidades; el CI falla con altas (`--audit-level=high`) |
| S2 CSP a «bloquear» | ✅ | `Content-Security-Policy` enforcing en `vercel.json`; sin `unsafe-inline` en estilos (los estilos de React/GSAP/three se aplican por CSSOM, que la CSP permite) ni `wasm-unsafe-eval` (no se usa). Probada con 0 violaciones; el detector se verificó con una violación forzada. `report-uri /api/csp` sigue activo |
| S3 límite de frecuencia | ✅ | contadores en Mongo con TTL (sirven entre instancias de Vercel): pedidos 10/h y cotizaciones 60/h por origen (huella, no IP), subida de fotos 60/h, login y fallos de admin: 5 → bloqueo de 15 min |
| S4 admin | 🟡 | sesión firmada (HMAC, 8 h), **TOTP** (RFC 6238, tolerancia ±1 paso, código no reutilizable), «cerrar sesión en todos los dispositivos», contraseña ≥ 12 caracteres y no de ejemplo (en Vercel). Ver «decisiones» |
| S5 entradas | ✅ | claves `$…` o con `.` rechazadas en todo JSON entrante (400); campos validados por tipo; fotos: tipo por bytes reales (no por extensión), 3 MB, 60/h; catálogo normalizado al guardar |
| S6 webhooks | n/a | esta tienda no recibe webhooks (no hay Mercado Pago integrado). Queda como requisito del adaptador de pagos |
| S7 auditoría | ✅ | colección `auditoria` solo-agregar: precio, oferta, stock, ocultar, altas/bajas, variantes, estados de pedido, borrados de datos. No hay ruta que la edite ni la borre; el panel la muestra. Roles: hay una sola dueña (un rol); si se suman empleadas hay que agregar roles |
| S8 secretos | ✅ | `scripts/escanear-secretos.mjs` sobre **todo el historial** (17 commits, 17.842 líneas agregadas, todas las ramas): 0 hallazgos. Corre en el CI con `fetch-depth: 0`. Las únicas contraseñas en el repo son de desarrollo/tests (`dev-casa-nido`, `clave-de-prueba`) y el servidor las rechaza en Vercel. **gitleaks no se corrió** (no está instalado y no se descargó): se usaron los mismos patrones del CI más el de Resend |
| S9 encabezados | ✅ | HSTS (2 años), nosniff, `X-Frame-Options: DENY`, Referrer-Policy, Permissions-Policy (`camera=(self)`), COOP `same-origin`, CORS cerrado a `ORIGENES_PERMITIDOS`; `/.well-known/security.txt` (**falta el mail real: 👤**) |
| S10 respaldo | ✅ / 🟡 | `scripts/backup.mjs` y `scripts/restaurar.mjs`, workflow semanal; restauración probada (ver `docs/BACKUP.md`). El workflow necesita el secreto `MONGODB_URI` (👤) |
| S11 Dependabot | ✅ | semanal y agrupado; Vercel no despliega `dependabot/*` (`ignoreCommand`, probado con el shell); CI con audit |
| S12 datos personales | ✅ / 🟡 | `/privacidad.html` y `/terminos.html` (**borradores**: los revisa un abogado, 👤), exportar y borrar (anonimizar) los datos de una persona desde el panel y `POST /api/datos`, sin datos personales en logs ni en la auditoría, IP guardada solo como huella |
| S13 | ✅ | este informe |

## 3. Hallazgos de la revisión y qué se hizo
| # | Hallazgo | Gravedad | Estado |
|---|---|---|---|
| 1 | La clave del admin viajaba y se guardaba en la pestaña en cada pedido (`x-admin-clave`) | Media | Corregido: el panel guarda solo una sesión que vence a las 8 h |
| 2 | Adivinar la clave por `/api/pedidos` o `/api/tienda` esquivaba el retraso del login | Alta | Corregido: todo endpoint de la dueña pasa por `exigirAdmin`, que cuenta los fallos y bloquea |
| 3 | Un código TOTP espiado podía reusarse | Media | Corregido: solo avanza el último paso usado (atómico) |
| 4 | Estilos en línea permitidos en la CSP | Media | Corregido (ver S2) |
| 5 | Cuerpos JSON con operadores de Mongo llegaban a los validadores | Baja (los validan por tipo) | Corregido: rechazo central |
| 6 | Contraseña de ejemplo aceptable en producción | Media | Corregido (≥ 12 y no de ejemplo en Vercel) |

## 4. Decisiones y riesgos aceptados
- **La sesión vive en `sessionStorage`, no en cookie `HttpOnly`.** El panel también se sirve desde otro dominio (la copia estática en Render) y la API es de Vercel: una cookie `SameSite=Lax` no viajaría. Lo compensan la CSP sin scripts en línea, que el código no usa `innerHTML`, que la sesión dura 8 h, que se puede cerrar en todos los dispositivos y que con TOTP robar la contraseña no alcanza. Si el panel pasa a un solo dominio, conviene una cookie `HttpOnly; Secure; SameSite=Lax`.
- **El origen para limitar es `x-forwarded-for`.** En Vercel lo arma la plataforma; si la API se mueve a un servidor propio sin proxy de confianza, un atacante podría falsear su origen y esquivar el límite (el bloqueo de fallos seguiría contando por el origen que declare).
- **El bloqueo del login es por origen**, no por cuenta: hay una sola cuenta, y bloquearla globalmente dejaría a un atacante sacar a la dueña del panel.
- **Contraseña en variable de entorno** (no en base): no hay hash que robar de la base; se compara en tiempo constante. El segundo paso es opcional hasta que se cargue `ADMIN_TOTP_SECRET` (👤): **sin él, el panel queda solo con contraseña.**
- `fotos` en Mongo: sirven públicas por id aleatorio; no hay listado.

## 5. Qué no se verificó
- Nada contra Atlas, Vercel ni Render reales (no hay credenciales): CSP y encabezados se probaron inyectándolos en el build local; el `ignoreCommand` y los workflows nuevos (`backup.yml`, `uptime.yml`) no corrieron en GitHub.
- Sin prueba de penetración ni escaneo dinámico (ZAP). Sin revisión de las dependencias de desarrollo más allá del audit de producción.
- El correo (Resend) y los avisos no se probaron con una cuenta real.
- Textos legales: son borradores; los valida un profesional.

## 6. Te toca a vos (credenciales y decisiones)
1. `ADMIN_PASSWORD` (≥ 12 caracteres, única) y `MONGODB_URI` en Vercel; Atlas con usuario propio de solo lectura/escritura sobre la base `casanido` (sin permisos de administración).
2. Segundo paso: `node scripts/totp-nuevo.mjs`, pegar `ADMIN_TOTP_SECRET` en Vercel y cargarlo en la app del celular.
3. Secreto `MONGODB_URI` en GitHub (Settings → Secrets → Actions) para el respaldo semanal; variable `SITIO_URL` para el aviso de caída. Repositorio **privado**.
4. Mail real en `public/.well-known/security.txt` y en los textos legales; revisión legal de `privacidad.html` y `terminos.html`.
5. Render (copia estática): agregar los mismos encabezados en el panel de Render (Headers), porque `vercel.json` solo rige en Vercel.
