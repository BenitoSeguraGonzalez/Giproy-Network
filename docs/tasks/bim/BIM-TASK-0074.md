# BIM-TASK-0074 - Lifecycle versionado de artifacts BIM

Estado: Cerrada localmente

## Objetivo

Versionar IFC fuente, viewer JSON, indices y Fragments con contrato, checksum,
generaciones, validacion de integridad y rollback seguro.

## Implementacion

- `bim_artifacts` se agrega con revision Alembic aditiva `de2004a1b2c3`.
- Tipos registrados: `source_ifc`, `viewer_json` y `fragments`.
- Contratos: `giproy_bim_source_ifc_v1`,
  `giproy_bim_viewer_artifact_v1` y `giproy_bim_fragments_v1`.
- Cada artifact conserva version, tenant/proyecto, generacion, path, checksum,
  bytes, checksum fuente, estado y metadata.
- Regeneraciones identicas son idempotentes; cambios crean nueva generacion y
  marcan la anterior `superseded`.
- Escritura derivada atomica mediante archivo temporal y replace.
- Validacion detecta archivo faltante/corrupto y contrato/payload incompatible.
- Rollback solo activa una generacion anterior que supera integridad/contrato.
- Jobs registran el IFC fuente dentro del savepoint de la version.
- El generador viewer registra JSON e indices sin reemplazar `artifact_path`
  del IFC fuente ni depender de `notes` como fuente de verdad.
- API BIM permite listar, registrar Fragments/viewer, validar y hacer rollback.

## Validacion

- Suite BIM Gate A: 70 passed.
- Prueba Gate A real S/M/L: 13, 144 y 926 elementos procesados por jobs en
  3.35 s; checksum, bytes, calidad, source artifact y no publicacion verificados.
- Idempotencia, corrupcion, contrato Fragments incompatible y rollback: OK.
- `py_compile`, `alembic heads`, build Vite, smoke BIM y anti-BIM: OK.

## Gate A

Gate A cerrado localmente:

- corpus small/medium/large procesado por jobs reales;
- fallos no publican versiones incompletas;
- salida trazable a IFC, checksum, parser, job, calidad y artifact;
- GiProy Clasico no se modifica.

## Rollback

Retirar `de2004a1b2c3`, registro/servicio/API/tests de lifecycle y volver al
generador viewer sin historial. El IFC fuente y las tablas clasicas no cambian.
