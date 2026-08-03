"""coordinated import staging

Revision ID: de2060a1b2c3
Revises: de2059a1b2c3
"""
from alembic import op
import sqlalchemy as sa

revision = "de2060a1b2c3"
down_revision = "de2059a1b2c3"
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "coordination_import_stages",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("empresa_id", sa.Integer(), nullable=False),
        sa.Column("proyecto_id", sa.Integer(), nullable=False),
        sa.Column("coordination_set_id", sa.Integer(), nullable=True),
        sa.Column("source_domain", sa.String(40), nullable=False),
        sa.Column("source_format", sa.String(40), nullable=False),
        sa.Column("filename", sa.String(255), nullable=False),
        sa.Column("checksum_sha256", sa.String(64), nullable=False),
        sa.Column("byte_size", sa.Integer(), nullable=False),
        sa.Column("status", sa.String(40), nullable=False, server_default="preflight_ready"),
        sa.Column("manifest_json", sa.JSON(), nullable=False),
        sa.Column("errors_json", sa.JSON(), nullable=False),
        sa.Column("confirmed_by", sa.Integer(), nullable=True),
        sa.Column("confirmed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_by", sa.Integer(), nullable=True),
        sa.Column("fecha_creacion", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.ForeignKeyConstraint(["empresa_id"], ["empresas.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["proyecto_id"], ["proyectos.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["coordination_set_id"], ["project_coordination_sets.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["confirmed_by"], ["usuarios.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["created_by"], ["usuarios.id"], ondelete="SET NULL"),
        sa.UniqueConstraint("empresa_id", "proyecto_id", "source_format", "checksum_sha256", name="uq_coordination_import_stage_checksum"),
    )
    op.create_index("ix_coordination_import_stage_scope", "coordination_import_stages", ["empresa_id", "proyecto_id", "status"])


def downgrade():
    op.drop_index("ix_coordination_import_stage_scope", table_name="coordination_import_stages")
    op.drop_table("coordination_import_stages")
