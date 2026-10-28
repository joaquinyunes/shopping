# Back-office de Casa Nido frente a Tiendanube

Rubro: tienda online de hogar y decoración. Competencia según la skill `backend-por-nicho` (fila E-commerce): **Tiendanube** (~25,5 % de los sitios en Argentina) y **WooCommerce** (~42,5 %). Envíos que usan esas tiendas: Correo Argentino (MiCorreo), Andreani, OCA e-Pak y Zipnova.

Referencia de comparación: el panel de Tiendanube. Las filas marcadas **[doc]** salen de su ayuda oficial (ayuda.tiendanube.com), leída el 2026-10-28; las marcadas **[general]** son lo que se sabe del producto sin haberlo verificado en esa ayuda y hay que confirmarlas en un panel real antes de prometerlas.

✅ lo tiene · 🟡 parcial · ❌ falta. «Antes» = rama `main`; «Ahora» = rama `feat/backoffice-tienda`.

## Matriz función por función

### Catálogo

| Función en Tiendanube | Antes | Ahora | Detalle |
|---|---|---|---|
| Alta, edición y baja de producto (nombre, precio, descripción) | ✅ | ✅ | `src/admin/Admin.tsx`, `AdminProducto.tsx`. Hasta 500 productos (tope de `datosValidos`). |
| Foto del producto | ✅ | ✅ | Una foto por producto; se sube a Atlas (`api/foto.ts`). |
| Varias fotos por producto [general] | ❌ | ❌ | |
| Categorías (con subcategorías, varias por producto) [doc] | 🟡 | 🟡 | Una categoría de texto por producto, sin jerarquía. |
| **Variantes** (hasta 3 propiedades, ej. talle/color; precio y stock por variante) [doc] | ❌ | ❌ | Es la mayor brecha estructural. En la importación se toma solo la primera fila de cada producto y se avisa. |
| **Stock** por producto; vacío = ilimitado [doc] | ❌ (solo «Agotado» a mano) | ✅ | Campo `stock` (+ `agotado` derivado cuando llega a 0). Sin stock por variante. |
| SKU y código de barras [doc] | ❌ | 🟡 | SKU sí; código de barras no. |
| Peso y medidas [doc] | 🟡 | 🟡 | Peso en gramos y una medida principal (se usan para la cámara «Ver en tu mesa» y para cotizar el envío). Sin alto/ancho/profundidad. |
| Precio promocional [doc] | ❌ | ❌ | |
| Ocultar producto sin borrarlo («Mostrar en tienda», visibilidad) [doc] | ❌ | ❌ | La importación lo avisa: los ocultos de Tiendanube entran visibles. |
| Costo interno / margen [doc] | ❌ | ❌ | |
| **Importar / exportar productos en CSV** [doc] | ❌ | ✅ | `src/lib/tiendanube-csv.ts`, botones en el admin. Ver «Compatibilidad CSV» abajo. |

### Pedidos

| Función en Tiendanube | Antes | Ahora | Detalle |
|---|---|---|---|
| Registro de cada pedido en el panel | ❌ (el pedido solo viajaba por WhatsApp) | ✅ | `api/pedido.ts` (público) y `AdminPedidos.tsx`. Numeración correlativa. |
| Estados de la venta (abierta / archivada / cancelada; pago; envío: empaquetada, enviada) [doc] | ❌ | 🟡 | Un solo estado lineal: pendiente → pagado → enviado → entregado, o cancelado. Sin estado de pago separado del de envío, sin «empaquetada», sin archivar. |
| Stock que se descuenta con la venta [doc] | ❌ | ✅ | Al crear el pedido, dentro de una transacción de Mongo; si falta stock en cualquier producto no se guarda nada. Probado con dos compradores simultáneos. |
| Cancelar devuelve el stock; reabrir lo vuelve a descontar [doc] | ❌ | ✅ | Tiendanube deja elegir si devolver el stock al cancelar; acá siempre se repone. |
| Cancelación automática por falta de pago [doc] | ❌ | ❌ | Un pedido pendiente retiene stock hasta que la dueña lo cancele (ver riesgos). |
| Historial de cambios de estado | ❌ | ✅ | Campo `historial` en cada pedido (se ve en la API; el panel muestra el estado actual). |
| Cambiar estados de muchas ventas a la vez [doc] | ❌ | ❌ | |
| Datos del cliente en el pedido | ❌ | 🟡 | Nombre, código postal y (opcional) teléfono. Sin dirección, mail ni libreta de clientes. |
| Avisos por mail al cliente [general] | ❌ | ❌ | |
| Notas internas, carritos abandonados, reportes de ventas [general] | ❌ | ❌ | |

### Envíos

| Función en Tiendanube | Antes | Ahora | Detalle |
|---|---|---|---|
| Cálculo del costo de envío en el carrito [general] | ❌ | 🟡 | `POST /api/envio` y selector en el carrito. Hoy cotiza con tarifas fijas por zona (AMBA / interior) y por kilo: **valores de ejemplo, no son los de ningún correo**. |
| Integración con Correo Argentino (MiCorreo), Andreani, OCA e-Pak, Zipnova [general] | ❌ | 🟡 | Interfaz `EnviosProvider` en `server/envios.ts`: un adaptador por correo, sin tocar pedidos ni front. **No hay adaptadores reales todavía** (requieren credenciales de la cuenta de cada correo). |
| Envío gratis sobre un monto [doc] | ❌ | ✅ | Variable `ENVIO_GRATIS_DESDE`. |
| Etiquetas, seguimiento y retiro por sucursal [general] | ❌ | ❌ | |
| Retiro en el local / envío acordado por WhatsApp | ✅ | ✅ | Siempre se puede no elegir envío y coordinar por WhatsApp. |

### Promociones y cobro

| Función en Tiendanube | Antes | Ahora | Detalle |
|---|---|---|---|
| Cupones y descuentos [general] | ❌ | ❌ | Siguiente en la lista de prioridades. |
| Cobro online (Pago Nube, Mercado Pago, transferencia) [general] | ❌ | ❌ | El pedido sale por WhatsApp y la dueña lo marca «pagado» a mano. Una pasarela necesita credenciales y no se hizo. |
| Facturación electrónica [general] | ❌ | ❌ | |

### Administración

| Función en Tiendanube | Antes | Ahora | Detalle |
|---|---|---|---|
| Datos de la tienda (nombre, frase, WhatsApp) | ✅ | ✅ | |
| Usuarios con permisos distintos [general] | ❌ | ❌ | Una sola clave (`ADMIN_PASSWORD`), comparada en tiempo constante. |
| Dominio propio, SSL, SEO por producto [general] | 🟡 | 🟡 | Dominio y SSL los da Vercel; sin campos de SEO por producto. |

## Compatibilidad CSV con Tiendanube

Columnas escritas por el export (nombres tomados de la guía «Cómo completar el Excel de carga masiva»): `Identificador de URL`, `Nombre`, `Categorías`, `Precio`, `Peso` (kg, con punto), `Stock` (vacío = ilimitado, `0` = agotado), `SKU`, `Mostrar en tienda` (siempre `SI`), `Descripción`, más las demás columnas de la plantilla vacías (propiedades 1–3, precio promocional, alto/ancho/profundidad, código de barras, envío sin cargo, tags, SEO, marca, producto físico, MPN, sexo, rango de edad, costo).

Al importar, el lector acepta los encabezados sin importar mayúsculas ni tildes, ignora el BOM, y sigue las reglas de la guía: celda vacía = sin cambios, `-` en Stock = ilimitado, decimales con punto, productos existentes reconocidos por `Identificador de URL`. Las filas con error se saltean y se informan con su número de fila; el resto se carga y la dueña revisa antes de tocar **Guardar**.

**No verificado:** los nombres exactos de los encabezados contra una planilla descargada de una tienda real (la guía describe las columnas pero no transcribe los títulos). Antes de usar el CSV con una tienda de verdad, exportar una planilla desde Tiendanube y compararla con `COLUMNAS` en `src/lib/tiendanube-csv.ts`. Tampoco se probó subir el CSV de este panel a Tiendanube.

## Prioridad de la brecha (impacto para la dueña) y qué se hizo

| # | Brecha | Impacto | Estado |
|---|---|---|---|
| 1 | Pedidos registrados con estado y stock descontado | Alto: hoy podía vender dos veces la última unidad y no tenía lista de ventas | **Hecho** |
| 2 | Stock y SKU por producto | Alto: es la base del punto 1 | **Hecho** |
| 3 | Importar / exportar catálogo compatible con Tiendanube | Alto para migrar o cargar 100+ productos sin tipear | **Hecho** |
| 4 | Cotización de envío detrás de `EnviosProvider` | Medio-alto: el envío es el dato que más frena una compra | **Hecho** (adaptador de tarifas fijas; correos reales pendientes) |
| 5 | Cupones | Medio | Pendiente |
| 6 | Variantes (talle, color) | Alto, pero cambia el modelo de datos y de stock | Pendiente, requiere diseño propio |
| 7 | Cobro online | Alto, pero necesita cuenta y credenciales de la dueña | Pendiente |
| 8 | Adaptadores de Correo Argentino / Andreani / OCA / Zipnova | Medio, necesita credenciales | Pendiente |
| 9 | Mails al cliente, cancelación automática por falta de pago, ocultar productos, varias fotos | Medio-bajo | Pendiente |

## Riesgos y límites conocidos

- **Pisado de stock por el admin.** El stock vive dentro del documento del catálogo (`tienda`). Si la dueña abre el admin, entra un pedido y después guarda, su copia vieja pisa el stock descontado. Para cerrarlo hace falta control de versión en `PUT /api/tienda` (ej. un `x-version` que viaje en el GET y se compruebe al guardar). No se hizo.
- **Pedidos de spam.** `POST /api/pedido` es público y no pide pago: alguien podría crear pedidos que retengan stock. Mitigación pendiente: límite por IP y vencimiento de pedidos pendientes.
- **Tarifas de envío de ejemplo.** No cobrarlas a clientas reales sin ajustar `TARIFAS` en `server/envios.ts` o conectar un correo.
- **Un solo estado por pedido** (no se separan pago y envío como en Tiendanube).
