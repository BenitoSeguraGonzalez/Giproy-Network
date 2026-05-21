"""add project documents

Revision ID: fe4f5a6b7c8d
Revises: fd3e4f5a6b7c
Create Date: 2026-04-24 20:10:00.000000
"""

from alembic import op
import sqlalchemy as sa


revision = "fe4f5a6b7c8d"
down_revision = "fd3e4f5a6b7c"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "proyecto_documentos",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("codigo_root", sa.String(length=50), nullable=False),
        sa.Column("empresa_id", sa.Integer(), nullable=False),
        sa.Column("uploaded_by_user_id", sa.Integer(), nullable=True),
        sa.Column("file_name", sa.String(length=255), nullable=False),
        sa.Column("storage_path", sa.String(length=1024), nullable=False),
        sa.Column("content_type", sa.String(length=120), nullable=False),
        sa.Column("size_bytes", sa.Integer(), server_default="0", nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["empresa_id"], ["empresas.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["uploaded_by_user_id"], ["usuarios.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_proyecto_documentos_id"), "proyecto_documentos", ["id"], unique=False)
    op.create_index(op.f("ix_proyecto_documentos_codigo_root"), "proyecto_documentos", ["codigo_root"], unique=False)
    op.create_index(op.f("ix_proyecto_documentos_empresa_id"), "proyecto_documentos", ["empresa_id"], unique=False)
    op.create_index(op.f("ix_proyecto_documentos_uploaded_by_user_id"), "proyecto_documentos", ["uploaded_by_user_id"], unique=False)
    op.create_index(op.f("ix_proyecto_documentos_created_at"), "proyecto_documentos", ["created_at"], unique=False)
    op.create_index(op.f("ix_proyecto_documentos_deleted_at"), "proyecto_documentos", ["deleted_at"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_proyecto_documentos_deleted_at"), table_name="proyecto_documentos")
    op.drop_index(op.f("ix_proyecto_documentos_created_at"), table_name="proyecto_documentos")
    op.drop_index(op.f("ix_proyecto_documentos_uploaded_by_user_id"), table_name="proyecto_documentos")
    op.drop_index(op.f("ix_proyecto_documentos_empresa_id"), table_name="proyecto_documentos")
    op.drop_index(op.f("ix_proyecto_documentos_codigo_root"), table_name="proyecto_documentos")
    op.drop_index(op.f("ix_proyecto_documentos_id"), table_name="proyecto_documentos")
    op.drop_table("proyecto_documentos")
