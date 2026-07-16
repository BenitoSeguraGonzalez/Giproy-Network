# BIM-TASK-0092 - Capacidades 4D

Estado: Cerrada localmente

## Resultado

- Capacidades `bim.schedule.view`, `bim.schedule.link` y
  `bim.progress.report` incorporadas a la matriz BIM.
- `bim.view` hereda lectura 4D y `bim.coordinate` hereda vinculacion.
- Superadministrador conserva la matriz completa sin cambiar roles globales.

## Validacion

Pruebas de default, grant, herencia, tenant y superadministrador: OK.

## Rollback

Retirar capacidades derivadas; auth, JWT y roles clasicos permanecen intactos.
