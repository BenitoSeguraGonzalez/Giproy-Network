# TASK: Reubicación de Objeto del Contrato

## TASK-PROJ-LYT-01: Discovery de layout

- objetivo: identificar la jerarquía real del grid y el contenedor actual del campo
- archivos afectados: `docs/project_contract_layout_execplan.md`, `docs/tasks/TASK-project-contract-layout.md`
- dependencias: ninguna
- validación: estructura documentada

## TASK-PROJ-LYT-02: Reubicación del bloque

- objetivo: mover `Objeto del Contrato` a una fila de ancho completo
- archivos afectados: `frontend/src/components/projects/DatosProyecto.jsx`
- dependencias: TASK-PROJ-LYT-01
- validación: el campo ya no queda limitado a la columna derecha

## TASK-PROJ-LYT-03: Validación final

- objetivo: asegurar estabilidad visual y de compilación
- archivos afectados: frontend implicado
- dependencias: TASK-PROJ-LYT-02
- validación: `npm run build`
