"""structured audit events

Revision ID: d4e8f1a2b3c4
Revises: c9d2e4f6a7b8
Create Date: 2026-03-12
"""

from alembic import op
import sqlalchemy as sa


revision = 'd4e8f1a2b3c4'
down_revision = 'c9d2e4f6a7b8'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        'system_audit_events',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('actor_user_id', sa.Integer(), nullable=True),
        sa.Column('actor_email', sa.String(length=255), nullable=True),
        sa.Column('actor_role', sa.String(length=100), nullable=True),
        sa.Column('empresa_id', sa.Integer(), nullable=True),
        sa.Column('target_user_id', sa.Integer(), nullable=True),
        sa.Column('target_empresa_id', sa.Integer(), nullable=True),
        sa.Column('module', sa.String(length=100), nullable=False),
        sa.Column('event_type', sa.String(length=100), nullable=False),
        sa.Column('severity', sa.String(length=20), nullable=False, server_default='info'),
        sa.Column('entity_type', sa.String(length=100), nullable=True),
        sa.Column('entity_id', sa.String(length=100), nullable=True),
        sa.Column('message', sa.Text(), nullable=False),
        sa.Column('payload_json', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['actor_user_id'], ['usuarios.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['empresa_id'], ['empresas.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['target_empresa_id'], ['empresas.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['target_user_id'], ['usuarios.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_system_audit_events_id'), 'system_audit_events', ['id'], unique=False)
    op.create_index(op.f('ix_system_audit_events_actor_user_id'), 'system_audit_events', ['actor_user_id'], unique=False)
    op.create_index(op.f('ix_system_audit_events_actor_email'), 'system_audit_events', ['actor_email'], unique=False)
    op.create_index(op.f('ix_system_audit_events_empresa_id'), 'system_audit_events', ['empresa_id'], unique=False)
    op.create_index(op.f('ix_system_audit_events_target_user_id'), 'system_audit_events', ['target_user_id'], unique=False)
    op.create_index(op.f('ix_system_audit_events_target_empresa_id'), 'system_audit_events', ['target_empresa_id'], unique=False)
    op.create_index(op.f('ix_system_audit_events_module'), 'system_audit_events', ['module'], unique=False)
    op.create_index(op.f('ix_system_audit_events_event_type'), 'system_audit_events', ['event_type'], unique=False)
    op.create_index(op.f('ix_system_audit_events_severity'), 'system_audit_events', ['severity'], unique=False)
    op.create_index(op.f('ix_system_audit_events_entity_type'), 'system_audit_events', ['entity_type'], unique=False)
    op.create_index(op.f('ix_system_audit_events_entity_id'), 'system_audit_events', ['entity_id'], unique=False)
    op.create_index(op.f('ix_system_audit_events_created_at'), 'system_audit_events', ['created_at'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_system_audit_events_created_at'), table_name='system_audit_events')
    op.drop_index(op.f('ix_system_audit_events_entity_id'), table_name='system_audit_events')
    op.drop_index(op.f('ix_system_audit_events_entity_type'), table_name='system_audit_events')
    op.drop_index(op.f('ix_system_audit_events_severity'), table_name='system_audit_events')
    op.drop_index(op.f('ix_system_audit_events_event_type'), table_name='system_audit_events')
    op.drop_index(op.f('ix_system_audit_events_module'), table_name='system_audit_events')
    op.drop_index(op.f('ix_system_audit_events_target_empresa_id'), table_name='system_audit_events')
    op.drop_index(op.f('ix_system_audit_events_target_user_id'), table_name='system_audit_events')
    op.drop_index(op.f('ix_system_audit_events_empresa_id'), table_name='system_audit_events')
    op.drop_index(op.f('ix_system_audit_events_actor_email'), table_name='system_audit_events')
    op.drop_index(op.f('ix_system_audit_events_actor_user_id'), table_name='system_audit_events')
    op.drop_index(op.f('ix_system_audit_events_id'), table_name='system_audit_events')
    op.drop_table('system_audit_events')
