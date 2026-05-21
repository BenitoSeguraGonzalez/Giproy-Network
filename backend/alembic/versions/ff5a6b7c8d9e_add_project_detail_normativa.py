"""add project detail normativa aplicable

Revision ID: ff5a6b7c8d9e
Revises: fe4f5a6b7c8d
Create Date: 2026-04-24 21:30:00.000000
"""

from alembic import op
import sqlalchemy as sa


revision = "ff5a6b7c8d9e"
down_revision = "fe4f5a6b7c8d"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("proyecto_detalles", sa.Column("normativa_aplicable", sa.Text(), nullable=True))


def downgrade() -> None:
    op.drop_column("proyecto_detalles", "normativa_aplicable")
