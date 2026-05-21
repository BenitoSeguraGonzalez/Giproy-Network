# Project Base Sync Modes And Undo - ExecPlan

## Objetivo
Ampliar la sincronización entre `Base Maestra` y `Base de Proyecto` para soportar tres modos operativos, selección de revisión objetivo, propagación real a presupuestos y una reversión de un solo paso desde historial.

## Alcance
- `APUs nuevas`: copia APUs faltantes y sus elementos implicados desde la maestra.
- `Valores de APU`: alinea valores y composición operativa de APUs ya existentes en proyecto contra la maestra.
- `Sincronismo integral`: combina ambas operaciones.
- Selección de revisión cuando el proyecto tiene varias revisiones/base de proyecto.
- Confirmación operativa con advertencia de impacto.
- Historial con usuario, fecha/hora, revisión y opción de revertir la última sincronización.

## Criterios de implementación
- No tocar la `Base Maestra`.
- Mantener sincronización modular sobre la infraestructura actual de `project_base_reconciliation`.
- Recalcular presupuestos operativos de la revisión objetivo tras cambios de precios/APUs.
- Mantener tanteos y propagarlos con precios nuevos.
- Permitir solo un `undo` de la última sincronización por base de proyecto.

## Resultado esperado
- Nuevo modal de sincronización con modo y revisión.
- Backend con ejecución/preview por modo.
- Historial reversible de un paso.
- Presupuestos y cronogramas de la revisión objetivo leyendo valores vivos tras la sincronización.
