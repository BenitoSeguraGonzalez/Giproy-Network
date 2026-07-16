"""Add BIM cost payment applications and certification.

Revision ID: de2040a1b2c3
Revises: de2039a1b2c3
"""

from alembic import op
import sqlalchemy as sa


revision = "de2040a1b2c3"
down_revision = "de2039a1b2c3"
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "bim_cost_payment_applications",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("empresa_id", sa.Integer(), sa.ForeignKey("empresas.id", ondelete="CASCADE"), nullable=False),
        sa.Column("proyecto_id", sa.Integer(), sa.ForeignKey("proyectos.id", ondelete="CASCADE"), nullable=False),
        sa.Column("contract_id", sa.Integer(), sa.ForeignKey("bim_cost_contracts.id", ondelete="RESTRICT"), nullable=False),
        sa.Column("application_number", sa.String(100), nullable=False),
        sa.Column("period_start", sa.Date(), nullable=False),
        sa.Column("period_end", sa.Date(), nullable=False),
        sa.Column("currency", sa.String(3), nullable=False),
        sa.Column("gross_requested", sa.Numeric(18, 2), nullable=False),
        sa.Column("retention_requested", sa.Numeric(18, 2), nullable=False, server_default="0"),
        sa.Column("net_requested", sa.Numeric(18, 2), nullable=False),
        sa.Column("certified_gross", sa.Numeric(18, 2)),
        sa.Column("certified_retention", sa.Numeric(18, 2)),
        sa.Column("certified_net", sa.Numeric(18, 2)),
        sa.Column("status", sa.String(30), nullable=False, server_default="draft"),
        sa.Column("decision_reason", sa.Text()),
        sa.Column("lock_version", sa.Integer(), nullable=False, server_default="1"),
        sa.Column("created_by", sa.Integer(), sa.ForeignKey("usuarios.id", ondelete="SET NULL")),
        sa.Column("submitted_by", sa.Integer(), sa.ForeignKey("usuarios.id", ondelete="SET NULL")),
        sa.Column("decided_by", sa.Integer(), sa.ForeignKey("usuarios.id", ondelete="SET NULL")),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("submitted_at", sa.DateTime(timezone=True)),
        sa.Column("decided_at", sa.DateTime(timezone=True)),
        sa.CheckConstraint("period_end >= period_start", name="ck_bim_cost_payment_period"),
        sa.CheckConstraint("gross_requested > 0", name="ck_bim_cost_payment_gross"),
        sa.CheckConstraint("retention_requested >= 0 AND retention_requested <= gross_requested", name="ck_bim_cost_payment_retention"),
        sa.CheckConstraint("net_requested = gross_requested - retention_requested", name="ck_bim_cost_payment_net"),
        sa.CheckConstraint("certified_gross IS NULL OR (certified_gross > 0 AND certified_gross <= gross_requested)", name="ck_bim_cost_payment_certified_gross"),
        sa.CheckConstraint("certified_retention IS NULL OR (certified_retention >= 0 AND certified_retention <= certified_gross)", name="ck_bim_cost_payment_certified_retention"),
        sa.CheckConstraint("certified_net IS NULL OR certified_net = certified_gross - certified_retention", name="ck_bim_cost_payment_certified_net"),
        sa.CheckConstraint("status != 'certified' OR certified_gross IS NOT NULL", name="ck_bim_cost_payment_certified_state"),
        sa.CheckConstraint("status IN ('draft', 'submitted', 'certified', 'rejected')", name="ck_bim_cost_payment_status"),
        sa.UniqueConstraint("empresa_id", "proyecto_id", "contract_id", "application_number", name="uq_bim_cost_payment_application_number"),
    )
    for column in ("empresa_id", "proyecto_id", "contract_id", "status"):
        op.create_index(f"ix_bim_cost_payment_applications_{column}", "bim_cost_payment_applications", [column])


def downgrade():
    op.drop_table("bim_cost_payment_applications")
