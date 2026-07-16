import importlib.util
from pathlib import Path

import sqlalchemy as sa
from alembic.migration import MigrationContext
from alembic.operations import Operations


BIM_MIGRATION_PATH = (
    Path(__file__).resolve().parents[2] / "alembic" / "versions" / "de2001a1b2c3_bim_domain_tables.py"
)
BIM_TABLES = {
    "bim_models",
    "bim_model_versions",
    "bim_elements",
    "bim_storeys",
    "bim_view_states",
    "bim_link_edt",
    "bim_link_apu",
    "bim_link_presupuesto",
}


def _prepare_classic_reference_tables(connection):
    metadata = sa.MetaData()
    sa.Table("empresas", metadata, sa.Column("id", sa.Integer(), primary_key=True))
    sa.Table("proyectos", metadata, sa.Column("id", sa.Integer(), primary_key=True))
    sa.Table("usuarios", metadata, sa.Column("id", sa.Integer(), primary_key=True))
    sa.Table("edt_nodes", metadata, sa.Column("id", sa.Integer(), primary_key=True))
    sa.Table("apus", metadata, sa.Column("id", sa.Integer(), primary_key=True))
    sa.Table("presupuesto_detalles", metadata, sa.Column("id", sa.Integer(), primary_key=True))
    metadata.create_all(connection)


def _migration_operations(connection):
    context = MigrationContext.configure(connection)
    return Operations(context)


def _load_bim_migration():
    spec = importlib.util.spec_from_file_location("bim_domain_tables_migration", BIM_MIGRATION_PATH)
    migration = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(migration)
    return migration


def test_bim_domain_migration_upgrade_creates_expected_tables_and_indexes():
    engine = sa.create_engine("sqlite:///:memory:")
    migration = _load_bim_migration()

    with engine.begin() as connection:
        _prepare_classic_reference_tables(connection)
        migration.op = _migration_operations(connection)

        migration.upgrade()

        inspector = sa.inspect(connection)
        assert BIM_TABLES.issubset(set(inspector.get_table_names()))

        bim_models_columns = {column["name"] for column in inspector.get_columns("bim_models")}
        assert {"id", "proyecto_id", "empresa_id", "nombre", "activo"}.issubset(bim_models_columns)

        bim_elements_columns = {column["name"] for column in inspector.get_columns("bim_elements")}
        assert {"id", "bim_model_version_id", "global_id", "properties", "metadata_json"}.issubset(
            bim_elements_columns
        )

        bim_link_presupuesto_columns = {
            column["name"] for column in inspector.get_columns("bim_link_presupuesto")
        }
        assert {"bim_element_id", "presupuesto_detalle_id", "created_by"}.issubset(
            bim_link_presupuesto_columns
        )

        bim_indexes = {
            table_name: {index["name"] for index in inspector.get_indexes(table_name)}
            for table_name in BIM_TABLES
        }
        assert "ix_bim_models_empresa_id" in bim_indexes["bim_models"]
        assert "ix_bim_elements_global_id" in bim_indexes["bim_elements"]
        assert "ix_bim_link_edt_edt_node_id" in bim_indexes["bim_link_edt"]
        assert "ix_bim_link_apu_apu_id" in bim_indexes["bim_link_apu"]
        assert (
            "ix_bim_link_presupuesto_presupuesto_detalle_id"
            in bim_indexes["bim_link_presupuesto"]
        )


def test_bim_domain_migration_upgrade_is_idempotent_when_tables_exist():
    engine = sa.create_engine("sqlite:///:memory:")
    migration = _load_bim_migration()

    with engine.begin() as connection:
        _prepare_classic_reference_tables(connection)
        migration.op = _migration_operations(connection)

        migration.upgrade()
        migration.upgrade()

        inspector = sa.inspect(connection)
        assert BIM_TABLES.issubset(set(inspector.get_table_names()))


def test_bim_domain_migration_downgrade_removes_only_bim_tables():
    engine = sa.create_engine("sqlite:///:memory:")
    migration = _load_bim_migration()

    with engine.begin() as connection:
        _prepare_classic_reference_tables(connection)
        migration.op = _migration_operations(connection)

        migration.upgrade()
        migration.downgrade()

        table_names = set(sa.inspect(connection).get_table_names())
        assert BIM_TABLES.isdisjoint(table_names)
        assert {"empresas", "proyectos", "usuarios", "edt_nodes", "apus", "presupuesto_detalles"}.issubset(
            table_names
        )
