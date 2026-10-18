# Acta del tribunal — Túnel 3D de hogar (reemplaza el hero espacial) · 2026-10-18

## Expediente
- **Idea:** reemplazar el hero 3D actual de Casa Nido (viaje espacial: planeta, asteroides, estrellas) por un túnel 3D de scroll continuo (~500vh, escenario sticky, three.js + GSAP, la cámara recorre un corredor) con estética de hogar: cortinas, manijas, cubiertos, platos, copas, organizadores, mantas, bandejas, decorativos. Productos como tarjetas flotantes con carteles por categoría; cierre al catálogo y a WhatsApp. Imágenes nuevas con IA (Gemini) para las categorías sin foto.
- **Quién lo usa:** clientas de la dueña, que hoy compran por Instagram/WhatsApp.
- **Qué quiere el usuario:** una página nueva, más vistosa, con imágenes y animaciones nuevas, relacionada con productos para el hogar.
- **Inversión:** gratis (regalo). Tiempo: no lo dijo. Precio: no aplica.
- **Antecedente:** el juicio previo del hero espacial dio NO LA HAGAS ASÍ (1–11); el usuario avanzó con condiciones que ya están implementadas (catálogo manda, 3D apagable, fallback automático, fotos ilustrativas, admin simple).
- **No lo dijo:** qué celulares usan las clientas, cuántos productos reales vende, si las fotos IA coinciden con lo que vende.

## Alegatos
**Fiscal:** 1) La experiencia manda sobre la venta: el túnel esconde precio, producto y compra detrás del scroll. 2) Supuesto: celulares modestos; WebGL continuo se traba y gasta datos. 3) Las fotos IA no coinciden con lo que vende; la clienta recibe otra cosa.
**Defensa:** 1) Supuesto: la dueña quiere algo que se note y se pueda compartir. 2) Los riesgos del juicio previo ya están cubiertos (primera pantalla con producto/precio, 3D apagable, fallback). 3) El tema de hogar le da sentido a la animación y hace descubrir categorías.

## Votos
| # | Jurado | Voto | Razón | Cambiaría su voto si |
|---|---|---|---|---|
| 1 | La clienta ideal | INOCENTE | Ver cortinas, platos y mantas en un recorrido lindo da ganas de pedir, y si anda mal veo el catálogo directo. | Las fotos IA mostraran cosas distintas a lo que se vende, sin aviso de que son ilustrativas. |
| 2 | La escéptica | INOCENTE | Las promesas del juicio previo ya están implementadas, no solo prometidas. | Probado en un celular modesto real, el fallback no se activa o el túnel tapa el catálogo. |
| 3 | La que no te conoce | CULPABLE | En dos segundos veo un corredor con objetos flotando; no queda claro que es una tienda de hogar. | La primera pantalla muestra "Casa Nido", qué vende, un producto con precio y botón de pedir antes de cualquier animación. |
| 4 | La contadora | INOCENTE | Hosting gratis, librerías libres, imágenes IA casi sin costo; el gasto real es tiempo sin cuantificar. | Generar o reemplazar imágenes o rehacer el túnel exigiera pagar una API o hosting. |
| 5 | La competencia | CULPABLE | Un túnel three.js+GSAP con imágenes de Gemini se replica en días; el único foso (fotos reales propias) no existe. | La dueña carga fotos reales propias y el túnel se arma con ellas. |
| 6 | La que ya te compró | INOCENTE | Las condiciones implementadas protegen lo que ya tengo (catálogo, precio, WhatsApp, fallback). | Las fotos IA se mostraran como productos reales, o el túnel retrasara el acceso al catálogo. |
| 7 | La que casi compra | INOCENTE | Con producto, precio y botones en la primera pantalla y "ir directo", el túnel no estorba. | Para llegar al botón de WhatsApp hubiera que recorrer el túnel entero, sin botón fijo durante el scroll. |
| 8 | La experta del rubro | INOCENTE | Túnel three.js+GSAP con scroll sticky es estándar y viable; fallback, apagado y atajo ya existen. | Probado en un celular modesto real traba o el fallback no se activa bien. |
| 9 | La vendedora | CULPABLE | Se explica fácil, pero la objeción diaria ("¿cuánto sale y cómo lo pido?") queda tapada por animación y fotos IA. | Cada producto del túnel muestra precio y botón "pedir por WhatsApp", solo con fotos reales. |
| 10 | La que lo ejecuta | CULPABLE | Sostener túnel, carteles y fotos IA exige mantenimiento técnico y de contenido constante. | Pudiera actualizar productos, precios y fotos desde un admin simple, con el túnel opcional y apagable. |
| 11 | La del largo plazo | CULPABLE | Un túnel 3D es gimmick de lanzamiento; con el catálogo cambiando y fotos IA desactualizadas se apaga y vuelve a la grilla. | El túnel se alimenta del catálogo real (fotos y categorías de la dueña) sin tocar código. |
| 12 | La amiga honesta | CULPABLE | Mucho mantenimiento para alguien que ya cambió el hero una vez; te vas a cansar y ella no lo va a tocar. | Quedara una plantilla simple donde la dueña cambie productos y fotos sola, sin tocar el túnel. |

## Marcador
**INOCENTE 6 · CULPABLE 6**

## Veredicto: REHAZLA antes de invertirle
1. **En contra:** el túnel no deja claro qué se vende ni el precio en los primeros segundos (3, 9); las fotos IA no son lo que la clienta recibe y no hay foso propio (5, 9); mantenerlo depende del código, no de la dueña (10, 11, 12).
2. **A favor:** lo ya implementado (catálogo primero, apagable, fallback, ilustrativas) cubre el riesgo de compra (2, 6, 7, 8); el costo en plata es cero (4); la clienta lo disfruta si funciona (1).
3. **Condiciones aplicables esta semana** (el usuario pidió avanzar: son requisitos del plan):
   - **Primera pantalla útil antes de la animación:** "Casa Nido", qué vende, un producto con precio y botón de pedir, visibles sin scrollear (3, 9, 7).
   - **Precio y "Pedir por WhatsApp" en cada producto del túnel** y un botón fijo durante todo el scroll (9, 7, 6).
   - **El túnel se alimenta del catálogo real** (productos, fotos, categorías del admin), sin tocar código, y sigue apagable (10, 11, 12). Las fotos IA llevan aviso "ilustrativa" hasta que la dueña suba la real (1, 5, 6).
4. **Prueba real (≤ 7 días):** mandar el link a 10 clientas, alguna con celular modesto. **Sí:** 3 o más piden desde la web, nadie dice que se traba, y la dueña cambia una foto sola. **No:** nadie pide o dicen "se traba" o "¿es lo que me va a llegar?".
5. **Lo que el tribunal no sabía:** qué celulares usan las clientas, cuántos productos reales vende, si las fotos IA coinciden con lo que vende.

---
Juicio en salas separadas: cada papel fue un agente independiente que no vio a los demás, pero todos son el mismo modelo base.
Este tribunal es una simulación: ordena los argumentos, no reemplaza probar la idea con personas reales.
