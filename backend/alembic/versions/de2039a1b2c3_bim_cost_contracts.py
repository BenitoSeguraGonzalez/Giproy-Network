"""Add governed BIM cost contracts.

Revision ID: de2039a1b2c3
Revises: de2038a1b2c3
"""

from alembic import op
import sqlalchemy as sa


revision = "de2039a1b2c3"
down_revision = "de2038a1b2c3"
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "bim_cost_contracts",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("empresa_id", sa.Integer(), sa.ForeignKey("empresas.id", ondelete="CASCADE"), nullable=False),
        sa.Column("proyecto_id", sa.Integer(), sa.ForeignKey("proyectos.id", ondelete="CASCADE"), nullable=False),
        sa.Column("estimate_id", sa.Integer(), sa.ForeignKey("bim_cost_estimates.id", ondelete="RESTRICT"), nullable=False),
        sa.Column("contract_number", sa.String(100), nullable=False),
        sa.Column("title", sa.String(255), nullable=False),
        sa.Column("counterparty_name", sa.String(255), nullable=False),
        sa.Column("currency", sa.String(3), nullable=False),
        sa.Column("committed_amount", sa.Numeric(18, 2), nullable=False),
        sa.Column("start_date", sa.Date(), nullable=False),
        sa.Column("end_date", sa.Date(), nullable=False),
        sa.Column("status", sa.String(30), server_default="draft", nullable=False),
        sa.Column("transition_reason", sa.Text()),
        sa.Column("lock_version", sa.Integer(), server_default="1", nullable=False),
        sa.Column("created_by", sa.Integer(), sa.ForeignKey("usuarios.id", ondelete="SET NULL")),
        sa.Column("transitioned_by", sa.Integer(), sa.ForeignKey("usuarios.id", ondelete="SET NULL")),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("transitioned_at", sa.DateTime(timezone=True)),
        sa.CheckConstraint("committed_amount > 0", name="ck_bim_cost_contract_amount"),
        sa.CheckConstraint("end_date >= start_date", name="ck_bim_cost_contract_period"),
        sa.CheckConstraint("status IN ('draft', 'active', 'closed', 'cancelled')", name="ck_bim_cost_contract_status"),
        sa.UniqueConstraint("empresa_id", "proyecto_id", "contract_number", name="uq_bim_cost_contract_number"),
    )
    for column in ("empresa_id", "proyecto_id", "estimate_id", "status"):
        op.create_index(f"ix_bim_cost_contracts_{column}", "bim_cost_contracts", [column])


def downgrade():
    op.drop_table("bim_cost_contracts")
