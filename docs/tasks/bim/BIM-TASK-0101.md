# BIM-TASK-0101 - Componentes construibles logicos

Estado: Cerrada localmente

## Resultado

- Componentes agrupan referencias a elementos de una version y actividades 4D.
- Conservan frente, codigo, nombre, localizacion por GUID y autor.
- No crean geometria, no reescriben IFC y no duplican elementos BIM.
- Inspector crea componentes desde el elemento/version activos y permite foco.

## Validacion

- Elementos/versiones/actividades fuera de tenant o proyecto son rechazados.
- Foco GUID y flujo de alta pasan Chrome desktop/movil.

## Rollback

Eliminar componentes no afecta elementos, artifacts ni snapshots de actividad.
