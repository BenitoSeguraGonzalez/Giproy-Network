Directorio de migraciones Alembic.

Uso previsto:
- Crear revision manual: `alembic -c backend/alembic.ini revision -m "descripcion"`
- Autogenerar revision: `alembic -c backend/alembic.ini revision --autogenerate -m "descripcion"`
- Aplicar migraciones: `alembic -c backend/alembic.ini upgrade head`
- Baselinear una BD existente: `alembic -c backend/alembic.ini stamp head`

Nota:
- `env.py` toma la URL de base de datos desde `app.core.config.settings`.
- Las versiones deben guardarse en `backend/alembic/versions/`.
- La revision `c798fff6206e_initial_schema_baseline` es una baseline no destructiva. No debe usarse para recrear una BD vacia.
