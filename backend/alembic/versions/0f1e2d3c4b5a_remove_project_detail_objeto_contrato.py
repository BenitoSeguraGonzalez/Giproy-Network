"""remove project detail objeto contrato

Revision ID: 0f1e2d3c4b5a
Revises: ff5a6b7c8d9e
Create Date: 2026-04-25 11:20:00.000000
"""

from alembic import op
import sqlalchemy as sa


revision = "0f1e2d3c4b5a"
down_revision = "ff5a6b7c8d9e"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.drop_column("proyecto_detalles", "objeto_contrato")


def downgrade() -> None:
    op.add_column("proyecto_detalles", sa.Column("objeto_contrato", sa.Text(), nullable=True))
