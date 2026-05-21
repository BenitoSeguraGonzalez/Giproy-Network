"""add community topic follows

Revision ID: b1c4d6e8f9a0
Revises: a6f4d2b8c1e0
Create Date: 2026-03-22
"""

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "b1c4d6e8f9a0"
down_revision = "a6f4d2b8c1e0"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "community_topic_follows",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("topic_id", sa.Integer(), nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["topic_id"], ["community_topics.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["user_id"], ["usuarios.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("topic_id", "user_id", name="uq_community_topic_follows_topic_user"),
    )
    op.create_index(op.f("ix_community_topic_follows_topic_id"), "community_topic_follows", ["topic_id"], unique=False)
    op.create_index(op.f("ix_community_topic_follows_user_id"), "community_topic_follows", ["user_id"], unique=False)
    op.create_index(op.f("ix_community_topic_follows_created_at"), "community_topic_follows", ["created_at"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_community_topic_follows_created_at"), table_name="community_topic_follows")
    op.drop_index(op.f("ix_community_topic_follows_user_id"), table_name="community_topic_follows")
    op.drop_index(op.f("ix_community_topic_follows_topic_id"), table_name="community_topic_follows")
    op.drop_table("community_topic_follows")
