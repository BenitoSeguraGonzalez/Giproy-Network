"""Add governed BIM integration gateway subscriptions and outbox."""
from alembic import op
import sqlalchemy as sa

revision = "de2056a1b2c3"
down_revision = "de2055a1b2c3"
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "bim_integration_subscriptions",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("empresa_id", sa.Integer(), sa.ForeignKey("empresas.id", ondelete="CASCADE"), nullable=False),
        sa.Column("proyecto_id", sa.Integer(), sa.ForeignKey("proyectos.id", ondelete="CASCADE"), nullable=False),
        sa.Column("label", sa.String(length=120), nullable=False),
        sa.Column("target_url", sa.String(length=2048), nullable=False),
        sa.Column("event_types_json", sa.JSON(), nullable=False),
        sa.Column("encrypted_secret", sa.Text(), nullable=False),
        sa.Column("secret_hint", sa.String(length=12), nullable=False),
        sa.Column("status", sa.String(length=20), nullable=False),
        sa.Column("lock_version", sa.Integer(), nullable=False),
        sa.Column("created_by", sa.Integer(), sa.ForeignKey("usuarios.id", ondelete="SET NULL"), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.CheckConstraint("status IN ('active','disabled')", name="ck_bim_integration_subscription_status"),
        sa.UniqueConstraint("empresa_id", "proyecto_id", "target_url", name="uq_bim_integration_subscription_target"),
    )
    op.create_table(
        "bim_integration_deliveries",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("empresa_id", sa.Integer(), sa.ForeignKey("empresas.id", ondelete="CASCADE"), nullable=False),
        sa.Column("proyecto_id", sa.Integer(), sa.ForeignKey("proyectos.id", ondelete="CASCADE"), nullable=False),
        sa.Column("subscription_id", sa.Integer(), sa.ForeignKey("bim_integration_subscriptions.id", ondelete="CASCADE"), nullable=False),
        sa.Column("event_id", sa.String(length=64), nullable=False),
        sa.Column("event_type", sa.String(length=80), nullable=False),
        sa.Column("event_key", sa.String(length=180), nullable=False),
        sa.Column("payload_json", sa.JSON(), nullable=False),
        sa.Column("payload_checksum_sha256", sa.String(length=64), nullable=False),
        sa.Column("status", sa.String(length=20), nullable=False),
        sa.Column("attempt_count", sa.Integer(), nullable=False),
        sa.Column("max_attempts", sa.Integer(), nullable=False),
        sa.Column("next_attempt_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("last_http_status", sa.Integer(), nullable=True),
        sa.Column("last_error_code", sa.String(length=80), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("delivered_at", sa.DateTime(timezone=True), nullable=True),
        sa.CheckConstraint("status IN ('pending','delivering','retry','delivered','dead')", name="ck_bim_integration_delivery_status"),
        sa.UniqueConstraint("subscription_id", "event_key", name="uq_bim_integration_delivery_event"),
    )
    for column in ("id", "empresa_id", "proyecto_id", "status"):
        op.create_index(f"ix_bim_integration_subscriptions_{column}", "bim_integration_subscriptions", [column])
    for column in ("id", "empresa_id", "proyecto_id", "subscription_id", "event_id", "event_type", "status", "next_attempt_at"):
        op.create_index(f"ix_bim_integration_deliveries_{column}", "bim_integration_deliveries", [column])


def downgrade():
    op.drop_table("bim_integration_deliveries")
    op.drop_table("bim_integration_subscriptions")
