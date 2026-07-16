"""bim ids validation

Revision ID: de2006a1b2c3
Revises: de2005a1b2c3
Create Date: 2026-07-11
"""

from alembic import op
import sqlalchemy as sa

revision = "de2006a1b2c3"
down_revision = "de2005a1b2c3"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table("bim_ids_profiles", sa.Column("id", sa.Integer(), primary_key=True), sa.Column("proyecto_id", sa.Integer(), nullable=False), sa.Column("empresa_id", sa.Integer(), nullable=False), sa.Column("name", sa.String(255), nullable=False), sa.Column("source_filename", sa.String(255), nullable=False), sa.Column("ids_version", sa.String(50), nullable=False), sa.Column("checksum_sha256", sa.String(64), nullable=False), sa.Column("xml_content", sa.Text(), nullable=False), sa.Column("created_by", sa.Integer(), nullable=True), sa.Column("fecha_creacion", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False), sa.ForeignKeyConstraint(["proyecto_id"], ["proyectos.id"], ondelete="CASCADE"), sa.ForeignKeyConstraint(["empresa_id"], ["empresas.id"], ondelete="CASCADE"), sa.ForeignKeyConstraint(["created_by"], ["usuarios.id"], ondelete="SET NULL"))
    op.create_index("ix_bim_ids_profiles_scope", "bim_ids_profiles", ["proyecto_id", "empresa_id"])
    op.create_table("bim_ids_validations", sa.Column("id", sa.Integer(), primary_key=True), sa.Column("bim_ids_profile_id", sa.Integer(), nullable=False), sa.Column("bim_model_version_id", sa.Integer(), nullable=False), sa.Column("proyecto_id", sa.Integer(), nullable=False), sa.Column("empresa_id", sa.Integer(), nullable=False), sa.Column("status", sa.String(30), nullable=False), sa.Column("summary_json", sa.JSON(), nullable=False), sa.Column("created_by", sa.Integer(), nullable=True), sa.Column("fecha_creacion", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False), sa.ForeignKeyConstraint(["bim_ids_profile_id"], ["bim_ids_profiles.id"], ondelete="CASCADE"), sa.ForeignKeyConstraint(["bim_model_version_id"], ["bim_model_versions.id"], ondelete="CASCADE"), sa.ForeignKeyConstraint(["proyecto_id"], ["proyectos.id"], ondelete="CASCADE"), sa.ForeignKeyConstraint(["empresa_id"], ["empresas.id"], ondelete="CASCADE"), sa.ForeignKeyConstraint(["created_by"], ["usuarios.id"], ondelete="SET NULL"))
    op.create_index("ix_bim_ids_validations_scope", "bim_ids_validations", ["proyecto_id", "empresa_id", "bim_model_version_id"])
    op.create_table("bim_ids_findings", sa.Column("id", sa.Integer(), primary_key=True), sa.Column("bim_ids_validation_id", sa.Integer(), nullable=False), sa.Column("requirement_id", sa.String(255), nullable=False), sa.Column("specification_name", sa.String(255), nullable=False), sa.Column("global_id", sa.String(255), nullable=True), sa.Column("severity", sa.String(20), nullable=False), sa.Column("status", sa.String(20), nullable=False), sa.Column("message", sa.Text(), nullable=False), sa.Column("exception_reason", sa.Text(), nullable=True), sa.Column("exception_by", sa.Integer(), nullable=True), sa.Column("exception_at", sa.DateTime(timezone=True), nullable=True), sa.ForeignKeyConstraint(["bim_ids_validation_id"], ["bim_ids_validations.id"], ondelete="CASCADE"), sa.ForeignKeyConstraint(["exception_by"], ["usuarios.id"], ondelete="SET NULL"))
    op.create_index("ix_bim_ids_findings_validation_status", "bim_ids_findings", ["bim_ids_validation_id", "status"])
    op.create_index("ix_bim_ids_findings_global_id", "bim_ids_findings", ["global_id"])


def downgrade() -> None:
    op.drop_table("bim_ids_findings")
    op.drop_table("bim_ids_validations")
    op.drop_table("bim_ids_profiles")
