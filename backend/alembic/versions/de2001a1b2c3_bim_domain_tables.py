"""bim domain tables

Revision ID: de2001a1b2c3
Revises: de1991a1b2c3
Create Date: 2026-07-01
"""

from alembic import op
import sqlalchemy as sa


revision = "de2001a1b2c3"
down_revision = "de1991a1b2c3"
branch_labels = None
depends_on = None


def _has_table(table_name: str) -> bool:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    return table_name in set(inspector.get_table_names())


def _has_index(table_name: str, index_name: str) -> bool:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    return index_name in {index["name"] for index in inspector.get_indexes(table_name)}


def _create_index_if_missing(index_name: str, table_name: str, columns: list[str]) -> None:
    if _has_table(table_name) and not _has_index(table_name, index_name):
        op.create_index(index_name, table_name, columns, unique=False)


def upgrade() -> None:
    if not _has_table("bim_models"):
        op.create_table(
            "bim_models",
            sa.Column("id", sa.Integer(), nullable=False),
            sa.Column("proyecto_id", sa.Integer(), nullable=False),
            sa.Column("empresa_id", sa.Integer(), nullable=False),
            sa.Column("nombre", sa.String(length=255), nullable=False),
            sa.Column("descripcion", sa.Text(), nullable=True),
            sa.Column("disciplina", sa.String(length=100), nullable=True),
            sa.Column("archivo_fuente", sa.String(length=500), nullable=True),
            sa.Column("activo", sa.Boolean(), nullable=False),
            sa.Column("fecha_creacion", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=True),
            sa.Column("fecha_actualizacion", sa.DateTime(timezone=True), nullable=True),
            sa.ForeignKeyConstraint(["empresa_id"], ["empresas.id"], ondelete="CASCADE"),
            sa.ForeignKeyConstraint(["proyecto_id"], ["proyectos.id"], ondelete="CASCADE"),
            sa.PrimaryKeyConstraint("id"),
        )
    _create_index_if_missing("ix_bim_models_id", "bim_models", ["id"])
    _create_index_if_missing("ix_bim_models_proyecto_id", "bim_models", ["proyecto_id"])
    _create_index_if_missing("ix_bim_models_empresa_id", "bim_models", ["empresa_id"])

    if not _has_table("bim_model_versions"):
        op.create_table(
            "bim_model_versions",
            sa.Column("id", sa.Integer(), nullable=False),
            sa.Column("bim_model_id", sa.Integer(), nullable=False),
            sa.Column("version_label", sa.String(length=50), nullable=False),
            sa.Column("source_filename", sa.String(length=255), nullable=True),
            sa.Column("artifact_path", sa.String(length=500), nullable=True),
            sa.Column("status", sa.String(length=50), nullable=False),
            sa.Column("is_active", sa.Boolean(), nullable=False),
            sa.Column("element_count", sa.Integer(), nullable=True),
            sa.Column("storey_count", sa.Integer(), nullable=True),
            sa.Column("notes", sa.Text(), nullable=True),
            sa.Column("fecha_creacion", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=True),
            sa.Column("fecha_actualizacion", sa.DateTime(timezone=True), nullable=True),
            sa.ForeignKeyConstraint(["bim_model_id"], ["bim_models.id"], ondelete="CASCADE"),
            sa.PrimaryKeyConstraint("id"),
        )
    _create_index_if_missing("ix_bim_model_versions_id", "bim_model_versions", ["id"])
    _create_index_if_missing("ix_bim_model_versions_bim_model_id", "bim_model_versions", ["bim_model_id"])

    if not _has_table("bim_elements"):
        op.create_table(
            "bim_elements",
            sa.Column("id", sa.Integer(), nullable=False),
            sa.Column("bim_model_version_id", sa.Integer(), nullable=False),
            sa.Column("global_id", sa.String(length=255), nullable=False),
            sa.Column("ifc_class", sa.String(length=100), nullable=True),
            sa.Column("nombre", sa.String(length=255), nullable=True),
            sa.Column("storey_name", sa.String(length=255), nullable=True),
            sa.Column("system_name", sa.String(length=255), nullable=True),
            sa.Column("classification", sa.String(length=255), nullable=True),
            sa.Column("properties", sa.JSON(), nullable=True),
            sa.Column("metadata_json", sa.JSON(), nullable=True),
            sa.Column("descripcion", sa.Text(), nullable=True),
            sa.Column("fecha_creacion", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=True),
            sa.Column("fecha_actualizacion", sa.DateTime(timezone=True), nullable=True),
            sa.ForeignKeyConstraint(["bim_model_version_id"], ["bim_model_versions.id"], ondelete="CASCADE"),
            sa.PrimaryKeyConstraint("id"),
        )
    _create_index_if_missing("ix_bim_elements_id", "bim_elements", ["id"])
    _create_index_if_missing("ix_bim_elements_bim_model_version_id", "bim_elements", ["bim_model_version_id"])
    _create_index_if_missing("ix_bim_elements_global_id", "bim_elements", ["global_id"])
    _create_index_if_missing("ix_bim_elements_ifc_class", "bim_elements", ["ifc_class"])

    if not _has_table("bim_storeys"):
        op.create_table(
            "bim_storeys",
            sa.Column("id", sa.Integer(), nullable=False),
            sa.Column("bim_model_version_id", sa.Integer(), nullable=False),
            sa.Column("nombre", sa.String(length=255), nullable=False),
            sa.Column("codigo", sa.String(length=100), nullable=True),
            sa.Column("elevation", sa.String(length=100), nullable=True),
            sa.Column("orden", sa.Integer(), nullable=False),
            sa.Column("fecha_creacion", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=True),
            sa.ForeignKeyConstraint(["bim_model_version_id"], ["bim_model_versions.id"], ondelete="CASCADE"),
            sa.PrimaryKeyConstraint("id"),
        )
    _create_index_if_missing("ix_bim_storeys_id", "bim_storeys", ["id"])
    _create_index_if_missing("ix_bim_storeys_bim_model_version_id", "bim_storeys", ["bim_model_version_id"])
    _create_index_if_missing("ix_bim_storeys_codigo", "bim_storeys", ["codigo"])

    if not _has_table("bim_view_states"):
        op.create_table(
            "bim_view_states",
            sa.Column("id", sa.Integer(), nullable=False),
            sa.Column("proyecto_id", sa.Integer(), nullable=False),
            sa.Column("empresa_id", sa.Integer(), nullable=False),
            sa.Column("usuario_id", sa.Integer(), nullable=False),
            sa.Column("bim_model_version_id", sa.Integer(), nullable=True),
            sa.Column("nombre", sa.String(length=255), nullable=False),
            sa.Column("scope", sa.String(length=50), nullable=False),
            sa.Column("payload", sa.JSON(), nullable=True),
            sa.Column("fecha_creacion", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=True),
            sa.Column("fecha_actualizacion", sa.DateTime(timezone=True), nullable=True),
            sa.ForeignKeyConstraint(["bim_model_version_id"], ["bim_model_versions.id"], ondelete="CASCADE"),
            sa.ForeignKeyConstraint(["empresa_id"], ["empresas.id"], ondelete="CASCADE"),
            sa.ForeignKeyConstraint(["proyecto_id"], ["proyectos.id"], ondelete="CASCADE"),
            sa.ForeignKeyConstraint(["usuario_id"], ["usuarios.id"], ondelete="CASCADE"),
            sa.PrimaryKeyConstraint("id"),
        )
    _create_index_if_missing("ix_bim_view_states_id", "bim_view_states", ["id"])
    _create_index_if_missing("ix_bim_view_states_proyecto_id", "bim_view_states", ["proyecto_id"])
    _create_index_if_missing("ix_bim_view_states_empresa_id", "bim_view_states", ["empresa_id"])
    _create_index_if_missing("ix_bim_view_states_usuario_id", "bim_view_states", ["usuario_id"])
    _create_index_if_missing("ix_bim_view_states_bim_model_version_id", "bim_view_states", ["bim_model_version_id"])

    if not _has_table("bim_link_edt"):
        op.create_table(
            "bim_link_edt",
            sa.Column("id", sa.Integer(), nullable=False),
            sa.Column("bim_element_id", sa.Integer(), nullable=False),
            sa.Column("edt_node_id", sa.Integer(), nullable=False),
            sa.Column("link_type", sa.String(length=50), nullable=False),
            sa.Column("notes", sa.Text(), nullable=True),
            sa.Column("created_by", sa.Integer(), nullable=True),
            sa.Column("fecha_creacion", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=True),
            sa.ForeignKeyConstraint(["bim_element_id"], ["bim_elements.id"], ondelete="CASCADE"),
            sa.ForeignKeyConstraint(["created_by"], ["usuarios.id"], ondelete="SET NULL"),
            sa.ForeignKeyConstraint(["edt_node_id"], ["edt_nodes.id"], ondelete="CASCADE"),
            sa.PrimaryKeyConstraint("id"),
        )
    _create_index_if_missing("ix_bim_link_edt_id", "bim_link_edt", ["id"])
    _create_index_if_missing("ix_bim_link_edt_bim_element_id", "bim_link_edt", ["bim_element_id"])
    _create_index_if_missing("ix_bim_link_edt_edt_node_id", "bim_link_edt", ["edt_node_id"])

    if not _has_table("bim_link_apu"):
        op.create_table(
            "bim_link_apu",
            sa.Column("id", sa.Integer(), nullable=False),
            sa.Column("bim_element_id", sa.Integer(), nullable=False),
            sa.Column("apu_id", sa.Integer(), nullable=False),
            sa.Column("link_type", sa.String(length=50), nullable=False),
            sa.Column("notes", sa.Text(), nullable=True),
            sa.Column("created_by", sa.Integer(), nullable=True),
            sa.Column("fecha_creacion", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=True),
            sa.ForeignKeyConstraint(["apu_id"], ["apus.id"], ondelete="CASCADE"),
            sa.ForeignKeyConstraint(["bim_element_id"], ["bim_elements.id"], ondelete="CASCADE"),
            sa.ForeignKeyConstraint(["created_by"], ["usuarios.id"], ondelete="SET NULL"),
            sa.PrimaryKeyConstraint("id"),
        )
    _create_index_if_missing("ix_bim_link_apu_id", "bim_link_apu", ["id"])
    _create_index_if_missing("ix_bim_link_apu_bim_element_id", "bim_link_apu", ["bim_element_id"])
    _create_index_if_missing("ix_bim_link_apu_apu_id", "bim_link_apu", ["apu_id"])

    if not _has_table("bim_link_presupuesto"):
        op.create_table(
            "bim_link_presupuesto",
            sa.Column("id", sa.Integer(), nullable=False),
            sa.Column("bim_element_id", sa.Integer(), nullable=False),
            sa.Column("presupuesto_detalle_id", sa.Integer(), nullable=False),
            sa.Column("link_type", sa.String(length=50), nullable=False),
            sa.Column("notes", sa.Text(), nullable=True),
            sa.Column("created_by", sa.Integer(), nullable=True),
            sa.Column("fecha_creacion", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=True),
            sa.ForeignKeyConstraint(["bim_element_id"], ["bim_elements.id"], ondelete="CASCADE"),
            sa.ForeignKeyConstraint(["created_by"], ["usuarios.id"], ondelete="SET NULL"),
            sa.ForeignKeyConstraint(["presupuesto_detalle_id"], ["presupuesto_detalles.id"], ondelete="CASCADE"),
            sa.PrimaryKeyConstraint("id"),
        )
    _create_index_if_missing("ix_bim_link_presupuesto_id", "bim_link_presupuesto", ["id"])
    _create_index_if_missing("ix_bim_link_presupuesto_bim_element_id", "bim_link_presupuesto", ["bim_element_id"])
    _create_index_if_missing(
        "ix_bim_link_presupuesto_presupuesto_detalle_id",
        "bim_link_presupuesto",
        ["presupuesto_detalle_id"],
    )


def downgrade() -> None:
    for table_name in (
        "bim_link_presupuesto",
        "bim_link_apu",
        "bim_link_edt",
        "bim_view_states",
        "bim_storeys",
        "bim_elements",
        "bim_model_versions",
        "bim_models",
    ):
        if _has_table(table_name):
            op.drop_table(table_name)
