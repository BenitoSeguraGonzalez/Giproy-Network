# BIM-TASK-0146 - Dashboard CDE operacional

Estado: Cerrada localmente

## Objetivo

Consolidar documentos, RFIs, submittals, revisiones, responsables y
vencimientos en una superficie operacional CDE, sin exponer datos fuera de ACL
ni crear una via de acceso paralela a los permisos BIM.

## Cambios

- Endpoint de solo lectura `GET /bim/projects/{project_id}/cde/dashboard` con
  contrato `giproy_bim_cde_dashboard_v1`.
- Documentos y revisiones contabilizados solo cuando el usuario conserva
  permiso `view` en la ACL documental.
- RFIs, submittals y revisiones limitados al creador/responsable/revisor para
  usuarios ordinarios; el superadministrador obtiene alcance de proyecto.
- Metricas de abiertos, pendientes, vencidos y notificaciones no leidas.
- Carga agregada por responsable y cola priorizada por vencimiento.
- Tab `Resumen` como primera herramienta de Coordinacion BIM V2; no se agregan
  paneles simultaneos ni una nueva shell.

## Criterios verificados

- Empresa, proyecto, usuario y ACL delimitan cada consulta.
- Un usuario ordinario no contabiliza documentos restringidos ni trabajo ajeno.
- El superadministrador puede auditar el conjunto del proyecto sin mezclar
  revisiones distintas ni otros tenants.
- Fechas naive/aware se normalizan a UTC y los vencimientos se ordenan primero.
- El dashboard no escribe CDE, Cronograma, Proyectos ni datos clasicos.

## Validacion

- Suite focal PostgreSQL: `3 passed`; regresion CDE PostgreSQL: `25 passed`.
- PostgreSQL real: upgrade/downgrade hasta `de2032a1b2c3`: OK; no hay migracion
  nueva en este slice.
- Build Vite y Playwright 1920x1080: OK; sin overflow ni errores de consola.
- Workspace V2 agregado, anti-BIM y baseline enterprise: OK.
- Matriz: C08 completa, `56,67%`.

## Rollback

Retirar endpoint, schema, servicio, cliente, panel, harness y entrada `Resumen`.
No hay downgrade de base de datos. CDE, GiProy Clasico y TASK-1807 permanecen
intactos.
