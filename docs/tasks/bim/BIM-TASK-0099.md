# BIM-TASK-0099 - Desviacion plan-real y retorno a viewpoint

Estado: Cerrada localmente

## Resultado

- Comparacion por fecha de corte calcula plan, real, variacion de progreso y
  desviacion de calendario por actividad.
- Metodologia `linear_planned_progress` queda declarada en el contrato.
- Actividades se clasifican como adelantadas, en linea o atrasadas.
- Viewpoints agrupan GUIDs aprobados por version y enfocan Fragments sin abrir
  navegacion hacia modulos clasicos.
- Panel compacto crea baselines/dependencias y consulta desviaciones reales.

## Validacion

- Harness Chrome desktop/movil cubre baseline, dependencia, desviacion y foco.
- `100` pruebas BIM, build, anti-BIM y baseline enterprise: OK.
- GiProy Clasico conserva comportamiento con BIM apagado.

## Rollback

Retirar panel/endpoints devuelve el workspace a simulacion temporal; snapshots
previos permanecen intactos hasta aplicar downgrade BIM explicito.
