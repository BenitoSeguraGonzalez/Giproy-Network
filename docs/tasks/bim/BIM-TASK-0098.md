# BIM-TASK-0098 - Lineas base y dependencias 4D

Estado: Cerrada localmente

## Resultado

- Lineas base inmutables agrupan snapshots de actividad por revision.
- Dependencias `FS`, `SS`, `FF` y `SF` conservan lag como snapshot BIM.
- Una nueva revision crea otra linea base; no existe actualizacion destructiva.
- Ningun dato se escribe en Cronograma clasico.

## Validacion

- Migracion aditiva `de2013a1b2c3` aplicada a PostgreSQL `giproy_erp`.
- Upgrade/downgrade/re-upgrade validado en `giproy_bim_test`.
- Duplicados, actividades fuera de tenant y dependencias invalidas se bloquean.

## Rollback

Downgrade a `de2012a1b2c3` elimina solo baseline, membresias y dependencias BIM.
