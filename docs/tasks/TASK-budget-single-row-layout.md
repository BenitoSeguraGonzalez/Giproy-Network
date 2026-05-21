# TASK: Presupuesto en Fila Única

## Objetivo

Garantizar que las líneas del presupuesto se rendericen siempre en una sola fila, compactando columnas secundarias antes que la descripción.

## Archivos afectados

- `frontend/src/components/presupuestos/LineasPresupuestoTab.jsx`
- `docs/budget_single_row_layout_execplan.md`
- `docs/tasks/TASK-budget-single-row-layout.md`

## Dependencias

- Layout actual de `PresupuestoDetail`
- Árbol y filas de `LineasPresupuestoTab`

## Validación

- Cabecera y filas alineadas en una sola estructura horizontal
- No hay modo multilinea para partidas/APUs
- Descripción conserva prioridad de ancho
- `npm run build` pasa
