# TASK: Zoom Con Rueda En Grafo

## Objetivo
Adecuar la navegación del grafo de `EDO` y `EDT` para que la rueda del ratón controle el zoom directamente.

## Tasks

### TASK-GRAPH-WHEEL-01
- Objetivo: documentar la nueva política de interacción
- Archivos: [docs/graph_wheel_zoom_execplan.md](/e:/Repositorios/GiProy Network/docs/graph_wheel_zoom_execplan.md)
- Dependencias: ninguna
- Validación: plan autocontenido

### TASK-GRAPH-WHEEL-02
- Objetivo: implementar zoom directo por rueda en el viewport gráfico
- Archivos: [frontend/src/components/projects/HierarchyGraphView.jsx](/e:/Repositorios/GiProy Network/frontend/src/components/projects/HierarchyGraphView.jsx)
- Dependencias: TASK-GRAPH-WHEEL-01
- Validación: la rueda modifica el zoom sin `Ctrl`

### TASK-GRAPH-WHEEL-03
- Objetivo: validar que paneo y build siguen operativos
- Archivos: frontend
- Dependencias: TASK-GRAPH-WHEEL-02
- Validación: `npm run build`
