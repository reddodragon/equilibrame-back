# Roles, administración y venta minorista/mayorista

Plan acordado el 9 de septiembre de 2026. Implementar por unidades verificables; no es una entrega completa del sistema. Pagos y envíos siguen pendientes de credenciales. La app permanece en localhost hasta preparar el VPS.

## 1. Base de acceso — implementada en código

| Perfil visible | Valor técnico | Permisos iniciales |
| --- | --- | --- |
| Usuario | `USER` | Consultar catálogo público y sus filtros. |
| Revendedor | `ENTREPRENEUR` | Catálogo y capacidades reservadas para combos/encargos propios. |
| Empleado | `EMPLOYEE` | Solo catálogo por ahora; tareas operativas por confirmar. |
| Administrador | `ADMIN` | Gestión de catálogo, usuarios, contenido, encargos y lectura de métricas. |

Los permisos de funciones futuras son una política preparada, no endpoints implementados. No se renombra ENTREPRENEUR: conservarlo evita migrar cuentas existentes solo para cambiar la etiqueta.

- Política centralizada en el backend y guard global. Roles desconocidos e inactivos no acceden a recursos administrativos.
- El JWT identifica al usuario; la API obtiene su rol actual de la base en cada solicitud. Cambiar el rol no debe depender de esperar que venza el token.
- El front consulta `GET /api/admin/access` antes de mostrar el panel. Ocultar UI no reemplaza la autorización del servidor.
- Registro local y Google siguen creando USER. Un formulario público nunca asigna roles privilegiados.
- Migración aditiva `20260909043000_add_employee_role` preparada, **todavía no aplicada**. Revisar destino y backup, aplicar antes de asignar EMPLOYEE en la base. No se ejecutó seed.
- Pruebas HTTP reales con persistencia simulada: visitante 401, perfiles no administradores 403, ADMIN 200, desactivación y cambio de rol efectivos con tokens anteriores.

## 2. CRUD administrativo de usuarios — siguiente unidad

1. Listado paginado, búsqueda y filtros de rol/estado; devolver DTO sin hashes, tokens ni secretos.
2. Alta de cuenta/invitación administrativa sin contraseñas compartidas; edición de nombre, contacto y estado.
3. Cambio de rol solo por administrador y auditoría de actor, cuenta, antes/después y fecha.
4. Desactivación como baja ordinaria para conservar trazabilidad de encargos y ventas. Diseñar borrado definitivo aparte.
5. Proteger al último administrador activo, incluso con solicitudes concurrentes: transacción con serialización/reintento o bloqueo consistente. No basta contar administradores antes de actualizar.
6. Probar autoescalada, acceso a cuentas ajenas, último administrador, revocación y reactivación.

**Pendiente de definición:** tareas exactas del empleado. No se le concederá acceso al CRUD de usuarios ni a métricas por inferencia.

## 3. Productos y categorías — ampliar la API existente y conectar panel

Ya existen endpoints administrativos de categorías/productos y filtros públicos. Reutilizarlos.

- Categoría: nombre, slug, descripción, imagen, orden y visibilidad.
- Producto: nombre, descripción, categoría, familia olfativa/tipo de aroma, usos estructurados (textil, ambiente, etc.), imágenes y estado.
- Perfumes: pirámide de salida, corazón y fondo. Definir un tipo de producto estable para validaciones; no depender de comparar nombres editables de categorías.
- Presentación/variante: SKU, formato, precio y stock. No duplicar el mismo producto por tamaño.
- Sprays: variantes 100 ml y 250 ml con imágenes asociadas a cada variante. El selector debe actualizar imagen, precio, disponibilidad y línea del carrito por `variantId`.
- La respuesta pública actual resume una variante: ampliarla de forma compatible para exponer variantes seleccionables, sin filtrar precios privados de revendedor al catálogo público.
- Validar importes no negativos, cantidades enteras, categoría válida, variante activa y que las imágenes pertenezcan al producto correcto.
- Paginación en tienda y administrador; estados vacío/error/carga sin fallback silencioso a ejemplos.

**Aceptación:** crear un spray con dos presentaciones, cambiar entre ellas y verificar imagen/precio/stock y carrito; filtrar por categoría/aroma; ocultar productos sin romper históricos.

## 4. Imágenes — decisión previa al formulario de carga definitivo

Elegir proveedor con la comparación adjunta. La API controla autorización, tipos/tamaño/contenido y claves de objetos; nunca recibir como confiable una URL arbitraria de borrado.

Preparar un adaptador `MediaStorage` y un registro de asset con proveedor, object key, tipo, tamaño y dimensiones. Productos/variantes referencian assets; no guardan credenciales. Evitar que cambiar de proveedor obligue a cambiar componentes.

Si se usan cargas directas firmadas: permisos y cuotas en el servidor, firma breve y endpoint de confirmación que verifica el objeto antes de asociarlo. En esta etapa no se contrataron servicios ni se subieron archivos.

## 5. Secciones configurables del inicio

Extender FeaturedSection, que hoy no tiene relaciones con productos/combos.

1. Dos ubicaciones generales estables, cada una con título, descripción, orden, visibilidad y productos seleccionados.
2. Relaciones ordenadas SectionProduct/SectionCombo con unicidad para impedir duplicados.
3. Secciones de audiencia revendedor con combos seleccionados desde administración.
4. Filtrar audiencia también en API; no enviar contenido/precios exclusivos a un visitante y ocultarlos solo con CSS.
5. Pruebas de sección oculta, sin productos activos, cambio de orden y acceso por rol.

## 6. Combos y encargos de revendedores

Reutilizar Combo y ComboItem; distinguir programa emprendedor/mayorista como modalidad comercial, no como un quinto rol sin necesidad.

1. CRUD de combos con variantes, cantidades, imagen, precio y vigencia.
2. Selección de múltiples combos y cantidades; mostrar resumen antes de enviar.
3. Crear ResellerRequest/ResellerRequestItem con usuario propietario y snapshots de productos, presentaciones, cantidades y precios cotizados.
4. Resolver combos y precios en servidor; sumar componentes compartidos multiplicando cantidades de combo por cantidades de cada variante. No confiar en totales del cliente.
5. Idempotencia de envío para evitar duplicados por doble clic/reintento.
6. Estados propuestos: pendiente, en revisión, aceptado, rechazado y cancelado. Registrar transiciones y responsable.
7. **Crear y gestionar el encargo no descuenta ni reserva stock y no registra una venta.** El stock mostrado es orientativo hasta definir la confirmación comercial.
8. Administrador ve cantidad y tipo de todos los productos; revendedor solo consulta sus propios encargos.

**Aceptación:** dos combos con una variante compartida generan las cantidades agregadas correctas, un solo encargo ante reintento y stock idéntico antes/después.

## 7. Ventas y dashboard

No existe todavía un modelo de venta confirmado. Diseñar Sale/SaleItem y política de confirmación/cancelación antes de calcular ingresos.

- Métricas: unidades por producto/variante, ventas por período, categorías y total de ventas confirmadas; no llamar ganancia al ingreso sin registrar costos.
- Definir moneda, zona horaria, descuentos, devoluciones y momento de confirmación.
- Separar encargos pendientes, ventas confirmadas y datos de demostración. No inflar cifras con catálogo, carrito o solicitudes.
- Sin pasarela, una confirmación manual autorizada y auditable puede ser una fase posterior; no implementarla sin acordar su efecto en stock.
- Gráficos accesibles con tabla equivalente, filtros temporales y estado sin ventas.

## 8. Despliegue VPS y publicación

Frontend y API mantienen repositorios separados. Ramas de trabajo publicadas sin fusionar en main; futuras entregas en unidades revisables con sus pruebas. No se ejecutan builds en este entorno por instrucción del proyecto.

Antes del VPS: rotar credenciales locales/de ejemplo, configurar secretos de despliegue, TLS, proxy, CORS, PostgreSQL privado, backups probados, migraciones controladas y almacenamiento de assets. Revisar historial de Git: quitar una credencial del último commit no invalida versiones ya publicadas.

## Estado de esta entrega

Completado: base de permisos, migración preparada, acceso administrativo y pruebas. Los CRUD de usuarios, UI del catálogo, variantes con imagen, secciones, encargos y métricas permanecen pendientes. No confundir el panel inicial con esos módulos ya implementados.
