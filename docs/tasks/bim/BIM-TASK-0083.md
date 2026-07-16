# BIM-TASK-0083 - Dominio de incidencias BCF-compatible

Estado: Cerrada localmente

## Implementacion

- Migracion aditiva `de2007a1b2c3` para topic, comentarios e historial BIM.
- Topic tenant/project scoped con GUID, version, prioridad, estado,
  responsable, creador, viewpoint, GUIDs seleccionados y snapshot referenciado.
- Contratos CRUD BIM y eventos auditables `created`, `updated`, `commented`.
- Import/export ZIP BCF-XML 2.1 con `bcf.version`, `markup.bcf` y
  `viewpoint.bcfv`; import idempotente por proyecto/GUID.

## Validacion

- Roundtrip conserva topic y GUIDs del viewpoint: OK.
- Comentarios e historial: OK.
- Aislamiento tenant y migracion reversible: OK.

## Rollback

Retirar endpoints/servicio/modelos y hacer downgrade `de2007a1b2c3` con
autorizacion. No existen dependencias clasicas.
