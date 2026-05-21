"""system maintenance

Revision ID: c9d2e4f6a7b8
Revises: b7f1c2d4e5f6
Create Date: 2026-03-12
"""

from alembic import op
import sqlalchemy as sa


revision = 'c9d2e4f6a7b8'
down_revision = 'b7f1c2d4e5f6'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        'system_maintenance',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('titulo', sa.String(length=255), nullable=False),
        sa.Column('mensaje', sa.Text(), nullable=True),
        sa.Column('mode', sa.String(length=20), nullable=False),
        sa.Column('is_enabled', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('starts_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('ends_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('updated_by', sa.Integer(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['updated_by'], ['usuarios.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_system_maintenance_id'), 'system_maintenance', ['id'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_system_maintenance_id'), table_name='system_maintenance')
    op.drop_table('system_maintenance')
