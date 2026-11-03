import { json, leerCuerpo, ruta } from '../server/http.js';

/** Recibe los reportes de la CSP en modo «solo reporte» y los deja en el log de Vercel (línea corta, sin cuerpo completo). */
export default ruta(async (req, res) => {
  if (req.method !== 'POST') return json(res, 405, { error: 'Método no permitido' });
  try {
    const crudo = JSON.parse((await leerCuerpo(req, 10_000)).toString('utf8')) as unknown;
    for (const r of (Array.isArray(crudo) ? crudo : [crudo]).slice(0, 5)) {
      const c = ((r as { body?: unknown })?.body ?? (r as Record<string, unknown>)?.['csp-report'] ?? r ?? {}) as Record<string, unknown>;
      const dato = (k: string) => String(c[k] ?? c[k.replace(/-(\w)/g, (_, l: string) => l.toUpperCase())] ?? '').slice(0, 120);
      console.warn(`CSP: ${dato('effective-directive') || dato('violated-directive')} bloquearía ${dato('blocked-uri') || dato('blockedURL')} en ${dato('document-uri') || dato('documentURL')}`);
    }
  } catch { /* un reporte roto no importa */ }
  res.statusCode = 204;
  res.end();
});
