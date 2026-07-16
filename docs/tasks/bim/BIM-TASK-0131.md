# BIM-TASK-0131 - Intercambio MSPDI XML seguro

Estado: Cerrada localmente

## Objetivo

Implementar import-preview y exportacion MSPDI XML sobre el contrato canonico
BIM, sin persistencia y sin aplicar cambios al Cronograma clasico.

## Cambios

- Parser XML protegido con `defusedxml`, limite de 25 MB y 100.000 tareas.
- Mapeo de calendarios, excepciones puntuales, WBS anidada, actividades,
  hitos, FS/SS/FF/SF, restricciones, recursos, asignaciones y avance.
- Exportador MSPDI con jerarquia WBS, calendarios, dependencias, recursos y
  asignaciones reproducibles.
- Reporte explicito de semantica no representable o irresoluble; las baselines
  MSPDI permanecen declaradas como no soportadas en este slice.
- Endpoints BIM protegidos de import-preview y exportacion bajo
  `/bim/projects/{project_id}/4d/schedule-interchange/mspdi`.
- Dependencia fijada `defusedxml==0.7.1`.

## Criterios verificados

- No se aceptan entidades XML, zonas horarias invalidas, ciclos WBS ni
  contratos canonicos con errores.
- El round-trip interno conserva el subconjunto soportado y no aplana WBS ni
  elimina excepciones puntuales de calendario.
- Referencias de predecesor/asignacion no resueltas y campos no soportados
  generan warnings, nunca descarte silencioso.
- Import-preview no persiste, no llama servicios clasicos y exige
  `bim.schedule.link`.

## Validacion

- `py_compile`: OK.
- `pytest test_bim_mspdi_interop.py test_bim_schedule_interop.py`: `12 passed`.
- Suite ampliada BIM/4D/MS Project clasico: `30 passed`.
- `validate_bim_synchro_parity.py`: OK, `45.83%`.
- `validate_enterprise_baseline.py`: OK.
- Warnings Pydantic `model_name/model_id`: conocidos y no bloqueantes.

## Ajuste de regresion clasica

La bateria ampliada descubrio un `datetime` no serializable en la importacion
XML clasica. Se normaliza el payload en su frontera JSON y se estabiliza el
fixture temporal. La ruta, permisos, tenant y semantica de dependencias no
cambian.

## No impacto clasico

No hay migracion, escritura DB BIM, aplicacion a Cronograma, cambio de auth,
tenant, EDT, APUs, Presupuesto, frontend ni rollout. Con BIM apagado la
experiencia clasica conserva sus contratos.

## Rollback

Retirar servicio, endpoints, schema de preview, fixture, tests y dependencia
`defusedxml`; revertir solo la normalizacion JSON focal del importador clasico.
No existe rollback de datos.
