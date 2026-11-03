import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const leer = (ruta: string) => readFileSync(new URL(`../${ruta}`, import.meta.url), 'utf8');
const vercel = JSON.parse(leer('vercel.json')) as { headers: Array<{ headers: Array<{ key: string; value: string }> }>; ignoreCommand?: string };
const cabeceras = Object.fromEntries(vercel.headers[0].headers.map(h => [h.key, h.value]));

describe('encabezados de seguridad (vercel.json)', () => {
  it('la CSP bloquea (no es solo reporte) y no permite scripts ni estilos en línea', () => {
    expect(cabeceras['Content-Security-Policy-Report-Only']).toBeUndefined();
    const csp = cabeceras['Content-Security-Policy'];
    expect(csp).toMatch(/default-src 'self'/);
    expect(csp).toMatch(/frame-ancestors 'none'/);
    expect(csp).toMatch(/object-src 'none'/);
    expect(csp).not.toMatch(/unsafe-inline|unsafe-eval|\*(?!\.)/);
  });
  it('trae HSTS, nosniff, referrer y permisos (la cámara solo para el propio sitio)', () => {
    expect(cabeceras['Strict-Transport-Security']).toMatch(/max-age=\d{7,}/);
    expect(cabeceras['X-Content-Type-Options']).toBe('nosniff');
    expect(cabeceras['Referrer-Policy']).toBe('strict-origin-when-cross-origin');
    expect(cabeceras['Permissions-Policy']).toMatch(/camera=\(self\)/);
    expect(cabeceras['Permissions-Policy']).toMatch(/microphone=\(\)/);
  });
  it('Vercel no despliega las ramas de Dependabot', () => {
    expect(vercel.ignoreCommand).toMatch(/dependabot\/\*/);
  });
});

describe('páginas públicas de seguridad y privacidad', () => {
  it('security.txt tiene contacto y vencimiento (RFC 9116)', () => {
    const t = leer('public/.well-known/security.txt');
    expect(t).toMatch(/^Contact: mailto:/m);
    expect(t).toMatch(/^Expires: \d{4}-\d{2}-\d{2}T/m);
  });
  it('privacidad y términos existen, avisan que son borrador y citan la ley y los derechos', () => {
    const p = leer('public/privacidad.html'), t = leer('public/terminos.html');
    expect(p).toMatch(/Ley 25\.326/);
    expect(p).toMatch(/Agencia de Acceso a la Información Pública/);
    expect(p).toMatch(/BORRADOR/);
    expect(t).toMatch(/BORRADOR/);
    expect(t).toMatch(/Ley 24\.240/);
  });
});
