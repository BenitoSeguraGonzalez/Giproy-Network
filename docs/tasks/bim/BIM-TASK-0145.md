# BIM-TASK-0145 - Revision CDE contextual y notificaciones BIM

Estado: Cerrada localmente

## Objetivo

Unificar comentarios y decisiones sobre una emision documental exacta y su
contexto BIM, sin depender del sistema global de notificaciones clasico.

## Cambios

- Migracion aditiva `de2032a1b2c3` con revisiones, comentarios y notificaciones.
- Numeracion por empresa/proyecto y fijacion de `document_revision_id`.
- Contexto opcional por `GlobalId` y viewpoint de camara.
- Responsable, vencimiento, bloqueo optimista y estados abierto, resuelto,
  reabierto y cerrado.
- Visibilidad y acciones limitadas a creador, responsable o superadmin.
- Notificaciones internas deduplicadas para asignacion, comentario, resolucion,
  reapertura y cierre, con lectura por destinatario.
- Tab unico `Revisiones` en Coordinacion BIM con creacion, bandeja, hilo y
  decisiones, evitando paneles simultaneos.

## Criterios verificados

- Documento, revision, responsable y elemento pertenecen al tenant/proyecto.
- Solo responsable resuelve; solo creador reabre o cierra.
- Un tercero de la misma empresa no lista ni comenta la revision.
- Comentario, resolucion y lectura generan estado trazable sin correo externo.
- No se modifican comentarios, documentos ni notificaciones clasicas.

## Validacion

- Suite focal: `3 passed`; regresion BIM seleccionada: `44 passed`.
- PostgreSQL real: upgrade/downgrade `de2032a1b2c3` y `TIMESTAMPTZ`: OK.
- Build y Playwright 1920x1080 con crear, comentar y resolver: OK; sin overflow
  ni solapamientos.
- Workspace V2 agregado, anti-BIM y baseline enterprise: OK.
- Matriz: C07 completa, `55,83%`.

## Rollback

Ejecutar downgrade `de2032a1b2c3` y retirar endpoints, servicio, cliente,
panel y harness. CDE documental, BCF y todos los dominios clasicos permanecen.
