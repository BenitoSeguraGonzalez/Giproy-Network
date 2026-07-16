import importlib.util
from pathlib import Path

import sqlalchemy as sa
from alembic.migration import MigrationContext
from alembic.operations import Operations


MIGRATION_PATH = Path(__file__).resolve().parents[2] / "alembic" / "versions" / "de2006a1b2c3_bim_ids_validation.py"


def test_bim_ids_migration_is_additive_and_reversible():
    spec = importlib.util.spec_from_file_location("bim_ids_migration", MIGRATION_PATH)
    migration = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(migration)
    engine = sa.create_engine("sqlite:///:memory:")
    metadata = sa.MetaData()
    for table_name in ("empresas", "proyectos", "usuarios", "bim_model_versions"):
        sa.Table(table_name, metadata, sa.Column("id", sa.Integer(), primary_key=True))
    with engine.begin() as connection:
        metadata.create_all(connection)
        migration.op = Operations(MigrationContext.configure(connection))
        migration.upgrade()
        tables = set(sa.inspect(connection).get_table_names())
        assert {"bim_ids_profiles", "bim_ids_validations", "bim_ids_findings"}.issubset(tables)
        migration.downgrade()
        remaining = set(sa.inspect(connection).get_table_names())
        assert {"bim_ids_profiles", "bim_ids_validations", "bim_ids_findings"}.isdisjoint(remaining)
        assert {"empresas", "proyectos", "usuarios", "bim_model_versions"}.issubset(remaining)
