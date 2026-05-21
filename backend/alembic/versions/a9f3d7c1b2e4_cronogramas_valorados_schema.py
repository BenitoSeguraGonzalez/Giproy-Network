"""cronogramas valorados schema

Revision ID: a9f3d7c1b2e4
Revises: c4b7d9e2a1f0, f4c6d9b8a1e2
Create Date: 2026-03-12 22:10:00.000000
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


revision = "a9f3d7c1b2e4"
down_revision = ("c4b7d9e2a1f0", "f4c6d9b8a1e2")
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "cronogramas_valorados",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("empresa_id", sa.Integer(), nullable=False),
        sa.Column("proyecto_id", sa.Integer(), nullable=False),
        sa.Column("presupuesto_id", sa.Integer(), nullable=False),
        sa.Column("period_type", sa.String(length=20), nullable=False, server_default="mensual"),
        sa.Column("distribution_mode", sa.String(length=20), nullable=False, server_default="homogeneo"),
        sa.Column("global_distribution", postgresql.JSONB(astext_type=sa.Text()), nullable=False, server_default=sa.text("'[]'::jsonb")),
        sa.Column("line_distribution_overrides", postgresql.JSONB(astext_type=sa.Text()), nullable=False, server_default=sa.text("'{}'::jsonb")),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["empresa_id"], ["empresas.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["presupuesto_id"], ["presupuestos.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["proyecto_id"], ["proyectos.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("presupuesto_id", name="uq_cronogramas_valorados_presupuesto_id"),
    )
    op.create_index(op.f("ix_cronogramas_valorados_id"), "cronogramas_valorados", ["id"], unique=False)
    op.create_index(op.f("ix_cronogramas_valorados_empresa_id"), "cronogramas_valorados", ["empresa_id"], unique=False)
    op.create_index(op.f("ix_cronogramas_valorados_proyecto_id"), "cronogramas_valorados", ["proyecto_id"], unique=False)
    op.create_index(op.f("ix_cronogramas_valorados_presupuesto_id"), "cronogramas_valorados", ["presupuesto_id"], unique=False)
    op.alter_column("cronogramas_valorados", "period_type", server_default=None)
    op.alter_column("cronogramas_valorados", "distribution_mode", server_default=None)


def downgrade() -> None:
    op.drop_index(op.f("ix_cronogramas_valorados_presupuesto_id"), table_name="cronogramas_valorados")
    op.drop_index(op.f("ix_cronogramas_valorados_proyecto_id"), table_name="cronogramas_valorados")
    op.drop_index(op.f("ix_cronogramas_valorados_empresa_id"), table_name="cronogramas_valorados")
    op.drop_index(op.f("ix_cronogramas_valorados_id"), table_name="cronogramas_valorados")
    op.drop_table("cronogramas_valorados")
