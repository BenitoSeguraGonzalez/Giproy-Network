"""system announcements

Revision ID: a13e4f2c9d20
Revises: 5e7a2c4d9b11
Create Date: 2026-03-12
"""

from alembic import op
import sqlalchemy as sa


revision = "a13e4f2c9d20"
down_revision = "5e7a2c4d9b11"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "system_announcements",
        sa.Column("id", sa.Integer(), primary_key=True, nullable=False),
        sa.Column("titulo", sa.String(length=255), nullable=False),
        sa.Column("mensaje", sa.Text(), nullable=False),
        sa.Column("tipo", sa.String(length=20), nullable=False, server_default="info"),
        sa.Column("scope", sa.String(length=20), nullable=False, server_default="global"),
        sa.Column("empresa_id", sa.Integer(), nullable=True),
        sa.Column("starts_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("ends_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.Column("created_by", sa.Integer(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["empresa_id"], ["empresas.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["created_by"], ["usuarios.id"], ondelete="SET NULL"),
    )
    op.create_index("ix_system_announcements_id", "system_announcements", ["id"], unique=False)
    op.create_index("ix_system_announcements_titulo", "system_announcements", ["titulo"], unique=False)
    op.create_index("ix_system_announcements_empresa_id", "system_announcements", ["empresa_id"], unique=False)


def downgrade() -> None:
    op.drop_index("ix_system_announcements_empresa_id", table_name="system_announcements")
    op.drop_index("ix_system_announcements_titulo", table_name="system_announcements")
    op.drop_index("ix_system_announcements_id", table_name="system_announcements")
    op.drop_table("system_announcements")
