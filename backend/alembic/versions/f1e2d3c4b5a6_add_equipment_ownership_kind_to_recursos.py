"""add equipment ownership kind to recursos

Revision ID: f1e2d3c4b5a6
Revises: c2d4e6f8a0b1
Create Date: 2026-04-11 10:30:00.000000
"""

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "f1e2d3c4b5a6"
down_revision = "c2d4e6f8a0b1"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("recursos", sa.Column("equipment_ownership_kind", sa.String(length=20), nullable=True))
    op.create_index(op.f("ix_recursos_equipment_ownership_kind"), "recursos", ["equipment_ownership_kind"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_recursos_equipment_ownership_kind"), table_name="recursos")
    op.drop_column("recursos", "equipment_ownership_kind")
