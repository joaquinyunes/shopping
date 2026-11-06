# Casa Nido — cómo se vende (V1, V2, V3, V10)

**Frase de venta (a validar con una compradora real):** «Tienda online de hogar propia: tus clientas ven el producto en su mesa con la cámara, piden por WhatsApp o pagan, y el stock se descuenta solo.»

## V1. Tres paquetes (propuesta a validar con una compradora real, no es un dato de mercado)
| Paquete | Qué incluye | Precio propuesto (USD) |
|---|---|---|
| **Instalación** | Base de datos (Atlas) + sitio en Vercel y copia en Render + dominio propio + catálogo real cargado (importando la planilla de Tiendanube/Excel) + segundo paso del admin + capacitación de 1 h (ver `docs/MANUAL-DUENA.md`) | 900 pago único |
| **Mensual** | Hosting y base, respaldo semanal cifrado con prueba de restauración trimestral, actualizaciones de seguridad (Dependabot), aviso de caída (`/api/salud`) y soporte por mail/WhatsApp con respuesta en 1 día hábil | 60 por mes |
| **Completo** | Todo lo anterior + integraciones locales (envíos con Andreani/Correo Argentino/OCA, Mercado Pago, WhatsApp automático, factura electrónica con proveedor certificado) + migración de datos de la tienda anterior + 12 meses de mantenimiento incluidos | ~10.000 |

Qué **no** incluye ningún paquete: fotografía de producto, redes sociales/publicidad, facturación fiscal sin un proveedor y un contador matriculado, cambios de diseño a medida (se presupuestan aparte). Los datos de la clienta son suyos; el código se entrega con licencia de uso (ver «Licencia y contrato», pendiente con abogado: 👤).
Las integraciones locales **no están en producción todavía**: los adaptadores de envío están escritos y probados con respuestas simuladas, no contra los correos (`docs/ENVIOS.md`); Mercado Pago, WhatsApp automático y factura electrónica no están hechos. El paquete Completo solo se puede cerrar cuando estén (el tribunal lo pidió: «el foso que una agencia no copia en semanas»).

## V2. Costo a 3 años contra la suscripción del rubro
Fuente: <https://www.tiendanube.com/planes-y-precios>, leída con el navegador el **03/11/2026** (precios en pesos, vista mensual, Argentina). Hay que **volver a leerla el día que se arma la oferta**.
| Plan de Tiendanube | Mensual | 3 años (36 meses) | Con pago anual (hasta -25 %, el sitio no muestra el monto) |
|---|---|---|---|
| Inicial | gratis (con costo por transacción: el valor por plan no se leyó) | — | — |
| Esencial | $27.999 | $1.007.964 | hasta ~$755.973 |
| Impulso (el «más elegido») | $79.999 | $2.879.964 | hasta ~$2.159.973 |
| Escala | $244.999 | $8.819.964 | hasta ~$6.614.973 |

Casa Nido (propuesta de V1, en dólares): **Instalación + Mensual** = 900 + 36 × 60 = **USD 3.060**; **Completo** = 10.000 + 24 meses × 60 (los 12 primeros van incluidos) = **USD 11.440**.
Para compararlas hay que pasar los dólares a pesos al **tipo de cambio del día** (👤 dato que no se inventa acá). Con una cotización de ejemplo de 1.500 pesos por dólar (solo ilustrativa):
| | Pesos a 3 años |
|---|---|
| Casa Nido Instalación + Mensual | $4.590.000 |
| Casa Nido Completo | $17.160.000 |
| Tiendanube Esencial / Impulso | $1.007.964 / $2.879.964 |

**Lo que dice honestamente la tabla:** por precio, una tienda chica **no gana** contra Tiendanube: es entre 1,6 y 17 veces más cara según el paquete. Los jurados tenían razón: «Tiendanube cuesta una cuota chica». Entonces no se vende por precio. Se vende a quien:
1. necesita algo que la suscripción no hace: **«Ver en tu mesa» con la cámara** a tamaño real, o integraciones a medida;
2. quiere que **el código y la base sean suyos** (Tiendanube da acceso al código fuente recién desde Impulso y la tienda sigue siendo de ellos);
3. vende lo suficiente como para que la comisión por transacción de la suscripción pese (el costo por transacción de Esencial/Impulso hay que leerlo y sumarlo: 👤 con la compradora real).
Mientras no haya una compradora que lo pague, **el USD 10.000 es una hipótesis**: el camino que la tabla sí sostiene es *Instalación + Mensual*. La propuesta no se ofrece hasta cumplir V10.

## V3. Entorno de demo aparte
- `npm run build:demo` genera `dist-demo/`: mismo sitio con un cartel «DEMO» fijo, `noindex`, **sin API ni base** (los cambios del panel quedan en el navegador de quien prueba) y con los datos de ejemplo del repo (productos con fotos ilustrativas, aviso de IA visible).
- Se publica como **otro proyecto** de Vercel (Build Command `npm run build:demo`, Output Directory `dist-demo`, sin ninguna variable de entorno) con otra dirección, por ejemplo `demo-casa-nido.vercel.app`. El sitio real **nunca** se usa para mostrar. 👤 crear ese proyecto.
- Para mostrar a una compradora el caso real, se usa el sitio de la tienda de referencia (el estudio jurídico es otro rubro; la referencia de hogar es la propia tienda cuando esté en producción).

## V10. Clienta piloto (👤)
Requiere una dueña real que use la tienda con su catálogo. Criterio de éxito: una semana de pedidos reales con el stock descontado en producción y un respaldo restaurado. Hasta entonces: **no seguir construyendo para otros rubros** (regla del tribunal).

## Lo que queda para vos (👤)
1. Validar precios y paquetes con una compradora real; completar el tipo de cambio y el costo por transacción de Tiendanube el día de la oferta.
2. Licencia/contrato y revisión legal de privacidad y términos (con abogado).
3. Crear el proyecto de la demo en Vercel; cuentas a nombre de la clienta en cada traspaso.
4. Elegir la clienta piloto (V10).
