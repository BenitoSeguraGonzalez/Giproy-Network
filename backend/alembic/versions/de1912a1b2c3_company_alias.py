"""add company alias

Revision ID: de1912a1b2c3
Revises: de1908a1b2c3
Create Date: 2026-06-15 00:00:00.000000
"""

from alembic import op
import sqlalchemy as sa


revision = "de1912a1b2c3"
down_revision = "de1908a1b2c3"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("empresas", sa.Column("alias", sa.String(length=100), nullable=True))
    op.create_index(op.f("ix_empresas_alias"), "empresas", ["alias"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_empresas_alias"), table_name="empresas")
    op.drop_column("empresas", "alias")
