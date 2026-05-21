"""project_detail_empresa_scope

Revision ID: f4c6d9b8a1e2
Revises: 8b0d9e1d2f44
Create Date: 2026-03-12 18:45:00.000000
"""

from alembic import op
import sqlalchemy as sa


revision = "f4c6d9b8a1e2"
down_revision = "8b0d9e1d2f44"
branch_labels = None
depends_on = None


def _has_table(inspector: sa.Inspector, table_name: str) -> bool:
    return table_name in inspector.get_table_names()


def _has_column(inspector: sa.Inspector, table_name: str, column_name: str) -> bool:
    return any(column["name"] == column_name for column in inspector.get_columns(table_name))


def _has_index(inspector: sa.Inspector, table_name: str, index_name: str) -> bool:
    return any(index["name"] == index_name for index in inspector.get_indexes(table_name))


def _has_foreign_key(inspector: sa.Inspector, table_name: str, fk_name: str) -> bool:
    return any(fk["name"] == fk_name for fk in inspector.get_foreign_keys(table_name))


def upgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)

    if not _has_table(inspector, "proyecto_detalles"):
        return

    if not _has_column(inspector, "proyecto_detalles", "id"):
        op.add_column("proyecto_detalles", sa.Column("id", sa.Integer(), nullable=True))
        bind.execute(sa.text("CREATE SEQUENCE IF NOT EXISTS proyecto_detalles_id_seq"))
        bind.execute(
            sa.text(
                "ALTER TABLE proyecto_detalles ALTER COLUMN id SET DEFAULT nextval('proyecto_detalles_id_seq')"
            )
        )
        bind.execute(sa.text("UPDATE proyecto_detalles SET id = nextval('proyecto_detalles_id_seq') WHERE id IS NULL"))
        inspector = sa.inspect(bind)

    if not _has_column(inspector, "proyecto_detalles", "empresa_id"):
        op.add_column("proyecto_detalles", sa.Column("empresa_id", sa.Integer(), nullable=True))
        inspector = sa.inspect(bind)

    bind.execute(
        sa.text(
            """
            WITH root_empresa AS (
                SELECT
                    COALESCE(codigo_root, codigo) AS root_code,
                    MIN(empresa_id) AS empresa_id,
                    COUNT(DISTINCT empresa_id) AS empresas
                FROM proyectos
                WHERE COALESCE(codigo_root, codigo) IS NOT NULL
                GROUP BY COALESCE(codigo_root, codigo)
            )
            UPDATE proyecto_detalles AS d
            SET empresa_id = re.empresa_id
            FROM root_empresa AS re
            WHERE d.codigo_root = re.root_code
              AND d.empresa_id IS NULL
              AND re.empresas = 1
            """
        )
    )

    pk_name = inspector.get_pk_constraint("proyecto_detalles").get("name")
    if pk_name != "proyecto_detalles_pkey_id":
        if pk_name:
            op.drop_constraint(pk_name, "proyecto_detalles", type_="primary")
        op.alter_column("proyecto_detalles", "id", nullable=False)
        op.create_primary_key("proyecto_detalles_pkey_id", "proyecto_detalles", ["id"])
        inspector = sa.inspect(bind)

    if not _has_index(inspector, "proyecto_detalles", "ix_proyecto_detalles_id"):
        op.create_index("ix_proyecto_detalles_id", "proyecto_detalles", ["id"], unique=False)
        inspector = sa.inspect(bind)

    if not _has_index(inspector, "proyecto_detalles", "ix_proyecto_detalles_empresa_id"):
        op.create_index("ix_proyecto_detalles_empresa_id", "proyecto_detalles", ["empresa_id"], unique=False)
        inspector = sa.inspect(bind)

    if not _has_foreign_key(inspector, "proyecto_detalles", "fk_proyecto_detalles_empresa_id_empresas"):
        op.create_foreign_key(
            "fk_proyecto_detalles_empresa_id_empresas",
            "proyecto_detalles",
            "empresas",
            ["empresa_id"],
            ["id"],
            ondelete="CASCADE",
        )
        inspector = sa.inspect(bind)

    if not _has_index(inspector, "proyecto_detalles", "ux_proyecto_detalles_empresa_codigo_root"):
        op.create_index(
            "ux_proyecto_detalles_empresa_codigo_root",
            "proyecto_detalles",
            ["empresa_id", "codigo_root"],
            unique=True,
            postgresql_where=sa.text("empresa_id IS NOT NULL"),
        )


def downgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)

    if not _has_table(inspector, "proyecto_detalles"):
        return

    if _has_index(inspector, "proyecto_detalles", "ux_proyecto_detalles_empresa_codigo_root"):
        op.drop_index("ux_proyecto_detalles_empresa_codigo_root", table_name="proyecto_detalles")
        inspector = sa.inspect(bind)

    if _has_foreign_key(inspector, "proyecto_detalles", "fk_proyecto_detalles_empresa_id_empresas"):
        op.drop_constraint("fk_proyecto_detalles_empresa_id_empresas", "proyecto_detalles", type_="foreignkey")
        inspector = sa.inspect(bind)

    if _has_index(inspector, "proyecto_detalles", "ix_proyecto_detalles_empresa_id"):
        op.drop_index("ix_proyecto_detalles_empresa_id", table_name="proyecto_detalles")
        inspector = sa.inspect(bind)

    if _has_index(inspector, "proyecto_detalles", "ix_proyecto_detalles_id"):
        op.drop_index("ix_proyecto_detalles_id", table_name="proyecto_detalles")
        inspector = sa.inspect(bind)

    bind.execute(
        sa.text(
            """
            DELETE FROM proyecto_detalles a
            USING proyecto_detalles b
            WHERE a.codigo_root = b.codigo_root
              AND a.id > b.id
            """
        )
    )

    pk_name = inspector.get_pk_constraint("proyecto_detalles").get("name")
    if pk_name != "proyecto_detalles_pkey":
        if pk_name:
            op.drop_constraint(pk_name, "proyecto_detalles", type_="primary")
        op.create_primary_key("proyecto_detalles_pkey", "proyecto_detalles", ["codigo_root"])
        inspector = sa.inspect(bind)

    if _has_column(inspector, "proyecto_detalles", "empresa_id"):
        op.drop_column("proyecto_detalles", "empresa_id")
        inspector = sa.inspect(bind)

    if _has_column(inspector, "proyecto_detalles", "id"):
        bind.execute(sa.text("ALTER TABLE proyecto_detalles ALTER COLUMN id DROP DEFAULT"))
        op.drop_column("proyecto_detalles", "id")
        bind.execute(sa.text("DROP SEQUENCE IF EXISTS proyecto_detalles_id_seq"))
