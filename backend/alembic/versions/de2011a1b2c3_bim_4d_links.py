"""bim 4d activity snapshots and link proposals

Revision ID: de2011a1b2c3
Revises: de2010a1b2c3
Create Date: 2026-07-11
"""
from alembic import op
import sqlalchemy as sa

revision = "de2011a1b2c3"
down_revision = "de2010a1b2c3"
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "bim_4d_activity_snapshots",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("empresa_id", sa.Integer(), nullable=False),
        sa.Column("proyecto_id", sa.Integer(), nullable=False),
        sa.Column("source_kind", sa.String(50), nullable=False),
        sa.Column("source_ref", sa.String(255), nullable=False),
        sa.Column("snapshot_revision", sa.String(100), nullable=False),
        sa.Column("activity_code", sa.String(100), nullable=False),
        sa.Column("activity_name", sa.String(500), nullable=False),
        sa.Column("planned_start", sa.DateTime(timezone=True), nullable=False),
        sa.Column("planned_finish", sa.DateTime(timezone=True), nullable=False),
        sa.Column("captured_by", sa.Integer()),
        sa.Column("captured_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["empresa_id"], ["empresas.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["proyecto_id"], ["proyectos.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["captured_by"], ["usuarios.id"], ondelete="SET NULL"),
        sa.UniqueConstraint("empresa_id", "proyecto_id", "source_kind", "source_ref", "snapshot_revision", name="uq_bim_4d_activity_snapshot_source_revision"),
    )
    op.create_index("ix_bim_4d_activity_snapshots_company_project", "bim_4d_activity_snapshots", ["empresa_id", "proyecto_id"])
    op.create_table(
        "bim_4d_link_proposals",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("empresa_id", sa.Integer(), nullable=False),
        sa.Column("proyecto_id", sa.Integer(), nullable=False),
        sa.Column("bim_model_version_id", sa.Integer(), nullable=False),
        sa.Column("bim_element_id", sa.Integer(), nullable=False),
        sa.Column("activity_snapshot_id", sa.Integer(), nullable=False),
        sa.Column("link_type", sa.String(30), nullable=False),
        sa.Column("status", sa.String(30), nullable=False),
        sa.Column("proposal_reason", sa.Text(), nullable=False),
        sa.Column("decision_reason", sa.Text()),
        sa.Column("created_by", sa.Integer()),
        sa.Column("decided_by", sa.Integer()),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("decided_at", sa.DateTime(timezone=True)),
        sa.ForeignKeyConstraint(["empresa_id"], ["empresas.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["proyecto_id"], ["proyectos.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["bim_model_version_id"], ["bim_model_versions.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["bim_element_id"], ["bim_elements.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["activity_snapshot_id"], ["bim_4d_activity_snapshots.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["created_by"], ["usuarios.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["decided_by"], ["usuarios.id"], ondelete="SET NULL"),
    )
    op.create_index("ix_bim_4d_link_proposals_company_project", "bim_4d_link_proposals", ["empresa_id", "proyecto_id"])


def downgrade():
    op.drop_table("bim_4d_link_proposals")
    op.drop_table("bim_4d_activity_snapshots")
