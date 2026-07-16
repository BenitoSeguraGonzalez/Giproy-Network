"""bim bcf issues

Revision ID: de2007a1b2c3
Revises: de2006a1b2c3
Create Date: 2026-07-11
"""
from alembic import op
import sqlalchemy as sa

revision = "de2007a1b2c3"
down_revision = "de2006a1b2c3"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table("bim_issues", sa.Column("id", sa.Integer(), primary_key=True), sa.Column("topic_guid", sa.String(36), nullable=False), sa.Column("proyecto_id", sa.Integer(), nullable=False), sa.Column("empresa_id", sa.Integer(), nullable=False), sa.Column("bim_model_version_id", sa.Integer()), sa.Column("title", sa.String(255), nullable=False), sa.Column("description", sa.Text()), sa.Column("priority", sa.String(30), nullable=False), sa.Column("status", sa.String(30), nullable=False), sa.Column("assigned_to", sa.Integer()), sa.Column("created_by", sa.Integer()), sa.Column("viewpoint_json", sa.JSON(), nullable=False), sa.Column("snapshot_path", sa.String(500)), sa.Column("fecha_creacion", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False), sa.Column("fecha_actualizacion", sa.DateTime(timezone=True)), sa.ForeignKeyConstraint(["proyecto_id"], ["proyectos.id"], ondelete="CASCADE"), sa.ForeignKeyConstraint(["empresa_id"], ["empresas.id"], ondelete="CASCADE"), sa.ForeignKeyConstraint(["bim_model_version_id"], ["bim_model_versions.id"], ondelete="SET NULL"), sa.ForeignKeyConstraint(["assigned_to"], ["usuarios.id"], ondelete="SET NULL"), sa.ForeignKeyConstraint(["created_by"], ["usuarios.id"], ondelete="SET NULL"), sa.UniqueConstraint("proyecto_id", "topic_guid", name="uq_bim_issue_project_topic_guid"))
    op.create_index("ix_bim_issues_scope_status", "bim_issues", ["proyecto_id", "empresa_id", "status"])
    op.create_table("bim_issue_comments", sa.Column("id", sa.Integer(), primary_key=True), sa.Column("bim_issue_id", sa.Integer(), nullable=False), sa.Column("body", sa.Text(), nullable=False), sa.Column("created_by", sa.Integer()), sa.Column("fecha_creacion", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False), sa.ForeignKeyConstraint(["bim_issue_id"], ["bim_issues.id"], ondelete="CASCADE"), sa.ForeignKeyConstraint(["created_by"], ["usuarios.id"], ondelete="SET NULL"))
    op.create_index("ix_bim_issue_comments_issue", "bim_issue_comments", ["bim_issue_id"])
    op.create_table("bim_issue_events", sa.Column("id", sa.Integer(), primary_key=True), sa.Column("bim_issue_id", sa.Integer(), nullable=False), sa.Column("event_type", sa.String(50), nullable=False), sa.Column("payload_json", sa.JSON(), nullable=False), sa.Column("created_by", sa.Integer()), sa.Column("fecha_creacion", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False), sa.ForeignKeyConstraint(["bim_issue_id"], ["bim_issues.id"], ondelete="CASCADE"), sa.ForeignKeyConstraint(["created_by"], ["usuarios.id"], ondelete="SET NULL"))
    op.create_index("ix_bim_issue_events_issue", "bim_issue_events", ["bim_issue_id"])


def downgrade() -> None:
    op.drop_table("bim_issue_events")
    op.drop_table("bim_issue_comments")
    op.drop_table("bim_issues")
