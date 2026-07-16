"""bim 4d immutable baselines and dependency snapshots

Revision ID: de2013a1b2c3
Revises: de2012a1b2c3
Create Date: 2026-07-11
"""
from alembic import op
import sqlalchemy as sa

revision = "de2013a1b2c3"
down_revision = "de2012a1b2c3"
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "bim_4d_baselines",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("empresa_id", sa.Integer(), nullable=False),
        sa.Column("proyecto_id", sa.Integer(), nullable=False),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("revision", sa.String(100), nullable=False),
        sa.Column("methodology", sa.String(100), nullable=False),
        sa.Column("created_by", sa.Integer()),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["empresa_id"], ["empresas.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["proyecto_id"], ["proyectos.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["created_by"], ["usuarios.id"], ondelete="SET NULL"),
        sa.UniqueConstraint("empresa_id", "proyecto_id", "revision", name="uq_bim_4d_baseline_revision"),
    )
    op.create_index("ix_bim_4d_baselines_company_project", "bim_4d_baselines", ["empresa_id", "proyecto_id"])
    op.create_table(
        "bim_4d_baseline_activities",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("baseline_id", sa.Integer(), nullable=False),
        sa.Column("activity_snapshot_id", sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(["baseline_id"], ["bim_4d_baselines.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["activity_snapshot_id"], ["bim_4d_activity_snapshots.id"], ondelete="RESTRICT"),
        sa.UniqueConstraint("baseline_id", "activity_snapshot_id", name="uq_bim_4d_baseline_activity"),
    )
    op.create_index("ix_bim_4d_baseline_activities_baseline", "bim_4d_baseline_activities", ["baseline_id"])
    op.create_table(
        "bim_4d_dependency_snapshots",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("baseline_id", sa.Integer(), nullable=False),
        sa.Column("predecessor_activity_id", sa.Integer(), nullable=False),
        sa.Column("successor_activity_id", sa.Integer(), nullable=False),
        sa.Column("dependency_type", sa.String(2), nullable=False),
        sa.Column("lag_days", sa.Float(), nullable=False),
        sa.ForeignKeyConstraint(["baseline_id"], ["bim_4d_baselines.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["predecessor_activity_id"], ["bim_4d_activity_snapshots.id"], ondelete="RESTRICT"),
        sa.ForeignKeyConstraint(["successor_activity_id"], ["bim_4d_activity_snapshots.id"], ondelete="RESTRICT"),
        sa.UniqueConstraint("baseline_id", "predecessor_activity_id", "successor_activity_id", "dependency_type", name="uq_bim_4d_baseline_dependency"),
    )
    op.create_index("ix_bim_4d_dependency_snapshots_baseline", "bim_4d_dependency_snapshots", ["baseline_id"])


def downgrade():
    op.drop_table("bim_4d_dependency_snapshots")
    op.drop_table("bim_4d_baseline_activities")
    op.drop_table("bim_4d_baselines")
