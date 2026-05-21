"""add proyecto apu cpc

Revision ID: ad9e0f1a2b3c
Revises: 0f1e2d3c4b5a
Create Date: 2026-04-30 00:00:00.000000
"""

from alembic import op
import sqlalchemy as sa


revision = "ad9e0f1a2b3c"
down_revision = "0f1e2d3c4b5a"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "proyecto_apu_cpc",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("empresa_id", sa.Integer(), nullable=False),
        sa.Column("proyecto_root_codigo", sa.String(length=50), nullable=False),
        sa.Column("apu_id", sa.Integer(), nullable=False),
        sa.Column("cod_cpc_id", sa.Integer(), nullable=False),
        sa.Column("updated_by_usuario_id", sa.Integer(), nullable=True),
        sa.Column("fecha_creacion", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=True),
        sa.Column("ultima_modificacion", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["apu_id"], ["apus.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["cod_cpc_id"], ["codcpc.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["empresa_id"], ["empresas.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["updated_by_usuario_id"], ["usuarios.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("empresa_id", "proyecto_root_codigo", "apu_id", name="uq_proyecto_apu_cpc_empresa_root_apu"),
    )
    op.create_index(op.f("ix_proyecto_apu_cpc_id"), "proyecto_apu_cpc", ["id"], unique=False)
    op.create_index(op.f("ix_proyecto_apu_cpc_empresa_id"), "proyecto_apu_cpc", ["empresa_id"], unique=False)
    op.create_index(op.f("ix_proyecto_apu_cpc_proyecto_root_codigo"), "proyecto_apu_cpc", ["proyecto_root_codigo"], unique=False)
    op.create_index(op.f("ix_proyecto_apu_cpc_apu_id"), "proyecto_apu_cpc", ["apu_id"], unique=False)
    op.create_index(op.f("ix_proyecto_apu_cpc_cod_cpc_id"), "proyecto_apu_cpc", ["cod_cpc_id"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_proyecto_apu_cpc_cod_cpc_id"), table_name="proyecto_apu_cpc")
    op.drop_index(op.f("ix_proyecto_apu_cpc_apu_id"), table_name="proyecto_apu_cpc")
    op.drop_index(op.f("ix_proyecto_apu_cpc_proyecto_root_codigo"), table_name="proyecto_apu_cpc")
    op.drop_index(op.f("ix_proyecto_apu_cpc_empresa_id"), table_name="proyecto_apu_cpc")
    op.drop_index(op.f("ix_proyecto_apu_cpc_id"), table_name="proyecto_apu_cpc")
    op.drop_table("proyecto_apu_cpc")
