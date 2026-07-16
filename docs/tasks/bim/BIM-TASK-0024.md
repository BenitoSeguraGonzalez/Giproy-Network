# BIM-TASK-0024: validacion controlada de migracion Alembic BIM

## Estado
Cerrada

## Objetivo

Validar la migracion principal del dominio BIM en un entorno controlado, sin
tocar la base real ni ejecutar cambios sobre datos de GiProy Clasico.

## Alcance

- Ejecutar la migracion `de2001a1b2c3_bim_domain_tables.py` contra SQLite en
  memoria.
- Simular solo las tablas clasicas referenciadas por foreign keys.
- Verificar creacion de tablas BIM, columnas e indices principales.
- Verificar idempotencia de `upgrade()`.
- Verificar que `downgrade()` remueve solo tablas BIM y conserva tablas
  clasicas simuladas.

## Resultado

- Se crea `backend/app/tests/test_bim_alembic_migration.py`.
- La migracion BIM principal queda validada sin conexion a PostgreSQL real.
- La prueba refuerza que el dominio BIM se agrega como capa aislada y no
  destructiva sobre referencias clasicas.

## No interferencia

- Sin aplicar migraciones sobre DB real.
- Sin cambios en modelos, servicios, endpoints ni frontend productivo.
- Sin cambios en auth/JWT/tenant.
- Sin tocar EDT/APUs/Presupuesto clasicos, Cronogramas, Proyectos clasico,
  Docker/Coolify, CI/CD, staging ni produccion.

## Validacion

- `python -m py_compile backend\app\tests\test_bim_alembic_migration.py`: OK.
- `..\.venv\Scripts\python.exe -m pytest app\tests\test_bim_alembic_migration.py`: OK, 3 passed.
- `..\.venv\Scripts\python.exe -m pytest app\tests\test_bim_alembic_migration.py app\tests\test_bim_foundation.py`: OK, 24 passed.
- `node frontend/scripts/smoke-classic-no-bim-contamination.mjs`: OK.

Warnings conocidos no bloqueantes: Pydantic BIM `model_name/model_id` y
deprecacion `httpx` por `TestClient`.

## Pendiente posterior

- Cuando exista autorizacion explicita de entorno, aplicar/verificar Alembic en
  base local real o staging controlado.
- Mantener sin cambios la DB viva mientras BIM siga en incubacion.
