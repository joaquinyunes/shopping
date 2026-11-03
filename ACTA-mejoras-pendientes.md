# Acta del tribunal — mejoras pendientes de Casa Nido (02/11/2026)

**Juicio en una sola sala: un mismo modelo hizo todos los papeles.** (No se lanzaron los 14 agentes: costo alto para un paquete de funciones conocidas.)

## Expediente
- Qué es: variantes (talle/color con precio y stock propios), varias fotos, precio promocional, ocultar producto, cancelación automática de pedidos sin pago + aviso por mail, adaptadores de envío reales detrás de `EnviosProvider`.
- Quién lo usa: la dueña de la tienda (catálogo y pedidos) y sus clientas (compra desde el celular).
- Qué quiere lograr: cerrar las brechas que `docs/BACKOFFICE.md` marca contra Tiendanube.
- Restricciones: catálogo entero en un documento Mongo (`tienda`), stock con `$inc` posicional dentro de una transacción. Sin credenciales de correos ni de mail. Tiempo y precio: no lo dijo.

## Alegatos
- **Fiscal:** (1) El stock por variante agrava el pisado de stock por el admin: la dueña guarda con una copia vieja y borra lo vendido. (2) Cancelar solos los pedidos pendientes puede cancelar uno que la dueña está coordinando por WhatsApp. (3) Los adaptadores de envío no se pueden probar sin credenciales: se entregaría código que nadie vio funcionar.
- **Defensa:** (1) Variantes y precio promocional son lo primero que una tienda de hogar y textil necesita. (2) Los pedidos pendientes que retienen stock son un problema real hoy. (3) Todo va detrás de interfaces que ya existen, sin tocar lo que funciona.

## Votos
| # | Jurado | Voto | Razón | Cambiaría su voto si |
|---|---|---|---|---|
| 1 | Clienta ideal | INOCENTE | Elegir talle/color y ver el precio de oferta es lo normal. | — |
| 2 | Escéptica | CULPABLE | Adaptadores de correo «hechos» sin una sola llamada real prometen más de lo que se verificó. | Se declare que no están verificados y haya respaldo. |
| 3 | La que no te conoce | INOCENTE | Variantes, oferta y fotos se entienden en dos segundos. | — |
| 4 | Contadora | CULPABLE | Gastar tiempo en adaptadores sin credenciales ni cliente que los use. | Los adaptadores sean mínimos. |
| 5 | Competencia | CULPABLE | Son funciones de Tiendanube; copiarlas no da ventaja. | — (no cambia nada del plan) |
| 6 | La que ya compró | INOCENTE | No rompe el carrito ni el pedido por WhatsApp. | — |
| 7 | La que casi compra | CULPABLE | Lo que la frena es pagar online, no las variantes. | Entre el cobro online. |
| 8 | Experta del rubro | INOCENTE | Con transacciones y pruebas contra Mongo real es sólido. | — |
| 9 | Vendedora | INOCENTE | «Elegí talle y color, mirá la oferta» se explica en una frase. | — |
| 10 | La que lo ejecuta | INOCENTE | Cabe en el esquema actual si se hace en tandas con pruebas. | — |
| 11 | Largo plazo | INOCENTE | Variantes y stock correcto no son moda. | — |
| 12 | Amiga honesta | INOCENTE | Es lo que la dueña va a pedir apenas venda ropa o textil. | — |

**Marcador: 8 INOCENTE · 4 CULPABLE → HAZLA, CON CONDICIONES.**

## Veredicto
1. **En contra:** adaptadores sin credenciales (2, 4); funciones copiables (5); el freno real de compra es el cobro (7).
2. **A favor:** variantes/oferta son lo básico (1, 3, 12); no rompe lo que anda (6, 10); se prueba contra Mongo real (8).
3. **Condiciones (requisitos del plan):**
   - Cerrar **primero** el pisado de stock del admin (control de versión) y recién después las variantes.
   - La cancelación automática es **opcional y viene apagada** (`PEDIDO_VENCE_HORAS`); la dueña la prende si quiere.
   - Los adaptadores de envío **siempre caen a la tarifa de ejemplo** si fallan y se documentan como **no verificados contra la API real**. El mail nunca hace fallar un pedido.
4. **Prueba barata (≤ 7 días):** la dueña carga un producto con dos variantes, hace tres pedidos de prueba y cancela uno. «Sí» = el stock de cada variante cuadra y entiende el panel sin ayuda; «no» = no encuentra dónde cargar la variante.
5. **No sabíamos:** cuánto vende por mes, si vende productos con talle o color, y si ya tiene cuenta en algún correo.

Este tribunal es una simulación: ordena los argumentos, no reemplaza probar la idea con personas reales.
