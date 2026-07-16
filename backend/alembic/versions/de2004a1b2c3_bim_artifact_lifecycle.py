"""bim artifact lifecycle

Revision ID: de2004a1b2c3
Revises: de2003a1b2c3
Create Date: 2026-07-10
"""

from alembic import op
import sqlalchemy as sa


revision = "de2004a1b2c3"
down_revision = "de2003a1b2c3"
branch_labels = None
depends_on = None


def _has_table() -> bool:
    return "bim_artifacts" in set(sa.inspect(op.get_bind()).get_table_names())


def _create_index(name: str, columns: list[str]) -> None:
    existing = {index["name"] for index in sa.inspect(op.get_bind()).get_indexes("bim_artifacts")}
    if name not in existing:
        op.create_index(name, "bim_artifacts", columns, unique=False)


def upgrade() -> None:
    if not _has_table():
        op.create_table(
            "bim_artifacts",
            sa.Column("id", sa.Integer(), nullable=False),
            sa.Column("bim_model_version_id", sa.Integer(), nullable=False),
            sa.Column("proyecto_id", sa.Integer(), nullable=False),
            sa.Column("empresa_id", sa.Integer(), nullable=False),
            sa.Column("artifact_type", sa.String(length=50), nullable=False),
            sa.Column("contract_version", sa.String(length=100), nullable=False),
            sa.Column("generation", sa.Integer(), nullable=False),
            sa.Column("artifact_path", sa.String(length=500), nullable=False),
            sa.Column("checksum_sha256", sa.String(length=64), nullable=False),
            sa.Column("file_size_bytes", sa.Integer(), nullable=False),
            sa.Column("source_checksum_sha256", sa.String(length=64), nullable=True),
            sa.Column("status", sa.String(length=30), nullable=False),
            sa.Column("metadata_json", sa.JSON(), nullable=False),
            sa.Column("fecha_creacion", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
            sa.Column("fecha_actualizacion", sa.DateTime(timezone=True), nullable=True),
            sa.ForeignKeyConstraint(["bim_model_version_id"], ["bim_model_versions.id"], ondelete="CASCADE"),
            sa.ForeignKeyConstraint(["empresa_id"], ["empresas.id"], ondelete="CASCADE"),
            sa.ForeignKeyConstraint(["proyecto_id"], ["proyectos.id"], ondelete="CASCADE"),
            sa.PrimaryKeyConstraint("id"),
            sa.UniqueConstraint("bim_model_version_id", "artifact_type", "generation", name="uq_bim_artifact_generation"),
        )
    _create_index("ix_bim_artifacts_id", ["id"])
    _create_index("ix_bim_artifacts_bim_model_version_id", ["bim_model_version_id"])
    _create_index("ix_bim_artifacts_proyecto_id", ["proyecto_id"])
    _create_index("ix_bim_artifacts_empresa_id", ["empresa_id"])
    _create_index("ix_bim_artifacts_artifact_type", ["artifact_type"])
    _create_index("ix_bim_artifacts_status", ["status"])


def downgrade() -> None:
    if _has_table():
        op.drop_table("bim_artifacts")
