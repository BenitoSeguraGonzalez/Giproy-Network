# BIM-TASK-0002: backend y base de datos BIM

## Estado
Parcialmente implementada

## Equivalente historico
`TASK-0547`.

## Objetivo
Implementar persistencia BIM con migraciones no destructivas, tenant obligatorio
y sin dependencia desde servicios clasicos hacia BIM.

## Estado real 2026-07-01
Existen modelos y servicios de persistencia BIM. La tabla `system_bim_settings`
tiene migracion Alembic y `BIM-TASK-0016` agrega migracion Alembic para las
tablas principales BIM. Los servicios aun conservan fallback runtime
`checkfirst`; esta TASK no puede cerrarse hasta validar la migracion en DB local
controlada y decidir si esos fallbacks pasan a modo solo readiness.
