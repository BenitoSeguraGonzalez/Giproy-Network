"""bim rollout plans

Revision ID: de2010a1b2c3
Revises: de2009a1b2c3
Create Date: 2026-07-11
"""
from alembic import op
import sqlalchemy as sa

revision = "de2010a1b2c3"
down_revision = "de2009a1b2c3"
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "bim_rollout_plans",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("empresa_id", sa.Integer(), nullable=False),
        sa.Column("stage", sa.String(30), nullable=False),
        sa.Column("status", sa.String(30), nullable=False),
        sa.Column("checklist_json", sa.JSON(), nullable=False),
        sa.Column("support_owner", sa.String(255), nullable=False),
        sa.Column("exit_criteria", sa.Text(), nullable=False),
        sa.Column("rollback_procedure", sa.Text(), nullable=False),
        sa.Column("rollback_rehearsed_at", sa.DateTime(timezone=True)),
        sa.Column("rollback_rehearsed_by", sa.Integer()),
        sa.Column("updated_by", sa.Integer()),
        sa.Column("fecha_creacion", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("fecha_actualizacion", sa.DateTime(timezone=True)),
        sa.ForeignKeyConstraint(["empresa_id"], ["empresas.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["rollback_rehearsed_by"], ["usuarios.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["updated_by"], ["usuarios.id"], ondelete="SET NULL"),
        sa.UniqueConstraint("empresa_id", name="uq_bim_rollout_plan_company"),
    )
    op.create_index("ix_bim_rollout_plans_empresa_id", "bim_rollout_plans", ["empresa_id"])


def downgrade():
    op.drop_table("bim_rollout_plans")
