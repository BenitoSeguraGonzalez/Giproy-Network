# BIM-TASK-0037 - Storage local IFC controlado

## Estado

Cerrada localmente.

## Objetivo

Completar la puerta de archivo/storage local del pipeline IFC: aceptar un
archivo `.ifc`, calcular checksum, almacenarlo en un perimetro BIM local
controlado, parsearlo con el parser inicial y registrar el `artifact_path` en
la version BIM correspondiente.

## Alcance

- Agregar configuracion `BIM_LOCAL_STORAGE_DIR`.
- Crear storage local BIM aislado bajo `uploads/bim/{empresa_id}/{project_id}`.
- Sanitizar nombres de archivo IFC.
- Rechazar archivos vacios, no `.ifc` o mayores al limite local definido.
- Calcular checksum SHA-256 sobre bytes originales.
- Persistir el archivo y enlazar `artifact_path` en `bim_model_versions`.
- Agregar endpoint multipart `/imports/ifc-file` bajo feature flag, tenant y
  rol `superadministrador`.
- Exponer cliente frontend de dominio `bimModelsApi.importIfcFile`.
- Validar con `tmp_path` en tests para no escribir en runtime real.

## Cambios realizados

- `backend/app/services/bim/ifc_storage.py` agrega storage local IFC con
  checksum, sanitizacion, limite de tamano y rollback de archivo en fallo.
- `backend/app/services/bim/import_service.py` agrega
  `import_ifc_file_bim_package(...)`.
- `backend/app/api/endpoints/bim_models.py` agrega endpoint
  `/projects/{project_id}/imports/ifc-file`.
- `backend/app/schemas/bim_model.py` agrega `BimIfcFileImportResponse`.
- `backend/app/core/config.py` agrega `BIM_LOCAL_STORAGE_DIR`.
- `frontend/src/api/bimModels.js` agrega `importIfcFile(...)` con `FormData`.
- `frontend/scripts/smoke-bim-workspace-positive.mjs` protege el cliente
  frontend de archivo IFC.
- `backend/app/tests/test_bim_foundation.py` cubre importacion por archivo,
  persistencia de `artifact_path`, escritura en `tmp_path` y rechazo de
  extension no IFC.

## No interferencia

- No se crea backend BIM separado.
- No se altera auth/JWT/tenant global.
- No se modifican EDT, APUs, Presupuesto, Cronogramas ni rutas clasicas.
- No se activa UX BIM visible en `Proyectos`.
- No se escribe en `uploads/bim` durante tests; se usa `tmp_path`.
- No se toca servidor, Docker, Coolify, staging ni produccion.

## Validacion

- `..\.venv\Scripts\python.exe -m pytest app\tests\test_bim_foundation.py app\tests\test_bim_ifc_simulations.py -q`:
  OK, 41 passed.
- `python -m py_compile app\services\bim\ifc_storage.py app\services\bim\ifc_parser.py app\services\bim\import_service.py app\api\endpoints\bim_models.py app\schemas\bim_model.py app\core\config.py`:
  OK.
- `cmd /c node frontend\scripts\smoke-bim-workspace-positive.mjs`: OK.
- `node frontend\scripts\smoke-classic-no-bim-contamination.mjs`: OK.
- `npm run build`: OK, con warning conocido de chunk grande
  `CronogramaGantt`.

## Limitaciones explicitas

- El storage local no implica despliegue ni sincronizacion remota.
- Aun no hay pipeline de fragments ni artefactos optimizados.
- Aun no se procesan relaciones IFC profundas, property sets ni quantities.
- Las simulaciones siguen siendo sinteticas; faltan IFC reales/representativos.

## Pendiente posterior

- `BIM-TASK-0038`: parsing IFC profundo de relaciones espaciales, property
  sets, quantities y clasificaciones.
- `BIM-TASK-0039`: fragments/artefactos optimizados y viewer 3D maduro.
- `BIM-TASK-0040`: simulaciones con datasets IFC reales o representativos y
  metricas de rendimiento/carga.

## Rollback

Revertir `ifc_storage.py`, `BIM_LOCAL_STORAGE_DIR`, endpoint `/ifc-file`,
servicio `import_ifc_file_bim_package`, contrato `BimIfcFileImportResponse`,
cliente `importIfcFile`, smoke y tests asociados. El sistema vuelve a parsing
IFC textual sin storage local persistente.
