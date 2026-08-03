"""Add tamper-evident hashes to the structured audit ledger."""

from alembic import op
import sqlalchemy as sa


revision = "de2062a1b2c3"
down_revision = "de2061a1b2c3"
branch_labels = None
depends_on = None


def upgrade():
    op.add_column("system_audit_events", sa.Column("previous_hash", sa.String(length=64), nullable=True))
    op.add_column("system_audit_events", sa.Column("hash_nonce", sa.String(length=36), nullable=True))
    op.add_column("system_audit_events", sa.Column("event_hash", sa.String(length=64), nullable=True))
    op.create_index("ix_system_audit_events_event_hash", "system_audit_events", ["event_hash"], unique=True)


def downgrade():
    op.drop_index("ix_system_audit_events_event_hash", table_name="system_audit_events")
    op.drop_column("system_audit_events", "event_hash")
    op.drop_column("system_audit_events", "hash_nonce")
    op.drop_column("system_audit_events", "previous_hash")
