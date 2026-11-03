# Respaldo y restauración de la base

Sin esto no se vende (S10). La base de pedidos y el catálogo viven en MongoDB Atlas; el plan gratis **no trae respaldos automáticos**, por eso el proyecto trae los suyos.

## Qué se guarda
`tienda` (catálogo), `pedidos`, `contadores` (numeración), `fotos` y `auditoria`. No se guarda `limites` ni las sesiones: se regeneran solas.
El archivo (`casanido-AAAA-MM-DD.ndjson.gz`) tiene **datos personales de clientas**: no se sube a ningún lado público y se crea con permisos 0600.

## Hacer un respaldo
```bash
MONGODB_URI="mongodb+srv://..." node scripts/backup.mjs        # deja backups/casanido-<fecha>.ndjson.gz
```
Automático: `.github/workflows/backup.yml` corre los lunes a las 06:00 UTC y deja el archivo como artefacto 30 días (secreto `MONGODB_URI` en GitHub; repo privado). Se puede lanzar a mano desde la pestaña Actions.

## Restaurar
```bash
# 1. en una base NUEVA y vacía, para mirar antes de tocar la real
MONGODB_URI="mongodb+srv://..." node scripts/restaurar.mjs backups/casanido-2026-11-03.ndjson.gz --db casanido_restaurada
# 2. si está bien, apuntá MONGODB_DB (Vercel) a esa base, o repetí con --forzar sobre la real (reemplaza lo que haya)
```
Sin `--forzar` el script se niega a escribir sobre una base con datos.

## Prueba de restauración (obligatoria antes de vender)
| Fecha | Dónde | Qué | Resultado |
|---|---|---|---|
| 03/11/2026 | MongoDB 5.0.19 local (replica set de un nodo) | Se cargó la tienda con 20 productos, 12 pedidos, el contador y una foto de 200 KB; se hizo el respaldo con `scripts/backup.mjs`; se **borró la base entera**; se restauró con `scripts/restaurar.mjs`; se comparó colección por colección | **Idéntica** (tienda 1, pedidos 12, contadores 1, fotos 1). Una segunda restauración sin `--forzar` se negó a pisar la base con datos |
| 03/11/2026 | Test automático `server/respaldo.test.ts` | Fechas, números, binarios (foto) y exclusión de `limites` | Verde |
| _pendiente_ | **Atlas real** | Hacer el respaldo con la `MONGODB_URI` de producción y restaurarlo en una base `casanido_restaurada` | 👤 requiere la cadena de conexión |

Hasta que se haga la prueba en Atlas, el respaldo está probado con el mismo motor pero no con la base de producción.

## Si se pierde la base
1. Descargar el último artefacto de Actions → `respaldo-casa-nido`.
2. Restaurar en una base nueva (arriba), verificar que el último número de pedido coincida con lo que ven en WhatsApp.
3. Apuntar `MONGODB_DB` a la nueva y redeploy.
Se pierde como máximo una semana de pedidos (los que entraron después del último respaldo): por eso el pedido también llega por WhatsApp, que es el segundo registro.
