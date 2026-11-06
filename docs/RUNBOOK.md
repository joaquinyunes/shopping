# Runbook — qué hago si se cae (V5)

Quién lo usa: quien da el soporte mensual. Primero mirar, después tocar.

## 1. Diagnóstico en 2 minutos
```bash
node scripts/verificar-instancia.mjs https://TU-SITIO
```
| Qué falla | Probable causa | Qué hacer |
|---|---|---|
| La portada no responde | Vercel caído o deploy roto | https://www.vercel-status.com; en Vercel → Deployments → «Promote to Production» el anterior (rollback) |
| `/api/salud` 503 | La base no responde | Atlas: ¿cluster pausado (plan gratis se pausa por inactividad)? ¿Acceso de red `0.0.0.0/0`? ¿Cambió la clave del usuario? Revisar `MONGODB_URI` |
| `/api/tienda` 500 | Error del servidor | Vercel → Logs: buscar el error (los mensajes no llevan datos personales) |
| Pedido da 429 | Límite de frecuencia | Esperar; si es una clienta real, el límite es de 10 pedidos por hora por conexión |
| El admin no deja entrar (401) | Clave o código mal / hora del celular | Revisar la hora automática; si perdió la app del código: generar otro con `scripts/totp-nuevo.mjs`, cambiar `ADMIN_TOTP_SECRET` en Vercel y redeploy |
| El admin da 429 | 5 intentos fallidos | Esperar 15 minutos (o borrar la colección `limites` en Atlas) |
| Stock raro | Pedido cancelado a medias o edición concurrente | Mirar «Historial de cambios» en el panel y los pedidos |

## 2. Si se perdió o rompió la base
`docs/BACKUP.md` → «Si se pierde la base». Se restaura el último respaldo cifrado en una base nueva, se verifica y se apunta `MONGODB_DB`.

## 3. Si se filtró una clave
1. Cambiarla **primero** (Atlas, Vercel, GitHub, Resend), después investigar.
2. Cambiar `ADMIN_PASSWORD` o `SESION_SECRET` cierra todas las sesiones.
3. Revisar el historial de cambios y los pedidos por movimientos raros.
4. Si pudo haber datos personales expuestos, avisar a las personas afectadas y consultar al abogado (Ley 25.326).

## 4. Qué se avisa y a quién
Aviso de caída: el workflow `uptime.yml` (GitHub) manda mail por cada falla; confirmar que la persona de soporte esté mirando el repo (Settings → Notifications). Sentry (errores a un panel) **no está configurado**: requiere una cuenta (👤).

## 5. Checklist de traspaso a la dueña
- [ ] Dominio a su nombre · [ ] Atlas, Vercel, Render, GitHub y Resend con su mail como dueña
- [ ] Cambió `ADMIN_PASSWORD` y generó su propio `ADMIN_TOTP_SECRET`
- [ ] Tiene `MANUAL-DUENA.pdf` y entró al panel sola
- [ ] Hizo un pedido de prueba y lo canceló (el stock volvió)
- [ ] Se hizo y se restauró un respaldo en una base vacía (fecha: ____)
- [ ] Mail real en `security.txt`, privacidad y términos revisados por abogado
- [ ] Contrato/licencia firmados
