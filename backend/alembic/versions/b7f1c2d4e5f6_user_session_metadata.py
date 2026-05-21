"""user session metadata

Revision ID: b7f1c2d4e5f6
Revises: a13e4f2c9d20
Create Date: 2026-03-12
"""

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'b7f1c2d4e5f6'
down_revision = 'a13e4f2c9d20'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column('usuarios', sa.Column('current_session_started_at', sa.DateTime(timezone=True), nullable=True))
    op.add_column('usuarios', sa.Column('current_session_device_id', sa.String(length=100), nullable=True))


def downgrade() -> None:
    op.drop_column('usuarios', 'current_session_device_id')
    op.drop_column('usuarios', 'current_session_started_at')
