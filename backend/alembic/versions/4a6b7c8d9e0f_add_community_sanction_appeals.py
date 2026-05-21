"""add community sanction appeals

Revision ID: 4a6b7c8d9e0f
Revises: 3f1b2c4d5e6f
Create Date: 2026-03-21 19:10:00
"""

from alembic import op
import sqlalchemy as sa


revision = "4a6b7c8d9e0f"
down_revision = "3f1b2c4d5e6f"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "community_sanction_appeals",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("sanction_id", sa.Integer(), nullable=False),
        sa.Column("appellant_user_id", sa.Integer(), nullable=False),
        sa.Column("reviewed_by_user_id", sa.Integer(), nullable=True),
        sa.Column("status", sa.String(length=30), nullable=False, server_default="abierta"),
        sa.Column("reason", sa.Text(), nullable=False),
        sa.Column("resolution_note", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("CURRENT_TIMESTAMP")),
        sa.Column("reviewed_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["appellant_user_id"], ["usuarios.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["reviewed_by_user_id"], ["usuarios.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["sanction_id"], ["community_sanctions.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_community_sanction_appeals_id"), "community_sanction_appeals", ["id"], unique=False)
    op.create_index(op.f("ix_community_sanction_appeals_sanction_id"), "community_sanction_appeals", ["sanction_id"], unique=False)
    op.create_index(op.f("ix_community_sanction_appeals_appellant_user_id"), "community_sanction_appeals", ["appellant_user_id"], unique=False)
    op.create_index(op.f("ix_community_sanction_appeals_reviewed_by_user_id"), "community_sanction_appeals", ["reviewed_by_user_id"], unique=False)
    op.create_index(op.f("ix_community_sanction_appeals_status"), "community_sanction_appeals", ["status"], unique=False)
    op.create_index(op.f("ix_community_sanction_appeals_created_at"), "community_sanction_appeals", ["created_at"], unique=False)
    op.create_index(op.f("ix_community_sanction_appeals_reviewed_at"), "community_sanction_appeals", ["reviewed_at"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_community_sanction_appeals_reviewed_at"), table_name="community_sanction_appeals")
    op.drop_index(op.f("ix_community_sanction_appeals_created_at"), table_name="community_sanction_appeals")
    op.drop_index(op.f("ix_community_sanction_appeals_status"), table_name="community_sanction_appeals")
    op.drop_index(op.f("ix_community_sanction_appeals_reviewed_by_user_id"), table_name="community_sanction_appeals")
    op.drop_index(op.f("ix_community_sanction_appeals_appellant_user_id"), table_name="community_sanction_appeals")
    op.drop_index(op.f("ix_community_sanction_appeals_sanction_id"), table_name="community_sanction_appeals")
    op.drop_index(op.f("ix_community_sanction_appeals_id"), table_name="community_sanction_appeals")
    op.drop_table("community_sanction_appeals")
