# Plan de migración: Cronograma de Trabajo a Gantt operativo

Fecha: 2026-04-07

Modo: GIPROY CLASICO

## Objetivo

Eliminar la redundancia visual de `Proyecto > Cronogramas` dejando solo dos vistas operativas:

- `Cronograma Valorado`
- `Cronograma Gantt`

El Gantt debe absorber las capacidades útiles del antiguo `Cronograma de Trabajo`: resumen operativo, configuración laboral, importación/exportación MS Project y edición de fechas, duración, cuadrilla, avance y dependencias.

## Decisión arquitectónica

No se elimina en este slice el backend `cronogramas-trabajo`.

Razón: hoy es el motor común que persiste filas, configuración, dependencias ricas, importación XML MS Project, exportación MSPDI y compatibilidad legacy. Eliminarlo físicamente implicaría migraciones, cambio de contrato API y riesgo sobre integraciones ya validadas.

Por tanto:

- Se elimina la vista frontend redundante `Cronograma de Trabajo`.
- El Gantt queda como única superficie operativa de planificación de trabajo.
- El backend `cronogramas-trabajo` permanece como motor interno no visible.
- La renombrada física del backend queda como fase posterior, con migración y pruebas contractuales.

## Fases

1. `TASK-0948`: migración visible y operativa.
   - Quitar la pestaña `De trabajo`.
   - Pasar acciones MS Project/import XML al Gantt.
   - Mostrar resumen operativo en Gantt.
   - Mantener `Cronograma Valorado` sin cambios funcionales.

2. `TASK-0949`: higiene y compatibilidad.
   - Retirar textos visibles de `Cronograma de Trabajo`.
   - Mantener nombres internos solo donde dependan del contrato backend común.
   - Validar build, ESLint y no interferencia BIM.

3. Fase diferida: renombrado físico backend/API.
   - Crear alias `cronogramas-gantt` si se requiere.
   - Mantener compatibilidad con `/cronogramas-trabajo`.
   - Migrar documentación API y tests.
   - Ejecutar migración solo cuando el Gantt haya estabilizado el ciclo operativo completo.

## No interferencia BIM

Este plan no modifica rutas BIM, flags BIM, componentes BIM ni UX BIM. El backend común se conserva para evitar acoplamientos prematuros.
