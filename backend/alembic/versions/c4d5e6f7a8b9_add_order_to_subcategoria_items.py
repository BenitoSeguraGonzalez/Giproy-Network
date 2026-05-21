"""add order to subcategoria items

Revision ID: c4d5e6f7a8b9
Revises: b1c4d6e8f9a0
Create Date: 2026-03-22
"""

from alembic import op
import sqlalchemy as sa


revision = "c4d5e6f7a8b9"
down_revision = "b1c4d6e8f9a0"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "subcategorias_items",
        sa.Column("orden", sa.Integer(), nullable=False, server_default="0"),
    )
    op.create_index(op.f("ix_subcategorias_items_orden"), "subcategorias_items", ["orden"], unique=False)

    op.execute(
        """
        WITH ranked AS (
            SELECT id,
                   ROW_NUMBER() OVER (
                       PARTITION BY base_trabajo_id, empresa_id, subcategoria_codigo
                       ORDER BY codigo ASC, id ASC
                   ) - 1 AS new_order
            FROM subcategorias_items
        )
        UPDATE subcategorias_items AS target
        SET orden = ranked.new_order
        FROM ranked
        WHERE target.id = ranked.id
        """
    )

    op.alter_column("subcategorias_items", "orden", server_default=None)


def downgrade() -> None:
    op.drop_index(op.f("ix_subcategorias_items_orden"), table_name="subcategorias_items")
    op.drop_column("subcategorias_items", "orden")
