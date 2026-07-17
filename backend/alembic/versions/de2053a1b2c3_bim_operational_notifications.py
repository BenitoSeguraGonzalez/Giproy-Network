"""Add tenant-aware BIM operational notification matrix."""
from alembic import op
import sqlalchemy as sa

revision = "de2053a1b2c3"
down_revision = "de2052a1b2c3"
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "bim_operational_notifications",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("empresa_id", sa.Integer(), sa.ForeignKey("empresas.id", ondelete="CASCADE"), nullable=False),
        sa.Column("proyecto_id", sa.Integer(), sa.ForeignKey("proyectos.id", ondelete="CASCADE"), nullable=False),
        sa.Column("usuario_id", sa.Integer(), sa.ForeignKey("usuarios.id", ondelete="CASCADE"), nullable=False),
        sa.Column("source_type", sa.String(length=30), nullable=False),
        sa.Column("source_id", sa.Integer(), nullable=False),
        sa.Column("source_number", sa.String(length=30), nullable=False),
        sa.Column("title", sa.String(length=500), nullable=False),
        sa.Column("event_type", sa.String(length=30), nullable=False),
        sa.Column("severity", sa.String(length=20), nullable=False),
        sa.Column("escalation_level", sa.Integer(), nullable=False),
        sa.Column("due_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("dedupe_key", sa.String(length=255), nullable=False),
        sa.Column("acknowledged_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("resolved_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.CheckConstraint("source_type IN ('rfi','submittal','review')", name="ck_bim_operational_notification_source"),
        sa.CheckConstraint("severity IN ('warning','high','critical')", name="ck_bim_operational_notification_severity"),
        sa.CheckConstraint("escalation_level IN (0,1,2)", name="ck_bim_operational_notification_level"),
        sa.UniqueConstraint("dedupe_key", name="uq_bim_operational_notification_dedupe"),
    )
    for column in ("id", "empresa_id", "proyecto_id", "usuario_id", "source_type", "source_id", "due_at", "acknowledged_at", "resolved_at"):
        op.create_index(f"ix_bim_operational_notifications_{column}", "bim_operational_notifications", [column])


def downgrade():
    op.drop_table("bim_operational_notifications")
