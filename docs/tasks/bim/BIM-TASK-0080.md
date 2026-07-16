# BIM-TASK-0080 - Comparacion de versiones

Estado: Cerrada localmente

## Implementacion

- Contrato `giproy_bim_version_compare_v1` y endpoint tenant-scoped.
- Emparejamiento primario por GUID y fallback unico por clase, nombre, nivel y
  clasificacion, siempre marcado como `semantic_fallback`.
- Clasifica agregados, eliminados, geometria/transform, propiedades, ambos y
  sin cambios mediante JSON canonico reproducible.
- Panel compacto permite elegir versiones, filtrar cambios y enfocar GUID.

## Validacion

- Dataset A/B conocido cubre todos los tipos y GUID renumerado: OK.
- Version cross-tenant: 404.
- Py-compile, pytest focal, build, smoke BIM y anti-BIM: OK.

## Rollback

Retirar servicio, schema, endpoint, cliente y panel; no hay migracion ni datos.
