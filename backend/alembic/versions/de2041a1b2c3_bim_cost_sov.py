"""Add governed BIM Schedule of Values.

Revision ID: de2041a1b2c3
Revises: de2040a1b2c3
"""

from alembic import op
import sqlalchemy as sa


revision = "de2041a1b2c3"
down_revision = "de2040a1b2c3"
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "bim_cost_schedules_of_values",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("empresa_id", sa.Integer(), sa.ForeignKey("empresas.id", ondelete="CASCADE"), nullable=False),
        sa.Column("proyecto_id", sa.Integer(), sa.ForeignKey("proyectos.id", ondelete="CASCADE"), nullable=False),
        sa.Column("contract_id", sa.Integer(), sa.ForeignKey("bim_cost_contracts.id", ondelete="RESTRICT"), nullable=False),
        sa.Column("revision", sa.String(100), nullable=False),
        sa.Column("lines_json", sa.JSON(), nullable=False),
        sa.Column("total_scheduled_value", sa.Numeric(18, 2), nullable=False),
        sa.Column("status", sa.String(30), nullable=False, server_default="draft"),
        sa.Column("decision_reason", sa.Text()),
        sa.Column("lock_version", sa.Integer(), nullable=False, server_default="1"),
        sa.Column("created_by", sa.Integer(), sa.ForeignKey("usuarios.id", ondelete="SET NULL")),
        sa.Column("decided_by", sa.Integer(), sa.ForeignKey("usuarios.id", ondelete="SET NULL")),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("decided_at", sa.DateTime(timezone=True)),
        sa.CheckConstraint("total_scheduled_value > 0", name="ck_bim_cost_sov_total"),
        sa.CheckConstraint("status IN ('draft', 'approved', 'rejected', 'superseded')", name="ck_bim_cost_sov_status"),
        sa.UniqueConstraint("empresa_id", "proyecto_id", "contract_id", "revision", name="uq_bim_cost_sov_revision"),
    )
    for column in ("empresa_id", "proyecto_id", "contract_id", "status"):
        op.create_index(f"ix_bim_cost_schedules_of_values_{column}", "bim_cost_schedules_of_values", [column])
    op.create_index(
        "uq_bim_cost_sov_active_approval", "bim_cost_schedules_of_values",
        ["empresa_id", "proyecto_id", "contract_id"], unique=True,
        postgresql_where=sa.text("status = 'approved'"),
    )


def downgrade():
    op.drop_table("bim_cost_schedules_of_values")
