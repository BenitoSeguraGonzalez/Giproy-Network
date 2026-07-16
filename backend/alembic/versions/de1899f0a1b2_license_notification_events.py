"""license notification events

Revision ID: de1899f0a1b2
Revises: cd1893e4f5a6
Create Date: 2026-06-09
"""

from alembic import op
import sqlalchemy as sa


revision = "de1899f0a1b2"
down_revision = "cd1893e4f5a6"
branch_labels = None
depends_on = None


def upgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    if "license_notification_events" in inspector.get_table_names():
        return

    op.create_table(
        "license_notification_events",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("empresa_id", sa.Integer(), nullable=False),
        sa.Column("empresa_licencia_id", sa.Integer(), nullable=True),
        sa.Column("licencia_id", sa.Integer(), nullable=True),
        sa.Column("recipient_usuario_id", sa.Integer(), nullable=True),
        sa.Column("notification_type", sa.String(length=80), nullable=False),
        sa.Column("channel", sa.String(length=30), nullable=False),
        sa.Column("recipient_email", sa.String(length=255), nullable=True),
        sa.Column("status", sa.String(length=30), server_default="pending", nullable=False),
        sa.Column("dedupe_key", sa.String(length=255), nullable=False),
        sa.Column("payload", sa.JSON(), nullable=True),
        sa.Column("scheduled_for", sa.DateTime(timezone=True), nullable=True),
        sa.Column("sent_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("acknowledged_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("last_error", sa.String(length=500), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["empresa_id"], ["empresas.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["empresa_licencia_id"], ["empresa_licencias.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["licencia_id"], ["licencias.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["recipient_usuario_id"], ["usuarios.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("dedupe_key", name="uq_license_notification_events_dedupe_key"),
    )
    op.create_index(op.f("ix_license_notification_events_id"), "license_notification_events", ["id"], unique=False)
    op.create_index(op.f("ix_license_notification_events_empresa_id"), "license_notification_events", ["empresa_id"], unique=False)
    op.create_index(op.f("ix_license_notification_events_empresa_licencia_id"), "license_notification_events", ["empresa_licencia_id"], unique=False)
    op.create_index(op.f("ix_license_notification_events_licencia_id"), "license_notification_events", ["licencia_id"], unique=False)
    op.create_index(op.f("ix_license_notification_events_recipient_usuario_id"), "license_notification_events", ["recipient_usuario_id"], unique=False)
    op.create_index(op.f("ix_license_notification_events_notification_type"), "license_notification_events", ["notification_type"], unique=False)
    op.create_index(op.f("ix_license_notification_events_channel"), "license_notification_events", ["channel"], unique=False)
    op.create_index(op.f("ix_license_notification_events_recipient_email"), "license_notification_events", ["recipient_email"], unique=False)
    op.create_index(op.f("ix_license_notification_events_status"), "license_notification_events", ["status"], unique=False)
    op.create_index(op.f("ix_license_notification_events_dedupe_key"), "license_notification_events", ["dedupe_key"], unique=False)
    op.create_index(op.f("ix_license_notification_events_scheduled_for"), "license_notification_events", ["scheduled_for"], unique=False)
    op.create_index(op.f("ix_license_notification_events_created_at"), "license_notification_events", ["created_at"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_license_notification_events_created_at"), table_name="license_notification_events")
    op.drop_index(op.f("ix_license_notification_events_scheduled_for"), table_name="license_notification_events")
    op.drop_index(op.f("ix_license_notification_events_dedupe_key"), table_name="license_notification_events")
    op.drop_index(op.f("ix_license_notification_events_status"), table_name="license_notification_events")
    op.drop_index(op.f("ix_license_notification_events_recipient_email"), table_name="license_notification_events")
    op.drop_index(op.f("ix_license_notification_events_channel"), table_name="license_notification_events")
    op.drop_index(op.f("ix_license_notification_events_notification_type"), table_name="license_notification_events")
    op.drop_index(op.f("ix_license_notification_events_recipient_usuario_id"), table_name="license_notification_events")
    op.drop_index(op.f("ix_license_notification_events_licencia_id"), table_name="license_notification_events")
    op.drop_index(op.f("ix_license_notification_events_empresa_licencia_id"), table_name="license_notification_events")
    op.drop_index(op.f("ix_license_notification_events_empresa_id"), table_name="license_notification_events")
    op.drop_index(op.f("ix_license_notification_events_id"), table_name="license_notification_events")
    op.drop_table("license_notification_events")
