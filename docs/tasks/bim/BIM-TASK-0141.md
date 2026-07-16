# BIM-TASK-0141 - Workflow RFI integral sobre CDE BIM

Estado: Cerrada localmente

## Objetivo

Completar solicitudes de informacion gobernadas y auditables dentro del CDE
BIM, sin reutilizar ni modificar contratos o pantallas de GiProy Clasico.

## Cambios

- Migracion aditiva `de2028a1b2c3` con RFI y eventos inmutables.
- Numeracion unica por empresa/proyecto, responsable, vencimiento, prioridad,
  documento CDE opcional y `GlobalId` IFC opcional.
- Workflow `draft -> submitted -> answered -> closed`, anulacion controlada,
  bloqueo optimista y autorizacion por solicitante/responsable.
- Endpoints BIM para responsables, listado, creacion y transiciones.
- Tab `RFI` en Coordinacion del Workspace BIM V2 con lista, detalle,
  trazabilidad y contexto del elemento IFC activo.

## Criterios verificados

- Una RFI no se envia sin responsable y fecha futura.
- Solo el responsable responde y solo el solicitante cierra, salvo superadmin.
- Una version de bloqueo obsoleta no puede sobrescribir otra transicion.
- Empresa y proyecto no pueden consultar ni mutar RFI de otro contexto.
- Cada transicion genera exactamente un evento auditable.
- GiProy Clasico permanece sin dependencias ni UX RFI nueva.

## Validacion

- Suite focal RFI: `4 passed`; regresion acumulada: `35 passed`.
- PostgreSQL real: upgrade/downgrade `de2028a1b2c3`, tablas y `TIMESTAMPTZ`: OK.
- Build y Playwright 1920x1080 con flujo completo: OK.
- Workspace V2, anti-BIM y baseline enterprise: OK.
- Matriz: C02 completa, `50,83%`.

## Rollback

Ejecutar downgrade `de2028a1b2c3` y retirar endpoints, servicio, cliente, panel
y harness RFI. No existe migracion, tabla, ruta ni pantalla clasica que revertir.
