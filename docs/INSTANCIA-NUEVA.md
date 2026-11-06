# Instancia nueva para una clienta (V4) — objetivo: menos de 1 hora

> Estado: la **lista y el script de verificación están probados contra la tienda completa en local** (Mongo + API + sitio, `npm run dev:api`). El recorrido en la nube (Atlas + Vercel + Render) **no se probó de cero**: requiere cuentas (👤). Cronometrarlo la primera vez que se haga de verdad.

## Antes (5 min) — lo que se necesita de la clienta
Nombre de la tienda, WhatsApp, dominio (si tiene), mail de contacto legal, planilla de productos (Tiendanube/Excel → CSV), 20 fotos. Las cuentas se crean **a nombre de la clienta** (V5, traspaso).

## 1. Base de datos — Atlas (10 min)
1. Cluster gratis (M0) + usuario `casanido` con rol **readWrite sobre la base `casanido` únicamente** (no administrador).
2. Network Access: `0.0.0.0/0` (Vercel no tiene IP fija; la seguridad es el usuario y la contraseña de la base).
3. Copiar la cadena de conexión → `MONGODB_URI`.

## 2. Sitio y API — Vercel (15 min)
1. Importar el repo; Framework: Vite; el resto por defecto (`vercel.json` ya trae encabezados, cron e `ignoreCommand`).
2. Variables (Production): `MONGODB_URI`, `ADMIN_PASSWORD` (≥ 12 caracteres, única), `ADMIN_TOTP_SECRET` (`node scripts/totp-nuevo.mjs`), `SESION_SECRET` (cadena larga al azar), `ORIGENES_PERMITIDOS` (la copia de Render, si hay), opcionales: `ENVIO_*`, `PEDIDO_VENCE_HORAS`, `CRON_SECRET`, `RESEND_*` (ver `docs/DEPLOY.md`).
3. Deploy. Entrar a `/#/admin`, cargar el código de la app, subir la planilla de productos y las fotos, poner el WhatsApp real.

## 3. Copia en Render (10 min)
Static Site: Build `npm ci && npm run build`, Publish `dist`, variable `VITE_API_URL` = URL de Vercel. Cargar en Render los mismos encabezados de `vercel.json` (Headers).

## 4. Dominio, respaldo y aviso de caída (10 min)
- Dominio en Vercel (+ `ORIGENES_PERMITIDOS` si cambia la dirección).
- GitHub (repo **privado**): secretos `MONGODB_URI` y `BACKUP_PASSPHRASE`, variable `SITIO_URL` → respaldo semanal cifrado y aviso de caída.
- Mail real en `public/.well-known/security.txt` y en `privacidad.html`/`terminos.html` (borradores: revisión legal).

## 5. Verificación (5 min)
```bash
node scripts/verificar-instancia.mjs https://TU-SITIO
```
Debe terminar en «La instancia pasó las pruebas de humo» (los ⚠ se leen: segundo paso sin cargar, security.txt sin mail). Después, un pedido de prueba desde el celular: llega a `/#/admin`, baja el stock, se cancela y el stock vuelve. Hacer **un respaldo y restaurarlo en una base vacía** (`docs/BACKUP.md`) y anotar la fecha.

## Traspaso (V5)
Dominio, Atlas, Vercel, Render, GitHub y Resend a nombre de la clienta; ella cambia `ADMIN_PASSWORD` y genera su propio `ADMIN_TOTP_SECRET`; se le entrega `docs/MANUAL-DUENA.md` y `docs/RUNBOOK.md`.
