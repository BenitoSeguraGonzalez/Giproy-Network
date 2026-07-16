import importlib.util
from pathlib import Path

import sqlalchemy as sa
from alembic.migration import MigrationContext
from alembic.operations import Operations


MIGRATION_PATH = Path(__file__).resolve().parents[2] / "alembic" / "versions" / "de2005a1b2c3_bim_federations.py"


def test_bim_federation_migration_is_additive_and_reversible():
    spec = importlib.util.spec_from_file_location("bim_federation_migration", MIGRATION_PATH)
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
        inspector = sa.inspect(connection)
        assert {"bim_federations", "bim_federation_members"}.issubset(inspector.get_table_names())
        federation_columns = {column["name"] for column in inspector.get_columns("bim_federations")}
        assert {"proyecto_id", "empresa_id", "revision", "justification", "created_by"}.issubset(federation_columns)
        member_columns = {column["name"] for column in inspector.get_columns("bim_federation_members")}
        assert {"bim_model_version_id", "transform_json", "georeference_json", "enabled"}.issubset(member_columns)
        migration.downgrade()
        remaining = set(sa.inspect(connection).get_table_names())
        assert "bim_federations" not in remaining
        assert "bim_federation_members" not in remaining
        assert {"empresas", "proyectos", "usuarios", "bim_model_versions"}.issubset(remaining)
