"""add blocking actor to community dm threads

Revision ID: 3f1b2c4d5e6f
Revises: 1c9a4b2d8e77
Create Date: 2026-03-21 18:40:00
"""

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "3f1b2c4d5e6f"
down_revision = "1c9a4b2d8e77"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "community_dm_threads",
        sa.Column("blocked_by_user_id", sa.Integer(), nullable=True),
    )
    op.create_index(
        op.f("ix_community_dm_threads_blocked_by_user_id"),
        "community_dm_threads",
        ["blocked_by_user_id"],
        unique=False,
    )
    op.create_foreign_key(
        "fk_community_dm_threads_blocked_by_user_id_usuarios",
        "community_dm_threads",
        "usuarios",
        ["blocked_by_user_id"],
        ["id"],
        ondelete="SET NULL",
    )


def downgrade() -> None:
    op.drop_constraint(
        "fk_community_dm_threads_blocked_by_user_id_usuarios",
        "community_dm_threads",
        type_="foreignkey",
    )
    op.drop_index(op.f("ix_community_dm_threads_blocked_by_user_id"), table_name="community_dm_threads")
    op.drop_column("community_dm_threads", "blocked_by_user_id")
