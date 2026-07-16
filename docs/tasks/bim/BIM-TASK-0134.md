# BIM-TASK-0134 - Revision, aprobacion y rollback de scheduling BIM

Estado: Cerrada localmente

## Objetivo

Persistir previews canonicos de scheduling dentro del dominio BIM, permitir
decision auditada y rollback limpio, sin escribir Cronograma clasico.

## Cambios

- Tabla BIM `bim_schedule_import_revisions` con frontera obligatoria
  `empresa_id/proyecto_id`, documento, preflight, checksums y auditoria.
- Migracion no destructiva `de2023a1b2c3` sobre la rama BIM.
- Estados `pending/approved/rejected/superseded/rolled_back`, version optimista
  y una sola revision aprobada activa por empresa/proyecto.
- Aprobacion supersede la activa; rollback reactiva la anterior sin borrar
  historial ni datos.
- Comparador semantico por codigos para P6/MSPDI, independiente del remapeo de
  ObjectIds/UIDs.
- Endpoints BIM de crear/listar/decidir/revertir/comparar, protegidos por
  capacidades de scheduling.

## Criterios verificados

- Preflight invalido y contenido duplicado no se persisten.
- Version obsoleta se rechaza y la transicion usa lock de fila.
- Indice unico parcial impide dos revisiones aprobadas activas.
- Tenant distinto no puede listar ni decidir revisiones ajenas.
- Rollback restaura la revision previa y conserva evidencia completa.
- No se crean actividades ni cambios en Cronograma clasico.

## Validacion

- Revision/rollback focal: `5 passed`.
- Suite combinada de interoperabilidad, 4D y MS Project clasico: `43 passed`.
- `py_compile`: OK.
- `alembic heads`: `de2023a1b2c3` reconocido en la rama BIM.
- `validate_enterprise_baseline.py`: OK.
- Warnings Pydantic `model_name/model_id`: conocidos y no bloqueantes.

## Estado de paridad

La matriz permanece en 46,67%. Falta round-trip contra las aplicaciones
objetivo y una TASK separada si se autoriza proponer cambios a Cronograma.

## Rollback

Ejecutar downgrade de `de2023a1b2c3` y retirar modelo, schemas, servicio,
endpoints y tests. La migracion solo crea una tabla BIM nueva.
