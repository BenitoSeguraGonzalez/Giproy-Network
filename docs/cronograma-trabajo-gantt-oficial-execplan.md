# ExecPlan: Vista Gantt Oficial en Cronogramas de Trabajo

## Objetivo
Consolidar una visualización Gantt funcional dentro de `Proyecto > Cronogramas`, sin depender de Microsoft Project ni de BIM, reutilizando la estructura existente de `cronogramas_trabajo`.

## Alcance
- Integración frontend oficial con un componente Gantt propio del sistema
- Acceso para usuarios con acceso funcional al módulo `Cronogramas`
- Reutilización de:
  - `cronogramasApi.getTrabajo(...)`
  - precedencias, fechas, progreso y jerarquía EDT ya calculadas

## Decisiones
- No se toca el carril actual de `Cronograma Valorado` ni `Cronograma de Trabajo`
- La vista Gantt queda como tercera vista oficial del mismo módulo
- La primera fase oficial cubre visualización, navegación y edición ligera de fechas, duración, avance, cuadrilla y predecesoras
- Se descarta incorporar Syncfusion en este cierre porque el componente propio ya está integrado y evita introducir dependencia nueva en el slice clásico

## Entregables
- Componente `CronogramaGantt`
- Reutilización del contrato persistente de `Cronograma de Trabajo`
- Activación desde la cabecera de `Cronogramas`
