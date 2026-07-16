# BIM-TASK-0039 - Artefacto optimizado para viewer BIM

## Estado

Cerrada localmente.

## Objetivo

Agregar la primera salida optimizada del motor BIM para consumo del viewer:
un artefacto JSON local, indexado por nivel, clase IFC y propiedades, generado
desde los elementos BIM persistidos y preparado como puente hacia fragments y
viewer 3D maduro.

## Alcance

- Generar artefacto local `giproy_bim_viewer_artifact`.
- Indexar elementos por:
  - storey
  - IFC class
  - property key
- Incluir bounds 2D derivados o provenientes de `geometry_2d`.
- Escribir el artefacto bajo `BIM_LOCAL_STORAGE_DIR/{empresa}/{proyecto}/artifacts`.
- Registrar trazabilidad `viewer_artifact_path=...` en notas de version.
- Exponer endpoint protegido
  `/projects/{project_id}/versions/{version_id}/artifacts/viewer`.
- Exponer cliente frontend de dominio `generateViewerArtifact(...)`.

## Cambios realizados

- `backend/app/services/bim/artifact_service.py` agrega generador de artefacto
  optimizado para viewer.
- `backend/app/api/endpoints/bim_models.py` agrega endpoint de generacion de
  artefacto.
- `backend/app/schemas/bim_model.py` agrega `BimViewerArtifactResponse`.
- `frontend/src/api/bimModels.js` agrega `generateViewerArtifact(...)`.
- `frontend/scripts/smoke-bim-workspace-positive.mjs` protege el cliente.
- `backend/app/tests/test_bim_foundation.py` valida generacion, archivo JSON,
  indices, trazabilidad y permisos.

## No interferencia

- No se agrega migracion ni tabla nueva.
- No se modifica UX clasica ni se activa BIM visible.
- No se toca EDT, APUs, Presupuesto, Cronogramas, auth, JWT ni tenant global.
- No se sube a servidor ni se toca Docker/Coolify/staging/produccion.

## Validacion

- `..\.venv\Scripts\python.exe -m pytest app\tests\test_bim_foundation.py app\tests\test_bim_ifc_simulations.py -q`:
  OK, 44 passed.
- `python -m py_compile app\services\bim\artifact_service.py app\services\bim\ifc_storage.py app\services\bim\ifc_parser.py app\services\bim\import_service.py app\api\endpoints\bim_models.py app\schemas\bim_model.py app\core\config.py`:
  OK.
- `cmd /c node frontend\scripts\smoke-bim-workspace-positive.mjs`: OK.
- `node frontend\scripts\smoke-classic-no-bim-contamination.mjs`: OK.
- `npm run build`: OK, con warning conocido de chunk grande
  `CronogramaGantt`.

## Limitaciones explicitas

- Este artefacto no es todavia un fragment binario industrial de That Open.
- No contiene geometria IFC real triangulada.
- No reemplaza el futuro pipeline fragments/web-ifc.
- Es una capa optimizada intermedia para viewer, indices, seleccion y
  preparacion de carga eficiente.

## Pendiente posterior

- `BIM-TASK-0040`: consumir artefacto optimizado desde harness/viewer 3D.
- `BIM-TASK-0041`: fragments/artefactos binarios con stack That Open.
- `BIM-TASK-0042`: simulaciones con IFC reales/representativos y metricas de
  rendimiento.

## Rollback

Revertir `artifact_service.py`, endpoint `/artifacts/viewer`, contrato
`BimViewerArtifactResponse`, cliente `generateViewerArtifact`, smoke y tests
asociados. El sistema vuelve a storage/parsing IFC sin artefacto optimizado.
