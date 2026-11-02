# Revisión de diseño y accesibilidad (WCAG 2.1 AA) — Casa Nido

Fecha: 2026-10-31 · Rama: `feat/diseno-a11y` · Alcance: **mejorar sin rediseñar** (héroe 3D, paleta y tipografía quedan igual).
Método: sitio levantado en local (`vite`), navegador integrado a 375 px y a escritorio, script de medición sobre el DOM
(h1, controles visibles < 44 px, campos sin etiqueta, desborde horizontal) + lectura del código con las pautas
`web-design-guidelines`, `design:accessibility-review`, `design:design-critique` y `design:ux-copy`.

## Resultado de la medición (celular 375 px, hero estático)

| Medida | Antes | Después |
|---|---|---|
| `<h1>` por página | 1 | 1 |
| Controles menores de 44 px | 52 de 56 | 0 de 56 |
| Campos sin etiqueta | 0 | 0 |
| Desborde horizontal | no | no |
| CSS gzip | 6,7 KB | 6,9 KB (+0,2 KB); JS sin cambios |

## Hallazgos

| # | Prio | Hallazgo | Evidencia | Estado |
|---|---|---|---|---|
| 1 | Alta | Botones "Agregar", filtros, links de barra y pie, cámara (38 px), cantidad del carrito (34 px) y acciones fijas del héroe por debajo de 44 px | medición: 52/56; `src/styles.css` (`.btn-chico`, `.filtros button`, `.btn-camara-flotante`, `.cantidad button`, `.escena-acciones`, `.barra-link`, `.marca`, `.pie a`) | Corregido |
| 2 | Alta | Texto blanco sobre `--terra` (#c4623f) = 4,1:1, bajo AA (4,5:1) en "Agregar", "Ver productos" y contador del carrito | cálculo de contraste; `.btn-primario`, `.contador` | Corregido: `--terra-osc` (5,7:1) |
| 3 | Alta | Foco visible ámbar (#f3c98b) sobre fondo crema ≈ 1,4:1, ilegible para quien navega con teclado (1.4.11) | `:focus-visible` en `styles.css` | Corregido: `--foco` terracota sobre claro, ámbar sobre oscuro |
| 4 | Media | Opciones de envío (radio) y enlaces del admin (`summary`, "Borrar", links) por debajo de 44 px | `.carrito-envio`, `.admin-*` | Corregido |
| 5 | Media | `prefers-reduced-motion`: faltaba quitar transiciones/transformaciones de `.btn` y de la foto en hover | `@media (prefers-reduced-motion)` | Corregido (el héroe 3D ya cae a estático por `use-hero-mode`) |
| 6 | Media | Textos: "La API respondió 500" visible para la dueña en el admin; estado vacío del carrito sin salida | `src/admin/nube.ts`, `Carrito.tsx` | Corregido: "No se pudo completar la acción (error N). Probá de nuevo en un momento." / "Tu pedido está vacío. Sumá productos desde el catálogo." |
| 7 | Baja | Fallback "Cargando…" del admin sin `role="status"` | `App.tsx` | Corregido |
| 8 | Baja | Solo `<main>` envuelve el catálogo; héroe y barra quedan fuera del landmark principal | `Catalogo.tsx` / `Tienda.tsx` | Pendiente (cambio de estructura, riesgo medio) |
| 9 | Baja | `aria-live="polite"` en toda la grilla: al filtrar anuncia todas las tarjetas | `Catalogo.tsx` | Pendiente: anunciar solo "N productos" |
| 10 | Baja | Falta enlace "Saltar al contenido" (hay solo 2 links antes del catálogo, impacto bajo) | `Barra.tsx` | Pendiente |

## Lo que se conservó a propósito
Héroe 3D (three.js + GSAP), paleta crema/terracota/salvia, tipografías Fraunces/Inter, bordes gruesos y sombras duras.

## No verificado
- Modo héroe 3D: el navegador integrado cae al hero estático (sin WebGL); su UI se revisó solo por código (un único `<h1>` en `HeroPartes`, `h2` en los hitos).
- Admin con sesión iniciada (requiere contraseña/Mongo): solo revisión de código y CSS.
- Lector de pantalla real (NVDA/VoiceOver) y contraste de los textos dentro del canvas 3D.
