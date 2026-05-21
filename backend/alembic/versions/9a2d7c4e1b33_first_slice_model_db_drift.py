"""first slice model db drift

Revision ID: 9a2d7c4e1b33
Revises: 5b7c9d1e2f3a
Create Date: 2026-03-22
"""

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "9a2d7c4e1b33"
down_revision = "5b7c9d1e2f3a"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("UPDATE apus SET revision = 0 WHERE revision IS NULL")
    op.execute("UPDATE recursos SET revision = 0 WHERE revision IS NULL")

    op.alter_column(
        "apus",
        "revision",
        existing_type=sa.Integer(),
        existing_server_default=sa.text("0"),
        nullable=False,
    )
    op.alter_column(
        "recursos",
        "revision",
        existing_type=sa.Integer(),
        existing_server_default=sa.text("0"),
        nullable=False,
    )

    op.create_index("ix_apus_omniclass_codigo", "apus", ["omniclass_codigo"], unique=False)
    op.create_index("ix_apus_revision", "apus", ["revision"], unique=False)
    op.create_index("ix_categorias_recursos_base_trabajo_id", "categorias_recursos", ["base_trabajo_id"], unique=False)
    op.create_index("ix_categorias_recursos_empresa_id", "categorias_recursos", ["empresa_id"], unique=False)
    op.create_index("ix_presupuesto_detalles_omniclass_codigo", "presupuesto_detalles", ["omniclass_codigo"], unique=False)
    op.create_index("ix_recursos_omniclass_codigo", "recursos", ["omniclass_codigo"], unique=False)
    op.create_index("ix_recursos_revision", "recursos", ["revision"], unique=False)
    op.create_index("ix_subcategorias_items_omniclass_codigo", "subcategorias_items", ["omniclass_codigo"], unique=False)

    op.drop_constraint("categorias_recursos_base_trabajo_id_fkey", "categorias_recursos", type_="foreignkey")
    op.drop_constraint("categorias_recursos_empresa_id_fkey", "categorias_recursos", type_="foreignkey")
    op.create_foreign_key(
        "categorias_recursos_base_trabajo_id_fkey",
        "categorias_recursos",
        "bases_trabajo",
        ["base_trabajo_id"],
        ["id"],
        ondelete="CASCADE",
    )
    op.create_foreign_key(
        "categorias_recursos_empresa_id_fkey",
        "categorias_recursos",
        "empresas",
        ["empresa_id"],
        ["id"],
        ondelete="CASCADE",
    )


def downgrade() -> None:
    op.drop_constraint("categorias_recursos_empresa_id_fkey", "categorias_recursos", type_="foreignkey")
    op.drop_constraint("categorias_recursos_base_trabajo_id_fkey", "categorias_recursos", type_="foreignkey")
    op.create_foreign_key(
        "categorias_recursos_empresa_id_fkey",
        "categorias_recursos",
        "empresas",
        ["empresa_id"],
        ["id"],
    )
    op.create_foreign_key(
        "categorias_recursos_base_trabajo_id_fkey",
        "categorias_recursos",
        "bases_trabajo",
        ["base_trabajo_id"],
        ["id"],
    )

    op.drop_index("ix_subcategorias_items_omniclass_codigo", table_name="subcategorias_items")
    op.drop_index("ix_recursos_revision", table_name="recursos")
    op.drop_index("ix_recursos_omniclass_codigo", table_name="recursos")
    op.drop_index("ix_presupuesto_detalles_omniclass_codigo", table_name="presupuesto_detalles")
    op.drop_index("ix_categorias_recursos_empresa_id", table_name="categorias_recursos")
    op.drop_index("ix_categorias_recursos_base_trabajo_id", table_name="categorias_recursos")
    op.drop_index("ix_apus_revision", table_name="apus")
    op.drop_index("ix_apus_omniclass_codigo", table_name="apus")

    op.alter_column(
        "recursos",
        "revision",
        existing_type=sa.Integer(),
        existing_server_default=sa.text("0"),
        nullable=True,
    )
    op.alter_column(
        "apus",
        "revision",
        existing_type=sa.Integer(),
        existing_server_default=sa.text("0"),
        nullable=True,
    )
