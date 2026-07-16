"""bim unplanned events with real cost and schedule impact"""

from alembic import op
import sqlalchemy as sa


revision = "de2035a1b2c3"
down_revision = "de2034a1b2c3"
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "bim_4d_unplanned_events",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("empresa_id", sa.Integer(), sa.ForeignKey("empresas.id", ondelete="CASCADE"), nullable=False),
        sa.Column("proyecto_id", sa.Integer(), sa.ForeignKey("proyectos.id", ondelete="CASCADE"), nullable=False),
        sa.Column("activity_snapshot_id", sa.Integer(), sa.ForeignKey("bim_4d_activity_snapshots.id", ondelete="RESTRICT"), nullable=False),
        sa.Column("work_area_id", sa.Integer(), sa.ForeignKey("bim_4d_work_areas.id", ondelete="SET NULL")),
        sa.Column("event_type", sa.String(30), nullable=False),
        sa.Column("title", sa.String(255), nullable=False),
        sa.Column("description", sa.Text(), nullable=False),
        sa.Column("occurred_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("delay_days", sa.Float(), nullable=False, server_default="0"),
        sa.Column("actual_cost", sa.Float(), nullable=False, server_default="0"),
        sa.Column("status", sa.String(20), nullable=False, server_default="reported"),
        sa.Column("decision_reason", sa.Text()),
        sa.Column("created_by", sa.Integer(), sa.ForeignKey("usuarios.id", ondelete="SET NULL")),
        sa.Column("decided_by", sa.Integer(), sa.ForeignKey("usuarios.id", ondelete="SET NULL")),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("decided_at", sa.DateTime(timezone=True)),
    )
    for column in ("empresa_id", "proyecto_id", "activity_snapshot_id", "work_area_id", "status", "occurred_at"):
        op.create_index(f"ix_bim_4d_unplanned_events_{column}", "bim_4d_unplanned_events", [column])


def downgrade():
    op.drop_table("bim_4d_unplanned_events")
