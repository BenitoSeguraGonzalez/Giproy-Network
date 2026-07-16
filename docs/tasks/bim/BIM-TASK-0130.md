# BIM-TASK-0130 - Contrato canonico y preflight de scheduling

Estado: Cerrada localmente

## Objetivo

Crear un contrato canonico de intercambio de cronogramas y un preflight BIM
seguro antes de implementar parsers MSPDI/P6 o permitir cualquier propuesta de
aplicacion sobre Cronograma clasico.

## Cambios

- Schema `giproy_bim_schedule_interchange_v1` para calendarios, WBS,
  actividades, dependencias FS/SS/FF/SF, recursos, asignaciones y baselines.
- Servicio puro con checksum canonico, referencias cruzadas, ciclos,
  restricciones, hitos, zonas horarias IANA y reporte de perdida.
- Endpoint protegido `POST /bim/projects/{project_id}/4d/schedule-interchange/preflight`.
- Dependencia `tzdata==2025.2` para validacion IANA reproducible en Windows y
  Linux.

## Criterios verificados

- El preflight no persiste ni llama servicios clasicos.
- IDs duplicados, referencias ausentes y ciclos se rechazan.
- Campos no representables generan warnings explicitos.
- El checksum normalizado es determinista.
- El endpoint vive solo en el router BIM y exige `bim.schedule.link`.

## Validacion

- `py_compile`: OK.
- `pytest test_bim_schedule_interop.py`: `4 passed`.
- Scheduling/capacidades focal: `9 passed`.
- `validate_enterprise_baseline.py`: OK.
- Warnings Pydantic `model_name/model_id`: conocidos y no bloqueantes.

## No impacto clasico

No hay migracion, escritura DB, frontend, cambio de Cronograma, auth, tenant,
EDT, APUs, Presupuesto ni rollout. BIM apagado conserva los contratos previos.

## Rollback

Retirar schema, servicio, endpoint, tests y `tzdata`. No existe rollback de
datos.
