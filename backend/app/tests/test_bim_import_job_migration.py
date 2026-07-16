import importlib.util
from pathlib import Path

import sqlalchemy as sa
from alembic.migration import MigrationContext
from alembic.operations import Operations


MIGRATION_PATH = (
    Path(__file__).resolve().parents[2] / "alembic" / "versions" / "de2002a1b2c3_bim_import_jobs.py"
)


def _load_migration():
    spec = importlib.util.spec_from_file_location("bim_import_jobs_migration", MIGRATION_PATH)
    migration = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(migration)
    return migration


def _operations(connection):
    return Operations(MigrationContext.configure(connection))


def _prepare_reference_tables(connection):
    metadata = sa.MetaData()
    sa.Table("empresas", metadata, sa.Column("id", sa.Integer(), primary_key=True))
    sa.Table("proyectos", metadata, sa.Column("id", sa.Integer(), primary_key=True))
    sa.Table("usuarios", metadata, sa.Column("id", sa.Integer(), primary_key=True))
    sa.Table("bim_model_versions", metadata, sa.Column("id", sa.Integer(), primary_key=True))
    metadata.create_all(connection)


def test_bim_import_jobs_migration_is_additive_and_idempotent():
    engine = sa.create_engine("sqlite:///:memory:")
    migration = _load_migration()

    with engine.begin() as connection:
        _prepare_reference_tables(connection)
        migration.op = _operations(connection)
        migration.upgrade()
        migration.upgrade()

        inspector = sa.inspect(connection)
        assert "bim_import_jobs" in inspector.get_table_names()
        columns = {column["name"] for column in inspector.get_columns("bim_import_jobs")}
        assert {
            "proyecto_id",
            "empresa_id",
            "idempotency_key",
            "status",
            "stage",
            "progress",
            "result_json",
        }.issubset(columns)
        indexes = {index["name"] for index in inspector.get_indexes("bim_import_jobs")}
        assert "ix_bim_import_jobs_proyecto_id" in indexes
        assert "ix_bim_import_jobs_status" in indexes


def test_bim_import_jobs_downgrade_preserves_reference_tables():
    engine = sa.create_engine("sqlite:///:memory:")
    migration = _load_migration()

    with engine.begin() as connection:
        _prepare_reference_tables(connection)
        migration.op = _operations(connection)
        migration.upgrade()
        migration.downgrade()

        tables = set(sa.inspect(connection).get_table_names())
        assert "bim_import_jobs" not in tables
        assert {"empresas", "proyectos", "usuarios", "bim_model_versions"}.issubset(tables)
