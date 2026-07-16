"""bim ifc quality reports

Revision ID: de2003a1b2c3
Revises: de2002a1b2c3
Create Date: 2026-07-10
"""

from alembic import op
import sqlalchemy as sa


revision = "de2003a1b2c3"
down_revision = "de2002a1b2c3"
branch_labels = None
depends_on = None


def _has_table(table_name: str) -> bool:
    return table_name in set(sa.inspect(op.get_bind()).get_table_names())


def _has_index(index_name: str) -> bool:
    if not _has_table("bim_ifc_quality_reports"):
        return False
    return index_name in {
        index["name"] for index in sa.inspect(op.get_bind()).get_indexes("bim_ifc_quality_reports")
    }


def _create_index(index_name: str, columns: list[str]) -> None:
    if not _has_index(index_name):
        op.create_index(index_name, "bim_ifc_quality_reports", columns, unique=False)


def upgrade() -> None:
    if not _has_table("bim_ifc_quality_reports"):
        op.create_table(
            "bim_ifc_quality_reports",
            sa.Column("id", sa.Integer(), nullable=False),
            sa.Column("bim_model_version_id", sa.Integer(), nullable=False),
            sa.Column("proyecto_id", sa.Integer(), nullable=False),
            sa.Column("empresa_id", sa.Integer(), nullable=False),
            sa.Column("contract_version", sa.String(length=64), nullable=False),
            sa.Column("source_checksum_sha256", sa.String(length=64), nullable=False),
            sa.Column("schema_identifier", sa.String(length=50), nullable=True),
            sa.Column("step_status", sa.String(length=30), nullable=False),
            sa.Column("schema_status", sa.String(length=30), nullable=False),
            sa.Column("semantic_status", sa.String(length=30), nullable=False),
            sa.Column("overall_status", sa.String(length=30), nullable=False),
            sa.Column("error_count", sa.Integer(), nullable=False),
            sa.Column("warning_count", sa.Integer(), nullable=False),
            sa.Column("findings", sa.JSON(), nullable=False),
            sa.Column("summary_json", sa.JSON(), nullable=False),
            sa.Column("fecha_generacion", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
            sa.Column("fecha_actualizacion", sa.DateTime(timezone=True), nullable=True),
            sa.ForeignKeyConstraint(["bim_model_version_id"], ["bim_model_versions.id"], ondelete="CASCADE"),
            sa.ForeignKeyConstraint(["empresa_id"], ["empresas.id"], ondelete="CASCADE"),
            sa.ForeignKeyConstraint(["proyecto_id"], ["proyectos.id"], ondelete="CASCADE"),
            sa.PrimaryKeyConstraint("id"),
            sa.UniqueConstraint("bim_model_version_id", name="uq_bim_ifc_quality_report_version"),
        )
    _create_index("ix_bim_ifc_quality_reports_id", ["id"])
    _create_index("ix_bim_ifc_quality_reports_bim_model_version_id", ["bim_model_version_id"])
    _create_index("ix_bim_ifc_quality_reports_proyecto_id", ["proyecto_id"])
    _create_index("ix_bim_ifc_quality_reports_empresa_id", ["empresa_id"])
    _create_index("ix_bim_ifc_quality_reports_overall_status", ["overall_status"])


def downgrade() -> None:
    if _has_table("bim_ifc_quality_reports"):
        op.drop_table("bim_ifc_quality_reports")
