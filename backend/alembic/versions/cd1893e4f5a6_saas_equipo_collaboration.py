"""saas equipo collaboration

Revision ID: cd1893e4f5a6
Revises: ba1c2d3e4f50
Create Date: 2026-06-08 00:00:00.000000
"""

from alembic import op
import sqlalchemy as sa


revision = "cd1893e4f5a6"
down_revision = "ba1c2d3e4f50"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "saas_equipo_seats",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("empresa_id", sa.Integer(), nullable=False),
        sa.Column("owner_user_id", sa.Integer(), nullable=False),
        sa.Column("collaborator_user_id", sa.Integer(), nullable=True),
        sa.Column("invited_email", sa.String(length=255), nullable=True),
        sa.Column("status", sa.String(length=30), server_default="active", nullable=False),
        sa.Column("source_right_code", sa.String(length=80), nullable=True),
        sa.Column("assigned_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("released_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("forced_by_user_id", sa.Integer(), nullable=True),
        sa.Column("audit_reason", sa.String(length=500), nullable=True),
        sa.Column("metadata_json", sa.JSON(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["collaborator_user_id"], ["usuarios.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["empresa_id"], ["empresas.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["forced_by_user_id"], ["usuarios.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["owner_user_id"], ["usuarios.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_saas_equipo_seats_id"), "saas_equipo_seats", ["id"], unique=False)
    op.create_index(op.f("ix_saas_equipo_seats_empresa_id"), "saas_equipo_seats", ["empresa_id"], unique=False)
    op.create_index(op.f("ix_saas_equipo_seats_owner_user_id"), "saas_equipo_seats", ["owner_user_id"], unique=False)
    op.create_index(op.f("ix_saas_equipo_seats_collaborator_user_id"), "saas_equipo_seats", ["collaborator_user_id"], unique=False)
    op.create_index(op.f("ix_saas_equipo_seats_invited_email"), "saas_equipo_seats", ["invited_email"], unique=False)
    op.create_index(op.f("ix_saas_equipo_seats_status"), "saas_equipo_seats", ["status"], unique=False)
    op.create_index(op.f("ix_saas_equipo_seats_source_right_code"), "saas_equipo_seats", ["source_right_code"], unique=False)
    op.create_index(op.f("ix_saas_equipo_seats_assigned_at"), "saas_equipo_seats", ["assigned_at"], unique=False)
    op.create_index(op.f("ix_saas_equipo_seats_forced_by_user_id"), "saas_equipo_seats", ["forced_by_user_id"], unique=False)

    op.create_table(
        "saas_equipo_edt_assignments",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("seat_id", sa.Integer(), nullable=False),
        sa.Column("empresa_id", sa.Integer(), nullable=False),
        sa.Column("proyecto_id", sa.Integer(), nullable=False),
        sa.Column("edt_id", sa.Integer(), nullable=False),
        sa.Column("usuario_id", sa.Integer(), nullable=False),
        sa.Column("proyecto_asignacion_id", sa.Integer(), nullable=True),
        sa.Column("modulo", sa.String(length=50), server_default="presupuestos", nullable=False),
        sa.Column("status", sa.String(length=30), server_default="active", nullable=False),
        sa.Column("assigned_by_user_id", sa.Integer(), nullable=True),
        sa.Column("revoked_by_user_id", sa.Integer(), nullable=True),
        sa.Column("assigned_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("revoked_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("metadata_json", sa.JSON(), nullable=True),
        sa.ForeignKeyConstraint(["assigned_by_user_id"], ["usuarios.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["edt_id"], ["edt_nodes.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["empresa_id"], ["empresas.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["proyecto_asignacion_id"], ["proyectos_asignaciones.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["proyecto_id"], ["proyectos.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["revoked_by_user_id"], ["usuarios.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["seat_id"], ["saas_equipo_seats.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["usuario_id"], ["usuarios.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    for column in [
        "id",
        "seat_id",
        "empresa_id",
        "proyecto_id",
        "edt_id",
        "usuario_id",
        "proyecto_asignacion_id",
        "modulo",
        "status",
        "assigned_by_user_id",
        "revoked_by_user_id",
        "assigned_at",
    ]:
        op.create_index(op.f(f"ix_saas_equipo_edt_assignments_{column}"), "saas_equipo_edt_assignments", [column], unique=False)

    op.create_table(
        "saas_equipo_locks",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("empresa_id", sa.Integer(), nullable=False),
        sa.Column("proyecto_id", sa.Integer(), nullable=False),
        sa.Column("edt_id", sa.Integer(), nullable=False),
        sa.Column("presupuesto_linea_id", sa.Integer(), nullable=True),
        sa.Column("locked_by_user_id", sa.Integer(), nullable=False),
        sa.Column("status", sa.String(length=30), server_default="active", nullable=False),
        sa.Column("reason", sa.String(length=500), nullable=True),
        sa.Column("locked_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("released_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("metadata_json", sa.JSON(), nullable=True),
        sa.ForeignKeyConstraint(["edt_id"], ["edt_nodes.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["empresa_id"], ["empresas.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["locked_by_user_id"], ["usuarios.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["presupuesto_linea_id"], ["presupuesto_detalles.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["proyecto_id"], ["proyectos.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    for column in ["id", "empresa_id", "proyecto_id", "edt_id", "presupuesto_linea_id", "locked_by_user_id", "status", "locked_at", "expires_at"]:
        op.create_index(op.f(f"ix_saas_equipo_locks_{column}"), "saas_equipo_locks", [column], unique=False)

    op.create_table(
        "saas_equipo_change_proposals",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("empresa_id", sa.Integer(), nullable=False),
        sa.Column("proyecto_id", sa.Integer(), nullable=False),
        sa.Column("edt_id", sa.Integer(), nullable=False),
        sa.Column("presupuesto_id", sa.Integer(), nullable=True),
        sa.Column("presupuesto_linea_id", sa.Integer(), nullable=True),
        sa.Column("submitted_by_user_id", sa.Integer(), nullable=True),
        sa.Column("reviewed_by_user_id", sa.Integer(), nullable=True),
        sa.Column("status", sa.String(length=30), server_default="pending", nullable=False),
        sa.Column("title", sa.String(length=255), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("proposed_changes", sa.JSON(), nullable=False),
        sa.Column("review_notes", sa.Text(), nullable=True),
        sa.Column("submitted_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("reviewed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("applied_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("metadata_json", sa.JSON(), nullable=True),
        sa.ForeignKeyConstraint(["edt_id"], ["edt_nodes.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["empresa_id"], ["empresas.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["presupuesto_id"], ["presupuestos.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["presupuesto_linea_id"], ["presupuesto_detalles.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["proyecto_id"], ["proyectos.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["reviewed_by_user_id"], ["usuarios.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["submitted_by_user_id"], ["usuarios.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
    )
    for column in ["id", "empresa_id", "proyecto_id", "edt_id", "presupuesto_id", "presupuesto_linea_id", "submitted_by_user_id", "reviewed_by_user_id", "status", "submitted_at"]:
        op.create_index(op.f(f"ix_saas_equipo_change_proposals_{column}"), "saas_equipo_change_proposals", [column], unique=False)


def downgrade() -> None:
    op.drop_table("saas_equipo_change_proposals")
    op.drop_table("saas_equipo_locks")
    op.drop_table("saas_equipo_edt_assignments")
    op.drop_table("saas_equipo_seats")
