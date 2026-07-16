"""Add governed BIM cost estimates.

Revision ID: de2038a1b2c3
Revises: de2037a1b2c3
"""

from alembic import op
import sqlalchemy as sa


revision = "de2038a1b2c3"
down_revision = "de2037a1b2c3"
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "bim_cost_estimates",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("empresa_id", sa.Integer(), sa.ForeignKey("empresas.id", ondelete="CASCADE"), nullable=False),
        sa.Column("proyecto_id", sa.Integer(), sa.ForeignKey("proyectos.id", ondelete="CASCADE"), nullable=False),
        sa.Column("qto_snapshot_id", sa.Integer(), sa.ForeignKey("bim_qto_snapshots.id", ondelete="RESTRICT"), nullable=False),
        sa.Column("revision", sa.String(100), nullable=False),
        sa.Column("currency", sa.String(3), nullable=False),
        sa.Column("qto_checksum_sha256", sa.String(64), nullable=False),
        sa.Column("lines_json", sa.JSON(), nullable=False),
        sa.Column("subtotal", sa.Numeric(18, 2), nullable=False),
        sa.Column("status", sa.String(30), server_default="draft", nullable=False),
        sa.Column("decision_reason", sa.Text()),
        sa.Column("lock_version", sa.Integer(), server_default="1", nullable=False),
        sa.Column("created_by", sa.Integer(), sa.ForeignKey("usuarios.id", ondelete="SET NULL")),
        sa.Column("decided_by", sa.Integer(), sa.ForeignKey("usuarios.id", ondelete="SET NULL")),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("decided_at", sa.DateTime(timezone=True)),
        sa.CheckConstraint("subtotal >= 0", name="ck_bim_cost_estimate_subtotal"),
        sa.CheckConstraint("status IN ('draft', 'approved', 'rejected', 'superseded')", name="ck_bim_cost_estimate_status"),
        sa.UniqueConstraint("empresa_id", "proyecto_id", "revision", name="uq_bim_cost_estimate_revision"),
    )
    for column in ("empresa_id", "proyecto_id", "qto_snapshot_id", "status"):
        op.create_index(f"ix_bim_cost_estimates_{column}", "bim_cost_estimates", [column])
    op.create_index(
        "uq_bim_cost_estimate_active_approval", "bim_cost_estimates",
        ["empresa_id", "proyecto_id"], unique=True,
        postgresql_where=sa.text("status = 'approved'"),
    )


def downgrade():
    op.drop_table("bim_cost_estimates")
