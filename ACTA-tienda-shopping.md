# Acta del tribunal — Tienda "shopping" estilo GTA

## Expediente
- **Idea:** web-tienda para una amiga que vende productos para el hogar. Interfaz que simula un shopping con intro estilo GTA: con cada scroll pasa de mapa → calle → frente del local → productos, efecto 3D. Sección admin para que la dueña cambie las fotos de los productos.
- **Quién la usa:** las clientas de la amiga, que hoy le compran por Instagram/WhatsApp.
- **Objetivo:** catálogo que termine en pedido por WhatsApp (preferido); pago online también serviría.
- **Inversión:** gratis, es un regalo; web pública y admin online en planes gratuitos.
- **No lo dijo:** cantidad de productos, ciudad, si la amiga sabe usar la compu, si las clientas entran desde el celular.

## Alegatos

**Fiscal**
1. Supuesto: el efecto 3D es pesado para celulares de gama media/baja y la clienta tiene que atravesar la intro antes de ver un producto. Abre el link desde WhatsApp, ve algo trabado o largo, y cierra.
2. Supuesto: la dueña no tiene tiempo ni práctica para mantener un admin online. Lo carga dos semanas y la web muestra productos agotados o precios viejos.
3. El expediente no dice cómo llegarían las clientas. Sin tráfico propio siguen comprando por Instagram y la web queda como un regalo que casi nadie visita.

**Defensa**
1. Supuesto: las clientas entran desde el celular y ya confían en la dueña. El catálogo les ahorra preguntar "¿qué tenés?" y el pedido llega armado por WhatsApp.
2. El destino es WhatsApp, un canal que la dueña ya usa todos los días. No aprende un sistema de pedidos: los mensajes entran donde ya contesta.
3. La intro estilo GTA es un diferencial que ningún catálogo de Instagram tiene. Una clienta lo comparte por lo original y le da marca recordable sin gastar en publicidad.

## Votos

| # | Jurado | Voto | Razón | Cambiaría su voto si |
|---|---|---|---|---|
| 1 | La clienta ideal | CULPABLE | Quiero ver rápido qué hay, precios y pedir por WhatsApp desde el celular; la intro me parece un obstáculo y se trabaría o me aburriría. | La intro fuera opcional ("saltar") y el catálogo con precios y botón "pedir por WhatsApp" apareciera de inmediato, liviano en celular. |
| 2 | La escéptica | CULPABLE | Prometen efecto original y admin simple, pero nada garantiza que funcione fluido en mi celular ni que productos y precios estén al día. | Hay un prototipo probado en un celular barato, con catálogo directo saltando la intro y la dueña actualizando productos sola. |
| 3 | La que no te conoce | CULPABLE | Un link sin contexto abre una intro de mapa y calle; no queda claro en dos segundos que es una tienda de hogar ni para quién. | La primera pantalla muestra nombre de la tienda, "productos para el hogar" y un botón visible "Ver productos" o "Pedir por WhatsApp". |
| 4 | La contadora | INOCENTE | Costo cero en dinero y poco en mantenimiento; hosting gratis alcanza para un catálogo chico. Una venta por WhatsApp ya compensa. | El admin exigiera servicios pagos o la dueña tuviera que dedicar horas semanales a mantenerlo. |
| 5 | La competencia | CULPABLE | Copiar el efecto 3D es código reutilizable; lo valioso (clientas, confianza) lo tiene la dueña en Instagram/WhatsApp, no la web. | La web integra algo que no se copia fácil: reseñas reales, stock en vivo, o exclusividad de productos propios. |
| 6 | La que ya te compró | CULPABLE | Ya le pido por WhatsApp y me funciona; una intro 3D larga antes de ver productos me confunde y me frena. | La intro se puede saltar con un toque y el catálogo carga al instante, con botón claro de pedir por WhatsApp. |
| 7 | La que casi compra | CULPABLE | Mi traba era la pereza de preguntar precios por DM; si la intro me hace esperar, cambio una fricción por otra. | Pudiera saltar la intro y ver productos con precio a un toque, con botón "pedir por WhatsApp" ya armado. |
| 8 | La experta del rubro | CULPABLE | Factible, pero un scroll 3D en celulares de gama media/baja suele trabarse; y un admin gratuito exige almacenamiento, auth y mantenimiento no triviales. | Se prueba un prototipo fluido (60fps, <3MB inicial) en un celular barato, con intro salteable y catálogo plano directo. |
| 9 | La vendedora | CULPABLE | Se explica en una frase, pero ante "¡se traba y tarda, mandame la foto!" no tengo respuesta segura. | Hay botón "saltar intro" visible y carga rápida en mi celular, para responder "entrá directo al catálogo". |
| 10 | La que lo ejecuta | CULPABLE | La dueña vive en Instagram/WhatsApp; un admin con fotos, precios y stock es trabajo extra que probablemente abandone. | El admin permite cambiar foto, precio y agotado desde el celular en menos de un minuto. |
| 11 | La del largo plazo | CULPABLE | La intro cansa tras la primera visita y un admin manual se abandona; lo que perdura es el catálogo, y está enterrado bajo el efecto. | La intro se puede saltar y el catálogo se actualiza sin depender de que la dueña use un admin. |
| 12 | La amiga honesta | CULPABLE | Se cansa rápido de un admin aparte; el efecto GTA lo entusiasma más a quien lo regala que a ella. | La actualización fuera tan fácil como mandar fotos por WhatsApp, o alguien más se la mantuviera. |

## Marcador
**INOCENTE 1 · CULPABLE 11**

## Veredicto: NO LA HAGAS ASÍ

1. **Lo que pesó en contra**
   - La intro tapa el catálogo: la clienta quiere ver precios y pedir ya, y en el celular se traba o aburre (jurados 1, 6, 7, 9).
   - Mantener un admin aparte es trabajo extra que la dueña puede abandonar, y la web queda desactualizada (10, 11, 12).
   - Sin contexto en la primera pantalla no se entiende que es una tienda de hogar (3).
2. **Lo que pesó a favor**
   - Cuesta cero y una sola venta por WhatsApp ya lo compensa (4).
3. **Condiciones para esta semana** (se usan como requisitos del desarrollo)
   - **Intro salteable y liviana:** botón "Ir al catálogo" visible desde el primer segundo, que la intro no bloquee nada y que funcione fluida en un celular barato (1, 2, 6, 7, 8, 9, 11).
   - **Primera pantalla clara:** nombre de la tienda, "productos para el hogar" y un botón a los productos / WhatsApp sin tener que scrollear (3).
   - **Admin de un minuto desde el celular:** cambiar foto, precio y "agotado" desde el teléfono en menos de un minuto (2, 10).
4. **Prueba real y barata (≤ 7 días):** la dueña manda el link a 10 clientas habituales por WhatsApp. **Sí:** al menos 3 mandan un pedido armado desde la web y la dueña actualiza sola un producto desde el celular. **No:** nadie pide desde la web, o las clientas responden "se traba" / "mandame fotos".
5. **Lo que el tribunal no sabía:** si las clientas entran desde celulares de gama baja, si la dueña se maneja con un panel web, y cómo van a llegar las clientas a la web además del link por WhatsApp.

---

# Segundo juicio — rediseño con mapa 3D (2026-10-16)

## Expediente
- La versión 1 (collage de fotos con zoom) el usuario la rechazó por fea y poco realista.
- **Nueva idea:** intro guiada por scroll con mapa 3D real y gratuito (MapLibre): país desde arriba → ciudad estilo Google Maps → la cámara se inclina y vuela entre edificios 3D hasta una cuadra genérica de Buenos Aires → se funde con una imagen realista del frente generada con Gemini → entra por la puerta → "pasillos" de categorías a pantalla completa → productos.
- **Se mantiene:** "saltar al catálogo" siempre visible, barra con nombre, carrito a WhatsApp, admin desde el celular, todo gratis.
- **No lo dijo:** no hay local físico (ubicación genérica), qué celulares usan las clientas, cuántos productos.

## Alegatos
**Fiscal:** 1) Supuesto: mapa 3D e imágenes a pantalla completa pesan en celulares modestos con datos; se traba y la clienta vuelve a Instagram. 2) La intro es un espectáculo para quien la hizo; la mayoría toca "saltar" y el catálogo recibe menos atención. 3) Supuesto: sin local físico, la cuadra y el frente IA muestran un lugar que no existe; quien lo crea real busca la dirección y siente engaño.
**Defensa:** 1) Supuesto: el carrito a WhatsApp ordena algo que ya funciona, por el mismo canal. 2) "Saltar" separa espectáculo de compra: la apurada entra directo, la curiosa disfruta y lo comparte. 3) Supuesto: si llega fluido, un recorrido distinto se vuelve memorable y se comparte.

## Votos
| # | Jurado | Voto | Razón | Cambiaría su voto si |
|---|---|---|---|---|
| 1 | La clienta ideal | CULPABLE | Quiero ver productos y precios rápido en mi celular; un vuelo 3D hasta un local que quizás no existe me suena a vueltas y desconfianza. | El catálogo con precios aparece primero y la intro es opcional, liviana, con el local y los productos reales. |
| 2 | La escéptica | CULPABLE | Promete más espectáculo, no más prueba; nada muestra que ahora sí vende, carga fluida o que las imágenes IA coinciden con lo real. | Un prototipo corre fluido en un celular modesto con datos y clientas reales pidieron por WhatsApp desde él. |
| 3 | La que no te conoce | CULPABLE | En dos segundos veo un mapa, no una tienda; nada me dice para quién es ni qué compro. | La primera pantalla muestra nombre, "productos para el hogar", productos y botón de WhatsApp, antes de cualquier mapa. |
| 4 | La contadora | CULPABLE | Esfuerzo enorme de build para una tienda regalo sin ingreso proyectado; el mantenimiento recae sin pago. | Se acota a una intro corta con imágenes estáticas, catálogo primero, y el mapa 3D queda como fase opcional. |
| 5 | La competencia | INOCENTE | Copiar la intro exige MapLibre, imágenes IA coherentes y pulido de scroll; otra vendedora de Instagram no lo haría mañana. | Existiera una plantilla gratuita de mapa-scroll-a-tienda que cualquiera clone en una tarde. |
| 6 | La que ya te compró | CULPABLE | Ya compro en dos toques; un recorrido con pasillos y un local que quizá no existe me demora y confunde. | El catálogo con carrito a WhatsApp abre primero y la intro es opcional, con fotos reales de sus productos. |
| 7 | La que casi compra | CULPABLE | Mi traba era la pereza de preguntar precios; más pasos antes de verlos me la agranda. | Los precios se ven de entrada y pedir por WhatsApp toma dos toques sin pasar por la intro. |
| 8 | La experta del rubro | CULPABLE | MapLibre vuela edificios 3D gratis, pero en celulares modestos el scroll-fly más imágenes grandes se traba; la IA rara vez iguala los productos. | Intro liviana con carga diferida, degradación a catálogo sin mapa y prueba en gama baja. |
| 9 | La vendedora | CULPABLE | Se explica fácil, pero sin local físico "¿dónde queda?" no tiene respuesta honesta. | La intro se presenta como tienda online, sin afirmar dirección, y el catálogo carga primero, rápido. |
| 10 | La que lo ejecuta | INOCENTE | La intro es fija y no me exige nada; subo fotos, precios y agotados desde el celular. | Agregar un producto exigiera regenerar imágenes con IA, tocar código o depender de alguien. |
| 11 | La del largo plazo | CULPABLE | La intro 3D envejece rápido; el catálogo y WhatsApp sí perduran. | La intro es un módulo opcional y desacoplado, y la tienda funciona sin mapa ni imágenes IA. |
| 12 | La amiga honesta | CULPABLE | No es técnica; algo que no entiende ni puede mantener la va a abrumar. | El espectáculo es estático y nunca lo toca, y su admin queda simple como mandar un WhatsApp. |

## Marcador
**INOCENTE 2 · CULPABLE 10** — Cambiaron respecto del primer juicio: la contadora (pasó a CULPABLE), la competencia y la que lo ejecuta (pasaron a INOCENTE).

## Veredicto: NO LA HAGAS ASÍ
1. **En contra:** la intro demora ver precios y pedir (1, 6, 7); el mapa 3D puede trabarse en celulares modestos (8); un local que no existe genera desconfianza (1, 9).
2. **A favor:** es difícil de copiar para otra vendedora (5); a la dueña no le suma trabajo, solo usa el admin (10).
3. **Condiciones para esta semana** (se usan como requisitos):
   - **La primera pantalla vende:** nombre, "productos para el hogar · tienda online", botones "Ver productos" y "Pedir por WhatsApp" encima del mapa, sin scrollear (3, 7, 9).
   - **Intro opcional, desacoplada y con degradación:** el mapa carga diferido; sin WebGL, con ahorro de datos o "reducir movimiento" la tienda va directo al catálogo sin mapa (8, 11, 1, 6).
   - **Honestidad y cero mantenimiento:** se presenta como tienda online, sin dirección real; las imágenes IA son solo ambientación fija y los productos siguen con fotos que la dueña cambia desde el admin (9, 10, 12).
4. **Prueba real (≤ 7 días):** mandar el link a 10 clientas. **Sí:** 3 o más piden por WhatsApp desde la web y ninguna se queja de que se traba. **No:** preguntan "¿dónde queda?", dicen que tarda o nadie pide.
5. **Lo que el tribunal no sabía:** qué celulares usan las clientas y si la amiga quiere mostrar una zona (aunque no tenga local).

---

# Tercer juicio — hero three.js con stickers + cámara "Ver en tu mesa" (2026-10-16)

## Expediente
- Las dos versiones anteriores (collage con zoom; mapa 3D con vuelo a la calle) el usuario las rechazó por feas.
- **Diseño pedido por el usuario:** hero 3D atado al scroll (~500vh, escenario sticky) con three.js: túnel de estrellas con warp, planeta con trama halftone, productos como "stickers" 3D que aparecen al pasar la cámara, portal final al catálogo, carteles HTML con GSAP ScrollTrigger, "ir directo al catálogo", fallback estático. Botón de cámara "Ver en tu mesa" con el producto a tamaño real (calibración con tarjeta de 8,56×5,4 cm). Todas las fotos de producto generadas en Gemini, en una sola sesión.
- **Se mantiene:** catálogo, carrito → WhatsApp, admin desde el celular. Gratis, regalo.
- **No lo dijo:** qué celulares usan las clientas, cuántos productos reales hay, si las fotos IA coinciden con lo que vende.

## Alegatos
**Fiscal:** 1) Supuesto: el hero 3D es pesado para celulares de gama media/baja; pantalla negra o saltos y la clienta vuelve al chat sin ver un precio. 2) Las fotos IA probablemente no coinciden con lo que vende y con el tamaño real la clienta compra lo que vio y recibe otra cosa. 3) "Ver en tu mesa" exige permiso de cámara, tarjeta y funcionar dentro del navegador de Instagram: casi nadie lo usa y es otro punto que se rompe.
**Defensa:** 1) El estilo se cuida con paleta cerrada y poca cosa en pantalla: identidad propia. 2) El embudo no cambia: con "ir directo" y el fallback, quien viene de Instagram saltea el show y pide igual. 3) "Ver en tu mesa" resuelve cuánto mide, si las medidas cargadas son reales.

## Votos
| # | Jurado | Voto | Razón | Cambiaría su voto si |
|---|---|---|---|---|
| 1 | La clienta ideal | CULPABLE | El show 3D me estorba y con fotos IA que quizá no son el producto no confío en las medidas ni en comprar. | Las fotos fueran reales, el catálogo con precios abriera directo y "Ver en tu mesa" fuera opcional. |
| 2 | La escéptica | CULPABLE | Lo central (hero 3D, fotos IA, tamaño real) es justo lo que suele prometerse y fallar; falta evidencia de que cumpla. | Se prueba en un celular gama baja real con fotos reales, y se puede pedir sin tarjeta ni show. |
| 3 | La que no te conoce | CULPABLE | Un hero espacial con planetas no dice "productos para el hogar"; en dos segundos no entiendo qué venden. | Lo primero visible, sin scroll, dice en texto claro "Casa Nido: cocina, deco, textiles y baño" con un producto y precio. |
| 4 | La contadora | CULPABLE | Cuesta casi cero en dinero, pero el tiempo no cierra: hero 3D, cámara, admin y fotos IA son meses regalados más mantenimiento eterno. | Se recorta a catálogo+carrito+admin primero y hero 3D y cámara quedan como fase opcional con tope de horas. |
| 5 | La competencia | INOCENTE | Copiar un hero con identidad propia, medidas verificadas y flujo de pedido rodado me llevaría semanas. | Existiera una plantilla gratuita de tienda 3D con "Ver en tu mesa" y pedido por WhatsApp. |
| 6 | La que ya te compró | CULPABLE | Ya le compro por WhatsApp con confianza; un show 3D y una cámara con tarjeta me confunden y, si llega distinto a la foto IA, pierdo la confianza. | Las fotos son del producto real, el catálogo abre directo con precios y el carrito manda el pedido. |
| 7 | La que casi compra | CULPABLE | Lo que me frenó fue no ver precio ni medida rápido; un show 3D y calibrar con tarjeta me suman trabas. | El catálogo con precio y medida real se ve al instante, sin pasar por el 3D, y las fotos son reales. |
| 8 | La experta del rubro | CULPABLE | El hero three.js es factible, pero "Ver en tu mesa" con tarjeta en el navegador de Instagram (WebView) y fotos IA a tamaño real no cumple lo prometido. | Se prueba en gama baja e in-app de Instagram y la cámara queda opcional, con medidas verificadas. |
| 9 | La vendedora | CULPABLE | No se explica en una frase y a "¿esto es lo que me va a llegar?" no tengo respuesta honesta si las fotos son IA. | Las fotos son de productos reales, la cámara es opcional y el catálogo con precios se ve desde el primer segundo. |
| 10 | La que lo ejecuta | CULPABLE | Mantener 3D, cámara y fotos IA exige habilidades y tiempo que ella no tiene; cada producto nuevo suma medidas y fotos. | Cargar un producto desde el celular toma menos de cinco minutos, con el show 3D y la cámara apagables. |
| 11 | La del largo plazo | CULPABLE | El hero 3D es moda con alto mantenimiento; a los seis meses sirven el catálogo y los precios. | El hero 3D y la cámara son módulos opcionales y desactivables; catálogo, carrito y admin funcionan solos. |
| 12 | La amiga honesta | CULPABLE | Vende por WhatsApp y quiere subir un precio y listo; tres cosas nuevas que mantener la cansan. | Subir un producto desde el celular le lleva menos de dos minutos y lo prueba sola antes de entregárselo. |

## Marcador
**INOCENTE 1 · CULPABLE 11**

## Veredicto: NO LA HAGAS ASÍ
1. **En contra:** el show tapa lo que vende y pesa en celulares modestos (1, 3, 7, 8); las fotos IA pueden no coincidir con lo que llega y la cámara las vuelve más comprometedoras (1, 2, 6, 9); más cosas que mantener para la dueña (4, 10, 11, 12).
2. **A favor:** es difícil de copiar con identidad propia y flujo ya rodado (5).
3. **Condiciones** (el usuario decidió avanzar igual; se usan como requisitos):
   - **El catálogo manda:** la primera pantalla dice "Casa Nido · cocina, deco, textiles y baño" con un producto con precio y botones "Ver productos" y "Pedir por WhatsApp", sin scrollear. Catálogo, carrito y admin funcionan solos, sin 3D.
   - **3D y cámara opcionales y apagables** desde el admin (interruptores), con fallback automático en celulares de gama baja, ahorro de datos, sin WebGL o reduced-motion.
   - **Fotos honestas:** las imágenes de Gemini son provisorias y se avisa "imágenes ilustrativas"; la dueña puede reemplazarlas por fotos reales desde el celular; la medida se marca "aproximada" hasta que ella cargue la real.
   - **Admin de dos minutos:** cargar o editar producto, foto, precio, medida y "agotado" desde el celular.
4. **Prueba real (≤ 7 días):** 10 clientas reciben el link por WhatsApp, entre ellas alguna con celular modesto. **Sí:** 3 o más piden desde la web, nadie dice que se traba y la dueña carga un producto sola. **No:** nadie pide, o dicen "se traba" o "¿es lo que me va a llegar?".
5. **Lo que el tribunal no sabía:** qué celulares usan las clientas, si hay fotos reales de los productos y cuántos productos vende de verdad.

---
Juicio en salas separadas: cada papel fue un agente independiente que no vio a los demás, pero todos son el mismo modelo base.
Este tribunal es una simulación: ordena los argumentos, no reemplaza probar la idea con personas reales.
