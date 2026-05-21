"""company license window

Revision ID: e1f2a3b4c5d6
Revises: d4e8f1a2b3c4
Create Date: 2026-03-12
"""

from alembic import op
import sqlalchemy as sa


revision = "e1f2a3b4c5d6"
down_revision = "d4e8f1a2b3c4"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("empresas", sa.Column("license_start_date", sa.Date(), nullable=True))
    op.add_column("empresas", sa.Column("license_end_date", sa.Date(), nullable=True))

    op.execute(
        """
        UPDATE empresas
        SET license_start_date = DATE '2026-03-01',
            license_end_date = DATE '2027-03-01'
        WHERE license_start_date IS NULL
           OR license_end_date IS NULL
        """
    )

    op.alter_column("empresas", "license_start_date", nullable=False)
    op.alter_column("empresas", "license_end_date", nullable=False)


def downgrade() -> None:
    op.drop_column("empresas", "license_end_date")
    op.drop_column("empresas", "license_start_date")
