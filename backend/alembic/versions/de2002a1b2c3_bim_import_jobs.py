"""bim import jobs

Revision ID: de2002a1b2c3
Revises: de2001a1b2c3
Create Date: 2026-07-10
"""

from alembic import op
import sqlalchemy as sa


revision = "de2002a1b2c3"
down_revision = "de2001a1b2c3"
branch_labels = None
depends_on = None


def _has_table(table_name: str) -> bool:
    return table_name in set(sa.inspect(op.get_bind()).get_table_names())


def _has_index(table_name: str, index_name: str) -> bool:
    return index_name in {index["name"] for index in sa.inspect(op.get_bind()).get_indexes(table_name)}


def _create_index_if_missing(index_name: str, columns: list[str], *, unique: bool = False) -> None:
    if _has_table("bim_import_jobs") and not _has_index("bim_import_jobs", index_name):
        op.create_index(index_name, "bim_import_jobs", columns, unique=unique)


def upgrade() -> None:
    if not _has_table("bim_import_jobs"):
        op.create_table(
            "bim_import_jobs",
            sa.Column("id", sa.Integer(), nullable=False),
            sa.Column("proyecto_id", sa.Integer(), nullable=False),
            sa.Column("empresa_id", sa.Integer(), nullable=False),
            sa.Column("requested_by", sa.Integer(), nullable=True),
            sa.Column("bim_model_version_id", sa.Integer(), nullable=True),
            sa.Column("idempotency_key", sa.String(length=64), nullable=False),
            sa.Column("model_name", sa.String(length=255), nullable=False),
            sa.Column("version_label", sa.String(length=50), nullable=False),
            sa.Column("discipline", sa.String(length=100), nullable=True),
            sa.Column("description", sa.Text(), nullable=True),
            sa.Column("notes", sa.Text(), nullable=True),
            sa.Column("source_filename", sa.String(length=255), nullable=False),
            sa.Column("source_artifact_path", sa.String(length=500), nullable=False),
            sa.Column("checksum_sha256", sa.String(length=64), nullable=False),
            sa.Column("file_size_bytes", sa.Integer(), nullable=False),
            sa.Column("status", sa.String(length=50), nullable=False),
            sa.Column("stage", sa.String(length=50), nullable=False),
            sa.Column("progress", sa.Integer(), nullable=False),
            sa.Column("attempt_count", sa.Integer(), nullable=False),
            sa.Column("max_attempts", sa.Integer(), nullable=False),
            sa.Column("cancellation_requested", sa.Boolean(), nullable=False),
            sa.Column("error_code", sa.String(length=100), nullable=True),
            sa.Column("error_message", sa.Text(), nullable=True),
            sa.Column("result_json", sa.JSON(), nullable=True),
            sa.Column("fecha_creacion", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
            sa.Column("fecha_inicio", sa.DateTime(timezone=True), nullable=True),
            sa.Column("fecha_finalizacion", sa.DateTime(timezone=True), nullable=True),
            sa.Column("fecha_actualizacion", sa.DateTime(timezone=True), nullable=True),
            sa.ForeignKeyConstraint(["bim_model_version_id"], ["bim_model_versions.id"], ondelete="SET NULL"),
            sa.ForeignKeyConstraint(["empresa_id"], ["empresas.id"], ondelete="CASCADE"),
            sa.ForeignKeyConstraint(["proyecto_id"], ["proyectos.id"], ondelete="CASCADE"),
            sa.ForeignKeyConstraint(["requested_by"], ["usuarios.id"], ondelete="SET NULL"),
            sa.PrimaryKeyConstraint("id"),
            sa.UniqueConstraint("idempotency_key", name="uq_bim_import_jobs_idempotency_key"),
        )

    _create_index_if_missing("ix_bim_import_jobs_id", ["id"])
    _create_index_if_missing("ix_bim_import_jobs_proyecto_id", ["proyecto_id"])
    _create_index_if_missing("ix_bim_import_jobs_empresa_id", ["empresa_id"])
    _create_index_if_missing("ix_bim_import_jobs_requested_by", ["requested_by"])
    _create_index_if_missing("ix_bim_import_jobs_bim_model_version_id", ["bim_model_version_id"])
    _create_index_if_missing("ix_bim_import_jobs_idempotency_key", ["idempotency_key"], unique=True)
    _create_index_if_missing("ix_bim_import_jobs_status", ["status"])


def downgrade() -> None:
    if _has_table("bim_import_jobs"):
        op.drop_table("bim_import_jobs")
