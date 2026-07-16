import importlib.util
from pathlib import Path
import sqlalchemy as sa
from alembic.migration import MigrationContext
from alembic.operations import Operations

PATH = Path(__file__).resolve().parents[2] / "alembic" / "versions" / "de2007a1b2c3_bim_bcf_issues.py"

def test_bim_issue_migration_is_additive_and_reversible():
    spec = importlib.util.spec_from_file_location("bim_issue_migration", PATH); migration = importlib.util.module_from_spec(spec); spec.loader.exec_module(migration)
    engine = sa.create_engine("sqlite:///:memory:"); metadata = sa.MetaData()
    for name in ("empresas", "proyectos", "usuarios", "bim_model_versions"):
        sa.Table(name, metadata, sa.Column("id", sa.Integer(), primary_key=True))
    with engine.begin() as connection:
        metadata.create_all(connection); migration.op = Operations(MigrationContext.configure(connection)); migration.upgrade()
        assert {"bim_issues", "bim_issue_comments", "bim_issue_events"}.issubset(sa.inspect(connection).get_table_names())
        migration.downgrade(); remaining = set(sa.inspect(connection).get_table_names())
        assert {"bim_issues", "bim_issue_comments", "bim_issue_events"}.isdisjoint(remaining)
