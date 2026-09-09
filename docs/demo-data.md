# Seed seguro y preparación para datos reales

El seed es exclusivamente de demostración. Los ejemplos del catálogo ya están en la base local y se sirven mediante los endpoints normales; no es necesario volver a ejecutar el seed para seguir viéndolos.

## Antes de ejecutar un seed manual

**No usar contra una base con datos reales.** El script actual actualiza categorías, productos y variantes existentes, y reemplaza sus imágenes. No es una migración ni una importación de producción.

- Se requiere `ALLOW_DEMO_SEED=true` explícito.
- Se rechaza `NODE_ENV=production` antes de crear el cliente de base de datos. Esta protección no detecta un servidor productivo mal configurado: también hay que verificar el destino de `DATABASE_URL`.
- No se crea un administrador por defecto. Para crear uno de prueba se requieren ambos `SEED_ADMIN_EMAIL` y `SEED_ADMIN_PASSWORD`; contraseña de al menos 12 caracteres y como máximo 72 bytes UTF-8.
- Las cuentas existentes no cambian. Quitar la contraseña fija del código **no rota las credenciales de administradores creados antes**. Revisarlas y rotarlas antes de una publicación.

Esta mejora no ejecutó el seed, no migró tablas y no alteró datos ni cuentas.

## Comprobaciones separadas

| Comando | Efecto |
| --- | --- |
| `npm run typecheck` | Solo verifica TypeScript, sin emitir archivos ni corregirlos. |
| `npm run lint` | Revisa estilo y reglas, sin cambios. |
| `npm run lint:fix` | Correcciones explícitas; no forma parte de typecheck. |
| `npm run db:generate` | Genera el cliente Prisma; es un paso explícito de preparación/CI. |
| `npm run db:validate` | Valida el esquema, sin migrar ni poblar la base. |
| `npm test -- --runInBand` | Pruebas unitarias con dependencias simuladas. |

El cliente Prisma generado sigue versionado en esta primera etapa; su retirada del índice requiere una unidad posterior con verificación de instalación limpia.

## Escrituras de ferias

Actualizar y eliminar usan una sola operación Prisma, sin consultar previamente la existencia. El traductor compartido convierte registros inexistentes/eliminados concurrentemente en 404; los errores inesperados no se disfrazan de recursos inexistentes.

## Archivos que no se publican

`.env*` (excepto plantillas `.example`), claves privadas, dumps, uploads locales, dependencias y resultados de compilación están ignorados. Conservar SQL de migraciones bajo control de versiones. No confundir exclusión con respaldo: los uploads deberán tener almacenamiento persistente antes de desplegar.

Las pruebas HTTP actuales siguen siendo un smoke test básico; ampliar guards, validación y contratos queda pendiente. Pagos y envíos se implementarán cuando existan las credenciales y se defina la integración.
