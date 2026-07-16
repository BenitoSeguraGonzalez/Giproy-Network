"""gantt drafts and edit locks

Revision ID: ab1984c0d1e2
Revises: ff5a6b7c8d9e
Create Date: 2026-06-26
"""

from alembic import op
import sqlalchemy as sa


revision = "ab1984c0d1e2"
down_revision = "ff5a6b7c8d9e"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "cronogramas_gantt_drafts",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("empresa_id", sa.Integer(), nullable=False),
        sa.Column("proyecto_id", sa.Integer(), nullable=False),
        sa.Column("presupuesto_id", sa.Integer(), nullable=False),
        sa.Column("cronograma_id", sa.Integer(), nullable=False),
        sa.Column("status", sa.String(length=30), server_default="draft", nullable=False),
        sa.Column("version", sa.Integer(), server_default="1", nullable=False),
        sa.Column("base_snapshot", sa.JSON(), server_default="{}", nullable=False),
        sa.Column("intentions", sa.JSON(), server_default="[]", nullable=False),
        sa.Column("preview_snapshot", sa.JSON(), server_default="{}", nullable=False),
        sa.Column("invalidations", sa.JSON(), server_default="[]", nullable=False),
        sa.Column("audit_log", sa.JSON(), server_default="[]", nullable=False),
        sa.Column("created_by_id", sa.Integer(), nullable=True),
        sa.Column("updated_by_id", sa.Integer(), nullable=True),
        sa.Column("applied_by_id", sa.Integer(), nullable=True),
        sa.Column("applied_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("cancelled_by_id", sa.Integer(), nullable=True),
        sa.Column("cancelled_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("cancellation_reason", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["applied_by_id"], ["usuarios.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["cancelled_by_id"], ["usuarios.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["created_by_id"], ["usuarios.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["cronograma_id"], ["cronogramas_trabajo.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["empresa_id"], ["empresas.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["presupuesto_id"], ["presupuestos.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["proyecto_id"], ["proyectos.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["updated_by_id"], ["usuarios.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_cronogramas_gantt_drafts_id"), "cronogramas_gantt_drafts", ["id"], unique=False)
    op.create_index(op.f("ix_cronogramas_gantt_drafts_empresa_id"), "cronogramas_gantt_drafts", ["empresa_id"], unique=False)
    op.create_index(op.f("ix_cronogramas_gantt_drafts_proyecto_id"), "cronogramas_gantt_drafts", ["proyecto_id"], unique=False)
    op.create_index(op.f("ix_cronogramas_gantt_drafts_presupuesto_id"), "cronogramas_gantt_drafts", ["presupuesto_id"], unique=False)
    op.create_index(op.f("ix_cronogramas_gantt_drafts_cronograma_id"), "cronogramas_gantt_drafts", ["cronograma_id"], unique=False)
    op.create_index(op.f("ix_cronogramas_gantt_drafts_status"), "cronogramas_gantt_drafts", ["status"], unique=False)
    op.create_index(op.f("ix_cronogramas_gantt_drafts_created_by_id"), "cronogramas_gantt_drafts", ["created_by_id"], unique=False)
    op.create_index(op.f("ix_cronogramas_gantt_drafts_updated_by_id"), "cronogramas_gantt_drafts", ["updated_by_id"], unique=False)
    op.create_index(op.f("ix_cronogramas_gantt_drafts_applied_by_id"), "cronogramas_gantt_drafts", ["applied_by_id"], unique=False)
    op.create_index(op.f("ix_cronogramas_gantt_drafts_cancelled_by_id"), "cronogramas_gantt_drafts", ["cancelled_by_id"], unique=False)

    op.create_table(
        "cronogramas_gantt_edit_locks",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("empresa_id", sa.Integer(), nullable=False),
        sa.Column("proyecto_id", sa.Integer(), nullable=False),
        sa.Column("presupuesto_id", sa.Integer(), nullable=False),
        sa.Column("cronograma_id", sa.Integer(), nullable=False),
        sa.Column("status", sa.String(length=30), server_default="active", nullable=False),
        sa.Column("locked_by_user_id", sa.Integer(), nullable=True),
        sa.Column("locked_by_name", sa.String(length=255), nullable=True),
        sa.Column("requested_release_by_user_id", sa.Integer(), nullable=True),
        sa.Column("requested_release_by_name", sa.String(length=255), nullable=True),
        sa.Column("request_message", sa.Text(), nullable=True),
        sa.Column("acquired_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("last_heartbeat_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("released_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("audit_log", sa.JSON(), server_default="[]", nullable=False),
        sa.ForeignKeyConstraint(["cronograma_id"], ["cronogramas_trabajo.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["empresa_id"], ["empresas.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["locked_by_user_id"], ["usuarios.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["presupuesto_id"], ["presupuestos.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["proyecto_id"], ["proyectos.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["requested_release_by_user_id"], ["usuarios.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("cronograma_id", name="uq_cronogramas_gantt_edit_locks_cronograma_id"),
    )
    op.create_index(op.f("ix_cronogramas_gantt_edit_locks_id"), "cronogramas_gantt_edit_locks", ["id"], unique=False)
    op.create_index(op.f("ix_cronogramas_gantt_edit_locks_empresa_id"), "cronogramas_gantt_edit_locks", ["empresa_id"], unique=False)
    op.create_index(op.f("ix_cronogramas_gantt_edit_locks_proyecto_id"), "cronogramas_gantt_edit_locks", ["proyecto_id"], unique=False)
    op.create_index(op.f("ix_cronogramas_gantt_edit_locks_presupuesto_id"), "cronogramas_gantt_edit_locks", ["presupuesto_id"], unique=False)
    op.create_index(op.f("ix_cronogramas_gantt_edit_locks_cronograma_id"), "cronogramas_gantt_edit_locks", ["cronograma_id"], unique=False)
    op.create_index(op.f("ix_cronogramas_gantt_edit_locks_status"), "cronogramas_gantt_edit_locks", ["status"], unique=False)
    op.create_index(op.f("ix_cronogramas_gantt_edit_locks_locked_by_user_id"), "cronogramas_gantt_edit_locks", ["locked_by_user_id"], unique=False)
    op.create_index(op.f("ix_cronogramas_gantt_edit_locks_requested_release_by_user_id"), "cronogramas_gantt_edit_locks", ["requested_release_by_user_id"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_cronogramas_gantt_edit_locks_requested_release_by_user_id"), table_name="cronogramas_gantt_edit_locks")
    op.drop_index(op.f("ix_cronogramas_gantt_edit_locks_locked_by_user_id"), table_name="cronogramas_gantt_edit_locks")
    op.drop_index(op.f("ix_cronogramas_gantt_edit_locks_status"), table_name="cronogramas_gantt_edit_locks")
    op.drop_index(op.f("ix_cronogramas_gantt_edit_locks_cronograma_id"), table_name="cronogramas_gantt_edit_locks")
    op.drop_index(op.f("ix_cronogramas_gantt_edit_locks_presupuesto_id"), table_name="cronogramas_gantt_edit_locks")
    op.drop_index(op.f("ix_cronogramas_gantt_edit_locks_proyecto_id"), table_name="cronogramas_gantt_edit_locks")
    op.drop_index(op.f("ix_cronogramas_gantt_edit_locks_empresa_id"), table_name="cronogramas_gantt_edit_locks")
    op.drop_index(op.f("ix_cronogramas_gantt_edit_locks_id"), table_name="cronogramas_gantt_edit_locks")
    op.drop_table("cronogramas_gantt_edit_locks")

    op.drop_index(op.f("ix_cronogramas_gantt_drafts_cancelled_by_id"), table_name="cronogramas_gantt_drafts")
    op.drop_index(op.f("ix_cronogramas_gantt_drafts_applied_by_id"), table_name="cronogramas_gantt_drafts")
    op.drop_index(op.f("ix_cronogramas_gantt_drafts_updated_by_id"), table_name="cronogramas_gantt_drafts")
    op.drop_index(op.f("ix_cronogramas_gantt_drafts_created_by_id"), table_name="cronogramas_gantt_drafts")
    op.drop_index(op.f("ix_cronogramas_gantt_drafts_status"), table_name="cronogramas_gantt_drafts")
    op.drop_index(op.f("ix_cronogramas_gantt_drafts_cronograma_id"), table_name="cronogramas_gantt_drafts")
    op.drop_index(op.f("ix_cronogramas_gantt_drafts_presupuesto_id"), table_name="cronogramas_gantt_drafts")
    op.drop_index(op.f("ix_cronogramas_gantt_drafts_proyecto_id"), table_name="cronogramas_gantt_drafts")
    op.drop_index(op.f("ix_cronogramas_gantt_drafts_empresa_id"), table_name="cronogramas_gantt_drafts")
    op.drop_index(op.f("ix_cronogramas_gantt_drafts_id"), table_name="cronogramas_gantt_drafts")
    op.drop_table("cronogramas_gantt_drafts")
