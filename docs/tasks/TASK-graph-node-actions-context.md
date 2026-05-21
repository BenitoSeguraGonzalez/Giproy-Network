# TASK: Responsables Embebidos En Grafo

## Objetivo
Implementar en `EDO` y `EDT` una vista grafica basada solo en nodos estructurales, con responsables o participantes embebidos dentro del nodo principal y acciones propias al pulsarlos.

## Tasks

### TASK-GRAPH-EMBED-01
- Objetivo: documentar alcance, filtros y reglas visuales
- Archivos: [docs/graph_node_actions_execplan.md](/e:/Repositorios/GiProy Network/docs/graph_node_actions_execplan.md)
- Dependencias: ninguna
- Validacion: plan autocontenido con reglas para `Todos`, `Hitos/Cuentas` y `Responsables`

### TASK-GRAPH-EMBED-02
- Objetivo: proyectar el arbol grafico a nodos estructurales con responsables embebidos
- Archivos: [frontend/src/components/projects/HierarchyGraphView.jsx](/e:/Repositorios/GiProy Network/frontend/src/components/projects/HierarchyGraphView.jsx)
- Dependencias: TASK-GRAPH-EMBED-01
- Validacion: responsables ya no aparecen como nodos hijos en el grafo

### TASK-GRAPH-EMBED-03
- Objetivo: redisenar la tarjeta grafica con bloque embebido y jerarquia tipografica
- Archivos: [frontend/src/components/projects/HierarchyGraphView.jsx](/e:/Repositorios/GiProy Network/frontend/src/components/projects/HierarchyGraphView.jsx)
- Dependencias: TASK-GRAPH-EMBED-02
- Validacion: nombre del responsable principal y rol secundario ligero

### TASK-GRAPH-EMBED-04
- Objetivo: adaptar filtros del grafico a la nueva politica visual
- Archivos: [frontend/src/components/projects/HierarchyGraphView.jsx](/e:/Repositorios/GiProy Network/frontend/src/components/projects/HierarchyGraphView.jsx)
- Dependencias: TASK-GRAPH-EMBED-02
- Validacion: `Todos`, `Hitos/Cuentas` y `Responsables` responden segun la proyeccion nueva

### TASK-GRAPH-EMBED-05
- Objetivo: habilitar acciones propias del responsable embebido
- Archivos:
  - [frontend/src/components/projects/HierarchyGraphView.jsx](/e:/Repositorios/GiProy Network/frontend/src/components/projects/HierarchyGraphView.jsx)
  - [frontend/src/components/projects/Edo.jsx](/e:/Repositorios/GiProy Network/frontend/src/components/projects/Edo.jsx)
  - [frontend/src/components/projects/Edt.jsx](/e:/Repositorios/GiProy Network/frontend/src/components/projects/Edt.jsx)
- Dependencias: TASK-GRAPH-EMBED-03
- Validacion: pulsar responsable embebido abre editar o eliminar sin tratarlo como nodo grafico independiente

### TASK-GRAPH-EMBED-06
- Objetivo: adaptar minimapa, busqueda y centrado
- Archivos: [frontend/src/components/projects/HierarchyGraphView.jsx](/e:/Repositorios/GiProy Network/frontend/src/components/projects/HierarchyGraphView.jsx)
- Dependencias: TASK-GRAPH-EMBED-04
- Validacion: busqueda y minimapa siguen localizando hitos/cuentas y responsables

### TASK-GRAPH-EMBED-07
- Objetivo: validar compilacion y coherencia final
- Archivos: frontend
- Dependencias: TASK-GRAPH-EMBED-05, TASK-GRAPH-EMBED-06
- Validacion: `npm run build`
