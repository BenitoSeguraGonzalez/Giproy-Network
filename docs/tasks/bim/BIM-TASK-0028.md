# BIM-TASK-0028: guarda backend de validacion previa a importacion BIM

## Estado
Cerrada

## Objetivo

Cerrar la brecha de contrato HTTP que permitia importar paquetes JSON BIM con
errores de validacion si el cliente llamaba directamente a la API, saltandose la
guarda UX agregada en `BIM-TASK-0026`.

## Alcance

- Endurecer endpoints BIM de importacion JSON de paquete unico y batch.
- Rechazar con HTTP 400 los paquetes con errores de validacion BIM.
- Mantener las advertencias BIM como no bloqueantes.
- Agregar pruebas HTTP focales para confirmar que no se crean modelos parciales.
- Mantener sin cambios los modulos clasicos.

## Resultado

- `backend/app/api/endpoints/bim_models.py` valida antes de importar en:
  - `/bim/projects/{project_id}/imports/json-package`
  - `/bim/projects/{project_id}/imports/json-batch`
- Si la validacion contiene errores, el endpoint responde 400 con resumen,
  errores, warnings y resultados por paquete.
- `backend/app/tests/test_bim_foundation.py` agrega pruebas para paquete unico y
  batch invalido, verificando que no se crea ningun `BimModel`.
- La suite BIM backend sube a 28 pruebas.

## No interferencia

- Sin cambios frontend productivos.
- Sin cambios en GiProy Clasico, Proyectos, EDT, APUs, Presupuesto,
  Cronogramas, auth/JWT/tenant compartido, DB real, migraciones,
  Docker/Coolify, CI/CD, staging ni produccion.
- La UX clasica con BIM apagado permanece cubierta por smoke anti-BIM.

## Validacion

- `python -m py_compile backend\app\api\endpoints\bim_models.py backend\app\tests\test_bim_foundation.py`: OK.
- `..\.venv\Scripts\python.exe -m pytest app\tests\test_bim_foundation.py app\tests\test_bim_alembic_migration.py`: OK, 28 passed.
- `node frontend/scripts/smoke-classic-no-bim-contamination.mjs`: OK.

Warnings conocidos no bloqueantes: Pydantic BIM `model_name/model_id`,
deprecacion `httpx` por `TestClient` y warning transaccional del fixture al
forzar rollback controlado en batch BIM.

## Rollback

Revertir el helper de validacion previa y las llamadas en
`backend/app/api/endpoints/bim_models.py`, junto con las dos pruebas agregadas en
`backend/app/tests/test_bim_foundation.py`. Esto restaura el comportamiento
anterior de importacion directa desde API, sin tocar datos ni migraciones.

## Pendiente posterior

- Extender validaciones semanticas BIM si se incorporan importadores IFC/3D.
- Evaluar respuesta de error versionada cuando el contrato BIM salga de
  incubacion.
