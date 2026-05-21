"""add session expiration and activity fields

Revision ID: b9d1f3e5a2c4
Revises: f4c6d9b8a1e2
Create Date: 2026-03-14

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'b9d1f3e5a2c4'
down_revision = 'f4c6d9b8a1e2'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column('usuarios', sa.Column('current_session_expires_at', sa.DateTime(timezone=True), nullable=True))
    op.add_column('usuarios', sa.Column('last_active_at', sa.DateTime(timezone=True), nullable=True))


def downgrade() -> None:
    op.drop_column('usuarios', 'last_active_at')
    op.drop_column('usuarios', 'current_session_expires_at')
