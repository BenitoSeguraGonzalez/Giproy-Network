# BIM-TASK-0031: registro de manifiesto IFC BIM versionado

## Estado
Cerrada

## Objetivo

Abrir el primer contrato backend controlado para artefactos IFC sin introducir
todavia parsing IFC/3D ni dependencias nuevas. El alcance es registrar un
manifiesto IFC como version BIM trazable, validada y activable bajo feature flag.

## Alcance

- Agregar schema BIM para manifiesto IFC.
- Agregar servicio BIM aislado para registrar modelo/version desde manifiesto.
- Agregar endpoint backend BIM bajo `/imports/ifc-manifest`.
- Validar extension `.ifc`, checksum SHA-256 opcional y permisos de
  `superadministrador`.
- Mantener sin cambios frontend, GiProy Clasico y DB real.

## Resultado

- `backend/app/schemas/bim_model.py` expone:
  - `BimIfcManifestRequest`
  - `BimIfcManifestResponse`
- `backend/app/services/bim/import_service.py` agrega
  `register_ifc_bim_manifest(...)`.
- `backend/app/api/endpoints/bim_models.py` expone:
  - `POST /bim/projects/{project_id}/imports/ifc-manifest`
- La version queda con `status="ifc_manifest_registered"`,
  `element_count=0`, `storey_count=0` y metadata de checksum/tamano en notas.
- La suite BIM backend sube a 33 pruebas.

## Limite explicito

Este slice no parsea archivos IFC, no genera fragments, no renderiza 3D y no
agrega dependencias `three`, `web-ifc` ni That Open. Es una puerta de versionado
para que el pipeline IFC maduro pueda llegar despues sin romper contratos.

## No interferencia

- Sin cambios frontend productivos.
- Sin cambios en GiProy Clasico, Proyectos, EDT, APUs, Presupuesto,
  Cronogramas, auth/JWT/tenant compartido, DB real, migraciones,
  Docker/Coolify, CI/CD, staging ni produccion.
- La UX BIM visible sigue apagada en Proyectos clasico.

## Validacion

- `python -m py_compile backend\app\schemas\bim_model.py backend\app\services\bim\import_service.py backend\app\api\endpoints\bim_models.py backend\app\tests\test_bim_foundation.py`: OK.
- `..\.venv\Scripts\python.exe -m pytest app\tests\test_bim_foundation.py app\tests\test_bim_alembic_migration.py`: OK, 33 passed.
- `node frontend/scripts/smoke-classic-no-bim-contamination.mjs`: OK.

Warnings conocidos no bloqueantes: Pydantic BIM `model_name/model_id`,
deprecacion `httpx` por `TestClient` y warning transaccional del fixture al
forzar rollback controlado en batch BIM.

## Rollback

Eliminar schemas `BimIfcManifest*`, servicio `register_ifc_bim_manifest(...)`,
endpoint `/imports/ifc-manifest` y las dos pruebas asociadas. No hay cambios de
DB ni migraciones.

## Pendiente posterior

- Incorporar pipeline IFC real con parsing/validacion semantica y artefacto
  optimizado cuando se autoricen dependencias BIM/3D.
- Conectar el manifiesto IFC con storage real y hashes de archivo aplicados, sin
  tocar uploads/runtime sin instruccion explicita.
