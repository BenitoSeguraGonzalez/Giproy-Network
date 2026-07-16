"""Add BIM crew directory and timecards.

Revision ID: de2037a1b2c3
Revises: de2036a1b2c3
"""

from alembic import op
import sqlalchemy as sa


revision = "de2037a1b2c3"
down_revision = "de2036a1b2c3"
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "bim_4d_crews",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("empresa_id", sa.Integer(), sa.ForeignKey("empresas.id", ondelete="CASCADE"), nullable=False),
        sa.Column("proyecto_id", sa.Integer(), sa.ForeignKey("proyectos.id", ondelete="CASCADE"), nullable=False),
        sa.Column("code", sa.String(80), nullable=False),
        sa.Column("name", sa.String(180), nullable=False),
        sa.Column("trade", sa.String(120), nullable=False),
        sa.Column("member_count", sa.Integer(), nullable=False),
        sa.Column("active", sa.Boolean(), server_default=sa.true(), nullable=False),
        sa.Column("note", sa.Text(), nullable=False),
        sa.Column("created_by", sa.Integer(), sa.ForeignKey("usuarios.id", ondelete="SET NULL")),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.CheckConstraint("member_count > 0", name="ck_bim_4d_crew_member_count"),
        sa.UniqueConstraint("empresa_id", "proyecto_id", "code", name="uq_bim_4d_crew_code"),
    )
    for column in ("empresa_id", "proyecto_id", "trade", "active"):
        op.create_index(f"ix_bim_4d_crews_{column}", "bim_4d_crews", [column])

    op.create_table(
        "bim_4d_timecards",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("empresa_id", sa.Integer(), sa.ForeignKey("empresas.id", ondelete="CASCADE"), nullable=False),
        sa.Column("proyecto_id", sa.Integer(), sa.ForeignKey("proyectos.id", ondelete="CASCADE"), nullable=False),
        sa.Column("crew_id", sa.Integer(), sa.ForeignKey("bim_4d_crews.id", ondelete="RESTRICT"), nullable=False),
        sa.Column("activity_snapshot_id", sa.Integer(), sa.ForeignKey("bim_4d_activity_snapshots.id", ondelete="RESTRICT"), nullable=False),
        sa.Column("work_area_id", sa.Integer(), sa.ForeignKey("bim_4d_work_areas.id", ondelete="SET NULL")),
        sa.Column("work_date", sa.Date(), nullable=False),
        sa.Column("regular_hours", sa.Float(), nullable=False),
        sa.Column("overtime_hours", sa.Float(), nullable=False),
        sa.Column("installed_quantity", sa.Float(), nullable=False),
        sa.Column("installed_unit", sa.String(30), nullable=False),
        sa.Column("note", sa.Text(), nullable=False),
        sa.Column("created_by", sa.Integer(), sa.ForeignKey("usuarios.id", ondelete="SET NULL")),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.CheckConstraint("regular_hours >= 0", name="ck_bim_4d_timecard_regular_hours"),
        sa.CheckConstraint("overtime_hours >= 0", name="ck_bim_4d_timecard_overtime_hours"),
        sa.CheckConstraint("regular_hours + overtime_hours > 0", name="ck_bim_4d_timecard_total_hours_positive"),
        sa.CheckConstraint("regular_hours + overtime_hours <= 24", name="ck_bim_4d_timecard_total_hours_max"),
        sa.CheckConstraint("installed_quantity >= 0", name="ck_bim_4d_timecard_installed_quantity"),
        sa.UniqueConstraint("crew_id", "activity_snapshot_id", "work_date", name="uq_bim_4d_timecard_crew_activity_date"),
    )
    for column in ("empresa_id", "proyecto_id", "crew_id", "activity_snapshot_id", "work_area_id", "work_date"):
        op.create_index(f"ix_bim_4d_timecards_{column}", "bim_4d_timecards", [column])


def downgrade():
    op.drop_table("bim_4d_timecards")
    op.drop_table("bim_4d_crews")
