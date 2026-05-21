"""system bim settings

Revision ID: e7b9c1d4a2f0
Revises: c4b7d9e2a1f0
Create Date: 2026-03-26
"""

from alembic import op
import sqlalchemy as sa


revision = "e7b9c1d4a2f0"
down_revision = "c4b7d9e2a1f0"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "system_bim_settings",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("titulo", sa.String(length=255), nullable=False),
        sa.Column("descripcion", sa.Text(), nullable=True),
        sa.Column("is_enabled", sa.Boolean(), nullable=False, server_default="false"),
        sa.Column("superadmin_only", sa.Boolean(), nullable=False, server_default="true"),
        sa.Column("allowed_company_ids", sa.Text(), nullable=True),
        sa.Column("updated_by", sa.Integer(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["updated_by"], ["usuarios.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_system_bim_settings_id"), "system_bim_settings", ["id"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_system_bim_settings_id"), table_name="system_bim_settings")
    op.drop_table("system_bim_settings")
