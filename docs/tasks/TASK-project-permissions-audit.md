# TASK: Auditoría rápida de relaciones y permisos del módulo Proyectos

## TASK-PROJ-AUD-01: Detección de comparaciones frágiles

- objetivo: localizar checks de rol inconsistentes en pantallas y endpoints relacionados
- archivos afectados: `docs/project_permissions_audit_execplan.md`, `docs/tasks/TASK-project-permissions-audit.md`
- dependencias: ninguna
- validación: hallazgos documentados

## TASK-PROJ-AUD-02: Reparación de Gestor de Personal

- objetivo: alinear acceso del `ProjectManager` con la regla híbrida `administrador/superadministrador`
- archivos afectados: `frontend/src/pages/ProjectManager.jsx`
- dependencias: TASK-PROJ-AUD-01
- validación: acceso correcto para ambos roles

## TASK-PROJ-AUD-03: Validación final

- objetivo: asegurar estabilidad del bloque auditado
- archivos afectados: frontend implicado
- dependencias: TASK-PROJ-AUD-02
- validación: `npm run build`
