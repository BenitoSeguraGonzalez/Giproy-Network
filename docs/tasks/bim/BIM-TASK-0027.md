# BIM-TASK-0027: permisos de duplicacion de vistas BIM compartidas

## Estado
Cerrada

## Objetivo

Cerrar la brecha de permisos en duplicacion de vistas BIM para impedir que un
usuario regular cree copias con scope `company` mediante API.

## Alcance

- Endurecer endpoint BIM de duplicacion de view states.
- Bloquear `target_scope=company` para usuarios que no sean
  `superadministrador`.
- Agregar prueba HTTP focal sobre router BIM de view states.
- Mantener sin cambios los modulos clasicos.

## Resultado

- `backend/app/api/endpoints/bim_view_states.py` valida el scope solicitado antes
  de duplicar.
- `backend/app/tests/test_bim_foundation.py` incluye el router de view states en
  el cliente BIM focal y prueba que un usuario regular recibe 403 al duplicar
  hacia `company`.
- La suite BIM backend sube a 26 pruebas.

## No interferencia

- Sin cambios frontend productivos.
- Sin cambios en GiProy Clasico, Proyectos, EDT, APUs, Presupuesto,
  Cronogramas, auth/JWT/tenant compartido, DB real, migraciones,
  Docker/Coolify, CI/CD, staging ni produccion.

## Validacion

- `python -m py_compile backend\app\api\endpoints\bim_view_states.py backend\app\tests\test_bim_foundation.py`: OK.
- `..\.venv\Scripts\python.exe -m pytest app\tests\test_bim_foundation.py app\tests\test_bim_alembic_migration.py`: OK, 26 passed.
- `node frontend/scripts/smoke-classic-no-bim-contamination.mjs`: OK.

Warnings conocidos no bloqueantes: Pydantic BIM `model_name/model_id`,
deprecacion `httpx` por `TestClient` y warning transaccional del fixture al
forzar rollback controlado en batch BIM.

## Pendiente posterior

- Ampliar cobertura de permisos para lectura/edicion de vistas compartidas si se
  habilitan flujos colaborativos BIM mas ricos.
