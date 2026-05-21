"""backfill project currency usd

Revision ID: ac8d9e0f1a2b
Revises: ab7c8d9e0f1a
Create Date: 2026-04-24 00:00:00.000000
"""

from alembic import op


revision = "ac8d9e0f1a2b"
down_revision = "ab7c8d9e0f1a"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("UPDATE proyectos SET moneda = 'USD' WHERE moneda IS NULL OR TRIM(moneda) = ''")
    op.execute("UPDATE proyecto_detalles SET moneda = 'USD' WHERE moneda IS NULL OR TRIM(moneda) = ''")


def downgrade() -> None:
    pass
