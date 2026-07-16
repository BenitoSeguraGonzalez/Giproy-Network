# BIM-TASK-0036 - Parsing IFC semantico inicial local

## Estado

Cerrada localmente.

## Objetivo

Abrir la primera puerta real del motor BIM IFC: transformar contenido STEP/IFC
textual en storeys y elementos persistidos dentro del dominio BIM existente,
manteniendo feature flags, tenant y permisos, sin activar UX visible ni tocar
modulos clasicos.

## Alcance

- Agregar parser backend BIM `step_text_v1` para IFC textual.
- Extraer entidades IFC, niveles `IFCBUILDINGSTOREY` y clases de elementos
  constructivos frecuentes.
- Calcular checksum SHA-256 del contenido IFC.
- Persistir el resultado como version BIM `ready` usando tablas existentes:
  `bim_models`, `bim_model_versions`, `bim_storeys` y `bim_elements`.
- Exponer endpoint BIM local `/imports/ifc-text` protegido por feature flag,
  tenant y rol `superadministrador`.
- Exponer cliente frontend de dominio `bimModelsApi.importIfcText`.
- Endurecer smoke BIM positivo para proteger el cliente IFC semantico inicial.
- Agregar simulaciones locales S1/S2/S3 sobre datasets IFC sinteticos para
  validar conteos, clases y estabilidad de volumen medio.

## Cambios realizados

- `backend/app/services/bim/ifc_parser.py` agrega parser STEP/IFC textual
  inicial con resumen de entidades, clases IFC, storeys, elementos y checksum.
- `backend/app/services/bim/import_service.py` agrega
  `import_ifc_text_bim_package(...)`, reutilizando el importador BIM existente
  para persistir storeys/elementos sin duplicar logica de modelo/version.
- `backend/app/api/endpoints/bim_models.py` agrega endpoint
  `/projects/{project_id}/imports/ifc-text`.
- `backend/app/schemas/bim_model.py` agrega contratos
  `BimIfcTextImportRequest` y `BimIfcTextImportResponse`.
- `frontend/src/api/bimModels.js` expone `importIfcText(...)`.
- `frontend/scripts/smoke-bim-workspace-positive.mjs` exige el cliente IFC
  semantico inicial.
- `backend/app/tests/test_bim_foundation.py` cubre parser, endpoint positivo y
  bloqueo de usuario no superadministrador.
- `backend/app/tests/test_bim_ifc_simulations.py` agrega simulaciones S1/S2/S3
  del parser IFC inicial.

## No interferencia

- No se activa `BimTab` en `Proyectos`.
- No se modifican contratos clasicos, auth, JWT, tenant global, EDT, APUs,
  Presupuesto ni Cronogramas.
- No se agrega migracion destructiva ni tabla nueva.
- No se toca servidor, Docker, Coolify, staging ni produccion.
- El flujo queda local y bajo `/api/v1/bim`.

## Validacion

- `..\.venv\Scripts\python.exe -m pytest app\tests\test_bim_foundation.py app\tests\test_bim_ifc_simulations.py -q`:
  OK, 39 passed.
- `..\.venv\Scripts\python.exe -m pytest app\tests\test_bim_ifc_simulations.py -q`:
  OK, 3 passed.
- `python -m py_compile app\services\bim\ifc_parser.py app\services\bim\import_service.py app\api\endpoints\bim_models.py app\schemas\bim_model.py`:
  OK.
- `cmd /c node frontend\scripts\smoke-bim-workspace-positive.mjs`: OK.
- `node frontend\scripts\smoke-classic-no-bim-contamination.mjs`: OK.
- `npm run build`: OK, con warning conocido de chunk grande
  `CronogramaGantt`.

## Limitaciones explicitas

- El parser es una puerta semantica inicial, no un motor IFC completo.
- No resuelve aun relaciones espaciales profundas mediante
  `IFCRELCONTAINEDINSPATIALSTRUCTURE`.
- No extrae property sets completos, cantidades, materiales ni geometria real.
- No genera fragments ni artefactos optimizados.
- No conecta aun el resultado IFC con viewer 3D maduro basado en fragments.

## Pendiente posterior

- `BIM-TASK-0037`: storage local IFC controlado y simulaciones con datasets IFC
  reales/representativos.
- `BIM-TASK-0038`: extraccion semantica extendida de relaciones espaciales,
  property sets, cantidades y clasificaciones.
- `BIM-TASK-0039`: pipeline fragments/artefactos optimizados y viewer 3D
  maduro.

## Rollback

Revertir `ifc_parser.py`, contratos `BimIfcText*`, endpoint `/ifc-text`,
servicio `import_ifc_text_bim_package`, cliente `importIfcText`, smoke BIM y
pruebas agregadas. El sistema vuelve al estado de manifiesto IFC + importacion
JSON + viewer 3D base, sin afectar modulos clasicos.
