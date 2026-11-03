# Rediseño de Casa Nido — 03/11/2026

## 1. Qué no funcionaba (antes)
Capturas en `docs/inspiracion/antes-*.png`.
- Portada **oscura** (marrón/negro) con pasillo 3D de fondo: parece una demo técnica, no una tienda de hogar. Lo primero que se ve es un túnel, no un producto.
- Titular serif enorme + 4 botones + tarjeta flotante: demasiadas cosas compitiendo y ningún precio al ojo.
- Tarjetas con **sombra dura negra, bordes de 2,5 px y giro 3D**: estilo «brutalista/juguete», choca con productos de cerámica y lino.
- El catálogo es lo único real y está después de 500 vh de scroll animado.
- Sin categorías por ambiente, sin buscador, sin «cómo pedir», sin medios de pago ni envíos a la vista.

## 2. Referencias vistas (capturas en `docs/inspiracion/`, 03/11/2026)
| Sitio | Qué se copia (patrón, no pixeles) |
|---|---|
| Ferm Living (`ferm-living*.png`) | Encabezado blanco liviano (logo, Shop/Rooms, buscador, carrito); héroe **partido**: titular serif claro a la izquierda y foto de ambiente a la derecha; botón de contorno fino; fila de fotos verticales por ambiente. |
| HAY (`hay.png`) | Fondo gris/crema muy claro, navegación en mayúsculas espaciadas, mucho aire, la foto manda. |
| Muuto (`muuto*.png`) | Fondo color cálido por sección, foto de interior a sangre con poco texto, tipografía grande pero liviana. |
| Kave Home (`kave-home.png`) | Foto de interior calidez + logo grande; paleta terracota/crema. |
| Really Well Made (`really-well-made*.png`) | Encabezado con buscador y carrito siempre visible; **3 bloques de colección** con foto, título y flecha «→»; frase de presentación centrada. |
| Porta Romana (`portaromana.png`) | Logo serif, héroe a pantalla completa con un único botón de contorno. (Oscuro: se descarta el tono.) |
| Vitra, Luminaire, Humanscale, Rentfeather/Fernish | Grillas de producto con fondo neutro, foto grande y precio debajo; categorías por ambiente. |

Patrones que se repiten en casi todos: **1)** encabezado liviano claro, **2)** héroe con foto de ambiente real y un solo llamado, **3)** categorías por ambiente como bloques de foto, **4)** tarjetas planas con foto grande y precio visible, **5)** una paleta cálida corta (3–4 colores) usada en todo el sitio.

## 3. Tres direcciones

### A. «Taller cálido» — claro, editorial, plano (ELEGIDA)
- **Paleta**: papel `#fbf7f1`, crema `#f2e9dc`, tinta `#2b2420`, terracota `#a44d2e` (único acento), salvia `#7d9277` para detalles, filetes de 1 px `#e3d6c4`.
- **Tipografía**: Fraunces (ya cargada) en pesos 400–600 para titulares, Inter para el resto. Titulares medianos, no gigantes.
- **Portada**: encabezado blanco liviano con buscador y carrito → héroe partido (texto + foto `interior.jpg` con un producto con precio) → «Comprá por ambiente» (5 bloques con foto) → destacados (precio grande, 2.ª foto al pasar el mouse) → «Cómo pedir» → «Ver en tu mesa» → pie.
- **Tarjetas**: planas, sin sombra dura, esquinas de 4–8 px, fondo de la foto neutro.

### B. «Casa de color» — bloques de color por sección (Muuto/Kave)
- Fondos alternados terracota/salvia/crema, tarjetas muy redondeadas, tipografía sans grande.
- Atractiva, pero con 20 productos de foto ilustrativa (IA) los bloques de color compiten con las fotos y exige más fotografía propia.

### C. «Galería oscura» (Porta Romana)
- Fondo negro/marrón y foto a pantalla completa. Es lo que hoy **no gusta** y hace ver los productos más caros de lo que son. Descartada.

## 4. Decisión: A «Taller cálido»
Motivos:
1. **Es lo contrario de lo que no gusta** (oscuro, brutalista) pero sigue siendo reconocible: se conserva la paleta crema/terracota/salvia y Fraunces/Inter, así que no se tira lo ya aprobado por la dueña.
2. Las fotos de producto son recortes sobre fondo claro (`public/img/productos/*.webp`): sobre papel claro se ven limpias; sobre color (B) o negro (C) se notan los recortes.
3. Las fotos de ambiente **ya existen** (`public/img/ambientes/{interior,cocina,deco,textiles,bano}.jpg`): sirven tal cual para héroe y «Comprá por ambiente», sin pedir fotos nuevas.
4. Lo hace barato de mantener: un solo acento, sin sombras ni giros, menos CSS (el CSS actual tiene 430 líneas de efectos).
5. Mejor para el rendimiento (LCP): héroe = una imagen, no un canvas WebGL de 560 KB.
6. El diferencial («Ver en tu mesa», la cámara) pasa a una sección propia con voz clara, en vez de esconderse en un botón redondo.

El viaje 3D (R4) queda como sección opcional «Recorré la casa» debajo de «Comprá por ambiente», con interruptor de la dueña y fallback.

## 5. Antes / después
| | Antes | Después |
|---|---|---|
| Portada 1280 px | `inspiracion/antes-1280-portada.png` | `inspiracion/despues-1280-portada.png` |
| Portada 375 px | `inspiracion/antes-375-portada.png` | `inspiracion/despues-375-portada.png` |
| Catálogo 375 px | `inspiracion/antes-375-catalogo.png` | `inspiracion/despues-375-completa.png` (página entera) |
| Catálogo 1280 px | `inspiracion/antes-1280-catalogo.png` | `inspiracion/despues-1280-catalogo.png` |
| Ficha | no existía (todo en la tarjeta) | `inspiracion/despues-1280-ficha.png`, `despues-375-ficha.png` |
| Página entera | — | `inspiracion/despues-1280-completa.png` |

### Qué cambió (R2–R4)
- **Portada**: encabezado claro con buscador y carrito → héroe partido (texto + foto real del local + un producto con precio y «Agregar») → «Comprá por ambiente» → «Recorré la casa» (3D opcional) → «Lo que más se lleva» (precio grande, 2.ª foto al pasar el mouse si el producto tiene) → «Cómo pedir» → «Ver en tu mesa» → catálogo con filtros y búsqueda → pie con envíos, pagos y contacto.
- **Ficha de producto** (`#/producto/ID`, se comparte y «atrás» la cierra): galería, variantes, precio y stock a la vista, botón de compra pegado abajo (sticky), «Ver en tu mesa», «Consultar por WhatsApp», productos relacionados.
- **Viaje 3D**: de héroe a sección opcional con botón «Abrir el recorrido 3D»; solo aparece si la dueña lo dejó prendido y hay WebGL; «Cerrar recorrido» lo desmonta. Los hooks de three/GSAP siguen cargándose recién al abrirlo.
- **Estilo**: se sacaron las sombras duras, los bordes de 2,5 px, el giro 3D de las tarjetas y el fondo oscuro. Un solo acento (terracota), Fraunces + Inter, esquinas de 6 px.
- **No incluido, a propósito**: «Living» (no hay productos de esa categoría: la lista sale de las categorías reales) y **testimonios** (no hay testimonios reales; plan: «vacío si no hay»). Organización y Herrajes muestran la foto de un producto porque aún no hay foto de ambiente.

### Medición (R5), 03/11/2026, build de producción
| Medida | Antes | Después |
|---|---|---|
| `<h1>` / `<main>` | 1 / 1 | 1 / 1 (también con el 3D abierto) |
| axe-core 4.10 (WCAG 2 A/AA + 2.1 AA + 2.2 AA) | — | **0 violaciones** a 375, a 1280 y con la ficha abierta |
| Desborde horizontal a 375 px | no | no |
| Objetivos táctiles | 0 de 56 bajo 44 px | los enlaces de título de tarjeta se extienden a toda la tarjeta (enlace extendido); botones, filtros, carrito y selects ≥ 44 px |
| JS inicial (gzip) | 77,7 KB | 80,2 KB (el 3D, 190 KB gzip, sigue aparte y solo si se abre) |
| CSS inicial (gzip) | 6,3 KB | 4,4 KB |
| LCP en celular simulado (4G lenta + CPU 4×, primera visita) | n/d (héroe = canvas WebGL) | **1,9 s** (visita repetida 0,8 s); objetivo < 2,5 s |
| Foto de portada | JPG 223 KB | WebP 134 KB con `preload` |
| Consola | — | sin errores |
Pruebas funcionales hechas en el navegador: búsqueda («vela» → 1 producto), «Comprá por ambiente» filtra, «Agregar» suma al carrito, la ficha abre con el enlace y cierra con Esc (el hash vuelve a vacío), abrir y cerrar el recorrido 3D sin errores.
`camera=(self)` no se tocó (`vercel.json`); el visor de cámara cuelga del diálogo cuando se abre desde la ficha (si no, quedaba tapado por la capa superior del `<dialog>`).

### Crítica de diseño (`design:design-critique`)
- **Lo que funciona**: la portada se entiende en 2 segundos (qué es, foto de ambiente, un precio, dos botones); jerarquía clara (foto → titular → botones); una sola paleta; tarjetas con el precio como dato más grande; «Ver en tu mesa» tiene su lugar.
- 🟡 Organización/Herrajes muestran un recorte de producto y no una foto de ambiente: rompe un poco el ritmo de la fila. → cargar 2 fotos de ambiente más (👤 con la dueña).
- 🟡 El aviso «Imágenes ilustrativas generadas con IA» quedan lejos de las fotos de la portada: desaparece cuando la dueña suba fotos reales.
- 🟢 La banda «Recorré la casa» es discreta a propósito; si la dueña nunca la usa, apagar el interruptor 3D en el panel.
- 🟢 En la ficha de escritorio los relacionados dejan espacio vacío a la derecha con pocos productos.

### Accesibilidad (`design:accessibility-review`, WCAG 2.1 AA)
- Perceptible: texto principal tinta sobre papel 14,3:1; `--suave` 7,0:1 (6,2:1 sobre arena); terracota 4,7:1 sobre arena; botón primario blanco sobre terracota 5,7:1; etiquetas sobre fotos con degradé oscuro ≥ 6:1. Las fotos decorativas llevan `alt=""` y el nombre va en el título enlazado; la foto de la portada y la de la ficha tienen texto alternativo.
- Operable: todo con teclado; el enlace «Saltar al catálogo» sigue; el diálogo de la ficha usa `showModal` (foco atrapado, Esc cierra y devuelve el foco); foco visible terracota (ámbar solo dentro del 3D); `prefers-reduced-motion` quita transiciones y animaciones.
- Comprensible: el buscador tiene etiqueta; los avisos de variante sin elegir usan `role="alert"`; el conteo de resultados es `role="status"`.
- Robusto: un solo `<h1>`, `<main>`, `<header>`, `<footer>`, `<nav aria-label>`, `<form role="search">`.
- **No verificado**: lector de pantalla real (NVDA/VoiceOver), zoom 200 % a mano, celular físico.
