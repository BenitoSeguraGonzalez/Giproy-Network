"""Add BIM potential and approved change orders.

Revision ID: de2042a1b2c3
Revises: de2041a1b2c3
"""

from alembic import op
import sqlalchemy as sa


revision = "de2042a1b2c3"
down_revision = "de2041a1b2c3"
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "bim_cost_change_orders",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("empresa_id", sa.Integer(), sa.ForeignKey("empresas.id", ondelete="CASCADE"), nullable=False),
        sa.Column("proyecto_id", sa.Integer(), sa.ForeignKey("proyectos.id", ondelete="CASCADE"), nullable=False),
        sa.Column("contract_id", sa.Integer(), sa.ForeignKey("bim_cost_contracts.id", ondelete="RESTRICT"), nullable=False),
        sa.Column("change_number", sa.String(100), nullable=False),
        sa.Column("title", sa.String(255), nullable=False),
        sa.Column("description", sa.Text(), nullable=False),
        sa.Column("currency", sa.String(3), nullable=False),
        sa.Column("requested_cost_delta", sa.Numeric(18, 2), nullable=False),
        sa.Column("requested_schedule_days", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("approved_cost_delta", sa.Numeric(18, 2)),
        sa.Column("approved_schedule_days", sa.Integer()),
        sa.Column("contract_amount_before", sa.Numeric(18, 2)),
        sa.Column("contract_amount_after", sa.Numeric(18, 2)),
        sa.Column("status", sa.String(30), nullable=False, server_default="potential"),
        sa.Column("transition_reason", sa.Text()),
        sa.Column("decision_reason", sa.Text()),
        sa.Column("lock_version", sa.Integer(), nullable=False, server_default="1"),
        sa.Column("created_by", sa.Integer(), sa.ForeignKey("usuarios.id", ondelete="SET NULL")),
        sa.Column("submitted_by", sa.Integer(), sa.ForeignKey("usuarios.id", ondelete="SET NULL")),
        sa.Column("decided_by", sa.Integer(), sa.ForeignKey("usuarios.id", ondelete="SET NULL")),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("submitted_at", sa.DateTime(timezone=True)),
        sa.Column("decided_at", sa.DateTime(timezone=True)),
        sa.CheckConstraint("requested_cost_delta != 0 OR requested_schedule_days != 0", name="ck_bim_cost_change_requested_impact"),
        sa.CheckConstraint("status IN ('potential', 'submitted', 'approved', 'rejected', 'cancelled')", name="ck_bim_cost_change_status"),
        sa.CheckConstraint("status != 'approved' OR contract_amount_after > 0", name="ck_bim_cost_change_approved_amount"),
        sa.UniqueConstraint("empresa_id", "proyecto_id", "contract_id", "change_number", name="uq_bim_cost_change_order_number"),
    )
    for column in ("empresa_id", "proyecto_id", "contract_id", "status"):
        op.create_index(f"ix_bim_cost_change_orders_{column}", "bim_cost_change_orders", [column])


def downgrade():
    op.drop_table("bim_cost_change_orders")
