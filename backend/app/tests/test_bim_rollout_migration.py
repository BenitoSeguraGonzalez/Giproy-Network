import importlib.util
from pathlib import Path


def test_bim_rollout_migration_is_additive_and_tenant_scoped():
    path = Path(__file__).parents[2] / "alembic" / "versions" / "de2010a1b2c3_bim_rollout_plans.py"
    spec = importlib.util.spec_from_file_location("bim_rollout_migration", path)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)

    source = path.read_text(encoding="utf-8")
    assert module.down_revision == "de2009a1b2c3"
    assert '"bim_rollout_plans"' in source
    assert 'ForeignKeyConstraint(["empresa_id"], ["empresas.id"]' in source
    assert "drop_column" not in source
    assert "alter_column" not in source
