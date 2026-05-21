# TASK: Sidebar Autocolapsable en Proyectos

## Objetivo

Implementar navegación lateral autocolapsable en el detalle de proyecto, con fijado opcional en abierto y ajuste natural del área de trabajo.

## Archivos afectados

- `frontend/src/pages/Proyectos.jsx`
- `docs/project_sidebar_autocollapse_execplan.md`
- `docs/tasks/TASK-project-sidebar-autocollapse.md`

## Dependencias

- Layout actual del detalle de proyecto en `Proyectos.jsx`
- `localStorage` para persistencia liviana de preferencia

## Validación

- Hover expande sidebar.
- Mouse leave colapsa sidebar si no está fijada.
- Botón de fijado alterna persistencia.
- Items mantienen accesibilidad básica con tooltip en modo compacto.
- `npm run build` pasa.
