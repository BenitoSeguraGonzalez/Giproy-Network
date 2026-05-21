"""add community attachments

Revision ID: 5b7c9d1e2f3a
Revises: 4a6b7c8d9e0f
Create Date: 2026-03-21 21:10:00
"""

from alembic import op
import sqlalchemy as sa


revision = "5b7c9d1e2f3a"
down_revision = "4a6b7c8d9e0f"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "community_attachments",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("post_id", sa.Integer(), nullable=True),
        sa.Column("reply_id", sa.Integer(), nullable=True),
        sa.Column("created_by_user_id", sa.Integer(), nullable=True),
        sa.Column("target_empresa_id", sa.Integer(), nullable=False),
        sa.Column("scope", sa.String(length=30), nullable=False, server_default="interno_empresa"),
        sa.Column("file_name", sa.String(length=255), nullable=False),
        sa.Column("storage_path", sa.String(length=500), nullable=False),
        sa.Column("public_url", sa.String(length=500), nullable=False),
        sa.Column("content_type", sa.String(length=120), nullable=False),
        sa.Column("size_bytes", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("CURRENT_TIMESTAMP")),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["created_by_user_id"], ["usuarios.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["post_id"], ["community_posts.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["reply_id"], ["community_post_replies.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["target_empresa_id"], ["empresas.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_community_attachments_id"), "community_attachments", ["id"], unique=False)
    op.create_index(op.f("ix_community_attachments_post_id"), "community_attachments", ["post_id"], unique=False)
    op.create_index(op.f("ix_community_attachments_reply_id"), "community_attachments", ["reply_id"], unique=False)
    op.create_index(op.f("ix_community_attachments_created_by_user_id"), "community_attachments", ["created_by_user_id"], unique=False)
    op.create_index(op.f("ix_community_attachments_target_empresa_id"), "community_attachments", ["target_empresa_id"], unique=False)
    op.create_index(op.f("ix_community_attachments_scope"), "community_attachments", ["scope"], unique=False)
    op.create_index(op.f("ix_community_attachments_expires_at"), "community_attachments", ["expires_at"], unique=False)
    op.create_index(op.f("ix_community_attachments_created_at"), "community_attachments", ["created_at"], unique=False)
    op.create_index(op.f("ix_community_attachments_deleted_at"), "community_attachments", ["deleted_at"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_community_attachments_deleted_at"), table_name="community_attachments")
    op.drop_index(op.f("ix_community_attachments_created_at"), table_name="community_attachments")
    op.drop_index(op.f("ix_community_attachments_expires_at"), table_name="community_attachments")
    op.drop_index(op.f("ix_community_attachments_scope"), table_name="community_attachments")
    op.drop_index(op.f("ix_community_attachments_target_empresa_id"), table_name="community_attachments")
    op.drop_index(op.f("ix_community_attachments_created_by_user_id"), table_name="community_attachments")
    op.drop_index(op.f("ix_community_attachments_reply_id"), table_name="community_attachments")
    op.drop_index(op.f("ix_community_attachments_post_id"), table_name="community_attachments")
    op.drop_index(op.f("ix_community_attachments_id"), table_name="community_attachments")
    op.drop_table("community_attachments")
