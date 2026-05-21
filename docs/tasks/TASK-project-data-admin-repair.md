# TASK: Reparación permisos administrador en Datos de Proyecto

## TASK-PROJ-ADM-01: Discovery de bloqueo

- objetivo: identificar el punto exacto donde el administrador queda tratado como solo lectura
- archivos afectados: `docs/project_data_admin_repair_execplan.md`, `docs/tasks/TASK-project-data-admin-repair.md`
- dependencias: ninguna
- validación: causa raíz documentada

## TASK-PROJ-ADM-02: Reparación frontend DatosProyecto

- objetivo: permitir edición al administrador normalizando el rol
- archivos afectados: `frontend/src/components/projects/DatosProyecto.jsx`
- dependencias: TASK-PROJ-ADM-01
- validación: controles dejan de estar en solo lectura para `administrador`

## TASK-PROJ-ADM-03: Reparación backend guardado detalle

- objetivo: permitir persistencia del detalle para `administrador` sin depender de mayúsculas exactas
- archivos afectados: `backend/app/api/endpoints/proyecto_detalles.py`
- dependencias: TASK-PROJ-ADM-01
- validación: endpoint acepta `administrador` y `superadministrador`

## TASK-PROJ-ADM-04: Saneamiento del módulo de proyectos

- objetivo: corregir comparaciones equivalentes en vistas relacionadas para evitar recaídas
- archivos afectados: `frontend/src/pages/Proyectos.jsx`, `frontend/src/components/projects/Stakeholders.jsx`, `frontend/src/components/projects/Edo.jsx`, `frontend/src/components/projects/Edt.jsx`
- dependencias: TASK-PROJ-ADM-02
- validación: acciones híbridas visibles para administrador; acciones exclusivas de superadmin intactas

## TASK-PROJ-ADM-05: Validación final

- objetivo: verificar estabilidad del bloque reparado
- archivos afectados: frontend/backend implicados
- dependencias: TASK-PROJ-ADM-03, TASK-PROJ-ADM-04
- validación: `py_compile` y `npm run build`
