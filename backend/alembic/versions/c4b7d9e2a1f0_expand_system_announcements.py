"""expand system announcements

Revision ID: c4b7d9e2a1f0
Revises: f2a4c6e8b9d1
Create Date: 2026-03-12
"""

from alembic import op
import sqlalchemy as sa


revision = "c4b7d9e2a1f0"
down_revision = "f2a4c6e8b9d1"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "system_announcements",
        sa.Column("display_duration_seconds", sa.Integer(), nullable=True, server_default="30"),
    )
    op.alter_column("system_announcements", "display_duration_seconds", server_default=None)

    op.create_table(
        "system_announcement_companies",
        sa.Column("announcement_id", sa.Integer(), sa.ForeignKey("system_announcements.id", ondelete="CASCADE"), nullable=False),
        sa.Column("empresa_id", sa.Integer(), sa.ForeignKey("empresas.id", ondelete="CASCADE"), nullable=False),
        sa.PrimaryKeyConstraint("announcement_id", "empresa_id"),
    )

    op.execute(
        """
        INSERT INTO system_announcement_companies (announcement_id, empresa_id)
        SELECT id, empresa_id
        FROM system_announcements
        WHERE empresa_id IS NOT NULL
        """
    )


def downgrade() -> None:
    op.drop_table("system_announcement_companies")
    op.drop_column("system_announcements", "display_duration_seconds")
