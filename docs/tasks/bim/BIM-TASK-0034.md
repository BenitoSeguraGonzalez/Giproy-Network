# BIM-TASK-0034 - Bloqueo de etiquetas JSON BIM duplicadas

## Estado

Cerrada.

## Objetivo

Endurecer el pipeline de importacion JSON BIM para impedir que un mismo modelo
BIM reciba dos versiones con la misma `version_label`.

## Alcance

- Servicio BIM de importacion JSON.
- Endpoints BIM `json-package` y `json-batch`.
- Tests focales de contrato backend BIM.
- Documentacion del carril BIM paralelo.

## Cambios realizados

- `backend/app/services/bim/import_service.py` normaliza `version_label` y
  bloquea duplicados por modelo antes de crear una nueva version JSON.
- El mensaje de duplicado queda centralizado y compartido con el flujo IFC.
- `backend/app/api/endpoints/bim_models.py` traduce duplicados JSON a HTTP 400.
- `backend/app/tests/test_bim_foundation.py` cubre doble import JSON del mismo
  modelo/version y batch con etiquetas duplicadas, confirmando que no quedan
  versiones parciales.

## No interferencia clasica

- No se tocaron rutas, pantallas ni contratos clasicos.
- No se activo BIM en `Proyectos.jsx`.
- No se tocaron EDT, APUs, Presupuesto, Cronogramas, auth, JWT ni tenant
  compartido.
- No se tocaron Docker, Coolify, CI/CD, staging ni produccion.

## Validacion

- `python -m py_compile backend\app\services\bim\import_service.py backend\app\api\endpoints\bim_models.py backend\app\tests\test_bim_foundation.py`: OK.
- `..\.venv\Scripts\python.exe -m pytest app\tests\test_bim_foundation.py app\tests\test_bim_alembic_migration.py`: OK, 36 passed.
- `node frontend/scripts/smoke-classic-no-bim-contamination.mjs`: OK.

## Rollback

Revertir los cambios de `import_service.py`, `bim_models.py`, el test focal y
esta documentacion elimina la guarda de duplicados JSON sin afectar el resto del
dominio BIM.
