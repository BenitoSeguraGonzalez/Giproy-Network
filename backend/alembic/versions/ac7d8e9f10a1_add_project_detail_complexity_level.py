"""add project detail complexity level

Revision ID: ac7d8e9f10a1
Revises: ab6c7d8e9f10
Create Date: 2026-05-07
"""

from alembic import op
import sqlalchemy as sa


revision = "ac7d8e9f10a1"
down_revision = "ab6c7d8e9f10"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("proyecto_detalles", sa.Column("nivel_complejidad", sa.String(length=50), nullable=True))


def downgrade() -> None:
    op.drop_column("proyecto_detalles", "nivel_complejidad")
