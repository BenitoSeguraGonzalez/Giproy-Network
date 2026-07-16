# BIM-TASK-0029: cobertura de workspace context BIM por usuario

## Estado
Cerrada

## Objetivo

Cerrar una brecha de validacion de `BIM-TASK-0006` demostrando que el
`workspace-context` BIM persistido se mantiene aislado por usuario, proyecto y
empresa, y que sigue protegido por feature flag.

## Alcance

- Agregar pruebas HTTP focales sobre los endpoints BIM de workspace context.
- Validar que dos usuarios del mismo proyecto conservan contexto independiente.
- Validar que no se persiste contexto si BIM esta apagado.
- Mantener sin cambios los modulos clasicos y la UX visible de GiProy Clasico.

## Resultado

- `backend/app/tests/test_bim_foundation.py` agrega cobertura para:
  - `PUT /bim/projects/{project_id}/workspace-context`
  - `GET /bim/projects/{project_id}/workspace-context`
- La prueba confirma que `workspace_context` crea una fila por usuario y no
  mezcla `storey_name` ni `element_id` entre usuarios.
- La prueba con BIM apagado confirma respuesta 403 y ausencia de persistencia.
- La suite BIM backend sube a 30 pruebas.

## No interferencia

- Sin cambios backend productivos.
- Sin cambios frontend productivos.
- Sin cambios en GiProy Clasico, Proyectos, EDT, APUs, Presupuesto,
  Cronogramas, auth/JWT/tenant compartido, DB real, migraciones,
  Docker/Coolify, CI/CD, staging ni produccion.

## Validacion

- `python -m py_compile backend\app\tests\test_bim_foundation.py`: OK.
- `..\.venv\Scripts\python.exe -m pytest app\tests\test_bim_foundation.py app\tests\test_bim_alembic_migration.py`: OK, 30 passed.
- `node frontend/scripts/smoke-classic-no-bim-contamination.mjs`: OK.

Warnings conocidos no bloqueantes: Pydantic BIM `model_name/model_id`,
deprecacion `httpx` por `TestClient` y warning transaccional del fixture al
forzar rollback controlado en batch BIM.

## Rollback

Eliminar las dos pruebas agregadas en `backend/app/tests/test_bim_foundation.py`
y revertir esta documentacion. No hay cambios productivos ni migraciones que
revertir.

## Pendiente posterior

- Ampliar cobertura de creacion, renombrado y borrado de view states personales
  y compartidos.
- Mantener la activacion visible de workspace BIM fuera de GiProy Clasico hasta
  una TASK explicita de integracion controlada.
