# Back-office de Casa Nido frente a Tiendanube

Rubro: tienda online de hogar y decoración. Competencia según la skill `backend-por-nicho` (fila E-commerce): **Tiendanube** (~25,5 % de los sitios en Argentina) y **WooCommerce** (~42,5 %). Envíos que usan esas tiendas: Correo Argentino (MiCorreo), Andreani, OCA e-Pak y Zipnova.

Referencia de comparación: el panel de Tiendanube. Las filas marcadas **[doc]** salen de su ayuda oficial (ayuda.tiendanube.com), leída el 2026-10-28; las marcadas **[general]** son lo que se sabe del producto sin haberlo verificado en esa ayuda y hay que confirmarlas en un panel real antes de prometerlas.

✅ lo tiene · 🟡 parcial · ❌ falta. «Antes» = rama `main`; «Ahora» = rama `feat/pendientes-casa-nido`.

## Matriz función por función

### Catálogo

| Función en Tiendanube | Antes | Ahora | Detalle |
|---|---|---|---|
| Alta, edición y baja de producto (nombre, precio, descripción) | ✅ | ✅ | `src/admin/Admin.tsx`, `AdminProducto.tsx`. Hasta 500 productos (tope de `datosValidos`). |
| Foto del producto | ✅ | ✅ | Una foto por producto; se sube a Atlas (`api/foto.ts`). |
| Varias fotos por producto [general] | ❌ | ✅ | Foto principal + hasta 5 extra (`fotos`). La clienta cambia de foto con miniaturas de 44 px. |
| Categorías (con subcategorías, varias por producto) [doc] | 🟡 | 🟡 | Una categoría de texto por producto, sin jerarquía. |
| **Variantes** (hasta 3 propiedades, ej. talle/color; precio y stock por variante) [doc] | ❌ | ✅ | `propiedades` + `variantes` (hasta 40 por producto). El id de la variante sale de sus valores. En la tienda se elige en un desplegable; el pedido guarda cuál. Una variante con precio propio no toma la oferta del producto. |
| **Stock** por producto; vacío = ilimitado [doc] | ❌ (solo «Agotado» a mano) | ✅ | Campo `stock` (+ `agotado` derivado cuando llega a 0). Con variantes, el stock es de cada variante y el producto queda agotado cuando todas están en 0. |
| SKU y código de barras [doc] | ❌ | 🟡 | SKU (del producto y de cada variante) sí; código de barras no. |
| Peso y medidas [doc] | 🟡 | 🟡 | Peso en gramos y una medida principal (se usan para la cámara «Ver en tu mesa» y para cotizar el envío). Sin alto/ancho/profundidad. |
| Precio promocional [doc] | ❌ | ✅ | `precioPromo`, solo vale si es menor al precio. Se ve tachado el precio normal y la etiqueta «Oferta». El servidor cobra el precio vigente. |
| Ocultar producto sin borrarlo («Mostrar en tienda», visibilidad) [doc] | ❌ | ✅ | `oculto`: no se ve en la tienda ni en el héroe y el servidor rechaza pedirlo. En el CSV es `Mostrar en tienda` = NO. |
| Costo interno / margen [doc] | ❌ | ❌ | |
| **Importar / exportar productos en CSV** [doc] | ❌ | ✅ | `src/lib/tiendanube-csv.ts`, botones en el admin. Ver «Compatibilidad CSV» abajo. |

### Pedidos

| Función en Tiendanube | Antes | Ahora | Detalle |
|---|---|---|---|
| Registro de cada pedido en el panel | ❌ (el pedido solo viajaba por WhatsApp) | ✅ | `api/pedido.ts` (público) y `AdminPedidos.tsx`. Numeración correlativa. |
| Estados de la venta (abierta / archivada / cancelada; pago; envío: empaquetada, enviada) [doc] | ❌ | 🟡 | Un solo estado lineal: pendiente → pagado → enviado → entregado, o cancelado. Sin estado de pago separado del de envío, sin «empaquetada», sin archivar. |
| Stock que se descuenta con la venta [doc] | ❌ | ✅ | Al crear el pedido, dentro de una transacción de Mongo; si falta stock en cualquier producto no se guarda nada. Probado con dos compradores simultáneos. |
| Cancelar devuelve el stock; reabrir lo vuelve a descontar [doc] | ❌ | ✅ | Tiendanube deja elegir si devolver el stock al cancelar; acá siempre se repone. |
| Cancelación automática por falta de pago [doc] | ❌ | ✅ (opcional) | `PEDIDO_VENCE_HORAS`: los pendientes más viejos se cancelan solos y devuelven el stock (cron diario + al entrar un pedido o abrir el panel). **Viene apagada**: sin esa variable no se cancela nada. |
| Historial de cambios de estado | ❌ | ✅ | Campo `historial` en cada pedido, con el motivo cuando venció (se ve en la API; el panel muestra el estado actual y «venció sin pago»). |
| Cambiar estados de muchas ventas a la vez [doc] | ❌ | ❌ | |
| Datos del cliente en el pedido | ❌ | 🟡 | Nombre, código postal, (opcional) teléfono y (opcional) mail. Sin dirección ni libreta de clientes. |
| Avisos por mail al cliente [general] | ❌ | 🟡 | Interfaz `NotificacionesProvider` con adaptador de Resend (`RESEND_API_KEY` + `RESEND_FROM`): avisa pedido recibido, pagado, enviado, entregado, cancelado y vencido. **No probado contra Resend real** (faltan la clave y un dominio verificado); un fallo del mail nunca rompe el pedido. |
| Notas internas, carritos abandonados, reportes de ventas [general] | ❌ | ❌ | |

### Envíos

| Función en Tiendanube | Antes | Ahora | Detalle |
|---|---|---|---|
| Cálculo del costo de envío en el carrito [general] | ❌ | 🟡 | `POST /api/envio` y selector en el carrito. Hoy cotiza con tarifas por zona (AMBA / interior) y por kilo. Las de ejemplo vienen en el código; la dueña pone las suyas con `ENVIO_TARIFAS` (JSON, ver `docs/DEPLOY.md`) sin tocar código. |
| Integración con Correo Argentino (MiCorreo), Andreani, OCA e-Pak, Zipnova [general] | ❌ | 🟡 | Interfaz `EnviosProvider` en `server/envios.ts` + `conRespaldo(adaptador, tarifaPorZona)`: si el correo falla, tarda más de 5 s o no devuelve opciones, se cotiza con las tarifas por zona y la clienta puede comprar igual. **No hay adaptadores reales**: no se encontró documentación oficial de sus APIs y requieren credenciales de cada cuenta; escribir uno sin verla sería inventar el formato. |
| Envío gratis sobre un monto [doc] | ❌ | ✅ | Variable `ENVIO_GRATIS_DESDE`. |
| Etiquetas, seguimiento y retiro por sucursal [general] | ❌ | ❌ | |
| Retiro en el local / envío acordado por WhatsApp | ✅ | ✅ | Siempre se puede no elegir envío y coordinar por WhatsApp. |

### Promociones y cobro

| Función en Tiendanube | Antes | Ahora | Detalle |
|---|---|---|---|
| Cupones y descuentos [general] | ❌ | ❌ | Siguiente en la lista de prioridades (el precio promocional por producto ya está). |
| Cobro online (Pago Nube, Mercado Pago, transferencia) [general] | ❌ | ❌ | El pedido sale por WhatsApp y la dueña lo marca «pagado» a mano. Una pasarela necesita credenciales y no se hizo. |
| Facturación electrónica [general] | ❌ | ❌ | |

### Administración

| Función en Tiendanube | Antes | Ahora | Detalle |
|---|---|---|---|
| Datos de la tienda (nombre, frase, WhatsApp) | ✅ | ✅ | |
| Usuarios con permisos distintos [general] | ❌ | ❌ | Una sola clave (`ADMIN_PASSWORD`), comparada en tiempo constante. |
| Dominio propio, SSL, SEO por producto [general] | 🟡 | 🟡 | Dominio y SSL los da Vercel; sin campos de SEO por producto. |

## Compatibilidad CSV con Tiendanube

Columnas escritas por el export (nombres tomados de la guía «Cómo completar el Excel de carga masiva»): `Identificador de URL`, `Nombre`, `Categorías`, `Precio`, `Precio promocional`, `Peso` (kg, con punto), `Stock` (vacío = ilimitado, `0` = agotado), `SKU`, `Mostrar en tienda` (`SI`, o `NO` si el producto está oculto), `Descripción`, y para variantes `Nombre de propiedad 1-3` / `Valor de propiedad 1-3`, más las demás columnas de la plantilla vacías (propiedades 1–3, precio promocional, alto/ancho/profundidad, código de barras, envío sin cargo, tags, SEO, marca, producto físico, MPN, sexo, rango de edad, costo).

Al importar, el lector acepta los encabezados sin importar mayúsculas ni tildes, ignora el BOM, y sigue las reglas de la guía: celda vacía = sin cambios, `-` en Stock = ilimitado, decimales con punto, productos existentes reconocidos por `Identificador de URL`. Las filas que repiten el identificador son variantes del mismo producto (la primera fila lleva los datos del producto); una variante con el mismo precio que el producto no tiene precio propio, y en una variante ya cargada la celda vacía conserva su stock y precio. Las filas con error se saltean y se informan con su número de fila; el resto se carga y la dueña revisa antes de tocar **Guardar**.

**No verificado:** los nombres exactos de los encabezados contra una planilla descargada de una tienda real (la guía describe las columnas pero no transcribe los títulos). Antes de usar el CSV con una tienda de verdad, exportar una planilla desde Tiendanube y compararla con `COLUMNAS` en `src/lib/tiendanube-csv.ts`. Tampoco se probó subir el CSV de este panel a Tiendanube.

## Prioridad de la brecha (impacto para la dueña) y qué se hizo

| # | Brecha | Impacto | Estado |
|---|---|---|---|
| 1 | Pedidos registrados con estado y stock descontado | Alto: hoy podía vender dos veces la última unidad y no tenía lista de ventas | **Hecho** |
| 2 | Stock y SKU por producto | Alto: es la base del punto 1 | **Hecho** |
| 3 | Importar / exportar catálogo compatible con Tiendanube | Alto para migrar o cargar 100+ productos sin tipear | **Hecho** |
| 4 | Cotización de envío detrás de `EnviosProvider` | Medio-alto: el envío es el dato que más frena una compra | **Hecho** (adaptador de tarifas fijas; correos reales pendientes) |
| 5 | Cupones | Medio | Pendiente |
| 6 | Variantes (talle, color) | Alto, pero cambia el modelo de datos y de stock | **Hecho** (hasta 3 propiedades; precio y stock por variante; import/export CSV) |
| 7 | Cobro online | Alto, pero necesita cuenta y credenciales de la dueña | Pendiente |
| 8 | Adaptadores de Correo Argentino / Andreani / OCA / Zipnova | Medio, necesita credenciales | Pendiente: la interfaz, el respaldo ante fallas y las tarifas propias están; falta cada adaptador (credenciales y documentación oficial) |
| 9 | Mails al cliente, cancelación automática por falta de pago, ocultar productos, varias fotos, precio promocional | Medio-bajo | **Hecho** (mails y cancelación automática prendibles por variable; mails sin probar contra Resend real) |

## Riesgos y límites conocidos

- **Pisado de stock por el admin — cerrado.** El catálogo tiene una `version` que sube con cada cambio (guardado o stock movido por un pedido). El panel manda la versión que leyó; si ya cambió, `PUT /api/tienda` responde 409, el panel avisa y ofrece «Recargar tienda». Costo: si entra un pedido mientras la dueña edita, tiene que recargar y rehacer su cambio (no se mezclan). Un panel viejo en caché, sin versión, también recibe 409 hasta recargar.
- **Pedidos de spam — mitigado.** Un mismo origen (huella de la IP, no la IP) no puede tener más de 5 pedidos pendientes en una hora (429). Con `PEDIDO_VENCE_HORAS` prendida, los pendientes viejos además se cancelan solos. No frena a quien cambia de IP; para eso haría falta un captcha o el cobro online. El conteo y el guardado no son una sola transacción: dos pedidos simultáneos del mismo origen pueden pasar el tope por uno.
- **Cancelación automática: queda apagada a propósito.** La dueña coordina el pago por WhatsApp y puede tardar días; prenderla es su decisión.
- **Tarifas de envío de ejemplo.** No cobrarlas a clientas reales: cargar las propias con `ENVIO_TARIFAS` (o conectar un correo).
- **Un solo estado por pedido** (no se separan pago y envío como en Tiendanube).
