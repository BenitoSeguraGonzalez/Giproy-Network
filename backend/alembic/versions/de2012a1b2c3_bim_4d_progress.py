"""bim 4d progress snapshots

Revision ID: de2012a1b2c3
Revises: de2011a1b2c3
Create Date: 2026-07-11
"""
from alembic import op
import sqlalchemy as sa

revision = "de2012a1b2c3"
down_revision = "de2011a1b2c3"
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "bim_4d_progress_snapshots",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("empresa_id", sa.Integer(), nullable=False),
        sa.Column("proyecto_id", sa.Integer(), nullable=False),
        sa.Column("activity_snapshot_id", sa.Integer(), nullable=False),
        sa.Column("progress_percent", sa.Float(), nullable=False),
        sa.Column("actual_start", sa.DateTime(timezone=True)),
        sa.Column("actual_finish", sa.DateTime(timezone=True)),
        sa.Column("note", sa.Text()),
        sa.Column("reported_by", sa.Integer()),
        sa.Column("reported_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["empresa_id"], ["empresas.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["proyecto_id"], ["proyectos.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["activity_snapshot_id"], ["bim_4d_activity_snapshots.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["reported_by"], ["usuarios.id"], ondelete="SET NULL"),
    )
    op.create_index("ix_bim_4d_progress_company_project_activity", "bim_4d_progress_snapshots", ["empresa_id", "proyecto_id", "activity_snapshot_id"])


def downgrade():
    op.drop_table("bim_4d_progress_snapshots")
