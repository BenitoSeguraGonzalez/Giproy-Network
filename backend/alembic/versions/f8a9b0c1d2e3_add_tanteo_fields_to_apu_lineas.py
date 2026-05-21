"""add tanteo fields to apu_lineas

Revision ID: f8a9b0c1d2e3
Revises: f7a8b9c0d1e2
Create Date: 2026-03-22
"""

from alembic import op
import sqlalchemy as sa


revision = 'f8a9b0c1d2e3'
down_revision = 'f7a8b9c0d1e2'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column('apu_lineas', sa.Column('tanteo_activo', sa.Boolean(), nullable=False, server_default='0'))
    op.add_column('apu_lineas', sa.Column('rendimiento_original', sa.DECIMAL(15, 6), nullable=True))
    op.add_column('apu_lineas', sa.Column('rendimiento_tanteo', sa.DECIMAL(15, 6), nullable=True))


def downgrade() -> None:
    op.drop_column('apu_lineas', 'rendimiento_tanteo')
    op.drop_column('apu_lineas', 'rendimiento_original')
    op.drop_column('apu_lineas', 'tanteo_activo')
