"""bim federations

Revision ID: de2005a1b2c3
Revises: de2004a1b2c3
Create Date: 2026-07-11
"""

from alembic import op
import sqlalchemy as sa


revision = "de2005a1b2c3"
down_revision = "de2004a1b2c3"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "bim_federations",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("proyecto_id", sa.Integer(), nullable=False),
        sa.Column("empresa_id", sa.Integer(), nullable=False),
        sa.Column("nombre", sa.String(255), nullable=False),
        sa.Column("revision", sa.Integer(), nullable=False),
        sa.Column("status", sa.String(30), nullable=False),
        sa.Column("justification", sa.Text(), nullable=False),
        sa.Column("created_by", sa.Integer(), nullable=True),
        sa.Column("fecha_creacion", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["proyecto_id"], ["proyectos.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["empresa_id"], ["empresas.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["created_by"], ["usuarios.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("proyecto_id", "empresa_id", "revision", name="uq_bim_federation_project_revision"),
    )
    op.create_index("ix_bim_federations_project_company_status", "bim_federations", ["proyecto_id", "empresa_id", "status"])
    op.create_table(
        "bim_federation_members",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("bim_federation_id", sa.Integer(), nullable=False),
        sa.Column("bim_model_version_id", sa.Integer(), nullable=False),
        sa.Column("discipline", sa.String(100), nullable=False),
        sa.Column("display_order", sa.Integer(), nullable=False),
        sa.Column("enabled", sa.Boolean(), nullable=False),
        sa.Column("transform_json", sa.JSON(), nullable=False),
        sa.Column("georeference_json", sa.JSON(), nullable=False),
        sa.ForeignKeyConstraint(["bim_federation_id"], ["bim_federations.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["bim_model_version_id"], ["bim_model_versions.id"], ondelete="RESTRICT"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("bim_federation_id", "bim_model_version_id", name="uq_bim_federation_member_version"),
    )
    op.create_index("ix_bim_federation_members_federation", "bim_federation_members", ["bim_federation_id"])
    op.create_index("ix_bim_federation_members_version", "bim_federation_members", ["bim_model_version_id"])


def downgrade() -> None:
    op.drop_table("bim_federation_members")
    op.drop_table("bim_federations")
