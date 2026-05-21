"""marketplace category scopes

Revision ID: 7c1e4d2b9f10
Revises: 6e273af7f68e
Create Date: 2026-03-27 10:05:00.000000
"""

from alembic import op
import sqlalchemy as sa


revision = "7c1e4d2b9f10"
down_revision = "6e273af7f68e"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "marketplace_product_categories",
        sa.Column("visibility_scope", sa.String(length=20), nullable=False, server_default="all"),
    )
    op.create_index(
        op.f("ix_marketplace_product_categories_visibility_scope"),
        "marketplace_product_categories",
        ["visibility_scope"],
        unique=False,
    )
    op.execute("UPDATE marketplace_product_categories SET visibility_scope = 'all' WHERE visibility_scope IS NULL")
    op.alter_column("marketplace_product_categories", "visibility_scope", server_default=None)


def downgrade() -> None:
    op.drop_index(op.f("ix_marketplace_product_categories_visibility_scope"), table_name="marketplace_product_categories")
    op.drop_column("marketplace_product_categories", "visibility_scope")
