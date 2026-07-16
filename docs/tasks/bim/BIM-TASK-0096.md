# BIM-TASK-0096 - Timeline 4D reproducible

Estado: Cerrada localmente

## Resultado

- Endpoint BIM calcula la secuencia por fecha de corte usando solo vinculos
  aprobados y el ultimo progreso disponible hasta esa fecha.
- La respuesta conserva GUID, version, actividad, estado, progreso,
  visibilidad, opacidad y color temporal.
- El timeline no modifica fechas, relaciones, calendarios ni progreso clasico.

## Validacion

- Estados futuro, ejecucion, retraso y completado pasan pruebas de servicio.
- Contratos API, build y `99` pruebas BIM quedan en verde.
- GiProy Clasico permanece identico con BIM apagado.

## Rollback

Retirar endpoints y servicio temporal conserva snapshots y vinculos previos.
