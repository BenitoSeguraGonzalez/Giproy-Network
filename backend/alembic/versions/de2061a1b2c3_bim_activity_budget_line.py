"""Bind BIM 4D activity snapshots to their originating budget line."""

from alembic import op
import sqlalchemy as sa


revision = "de2061a1b2c3"
down_revision = "de2060a1b2c3"
branch_labels = None
depends_on = None


def upgrade():
    op.add_column("bim_4d_activity_snapshots", sa.Column("budget_line_id", sa.Integer(), nullable=True))
    op.create_index("ix_bim_4d_activity_snapshots_budget_line_id", "bim_4d_activity_snapshots", ["budget_line_id"])
    op.create_foreign_key(
        "fk_bim_4d_activity_snapshots_budget_line_id",
        "bim_4d_activity_snapshots",
        "presupuesto_detalles",
        ["budget_line_id"],
        ["id"],
        ondelete="SET NULL",
    )


def downgrade():
    op.drop_constraint("fk_bim_4d_activity_snapshots_budget_line_id", "bim_4d_activity_snapshots", type_="foreignkey")
    op.drop_index("ix_bim_4d_activity_snapshots_budget_line_id", table_name="bim_4d_activity_snapshots")
    op.drop_column("bim_4d_activity_snapshots", "budget_line_id")
