# ExecPlan: Auditoría rápida de permisos y relaciones del módulo Proyectos

## Objetivo

Detectar inconsistencias adicionales en permisos del módulo de proyectos después de la reparación de `Datos de proyecto`, priorizando fallos del mismo tipo: comparaciones de rol frágiles, resolución de empresa inconsistente y accesos híbridos `administrador/superadministrador`.

## Hallazgos

### Hallazgo 1. Comparación de rol defectuosa en Gestor de Personal

- archivo: `frontend/src/pages/ProjectManager.jsx`
- problema: `checkAccess()` compara `user?.rol !== 'administrador' && user?.rol !== 'Superadministrador'`
- impacto: un `superadministrador` en minúsculas puede ser expulsado del módulo aunque tenga permisos

### Hallazgo 2. Módulo principal de proyectos ya saneado

- `DatosProyecto`, `Proyectos`, `Stakeholders`, `EDO` y `EDT` ya quedaron sin comparaciones de rol sensibles a mayúsculas en el bloque reparado

### Hallazgo 3. Riesgo estructural no equivalente, pero relevante

- `stakeholders.py` permite crear/editar/asignar sin una restricción explícita por rol administrativo
- `edt.py` no replica el patrón de verificación de módulo que sí existe en `edo.py` y `presupuestos.py`
- estos puntos no son el mismo bug de casing, pero sí merecen una auditoría posterior de autorización fina

## Plan de reparación ejecutado

1. corregir comparación de rol en `ProjectManager`
2. validar búsqueda residual de comparaciones exactas dentro del módulo auditado
3. compilar frontend

## Validación

- `npm run build`
