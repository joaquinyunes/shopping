# Acta del tribunal — Objetos tocables, escena centrada, admin y publicación · 2026-10-18

## Expediente
- **Idea:** sobre el túnel 3D de hogar ya hecho hoy: (1) objetos flotantes que se puedan tocar, (2) todo el efecto 3D + scroll más centrado, (3) admin que modifique los productos de la página, (4) repositorio en GitHub y publicación en Render y Vercel.
- **Quién lo usa:** clientas de la dueña (Instagram/WhatsApp) y la dueña desde el celular.
- **Qué quiere el usuario:** que la web se sienta viva y que la dueña maneje sus productos sola.
- **Inversión:** tiempo; hosting gratis (supuesto: planes gratuitos de Vercel, Render y Supabase alcanzan).
- **Antecedente:** `ACTA-tunel-hogar.md` (6–6, REHAZLA; condiciones ya implementadas: primera pantalla útil, precio y pedido en cada producto, catálogo manda, 3D apagable).
- **No lo dijo:** celulares de las clientas, cuántos productos reales hay, qué proyecto de Supabase usar.

## Alegatos
**Fiscal:** 1) Tocar objetos puede pelearse con el scroll en el celular: un toque que frena o roba el desplazamiento arruina la compra. 2) El admin ya existe, pero sin Supabase guarda solo en el navegador de la dueña: las clientas no ven ningún cambio. 3) Publicar sin probar en un celular real repite el hueco que el acta anterior dejó abierto.
**Defensa:** 1) Supuesto: un toque que responde con un rebote hace que la visita dure más y no tapa precio ni WhatsApp. 2) Centrar acerca producto y texto, y se entiende más rápido qué es la tienda. 3) Con Supabase, la dueña cambia precios y fotos sola y el túnel se arma con su catálogo.

## Votos (juicio en una sola sala: un mismo modelo hizo todos los papeles)
| # | Jurado | Voto | Razón | Cambiaría su voto si |
|---|---|---|---|---|
| 1 | La clienta ideal | INOCENTE | Si lo flotante responde al toque, el recorrido se disfruta más sin sacarme el precio. | El toque frenara el scroll en mi celular. |
| 2 | La escéptica | CULPABLE | Nada de esto se probó todavía en un celular real. | Se probara en un celular modesto y anduviera. |
| 3 | La que no te conoce | INOCENTE | Con texto y producto más al centro se entiende rápido qué es. | El nombre y qué vende quedaran lejos del centro. |
| 4 | La contadora | INOCENTE | Hosting y base gratis; el costo es tiempo. | Algún plan gratuito pidiera tarjeta o pago. |
| 5 | La competencia | CULPABLE | Objetos que rebotan se copian en un día; el foso son las fotos propias. | La dueña cargara fotos reales y propias. |
| 6 | La que ya te compró | INOCENTE | Catálogo, precio y WhatsApp siguen donde estaban. | El toque abriera algo que tape el catálogo. |
| 7 | La que casi compra | INOCENTE | El botón fijo de pedir sigue durante todo el viaje. | Los toques movieran o taparan ese botón. |
| 8 | La experta del rubro | INOCENTE | Raycast sobre instancias es estándar y barato; hay que distinguir toque de arrastre. | El toque se confundiera con el arrastre y trabara el scroll. |
| 9 | La vendedora | INOCENTE | Cambiar precios desde el admin evita pedirle cambios a un programador. | El admin online no guardara de verdad. |
| 10 | La que lo ejecuta | CULPABLE | Sin Supabase conectado el admin guarda solo en su navegador y las clientas ven lo viejo. | Supabase quedara conectado con su usuario de la dueña. |
| 11 | La del largo plazo | INOCENTE | El túnel se alimenta del catálogo, así que no queda viejo. | El catálogo dejara de editarse. |
| 12 | La amiga honesta | INOCENTE | Editar productos desde el celular es algo que sí vas a usar. | El admin fuera incómodo en el celular. |

## Marcador
**INOCENTE 9 · CULPABLE 3**

## Veredicto: HAZLA
1. **En contra:** sin probar en celular real (2); sin foto propia no hay foso (5); sin Supabase el admin no llega a las clientas (10).
2. **A favor:** conserva precio, pedido y catálogo (1, 6, 7); centrar mejora la lectura (3); el admin libera a la dueña (9, 12).
3. **Condiciones (requisitos del plan):**
   - El toque no debe robar el scroll: se cuenta como toque solo si el dedo casi no se movió.
   - Conectar Supabase antes de dar el sitio por terminado (hace falta URL, clave pública y el usuario de la dueña).
   - Probar en viewport de celular y avisar que no se probó en un dispositivo real.
4. **Prueba real (≤ 7 días):** mandar el link a 10 clientas. **Sí:** 3 o más piden por WhatsApp y la dueña cambia un precio sola desde su celular. **No:** el scroll se traba o los cambios del admin no se ven en otro dispositivo.
5. **El tribunal no sabía:** modelos de celular, cantidad real de productos, proyecto de Supabase.

---
Juicio en una sola sala: un mismo modelo hizo todos los papeles.
Este tribunal es una simulación: ordena los argumentos, no reemplaza probar la idea con personas reales.
