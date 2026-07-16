"""bim 4d field reports evidence and earned value

Revision ID: de2016a1b2c3
Revises: de2015a1b2c3
Create Date: 2026-07-11
"""
from alembic import op
import sqlalchemy as sa

revision = "de2016a1b2c3"
down_revision = "de2015a1b2c3"
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "bim_4d_field_reports",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("empresa_id", sa.Integer(), nullable=False),
        sa.Column("proyecto_id", sa.Integer(), nullable=False),
        sa.Column("activity_snapshot_id", sa.Integer(), nullable=False),
        sa.Column("progress_snapshot_id", sa.Integer(), nullable=False, unique=True),
        sa.Column("work_area_id", sa.Integer()),
        sa.Column("reported_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("progress_percent", sa.Float(), nullable=False),
        sa.Column("installed_quantity", sa.Float(), nullable=False),
        sa.Column("installed_unit", sa.String(30), nullable=False),
        sa.Column("labor_hours", sa.Float(), nullable=False),
        sa.Column("equipment_hours", sa.Float(), nullable=False),
        sa.Column("budget_at_completion", sa.Float(), nullable=False),
        sa.Column("planned_value_to_date", sa.Float(), nullable=False),
        sa.Column("earned_value", sa.Float(), nullable=False),
        sa.Column("actual_cost", sa.Float(), nullable=False),
        sa.Column("schedule_performance_index", sa.Float()),
        sa.Column("cost_performance_index", sa.Float()),
        sa.Column("daily_log", sa.Text(), nullable=False),
        sa.Column("created_by", sa.Integer()),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["empresa_id"], ["empresas.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["proyecto_id"], ["proyectos.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["activity_snapshot_id"], ["bim_4d_activity_snapshots.id"], ondelete="RESTRICT"),
        sa.ForeignKeyConstraint(["progress_snapshot_id"], ["bim_4d_progress_snapshots.id"], ondelete="RESTRICT"),
        sa.ForeignKeyConstraint(["work_area_id"], ["bim_4d_work_areas.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["created_by"], ["usuarios.id"], ondelete="SET NULL"),
    )
    op.create_index("ix_bim_4d_field_reports_company_project_activity", "bim_4d_field_reports", ["empresa_id", "proyecto_id", "activity_snapshot_id"])
    op.create_table(
        "bim_4d_field_evidence",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("field_report_id", sa.Integer(), nullable=False),
        sa.Column("filename", sa.String(255), nullable=False),
        sa.Column("content_type", sa.String(100), nullable=False),
        sa.Column("byte_size", sa.Integer(), nullable=False),
        sa.Column("checksum_sha256", sa.String(64), nullable=False),
        sa.Column("content", sa.LargeBinary(), nullable=False),
        sa.Column("uploaded_by", sa.Integer()),
        sa.Column("uploaded_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["field_report_id"], ["bim_4d_field_reports.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["uploaded_by"], ["usuarios.id"], ondelete="SET NULL"),
        sa.UniqueConstraint("field_report_id", "checksum_sha256", name="uq_bim_4d_field_evidence_checksum"),
    )
    op.create_index("ix_bim_4d_field_evidence_report", "bim_4d_field_evidence", ["field_report_id"])


def downgrade():
    op.drop_table("bim_4d_field_evidence")
    op.drop_table("bim_4d_field_reports")
