# BIM-TASK-0095 - Motor de estado temporal 4D

Estado: Cerrada localmente

## Resultado

- Progreso 4D se registra como snapshots inmutables por empresa, proyecto y
  actividad, sin escribir sobre Cronograma clasico.
- El motor resuelve `not_started`, `in_progress`, `completed`, `delayed` y
  `demolished` para una fecha de corte reproducible.
- Reportes fuera de orden y porcentajes invalidos quedan rechazados.

## Validacion

- Migraciones `de2011/de2012` pasan upgrade, downgrade y re-upgrade sobre
  PostgreSQL 18 en `giproy_bim_test`.
- Servicios temporales pasan pruebas focales PostgreSQL y suite BIM completa.
- Tenant, proyecto y actividad permanecen como fronteras obligatorias.

## Rollback

Downgrade a `de2010a1b2c3` elimina solo las tablas 4D nuevas.
