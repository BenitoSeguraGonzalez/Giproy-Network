"""add cronograma recursos state

Revision ID: ae8f9a0b1c2d
Revises: ac7d8e9f10a1
Create Date: 2026-05-26
"""

from alembic import op
import sqlalchemy as sa


revision = "ae8f9a0b1c2d"
down_revision = "ac7d8e9f10a1"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "cronogramas_recursos_state",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("empresa_id", sa.Integer(), nullable=False),
        sa.Column("proyecto_id", sa.Integer(), nullable=False),
        sa.Column("presupuesto_id", sa.Integer(), nullable=False),
        sa.Column("version", sa.Integer(), server_default="1", nullable=False),
        sa.Column("adjustments", sa.JSON(), server_default="{}", nullable=False),
        sa.Column("updated_by_id", sa.Integer(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["empresa_id"], ["empresas.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["proyecto_id"], ["proyectos.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["presupuesto_id"], ["presupuestos.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["updated_by_id"], ["usuarios.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("presupuesto_id", name="uq_cronogramas_recursos_state_presupuesto_id"),
    )
    op.create_index(op.f("ix_cronogramas_recursos_state_id"), "cronogramas_recursos_state", ["id"], unique=False)
    op.create_index(op.f("ix_cronogramas_recursos_state_empresa_id"), "cronogramas_recursos_state", ["empresa_id"], unique=False)
    op.create_index(op.f("ix_cronogramas_recursos_state_proyecto_id"), "cronogramas_recursos_state", ["proyecto_id"], unique=False)
    op.create_index(op.f("ix_cronogramas_recursos_state_presupuesto_id"), "cronogramas_recursos_state", ["presupuesto_id"], unique=False)
    op.create_index(op.f("ix_cronogramas_recursos_state_updated_by_id"), "cronogramas_recursos_state", ["updated_by_id"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_cronogramas_recursos_state_updated_by_id"), table_name="cronogramas_recursos_state")
    op.drop_index(op.f("ix_cronogramas_recursos_state_presupuesto_id"), table_name="cronogramas_recursos_state")
    op.drop_index(op.f("ix_cronogramas_recursos_state_proyecto_id"), table_name="cronogramas_recursos_state")
    op.drop_index(op.f("ix_cronogramas_recursos_state_empresa_id"), table_name="cronogramas_recursos_state")
    op.drop_index(op.f("ix_cronogramas_recursos_state_id"), table_name="cronogramas_recursos_state")
    op.drop_table("cronogramas_recursos_state")
