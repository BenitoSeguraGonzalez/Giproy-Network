import importlib.util
from pathlib import Path

import sqlalchemy as sa
from alembic.migration import MigrationContext
from alembic.operations import Operations


MIGRATION_PATH = Path(__file__).resolve().parents[2] / "alembic" / "versions" / "de2003a1b2c3_bim_ifc_quality_reports.py"


def _load_migration():
    spec = importlib.util.spec_from_file_location("bim_ifc_quality_migration", MIGRATION_PATH)
    migration = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(migration)
    return migration


def test_bim_ifc_quality_migration_is_additive_idempotent_and_reversible():
    engine = sa.create_engine("sqlite:///:memory:")
    metadata = sa.MetaData()
    for table_name in ("empresas", "proyectos", "bim_model_versions"):
        sa.Table(table_name, metadata, sa.Column("id", sa.Integer(), primary_key=True))
    migration = _load_migration()

    with engine.begin() as connection:
        metadata.create_all(connection)
        migration.op = Operations(MigrationContext.configure(connection))
        migration.upgrade()
        migration.upgrade()
        inspector = sa.inspect(connection)
        assert "bim_ifc_quality_reports" in inspector.get_table_names()
        columns = {column["name"] for column in inspector.get_columns("bim_ifc_quality_reports")}
        assert {"bim_model_version_id", "contract_version", "findings", "overall_status"}.issubset(columns)
        migration.downgrade()
        assert "bim_ifc_quality_reports" not in sa.inspect(connection).get_table_names()
        assert {"empresas", "proyectos", "bim_model_versions"}.issubset(sa.inspect(connection).get_table_names())
