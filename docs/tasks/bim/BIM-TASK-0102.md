# BIM-TASK-0102 - Escenarios what-if 4D

Estado: Cerrada localmente

## Resultado

- Escenarios inmutables desplazan actividades de una linea base sin editarla.
- Resultado informa duracion original/escenario, delta y violaciones de
  dependencias `FS/SS/FF/SF`.
- Supuestos y metricas se persisten como JSON estructurado PostgreSQL.
- UX calcula y muestra duracion, variacion y conflictos.

## Validacion

- Prueba demuestra violacion FS y fechas fuente sin cambios.
- `102` pruebas BIM, build, harness responsive, anti-BIM y baseline: OK.

## Rollback

Retirar escenarios conserva baseline, actividades, Cronograma e IFC intactos.
