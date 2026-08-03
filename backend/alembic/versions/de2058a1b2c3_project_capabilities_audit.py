"""project capabilities and project audit envelope
Revision ID: de2058a1b2c3
Revises: de2057a1b2c3
Create Date: 2026-08-03
"""

from alembic import op
import sqlalchemy as sa


revision = "de2058a1b2c3"
down_revision = "de2057a1b2c3"
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "project_capability_grants",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("empresa_id", sa.Integer(), nullable=False),
        sa.Column("proyecto_id", sa.Integer(), nullable=False),
        sa.Column("usuario_id", sa.Integer(), nullable=False),
        sa.Column("edt_id", sa.Integer(), nullable=True),
        sa.Column("scope_key", sa.String(length=80), nullable=False, server_default="project"),
        sa.Column("profile_code", sa.String(length=80), nullable=True),
        sa.Column("capabilities_json", sa.JSON(), nullable=False),
        sa.Column("active", sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column("granted_by", sa.Integer(), nullable=True),
        sa.Column("fecha_creacion", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("fecha_actualizacion", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["empresa_id"], ["empresas.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["proyecto_id"], ["proyectos.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["usuario_id"], ["usuarios.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["edt_id"], ["edt_nodes.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["granted_by"], ["usuarios.id"], ondelete="SET NULL"),
        sa.UniqueConstraint("empresa_id", "proyecto_id", "usuario_id", "scope_key", name="uq_project_capability_grant_scope"),
    )
    op.create_index("ix_project_capability_grants_scope", "project_capability_grants", ["empresa_id", "proyecto_id", "usuario_id", "active"])

    op.add_column("system_audit_events", sa.Column("proyecto_id", sa.Integer(), nullable=True))
    op.add_column("system_audit_events", sa.Column("proyecto_codigo_root", sa.String(length=80), nullable=True))
    op.add_column("system_audit_events", sa.Column("proyecto_revision", sa.Integer(), nullable=True))
    op.add_column("system_audit_events", sa.Column("capability", sa.String(length=120), nullable=True))
    op.add_column("system_audit_events", sa.Column("correlation_id", sa.String(length=100), nullable=True))
    op.add_column("system_audit_events", sa.Column("operation_status", sa.String(length=40), nullable=True))
    op.add_column("system_audit_events", sa.Column("detail_json", sa.JSON(), nullable=True))
    op.create_foreign_key("fk_system_audit_events_proyecto", "system_audit_events", "proyectos", ["proyecto_id"], ["id"], ondelete="SET NULL")
    op.create_index("ix_system_audit_events_project_timeline", "system_audit_events", ["empresa_id", "proyecto_id", "created_at"])
    op.create_index("ix_system_audit_events_correlation", "system_audit_events", ["correlation_id"])


def downgrade():
    op.drop_index("ix_system_audit_events_correlation", table_name="system_audit_events")
    op.drop_index("ix_system_audit_events_project_timeline", table_name="system_audit_events")
    op.drop_constraint("fk_system_audit_events_proyecto", "system_audit_events", type_="foreignkey")
    for column in ("detail_json", "operation_status", "correlation_id", "capability", "proyecto_revision", "proyecto_codigo_root", "proyecto_id"):
        op.drop_column("system_audit_events", column)
    op.drop_table("project_capability_grants")
