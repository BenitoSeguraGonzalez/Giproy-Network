"""saas conecta slots

Revision ID: ba1c2d3e4f50
Revises: f9c0d1e2f3a4
Create Date: 2026-06-08 00:00:00.000000
"""

from alembic import op
import sqlalchemy as sa


revision = "ba1c2d3e4f50"
down_revision = "f9c0d1e2f3a4"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "saas_conecta_slots",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("empresa_id", sa.Integer(), nullable=False),
        sa.Column("owner_user_id", sa.Integer(), nullable=False),
        sa.Column("connected_user_id", sa.Integer(), nullable=True),
        sa.Column("invited_email", sa.String(length=255), nullable=True),
        sa.Column("status", sa.String(length=30), server_default="active", nullable=False),
        sa.Column("source_right_code", sa.String(length=80), nullable=True),
        sa.Column("assigned_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("released_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("last_reassignment_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("forced_by_user_id", sa.Integer(), nullable=True),
        sa.Column("audit_reason", sa.String(length=500), nullable=True),
        sa.Column("metadata_json", sa.JSON(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["connected_user_id"], ["usuarios.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["empresa_id"], ["empresas.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["forced_by_user_id"], ["usuarios.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["owner_user_id"], ["usuarios.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_saas_conecta_slots_assigned_at"), "saas_conecta_slots", ["assigned_at"], unique=False)
    op.create_index(op.f("ix_saas_conecta_slots_connected_user_id"), "saas_conecta_slots", ["connected_user_id"], unique=False)
    op.create_index(op.f("ix_saas_conecta_slots_empresa_id"), "saas_conecta_slots", ["empresa_id"], unique=False)
    op.create_index(op.f("ix_saas_conecta_slots_forced_by_user_id"), "saas_conecta_slots", ["forced_by_user_id"], unique=False)
    op.create_index(op.f("ix_saas_conecta_slots_id"), "saas_conecta_slots", ["id"], unique=False)
    op.create_index(op.f("ix_saas_conecta_slots_invited_email"), "saas_conecta_slots", ["invited_email"], unique=False)
    op.create_index(op.f("ix_saas_conecta_slots_owner_user_id"), "saas_conecta_slots", ["owner_user_id"], unique=False)
    op.create_index(op.f("ix_saas_conecta_slots_source_right_code"), "saas_conecta_slots", ["source_right_code"], unique=False)
    op.create_index(op.f("ix_saas_conecta_slots_status"), "saas_conecta_slots", ["status"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_saas_conecta_slots_status"), table_name="saas_conecta_slots")
    op.drop_index(op.f("ix_saas_conecta_slots_source_right_code"), table_name="saas_conecta_slots")
    op.drop_index(op.f("ix_saas_conecta_slots_owner_user_id"), table_name="saas_conecta_slots")
    op.drop_index(op.f("ix_saas_conecta_slots_invited_email"), table_name="saas_conecta_slots")
    op.drop_index(op.f("ix_saas_conecta_slots_id"), table_name="saas_conecta_slots")
    op.drop_index(op.f("ix_saas_conecta_slots_forced_by_user_id"), table_name="saas_conecta_slots")
    op.drop_index(op.f("ix_saas_conecta_slots_empresa_id"), table_name="saas_conecta_slots")
    op.drop_index(op.f("ix_saas_conecta_slots_connected_user_id"), table_name="saas_conecta_slots")
    op.drop_index(op.f("ix_saas_conecta_slots_assigned_at"), table_name="saas_conecta_slots")
    op.drop_table("saas_conecta_slots")
