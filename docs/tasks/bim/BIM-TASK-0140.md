# BIM-TASK-0140 - Gestion documental CDE BIM

Estado: Cerrada localmente

## Objetivo

Completar gestion documental versionada de proyecto dentro del dominio BIM,
sin reutilizar ni alterar Documentos de Proyecto clasico.

## Cambios

- Migracion aditiva `de2027a1b2c3` con documentos y revisiones CDE.
- Codigo documental unico por empresa/proyecto y revision incremental.
- Una sola emision vigente mediante indice parcial; historial inmutable.
- Almacenamiento controlado bajo `BIM_LOCAL_STORAGE_DIR`, escritura atomica,
  filenames seguros, limite de 100 MB y bloqueo de extensiones ejecutables.
- Checksum SHA-256 validado antes de cada descarga.
- Endpoints BIM para listar, cargar revision, consultar historial, descargar y
  archivar logicamente.
- Tab `Documentos` en Coordinacion del Workspace BIM V2.

## Criterios verificados

- La segunda emision supersede la primera sin borrar bytes ni metadata.
- Contenido duplicado y extensiones ejecutables se rechazan.
- Empresa/proyecto no pueden consultar revisiones de otro contexto.
- Un archivo manipulado no puede descargarse.
- Archivar oculta el documento activo sin eliminar su historial.
- Documentos de Proyecto clasico permanece independiente.

## Validacion

- Suite focal CDE: `4 passed`; acumulada: `45 passed`.
- `py_compile` y cabeza Alembic `de2027a1b2c3`: OK.
- PostgreSQL real: upgrade, downgrade, `TIMESTAMPTZ` e indice parcial: OK.
- Build y Playwright 1920x1080: OK.
- Workspace V2, anti-BIM y baseline enterprise: OK.
- Matriz: C01 completa, `50,00%`.

## Rollback

Ejecutar downgrade `de2027a1b2c3`, retirar endpoints, servicio, cliente y panel,
y eliminar manualmente solo la carpeta `cde` creada por este dominio si se
autoriza expresamente. Ninguna tabla ni ruta clasica requiere rollback.

