# BIM-TASK-0135 - Motor QTO BIM versionado

Estado: Cerrada localmente

## Objetivo

Generar takeoffs reproducibles desde cantidades IFC persistidas, agrupados por
clase, nivel y material, sin escribir EDT, APU, Presupuesto ni Cronograma
clasicos.

## Cambios

- Tabla BIM aditiva `bim_qto_snapshots` y migracion `de2024a1b2c3` sobre la
  rama BIM.
- Motor QTO tenant-aware con revisiones inmutables, checksum, cobertura,
  agrupacion configurable y trazabilidad a GlobalIds.
- Extraccion comun de cantidades IFC reutilizada por QTO y por las propuestas
  5D existentes.
- Reglas opcionales de clasificacion a codigos WBS/coste almacenadas como
  referencias latentes; no consultan ni modifican fuentes clasicas.
- Endpoints BIM para crear y listar snapshots por proyecto/version.
- Panel de cantidades organizado en tabs `QTO` y `Elemento`, integrado en el
  Workspace BIM V2 mediante el cliente de dominio.
- Harness Playwright 1920x1080 para generacion, cobertura, codigos y
  preservacion del flujo por elemento.

## Criterios verificados

- La version BIM debe pertenecer a la misma empresa y proyecto.
- Una revision duplicada se rechaza sin alterar snapshots existentes.
- La suma agrupada conserva valor, unidad, fuentes y elementos participantes.
- La cobertura distingue elementos cuantificados y filas con clasificacion.
- El frontend no usa `axiosConfig` ni llamadas directas fuera de `src/api`.
- GiProy Clasico permanece sin dependencia BIM y pasa la guarda con BIM
  apagado.

## Validacion

- QTO y propuestas 5D focales: `4 passed`.
- Suite acumulada scheduling/interoperabilidad/QTO: `29 passed`.
- `py_compile`: OK.
- `alembic heads`: `de2024a1b2c3` reconocido en la rama BIM.
- `npm run build`: OK, con warning de chunks grandes conocido.
- `npm run smoke:bim-workspace-v2`: OK, incluyendo QTO y WebGL 1920x1080.
- `smoke-classic-no-bim-contamination`: OK.
- `validate_enterprise_baseline.py --include-frontend`: OK.

## Estado de paridad

A04 permanece parcial. El motor QTO y su UX de consulta estan operativos, pero
la aprobacion de revisiones y la aplicacion controlada a destinos 5D deben
cerrarse en una TASK separada antes de considerar la capacidad completa.

## Rollback

Ejecutar downgrade de `de2024a1b2c3` y retirar modelo, schemas, servicio,
endpoints, cliente, panel y harness QTO. La migracion solo crea una tabla BIM;
no modifica tablas ni datos clasicos.
