"""Add governed BIM actual cost ledger.

Revision ID: de2043a1b2c3
Revises: de2042a1b2c3
"""

from alembic import op
import sqlalchemy as sa


revision = "de2043a1b2c3"
down_revision = "de2042a1b2c3"
branch_labels = None
depends_on = None


def upgrade():
    op.add_column("bim_4d_field_reports", sa.Column("currency", sa.String(3), nullable=False, server_default="USD"))
    op.create_table(
        "bim_cost_actual_entries",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("empresa_id", sa.Integer(), sa.ForeignKey("empresas.id", ondelete="CASCADE"), nullable=False),
        sa.Column("proyecto_id", sa.Integer(), sa.ForeignKey("proyectos.id", ondelete="CASCADE"), nullable=False),
        sa.Column("field_report_id", sa.Integer(), sa.ForeignKey("bim_4d_field_reports.id", ondelete="RESTRICT"), nullable=False),
        sa.Column("activity_snapshot_id", sa.Integer(), sa.ForeignKey("bim_4d_activity_snapshots.id", ondelete="RESTRICT"), nullable=False),
        sa.Column("work_area_id", sa.Integer(), sa.ForeignKey("bim_4d_work_areas.id", ondelete="SET NULL")),
        sa.Column("occurred_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("currency", sa.String(3), nullable=False),
        sa.Column("cumulative_actual_cost", sa.Numeric(18, 2), nullable=False),
        sa.Column("incremental_actual_cost", sa.Numeric(18, 2), nullable=False),
        sa.Column("posted_by", sa.Integer(), sa.ForeignKey("usuarios.id", ondelete="SET NULL")),
        sa.Column("posted_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.CheckConstraint("cumulative_actual_cost >= 0", name="ck_bim_cost_actual_cumulative"),
        sa.CheckConstraint("incremental_actual_cost >= 0", name="ck_bim_cost_actual_incremental"),
        sa.UniqueConstraint("field_report_id", name="uq_bim_cost_actual_field_report"),
    )
    for column in ("empresa_id", "proyecto_id", "field_report_id", "activity_snapshot_id", "work_area_id", "occurred_at"):
        op.create_index(f"ix_bim_cost_actual_entries_{column}", "bim_cost_actual_entries", [column])


def downgrade():
    op.drop_table("bim_cost_actual_entries")
    op.drop_column("bim_4d_field_reports", "currency")
