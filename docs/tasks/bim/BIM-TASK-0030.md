# BIM-TASK-0030: restriccion de scopes publicos en vistas BIM

## Estado
Cerrada

## Objetivo

Cerrar la brecha por la cual los endpoints publicos de view states BIM podian
aceptar scopes arbitrarios. Los scopes publicos autorizados quedan limitados a
`personal` y `company`; `workspace_context` permanece reservado al servicio
interno de contexto de workspace.

## Alcance

- Endurecer los endpoints BIM de creacion y duplicacion de view states.
- Rechazar scopes no soportados con HTTP 400.
- Mantener la regla existente: `company` solo puede ser creado/duplicado por
  `superadministrador`.
- Agregar prueba HTTP focal para creacion y duplicacion con scope invalido.
- Mantener sin cambios los modulos clasicos.

## Resultado

- `backend/app/api/endpoints/bim_view_states.py` agrega una guarda de scope
  publico para view states.
- `backend/app/tests/test_bim_foundation.py` confirma que `workspace_context` y
  cualquier scope legacy/arbitrario no pueden entrar por API publica.
- La suite BIM backend sube a 31 pruebas.

## No interferencia

- Sin cambios frontend productivos.
- Sin cambios en GiProy Clasico, Proyectos, EDT, APUs, Presupuesto,
  Cronogramas, auth/JWT/tenant compartido, DB real, migraciones,
  Docker/Coolify, CI/CD, staging ni produccion.
- La UX BIM visible sigue controlada por flags y la experiencia clasica con BIM
  apagado permanece cubierta por smoke anti-BIM.

## Validacion

- `python -m py_compile backend\app\api\endpoints\bim_view_states.py backend\app\tests\test_bim_foundation.py`: OK.
- `..\.venv\Scripts\python.exe -m pytest app\tests\test_bim_foundation.py app\tests\test_bim_alembic_migration.py`: OK, 31 passed.
- `node frontend/scripts/smoke-classic-no-bim-contamination.mjs`: OK.

Warnings conocidos no bloqueantes: Pydantic BIM `model_name/model_id`,
deprecacion `httpx` por `TestClient` y warning transaccional del fixture al
forzar rollback controlado en batch BIM.

## Rollback

Eliminar la guarda de scope publico en
`backend/app/api/endpoints/bim_view_states.py` y la prueba agregada en
`backend/app/tests/test_bim_foundation.py`. No hay cambios de DB ni migraciones.

## Pendiente posterior

- Ampliar matriz de permisos para renombrado/borrado de vistas personales y
  compartidas.
- Mantener `workspace_context` como scope interno no publicable.
