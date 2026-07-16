"""bim 4d work areas constructible components and scenarios

Revision ID: de2014a1b2c3
Revises: de2013a1b2c3
Create Date: 2026-07-11
"""
from alembic import op
import sqlalchemy as sa

revision = "de2014a1b2c3"
down_revision = "de2013a1b2c3"
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "bim_4d_work_areas",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("empresa_id", sa.Integer(), nullable=False),
        sa.Column("proyecto_id", sa.Integer(), nullable=False),
        sa.Column("code", sa.String(100), nullable=False),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("description", sa.Text()),
        sa.Column("created_by", sa.Integer()),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["empresa_id"], ["empresas.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["proyecto_id"], ["proyectos.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["created_by"], ["usuarios.id"], ondelete="SET NULL"),
        sa.UniqueConstraint("empresa_id", "proyecto_id", "code", name="uq_bim_4d_work_area_code"),
    )
    op.create_index("ix_bim_4d_work_areas_company_project", "bim_4d_work_areas", ["empresa_id", "proyecto_id"])
    op.create_table(
        "bim_4d_constructible_components",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("empresa_id", sa.Integer(), nullable=False),
        sa.Column("proyecto_id", sa.Integer(), nullable=False),
        sa.Column("work_area_id", sa.Integer(), nullable=False),
        sa.Column("bim_model_version_id", sa.Integer(), nullable=False),
        sa.Column("code", sa.String(100), nullable=False),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("element_ids_json", sa.JSON(), nullable=False),
        sa.Column("activity_snapshot_ids_json", sa.JSON(), nullable=False),
        sa.Column("created_by", sa.Integer()),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["empresa_id"], ["empresas.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["proyecto_id"], ["proyectos.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["work_area_id"], ["bim_4d_work_areas.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["bim_model_version_id"], ["bim_model_versions.id"], ondelete="RESTRICT"),
        sa.ForeignKeyConstraint(["created_by"], ["usuarios.id"], ondelete="SET NULL"),
        sa.UniqueConstraint("work_area_id", "code", name="uq_bim_4d_component_area_code"),
    )
    op.create_index("ix_bim_4d_components_company_project_area", "bim_4d_constructible_components", ["empresa_id", "proyecto_id", "work_area_id"])
    op.create_table(
        "bim_4d_scenarios",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("empresa_id", sa.Integer(), nullable=False),
        sa.Column("proyecto_id", sa.Integer(), nullable=False),
        sa.Column("baseline_id", sa.Integer(), nullable=False),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("revision", sa.String(100), nullable=False),
        sa.Column("shifts_json", sa.JSON(), nullable=False),
        sa.Column("metrics_json", sa.JSON(), nullable=False),
        sa.Column("created_by", sa.Integer()),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["empresa_id"], ["empresas.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["proyecto_id"], ["proyectos.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["baseline_id"], ["bim_4d_baselines.id"], ondelete="RESTRICT"),
        sa.ForeignKeyConstraint(["created_by"], ["usuarios.id"], ondelete="SET NULL"),
        sa.UniqueConstraint("empresa_id", "proyecto_id", "revision", name="uq_bim_4d_scenario_revision"),
    )
    op.create_index("ix_bim_4d_scenarios_company_project", "bim_4d_scenarios", ["empresa_id", "proyecto_id"])


def downgrade():
    op.drop_table("bim_4d_scenarios")
    op.drop_table("bim_4d_constructible_components")
    op.drop_table("bim_4d_work_areas")
