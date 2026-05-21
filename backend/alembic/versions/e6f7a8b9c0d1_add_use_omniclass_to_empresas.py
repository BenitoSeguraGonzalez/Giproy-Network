"""add use_omniclass to empresas

Revision ID: e6f7a8b9c0d1
Revises: c4d5e6f7a8b9
Create Date: 2026-03-22
"""

from alembic import op
import sqlalchemy as sa


revision = 'e6f7a8b9c0d1'
down_revision = 'c4d5e6f7a8b9'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column('empresas', sa.Column('use_omniclass', sa.Boolean(), nullable=False, server_default='1'))


def downgrade() -> None:
    op.drop_column('empresas', 'use_omniclass')
