# BIM-TASK-0132 - Intercambio Primavera P6 XML seguro

Estado: Cerrada localmente

## Objetivo

Implementar import-preview y exportacion Primavera P6 PMXML sobre el contrato
canonico BIM, sin persistencia ni escritura sobre Cronograma clasico.

## Cambios

- Parser seguro `APIBusinessObjects`, independiente del namespace versionado
  de Oracle, limitado a un proyecto, 50 MB y 200.000 actividades.
- Mapeo de proyecto, calendarios, excepciones, WBS anidada, actividades,
  hitos, restricciones, relaciones FS/SS/FF/SF, recursos y asignaciones.
- Exportador PMXML con ObjectIds deterministas y namespace explicito V24.12.
- Endpoints protegidos P6 import-preview/export bajo el router BIM.
- Fixture representativo y round-trip interno del subconjunto soportado.

## Limites declarados

- `BaselineProject`, riesgos, UDF, gastos y pasos se reportan como no
  representables; no se descartan silenciosamente.
- XER no forma parte de este slice y requiere corpus autorizado.
- El round-trip contra una instalacion Oracle P6 sigue pendiente; por ello B02
  solo pasa de ausente a parcial.

## Validacion

- P6 focal: `6 passed`.
- Suite combinada P6/MSPDI/canonico/4D/MS Project clasico: `36 passed`.
- XML con entidades, timezone invalida, multiproyecto, referencias irresueltas
  y exceso de tamano quedan cubiertos.
- `py_compile`: OK.
- Matriz y sus 2 pruebas reproducibles: OK, `46.67%`.
- `validate_enterprise_baseline.py`: OK.
- Warnings Pydantic `model_name/model_id`: conocidos y no bloqueantes.

## No impacto clasico

No hay migracion, escritura DB, frontend, cambio de auth, tenant, EDT, APUs,
Presupuesto ni aplicacion a Cronograma. Los endpoints requieren acceso BIM y
`bim.schedule.link`.

## Rollback

Retirar servicio, endpoints, fixture, tests y referencias documentales. No
existe rollback de datos.
