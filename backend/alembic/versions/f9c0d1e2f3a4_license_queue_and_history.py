"""license queue and history foundation

Revision ID: f9c0d1e2f3a4
Revises: f8a9b0c1d2e3
Create Date: 2026-04-01
"""

from alembic import op
import sqlalchemy as sa


revision = "f9c0d1e2f3a4"
down_revision = "f8a9b0c1d2e3"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("licencias", sa.Column("plan_kind", sa.String(length=50), nullable=True))
    op.add_column("licencias", sa.Column("precio_mensual", sa.Numeric(10, 2), nullable=True))
    op.add_column("licencias", sa.Column("precio_anual", sa.Numeric(10, 2), nullable=True))
    op.add_column("licencias", sa.Column("sort_order", sa.Integer(), nullable=False, server_default="0"))
    op.add_column("licencias", sa.Column("is_default_express", sa.Boolean(), nullable=False, server_default="0"))
    op.create_index(op.f("ix_licencias_plan_kind"), "licencias", ["plan_kind"], unique=False)
    op.alter_column("licencias", "sort_order", server_default=None)
    op.alter_column("licencias", "is_default_express", server_default=None)

    op.add_column("empresa_licencias", sa.Column("status", sa.String(length=30), nullable=False, server_default="active"))
    op.add_column("empresa_licencias", sa.Column("source", sa.String(length=30), nullable=False, server_default="manual_admin"))
    op.add_column("empresa_licencias", sa.Column("activated_at", sa.DateTime(timezone=True), nullable=True))
    op.add_column("empresa_licencias", sa.Column("payment_confirmed_at", sa.DateTime(timezone=True), nullable=True))
    op.add_column("empresa_licencias", sa.Column("expired_at", sa.DateTime(timezone=True), nullable=True))
    op.add_column("empresa_licencias", sa.Column("grace_ends_at", sa.Date(), nullable=True))
    op.add_column("empresa_licencias", sa.Column("queued_from_assignment_id", sa.Integer(), nullable=True))
    op.add_column("empresa_licencias", sa.Column("read_only_mode", sa.Boolean(), nullable=False, server_default="0"))
    op.add_column("empresa_licencias", sa.Column("detalles", sa.JSON(), nullable=True))
    op.create_index(op.f("ix_empresa_licencias_status"), "empresa_licencias", ["status"], unique=False)
    op.create_foreign_key(
        "fk_empresa_licencias_queued_from_assignment_id",
        "empresa_licencias",
        "empresa_licencias",
        ["queued_from_assignment_id"],
        ["id"],
    )
    op.alter_column("empresa_licencias", "status", server_default=None)
    op.alter_column("empresa_licencias", "source", server_default=None)
    op.alter_column("empresa_licencias", "read_only_mode", server_default=None)

    op.create_table(
        "license_events",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("empresa_id", sa.Integer(), nullable=False),
        sa.Column("empresa_licencia_id", sa.Integer(), nullable=True),
        sa.Column("licencia_id", sa.Integer(), nullable=True),
        sa.Column("actor_usuario_id", sa.Integer(), nullable=True),
        sa.Column("event_type", sa.String(length=60), nullable=False),
        sa.Column("notes", sa.String(length=500), nullable=True),
        sa.Column("payload", sa.JSON(), nullable=True),
        sa.Column("occurred_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
        sa.ForeignKeyConstraint(["actor_usuario_id"], ["usuarios.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["empresa_id"], ["empresas.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["empresa_licencia_id"], ["empresa_licencias.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["licencia_id"], ["licencias.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_license_events_id"), "license_events", ["id"], unique=False)
    op.create_index(op.f("ix_license_events_empresa_id"), "license_events", ["empresa_id"], unique=False)
    op.create_index(op.f("ix_license_events_empresa_licencia_id"), "license_events", ["empresa_licencia_id"], unique=False)
    op.create_index(op.f("ix_license_events_licencia_id"), "license_events", ["licencia_id"], unique=False)
    op.create_index(op.f("ix_license_events_actor_usuario_id"), "license_events", ["actor_usuario_id"], unique=False)
    op.create_index(op.f("ix_license_events_event_type"), "license_events", ["event_type"], unique=False)
    op.create_index(op.f("ix_license_events_occurred_at"), "license_events", ["occurred_at"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_license_events_occurred_at"), table_name="license_events")
    op.drop_index(op.f("ix_license_events_event_type"), table_name="license_events")
    op.drop_index(op.f("ix_license_events_actor_usuario_id"), table_name="license_events")
    op.drop_index(op.f("ix_license_events_licencia_id"), table_name="license_events")
    op.drop_index(op.f("ix_license_events_empresa_licencia_id"), table_name="license_events")
    op.drop_index(op.f("ix_license_events_empresa_id"), table_name="license_events")
    op.drop_index(op.f("ix_license_events_id"), table_name="license_events")
    op.drop_table("license_events")

    op.drop_constraint("fk_empresa_licencias_queued_from_assignment_id", "empresa_licencias", type_="foreignkey")
    op.drop_index(op.f("ix_empresa_licencias_status"), table_name="empresa_licencias")
    op.drop_column("empresa_licencias", "detalles")
    op.drop_column("empresa_licencias", "read_only_mode")
    op.drop_column("empresa_licencias", "queued_from_assignment_id")
    op.drop_column("empresa_licencias", "grace_ends_at")
    op.drop_column("empresa_licencias", "expired_at")
    op.drop_column("empresa_licencias", "payment_confirmed_at")
    op.drop_column("empresa_licencias", "activated_at")
    op.drop_column("empresa_licencias", "source")
    op.drop_column("empresa_licencias", "status")

    op.drop_index(op.f("ix_licencias_plan_kind"), table_name="licencias")
    op.drop_column("licencias", "is_default_express")
    op.drop_column("licencias", "sort_order")
    op.drop_column("licencias", "precio_anual")
    op.drop_column("licencias", "precio_mensual")
    op.drop_column("licencias", "plan_kind")
