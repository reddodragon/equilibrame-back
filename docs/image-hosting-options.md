# Imágenes externas para la app en VPS

Evaluación del 9 de septiembre de 2026; precios orientativos en USD consultados en documentación oficial, sin impuestos. No se contrataron planes ni se conectaron cuentas.

**Recomendación provisional: Cloudflare R2**, si se priorizan almacenamiento económico y portabilidad S3. Cloudinary es una alternativa si se prioriza disponer de gestión y transformación de imágenes con menos desarrollo. Ambas decisiones son independientes de alojar Next/Nest en un VPS; R2 no requiere volver a habilitar Cloudflare Tunnel.

| Plataforma | Costos y límites comprobados | Ventaja y contrapartida |
| --- | --- | --- |
| R2 Standard | 10 GB-mes, 1 millón de operaciones A y 10 millones B mensuales incluidos. Excedente de almacenamiento USD 0,015/GB-mes; operaciones adicionales se cobran; sin cargo de egress. | Compatible con S3 y costos bajos. No reemplaza un gestor de medios ni genera automáticamente las variantes de imagen. |
| Cloudinary | Plan gratuito de 25 créditos mensuales compartidos entre transformación, almacenamiento y entrega. | Transformaciones, CDN y herramientas de carga integradas. Hay que controlar créditos; no interpretar el plan como 25 GB más transformaciones y tráfico ilimitados. |
| Bunny Storage + CDN + Optimizer | Storage desde USD 0,01/GB por región, mínimo mensual USD 1. CDN aparte. Optimizer USD 9,50/mes por sitio. | Integración de almacenamiento, entrega y optimización; sumar todos los componentes y regiones al estimar. |

Fuentes: [R2 pricing](https://developers.cloudflare.com/r2/pricing/), [R2 y compatibilidad S3](https://developers.cloudflare.com/r2/how-r2-works/), [Cloudinary](https://cloudinary.com/pricing), [Bunny Storage](https://bunny.net/pricing/storage/), [Bunny Optimizer](https://bunny.net/pricing/optimizer/).

## Transformaciones sobre R2

Podemos generar formatos/tamaños al subirlos en el VPS o sumar un servicio de transformación. Cloudflare Images ofrece 5.000 transformaciones únicas mensuales gratuitas; superar el límite en el plan gratuito puede provocar errores para nuevas transformaciones. En plan pago: primeras 5.000 incluidas y USD 0,50 por 1.000 adicionales. R2 y transformaciones son cargos distintos. [Precios oficiales de Images](https://developers.cloudflare.com/images/pricing/).

No hay un presupuesto mensual realista todavía: faltan cantidad de originales, tamaño medio, versiones generadas y tráfico previsto. Para un catálogo pequeño, R2 podría permanecer dentro de las cuotas incluidas; eso no garantiza costo cero.

## Diseño para no depender del proveedor

- Mantener una interfaz de almacenamiento en Nest y un registro de assets con identificadores estables.
- Asociar imágenes a producto y variante; conservar originales y alt text.
- Optimizar dimensiones y WebP/AVIF con límites; validar MIME y contenido, no solo extensión.
- Credenciales solo en servidor; no usar variables NEXT_PUBLIC para secretos.
- Controlar permisos, cuotas, archivos huérfanos, borrado de assets compartidos y backups.
- No usar disco efímero del contenedor como única copia; el VPS puede alojar la app sin alojar sus imágenes.

La selección definitiva del proveedor y su implementación quedan pendientes.
