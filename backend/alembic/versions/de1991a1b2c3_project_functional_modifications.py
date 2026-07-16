"""project functional modifications

Revision ID: de1991a1b2c3
Revises: ab1984c0d1e2
Create Date: 2026-06-29
"""

from alembic import op
import sqlalchemy as sa


revision = "de1991a1b2c3"
down_revision = "ab1984c0d1e2"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "project_functional_modifications",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("empresa_id", sa.Integer(), nullable=False),
        sa.Column("proyecto_id", sa.Integer(), nullable=False),
        sa.Column("presupuesto_id", sa.Integer(), nullable=False),
        sa.Column("base_trabajo_id", sa.Integer(), nullable=True),
        sa.Column("revision", sa.Integer(), nullable=False),
        sa.Column("status", sa.String(length=30), nullable=False),
        sa.Column("active", sa.Boolean(), nullable=False),
        sa.Column("source", sa.String(length=30), nullable=False),
        sa.Column("source_ref", sa.JSON(), nullable=False),
        sa.Column("patch", sa.JSON(), nullable=False),
        sa.Column("snapshot", sa.JSON(), nullable=False),
        sa.Column("audit_log", sa.JSON(), nullable=False),
        sa.Column("created_by_id", sa.Integer(), nullable=True),
        sa.Column("superseded_by_id", sa.Integer(), nullable=True),
        sa.Column("applied_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("superseded_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("superseded_reason", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["base_trabajo_id"], ["bases_trabajo.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["created_by_id"], ["usuarios.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["empresa_id"], ["empresas.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["presupuesto_id"], ["presupuestos.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["proyecto_id"], ["proyectos.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["superseded_by_id"], ["usuarios.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_project_functional_modifications_id"), "project_functional_modifications", ["id"], unique=False)
    op.create_index(op.f("ix_project_functional_modifications_empresa_id"), "project_functional_modifications", ["empresa_id"], unique=False)
    op.create_index(op.f("ix_project_functional_modifications_proyecto_id"), "project_functional_modifications", ["proyecto_id"], unique=False)
    op.create_index(op.f("ix_project_functional_modifications_presupuesto_id"), "project_functional_modifications", ["presupuesto_id"], unique=False)
    op.create_index(op.f("ix_project_functional_modifications_base_trabajo_id"), "project_functional_modifications", ["base_trabajo_id"], unique=False)
    op.create_index(op.f("ix_project_functional_modifications_revision"), "project_functional_modifications", ["revision"], unique=False)
    op.create_index(op.f("ix_project_functional_modifications_status"), "project_functional_modifications", ["status"], unique=False)
    op.create_index(op.f("ix_project_functional_modifications_active"), "project_functional_modifications", ["active"], unique=False)
    op.create_index(op.f("ix_project_functional_modifications_source"), "project_functional_modifications", ["source"], unique=False)
    op.create_index(op.f("ix_project_functional_modifications_created_by_id"), "project_functional_modifications", ["created_by_id"], unique=False)
    op.create_index(op.f("ix_project_functional_modifications_superseded_by_id"), "project_functional_modifications", ["superseded_by_id"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_project_functional_modifications_superseded_by_id"), table_name="project_functional_modifications")
    op.drop_index(op.f("ix_project_functional_modifications_created_by_id"), table_name="project_functional_modifications")
    op.drop_index(op.f("ix_project_functional_modifications_source"), table_name="project_functional_modifications")
    op.drop_index(op.f("ix_project_functional_modifications_active"), table_name="project_functional_modifications")
    op.drop_index(op.f("ix_project_functional_modifications_status"), table_name="project_functional_modifications")
    op.drop_index(op.f("ix_project_functional_modifications_revision"), table_name="project_functional_modifications")
    op.drop_index(op.f("ix_project_functional_modifications_base_trabajo_id"), table_name="project_functional_modifications")
    op.drop_index(op.f("ix_project_functional_modifications_presupuesto_id"), table_name="project_functional_modifications")
    op.drop_index(op.f("ix_project_functional_modifications_proyecto_id"), table_name="project_functional_modifications")
    op.drop_index(op.f("ix_project_functional_modifications_empresa_id"), table_name="project_functional_modifications")
    op.drop_index(op.f("ix_project_functional_modifications_id"), table_name="project_functional_modifications")
    op.drop_table("project_functional_modifications")
