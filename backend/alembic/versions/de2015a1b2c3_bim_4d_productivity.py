"""bim 4d productivity and resource proposals

Revision ID: de2015a1b2c3
Revises: de2014a1b2c3
Create Date: 2026-07-11
"""
from alembic import op
import sqlalchemy as sa

revision = "de2015a1b2c3"
down_revision = "de2014a1b2c3"
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "bim_4d_productivity_proposals",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("empresa_id", sa.Integer(), nullable=False),
        sa.Column("proyecto_id", sa.Integer(), nullable=False),
        sa.Column("bim_model_version_id", sa.Integer(), nullable=False),
        sa.Column("bim_element_id", sa.Integer(), nullable=False),
        sa.Column("activity_snapshot_id", sa.Integer(), nullable=False),
        sa.Column("target_type", sa.String(30), nullable=False),
        sa.Column("target_id", sa.Integer(), nullable=False),
        sa.Column("quantity_name", sa.String(255), nullable=False),
        sa.Column("original_value", sa.Float(), nullable=False),
        sa.Column("original_unit", sa.String(30), nullable=False),
        sa.Column("quantity_value", sa.Float(), nullable=False),
        sa.Column("quantity_unit", sa.String(30), nullable=False),
        sa.Column("quantity_source_kind", sa.String(50), nullable=False),
        sa.Column("conversion_factor", sa.Float(), nullable=False),
        sa.Column("rounding_digits", sa.Integer(), nullable=False),
        sa.Column("normalization_rule", sa.String(255), nullable=False),
        sa.Column("productivity_value", sa.Float(), nullable=False),
        sa.Column("crew_size", sa.Float(), nullable=False),
        sa.Column("calculated_duration_days", sa.Float(), nullable=False),
        sa.Column("resource_code", sa.String(100), nullable=False),
        sa.Column("resource_name", sa.String(255), nullable=False),
        sa.Column("formula", sa.String(255), nullable=False),
        sa.Column("status", sa.String(30), nullable=False),
        sa.Column("decision_reason", sa.Text()),
        sa.Column("created_by", sa.Integer()),
        sa.Column("decided_by", sa.Integer()),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("decided_at", sa.DateTime(timezone=True)),
        sa.ForeignKeyConstraint(["empresa_id"], ["empresas.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["proyecto_id"], ["proyectos.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["bim_model_version_id"], ["bim_model_versions.id"], ondelete="RESTRICT"),
        sa.ForeignKeyConstraint(["bim_element_id"], ["bim_elements.id"], ondelete="RESTRICT"),
        sa.ForeignKeyConstraint(["activity_snapshot_id"], ["bim_4d_activity_snapshots.id"], ondelete="RESTRICT"),
        sa.ForeignKeyConstraint(["created_by"], ["usuarios.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["decided_by"], ["usuarios.id"], ondelete="SET NULL"),
    )
    op.create_index("ix_bim_4d_productivity_company_project_element", "bim_4d_productivity_proposals", ["empresa_id", "proyecto_id", "bim_element_id"])


def downgrade():
    op.drop_table("bim_4d_productivity_proposals")
