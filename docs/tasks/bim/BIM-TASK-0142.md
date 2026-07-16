# BIM-TASK-0142 - Submittals y planos de ingenieria BIM

Estado: Cerrada localmente

## Objetivo

Completar expedientes de submittal revisionados y gobernados dentro del CDE
BIM, conservando GiProy Clasico fuera del flujo durante incubacion.

## Cambios

- Migracion aditiva `de2029a1b2c3` con expedientes, revisiones y eventos.
- Numeracion por empresa/proyecto, tipo, disciplina, seccion tecnica, revisor y
  fecha requerida.
- Cada revision fija el ID exacto de la revision documental CDE evaluada.
- Workflow de borrador, envio, revision, aprobacion/rechazo y anulacion.
- Reenvio tras rechazo solo con una nueva emision CDE; la anterior queda
  `superseded` y permanece auditable.
- Tab `Submittals` en Coordinacion del Workspace BIM V2.

## Criterios verificados

- Un plano de ingenieria solo admite documento CDE de tipo plano o modelo.
- Solo el creador envia/reenvia y solo el revisor asignado revisa/decide,
  salvo superadmin.
- Fecha vencida y bloqueo optimista obsoleto se rechazan.
- Empresa/proyecto no acceden a expedientes ajenos.
- Rechazo, nueva revision y aprobacion conservan documentos y eventos.
- No se escribe en Documentos, Compras ni Contratos clasicos.

## Validacion

- Suite focal: `4 passed`; regresion acumulada: `39 passed`.
- PostgreSQL real: upgrade/downgrade `de2029a1b2c3` y `TIMESTAMPTZ`: OK.
- Build y Playwright 1920x1080 con rechazo/reenvio/aprobacion: OK.
- Workspace V2: primera agregacion termino tras siete smokes; RFI y Submittals
  aislados pasaron y la repeticion agregada completa quedo verde.
- Anti-BIM y baseline enterprise: OK.
- Matriz: C03 completa, `52,50%`.

## Rollback

Ejecutar downgrade `de2029a1b2c3` y retirar endpoints, servicio, cliente, panel
y harness. Los documentos CDE y todos los dominios clasicos permanecen intactos.
