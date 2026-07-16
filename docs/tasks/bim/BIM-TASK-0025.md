# BIM-TASK-0025: importacion JSON batch transaccional

## Estado
Cerrada

## Objetivo

Endurecer la importacion JSON BIM para que los lotes se comporten como una
operacion atomica: o se importan todos los paquetes del batch, o no queda ningun
modelo BIM parcial persistido.

## Alcance

- Separar la etapa interna de materializacion de un paquete BIM del commit final.
- Mantener compatibilidad para `json-package` como operacion de paquete unico.
- Hacer que `json-batch` ejecute todos los paquetes dentro de una sola
  transaccion.
- Agregar prueba focal de rollback cuando falla un paquete intermedio.

## Resultado

- `backend/app/services/bim/import_service.py` ahora usa
  `_stage_json_bim_package(...)` como helper interno sin commit propio.
- `import_json_bim_package(...)` conserva commit/rollback para paquete unico.
- `import_json_bim_batch(...)` confirma una sola vez al final y hace rollback si
  cualquier paquete falla.
- `backend/app/tests/test_bim_foundation.py` cubre rollback de batch BIM.

## No interferencia

- Sin cambios en rutas, modelos, schemas ni frontend productivo.
- Sin tocar DB real ni aplicar migraciones.
- Sin cambios en GiProy Clasico, Proyectos, EDT, APUs, Presupuesto,
  Cronogramas, auth/JWT/tenant, Docker/Coolify, CI/CD, staging ni produccion.

## Validacion

- `python -m py_compile backend\app\services\bim\import_service.py backend\app\tests\test_bim_foundation.py`: OK.
- `..\.venv\Scripts\python.exe -m pytest app\tests\test_bim_foundation.py app\tests\test_bim_alembic_migration.py`: OK, 25 passed.
- `node frontend/scripts/smoke-classic-no-bim-contamination.mjs`: OK.

Warnings conocidos no bloqueantes: Pydantic BIM `model_name/model_id`,
deprecacion `httpx` por `TestClient` y warning transaccional del fixture al
forzar rollback controlado en la prueba.

## Pendiente posterior

- Exponer en UX BIM feedback de importacion batch todo-o-nada.
- Agregar validacion previa bloqueante de errores en batch antes de importar,
  si el flujo de producto lo requiere.
