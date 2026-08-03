"""BIM coordinated 4D/5D core
Revision ID: de2059a1b2c3
Revises: de2058a1b2c3
Create Date: 2026-08-03
"""

from alembic import op
import sqlalchemy as sa


revision = "de2059a1b2c3"
down_revision = "de2058a1b2c3"
branch_labels = None
depends_on = None


def _scope_columns():
    return (
        sa.Column("empresa_id", sa.Integer(), nullable=False),
        sa.Column("proyecto_id", sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(["empresa_id"], ["empresas.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["proyecto_id"], ["proyectos.id"], ondelete="CASCADE"),
    )


def upgrade():
    op.create_table(
        "project_coordination_sets",
        sa.Column("id", sa.Integer(), primary_key=True),
        *_scope_columns(),
        sa.Column("proyecto_codigo_root", sa.String(length=80), nullable=False),
        sa.Column("proyecto_revision", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("revision", sa.Integer(), nullable=False, server_default="1"),
        sa.Column("presupuesto_id", sa.Integer(), nullable=True),
        sa.Column("presupuesto_revision", sa.Integer(), nullable=True),
        sa.Column("cronograma_trabajo_id", sa.Integer(), nullable=True),
        sa.Column("baseline_id", sa.Integer(), nullable=True),
        sa.Column("bim_version_ids_json", sa.JSON(), nullable=False),
        sa.Column("process_status", sa.String(length=40), nullable=False, server_default="draft"),
        sa.Column("coordination_status", sa.String(length=40), nullable=False, server_default="not_configured"),
        sa.Column("omniclass_status", sa.String(length=40), nullable=False, server_default="disabled"),
        sa.Column("official", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("active", sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column("created_by", sa.Integer(), nullable=True),
        sa.Column("approved_by", sa.Integer(), nullable=True),
        sa.Column("approved_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("fecha_creacion", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("fecha_actualizacion", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["presupuesto_id"], ["presupuestos.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["cronograma_trabajo_id"], ["cronogramas_trabajo.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["baseline_id"], ["bim_4d_baselines.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["created_by"], ["usuarios.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["approved_by"], ["usuarios.id"], ondelete="SET NULL"),
        sa.UniqueConstraint("empresa_id", "proyecto_id", "revision", name="uq_project_coordination_set_revision"),
    )
    op.create_index("ix_project_coordination_sets_scope", "project_coordination_sets", ["empresa_id", "proyecto_id", "active"])

    op.create_table(
        "coordination_links",
        sa.Column("id", sa.Integer(), primary_key=True),
        *_scope_columns(),
        sa.Column("coordination_set_id", sa.Integer(), nullable=False),
        sa.Column("budget_line_id", sa.Integer(), nullable=True),
        sa.Column("apu_id", sa.Integer(), nullable=True),
        sa.Column("activity_ref", sa.String(length=160), nullable=True),
        sa.Column("activity_snapshot_id", sa.Integer(), nullable=True),
        sa.Column("bim_element_id", sa.Integer(), nullable=True),
        sa.Column("bim_global_id", sa.String(length=128), nullable=True),
        sa.Column("allocation_key", sa.String(length=100), nullable=False, server_default="primary"),
        sa.Column("allocation_type", sa.String(length=30), nullable=False, server_default="percentage"),
        sa.Column("allocation_value", sa.Numeric(18, 8), nullable=False, server_default="100"),
        sa.Column("unit", sa.String(length=40), nullable=True),
        sa.Column("additive", sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column("source", sa.String(length=40), nullable=False, server_default="manual"),
        sa.Column("status", sa.String(length=40), nullable=False, server_default="draft"),
        sa.Column("valid_from_revision", sa.Integer(), nullable=False, server_default="1"),
        sa.Column("valid_to_revision", sa.Integer(), nullable=True),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("created_by", sa.Integer(), nullable=True),
        sa.Column("fecha_creacion", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("fecha_actualizacion", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["coordination_set_id"], ["project_coordination_sets.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["budget_line_id"], ["presupuesto_detalles.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["apu_id"], ["apus.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["activity_snapshot_id"], ["bim_4d_activity_snapshots.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["bim_element_id"], ["bim_elements.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["created_by"], ["usuarios.id"], ondelete="SET NULL"),
        sa.UniqueConstraint("coordination_set_id", "budget_line_id", "activity_ref", "bim_element_id", "allocation_key", name="uq_coordination_link_identity"),
    )
    op.create_index("ix_coordination_links_set", "coordination_links", ["coordination_set_id", "status"])

    op.create_table(
        "coordination_proposals",
        sa.Column("id", sa.Integer(), primary_key=True),
        *_scope_columns(),
        sa.Column("coordination_set_id", sa.Integer(), nullable=False),
        sa.Column("proposal_type", sa.String(length=60), nullable=False),
        sa.Column("status", sa.String(length=40), nullable=False, server_default="draft"),
        sa.Column("source_domain", sa.String(length=40), nullable=False),
        sa.Column("target_domain", sa.String(length=40), nullable=False),
        sa.Column("diff_json", sa.JSON(), nullable=False),
        sa.Column("impact_json", sa.JSON(), nullable=False),
        sa.Column("reason", sa.Text(), nullable=True),
        sa.Column("correlation_id", sa.String(length=100), nullable=False),
        sa.Column("proposed_by", sa.Integer(), nullable=True),
        sa.Column("decided_by", sa.Integer(), nullable=True),
        sa.Column("decision_reason", sa.Text(), nullable=True),
        sa.Column("decided_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("applied_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("version", sa.Integer(), nullable=False, server_default="1"),
        sa.Column("fecha_creacion", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("fecha_actualizacion", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["coordination_set_id"], ["project_coordination_sets.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["proposed_by"], ["usuarios.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["decided_by"], ["usuarios.id"], ondelete="SET NULL"),
    )
    op.create_index("ix_coordination_proposals_inbox", "coordination_proposals", ["empresa_id", "proyecto_id", "status"])
    op.create_index("ix_coordination_proposals_correlation", "coordination_proposals", ["correlation_id"])

    op.create_table(
        "coordination_conflicts",
        sa.Column("id", sa.Integer(), primary_key=True),
        *_scope_columns(),
        sa.Column("coordination_set_id", sa.Integer(), nullable=False),
        sa.Column("conflict_type", sa.String(length=80), nullable=False),
        sa.Column("severity", sa.String(length=20), nullable=False, server_default="warning"),
        sa.Column("status", sa.String(length=40), nullable=False, server_default="open"),
        sa.Column("entity_refs_json", sa.JSON(), nullable=False),
        sa.Column("detail_json", sa.JSON(), nullable=False),
        sa.Column("resolution", sa.Text(), nullable=True),
        sa.Column("resolved_by", sa.Integer(), nullable=True),
        sa.Column("resolved_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("fecha_creacion", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.ForeignKeyConstraint(["coordination_set_id"], ["project_coordination_sets.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["resolved_by"], ["usuarios.id"], ondelete="SET NULL"),
    )
    op.create_index("ix_coordination_conflicts_inbox", "coordination_conflicts", ["empresa_id", "proyecto_id", "status", "severity"])

    op.create_table(
        "bim_classification_resolutions",
        sa.Column("id", sa.Integer(), primary_key=True),
        *_scope_columns(),
        sa.Column("bim_element_id", sa.Integer(), nullable=False),
        sa.Column("bim_model_version_id", sa.Integer(), nullable=False),
        sa.Column("system", sa.String(length=80), nullable=False, server_default="OmniClass"),
        sa.Column("edition", sa.String(length=40), nullable=False, server_default="unknown"),
        sa.Column("table_code", sa.String(length=20), nullable=True),
        sa.Column("source_code", sa.String(length=100), nullable=True),
        sa.Column("source_title", sa.Text(), nullable=True),
        sa.Column("omniclass_id", sa.Integer(), nullable=True),
        sa.Column("resolution_status", sa.String(length=40), nullable=False, server_default="unresolved"),
        sa.Column("confidence", sa.Numeric(5, 4), nullable=True),
        sa.Column("source", sa.String(length=40), nullable=False, server_default="ifc"),
        sa.Column("approved_by", sa.Integer(), nullable=True),
        sa.Column("approved_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("fecha_creacion", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("fecha_actualizacion", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["bim_element_id"], ["bim_elements.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["bim_model_version_id"], ["bim_model_versions.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["omniclass_id"], ["omniclass_maestro.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["approved_by"], ["usuarios.id"], ondelete="SET NULL"),
        sa.UniqueConstraint("bim_element_id", "bim_model_version_id", "system", "edition", name="uq_bim_classification_resolution"),
    )
    op.create_index("ix_bim_classification_resolution_scope", "bim_classification_resolutions", ["empresa_id", "proyecto_id", "resolution_status"])


def downgrade():
    op.drop_table("bim_classification_resolutions")
    op.drop_table("coordination_conflicts")
    op.drop_table("coordination_proposals")
    op.drop_table("coordination_links")
    op.drop_table("project_coordination_sets")
