# BIM-TASK-0033: bloqueo de etiquetas IFC duplicadas

## Estado
Cerrada

## Objetivo

Endurecer el versionado inicial de manifiestos IFC para impedir que un mismo
modelo BIM reciba dos versiones con la misma etiqueta dentro del mismo
proyecto/empresa/disciplina.

## Alcance

- Validar duplicidad de `version_label` antes de registrar un manifiesto IFC.
- Responder 400 desde el endpoint BIM cuando la etiqueta ya existe.
- Evitar mutaciones y rollback innecesario en errores de contrato.
- Agregar prueba HTTP focal.
- Mantener sin cambios los modulos clasicos.

## Resultado

- `backend/app/services/bim/import_service.py` rechaza duplicados antes de abrir
  el bloque transaccional de escritura.
- `backend/app/tests/test_bim_foundation.py` cubre doble POST al mismo
  manifiesto IFC y confirma que solo queda una version persistida.
- La suite BIM backend sube a 34 pruebas.

## No interferencia

- Sin cambios frontend productivos.
- Sin cambios en GiProy Clasico, Proyectos, EDT, APUs, Presupuesto,
  Cronogramas, auth/JWT/tenant compartido, DB real, migraciones,
  Docker/Coolify, CI/CD, staging ni produccion.

## Validacion

- `python -m py_compile backend\app\services\bim\import_service.py backend\app\tests\test_bim_foundation.py`: OK.
- `..\.venv\Scripts\python.exe -m pytest app\tests\test_bim_foundation.py app\tests\test_bim_alembic_migration.py`: OK, 34 passed.
- `node frontend/scripts/smoke-classic-no-bim-contamination.mjs`: OK.

Warnings conocidos no bloqueantes: Pydantic BIM `model_name/model_id`,
deprecacion `httpx` por `TestClient` y warning transaccional del fixture al
forzar rollback controlado en batch BIM.

## Rollback

Eliminar la validacion de duplicado en `register_ifc_bim_manifest(...)` y la
prueba asociada. No hay cambios de DB ni migraciones.

## Pendiente posterior

- Evaluar constraint no destructivo de unicidad para version labels BIM cuando se
  autorice una migracion especifica.
- Extender la misma politica de versionado al import JSON si el producto decide
  bloquear etiquetas repetidas tambien para paquetes de incubacion.
