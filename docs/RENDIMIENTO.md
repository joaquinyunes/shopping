# Rendimiento y SEO (V9) — medición del 06/11/2026

**Resultado: NO se llegó a Lighthouse ≥ 90 en rendimiento móvil** (objetivo del plan). Accesibilidad, buenas prácticas y SEO sí.

## Cómo se midió
Lighthouse 12, perfil móvil por defecto (CPU 4× más lenta, 4G lenta simulada), Chrome headless en esta compu, contra el build de producción servido con gzip (`node scripts/servir-dist.mjs`) y **sin API** (la tienda cae a los datos de ejemplo). Los informes completos están en `docs/auditorias/lighthouse-movil-*.json`. La compu estaba ocupada con otras tareas: hay ruido (cinco corridas).

| Corrida | Rendimiento | Accesibilidad | Buenas prácticas | SEO | LCP | FCP | TBT |
|---|---|---|---|---|---|---|---|
| 1 (antes de achicar imágenes) | 80 | 100 | 100 | 92 | 4,5 s | 1,7 s | 210 ms |
| 2 | 82 | 100 | 100 | 92 | 4,5 s | 1,8 s | 130 ms |
| 3 (portada 800 px + fotos de 400 px) | 83 | 100 | 100 | 92 | 3,5 s | 1,7 s | 310 ms |
| 4 (+ fuentes sin bloquear) | 79 | 100 | 100 | 92 | 3,8 s | 1,5 s | 390 ms |
| 5 | 71 | 100 | 100 | 92 | 3,8 s | 2,9 s | 490 ms |
Sin comprimir (`vite preview`) daba 46: el servidor importa. Vercel comprime con brotli.

## Por qué no llega
- La tienda es una **aplicación de una página**: nada se dibuja hasta que baja y corre el JavaScript (80 KB gzip) y se lee el catálogo; el LCP es la foto de la portada y llega después. FCP ≈ 1,5–1,8 s es el piso de esta arquitectura en la simulación.
- Con CPU 4× lenta, el tiempo de bloqueo (TBT) y el dibujo de 20 tarjetas pesan (130–490 ms según la corrida).
- Las fuentes de Google bloquean el dibujo (se cargan ahora sin bloquear con `public/fuentes.js`, sin mejora medible por el ruido).

## Lo que se hizo
Portada en WebP de 800 px para celular (55 KB) con `preload` y `srcset`; fotos de producto de 400 px (`scripts/miniaturas.mjs`) con `srcset`; imágenes con ancho y alto (CLS 0–0,002); el recorrido 3D (190 KB gzip) solo se descarga si se abre; JS inicial 80 KB gzip, CSS 4,4 KB.

## Para llegar a 90 (no hecho)
1. **Prerender de la portada** (HTML con el héroe y los destacados ya escrito en el build, sin esperar al JS): es el cambio grande y el que más mueve el LCP.
2. **Fuentes propias** (alojarlas en el mismo dominio, subconjunto latino, `font-display: swap`): quita dos conexiones externas y el CSS bloqueante.
3. Cargar el catálogo embebido en el HTML del build o con caché de borde (hoy es `no-store` por CORS).
4. Medir de nuevo en Vercel real (brotli, HTTP/2, CDN) y en un celular de gama media: la simulación puede subestimar o sobrestimar.

## SEO
92 en Lighthouse. Falta: datos estructurados `Product`/`Organization` (JSON-LD), `sitemap.xml` y `robots.txt`, y la dirección canónica del dominio real (👤 cuando exista).
