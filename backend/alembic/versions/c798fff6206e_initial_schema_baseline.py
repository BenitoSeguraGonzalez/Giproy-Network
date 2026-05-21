"""initial_schema_baseline

Revision ID: c798fff6206e
Revises:
Create Date: 2026-03-11 14:37:32.428060
"""
from alembic import op


# revision identifiers, used by Alembic.
revision = "c798fff6206e"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Baseline no destructivo.
    # Esta revision representa el estado actual de la BD existente y debe
    # usarse con `alembic stamp head` antes de crear migraciones reales.
    pass


def downgrade() -> None:
    # Revision baseline; no hay operaciones reversibles.
    pass
