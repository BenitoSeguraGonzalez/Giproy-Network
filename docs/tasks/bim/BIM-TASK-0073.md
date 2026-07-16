# BIM-TASK-0073 - Conformidad IFC y reporte de calidad base

Estado: Cerrada localmente

## Objetivo

Separar validez STEP, compatibilidad de schema y warnings semanticos GiProy en
un reporte versionado, persistente y visible, sin realizar claims de
certificacion buildingSMART.

## Implementacion

- Contrato `giproy_bim_ifc_quality_v1` con dominios `step`, `schema` y
  `semantic` y severidades diferenciadas.
- Baseline soportado IFC2X3/IFC4; otros schemas quedan
  `partially_supported`, nunca certificados.
- La migracion aditiva `de2003a1b2c3` crea
  `bim_ifc_quality_reports`, acotada por version, proyecto y empresa.
- Los reportes conservan checksum, schema, estados, conteos, findings
  vinculables por `entity_ref`, resumen y timestamps.
- El job IFC bloquea estructuras STEP/schema invalidas antes de persistir y
  conserva el analisis accionable en su resultado fallido.
- Los jobs exitosos generan el reporte dentro del mismo savepoint de version.
- API BIM protegida para generar y consultar reportes por version.
- `BimQualityReportPanel` muestra STEP, schema, semantica y hallazgos de la
  version seleccionada dentro del workspace BIM.

## Validacion

- Suite BIM ampliada: 58 passed incluyendo corpus real, invalidos, schema
  parcial, jobs, migraciones, endpoints y foundation.
- Suite focal HTTP/calidad/jobs: 12 passed.
- `py_compile`: OK.
- `alembic heads`: `de2003a1b2c3` reconocido como head BIM.
- `smoke-bim-workspace-positive`: OK.
- `smoke-classic-no-bim-contamination`: OK.
- `npm run build`: OK; warning conocido de chunk grande Vite.

## No interferencia clasica

- Persistencia, API, servicios y UI viven exclusivamente en BIM.
- No cambia auth, tenant, Proyectos clasico, contratos clasicos ni TASK-1807.
- No se activa BIM fuera de feature flags y rol permitido.

## Limites declarados

- El reporte es evidencia de conformidad tecnica interna, no certificacion.
- No reemplaza validadores oficiales buildingSMART ni IDS, que se aborda en
  fases posteriores del plan.

## Rollback

Retirar revision `de2003a1b2c3`, modelo, servicio, endpoints, tests, cliente y
panel de calidad BIM. Los jobs IFC y GiProy Clasico siguen operativos.
