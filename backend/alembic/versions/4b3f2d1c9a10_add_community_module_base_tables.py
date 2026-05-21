"""add_community_module_base_tables

Revision ID: 4b3f2d1c9a10
Revises: 2f014d9a72ab
Create Date: 2026-03-21 14:10:00.000000
"""
from alembic import op
import sqlalchemy as sa


revision = "4b3f2d1c9a10"
down_revision = "2f014d9a72ab"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "community_posts",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("scope", sa.String(length=30), nullable=False),
        sa.Column("status", sa.String(length=30), nullable=False),
        sa.Column("title", sa.String(length=255), nullable=False),
        sa.Column("body", sa.Text(), nullable=False),
        sa.Column("allow_replies", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.Column("is_pinned", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.Column("author_user_id", sa.Integer(), nullable=False),
        sa.Column("empresa_id", sa.Integer(), nullable=True),
        sa.Column("target_empresa_id", sa.Integer(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["author_user_id"], ["usuarios.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["empresa_id"], ["empresas.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["target_empresa_id"], ["empresas.id"], ondelete="CASCADE"),
    )
    op.create_index(op.f("ix_community_posts_scope"), "community_posts", ["scope"], unique=False)
    op.create_index(op.f("ix_community_posts_status"), "community_posts", ["status"], unique=False)
    op.create_index(op.f("ix_community_posts_author_user_id"), "community_posts", ["author_user_id"], unique=False)
    op.create_index(op.f("ix_community_posts_empresa_id"), "community_posts", ["empresa_id"], unique=False)
    op.create_index(op.f("ix_community_posts_target_empresa_id"), "community_posts", ["target_empresa_id"], unique=False)
    op.create_index(op.f("ix_community_posts_created_at"), "community_posts", ["created_at"], unique=False)
    op.create_index(op.f("ix_community_posts_deleted_at"), "community_posts", ["deleted_at"], unique=False)

    op.create_table(
        "community_post_replies",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("post_id", sa.Integer(), nullable=False),
        sa.Column("parent_reply_id", sa.Integer(), nullable=True),
        sa.Column("author_user_id", sa.Integer(), nullable=False),
        sa.Column("body", sa.Text(), nullable=False),
        sa.Column("status", sa.String(length=30), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["post_id"], ["community_posts.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["parent_reply_id"], ["community_post_replies.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["author_user_id"], ["usuarios.id"], ondelete="CASCADE"),
    )
    op.create_index(op.f("ix_community_post_replies_post_id"), "community_post_replies", ["post_id"], unique=False)
    op.create_index(op.f("ix_community_post_replies_parent_reply_id"), "community_post_replies", ["parent_reply_id"], unique=False)
    op.create_index(op.f("ix_community_post_replies_author_user_id"), "community_post_replies", ["author_user_id"], unique=False)
    op.create_index(op.f("ix_community_post_replies_status"), "community_post_replies", ["status"], unique=False)
    op.create_index(op.f("ix_community_post_replies_created_at"), "community_post_replies", ["created_at"], unique=False)
    op.create_index(op.f("ix_community_post_replies_deleted_at"), "community_post_replies", ["deleted_at"], unique=False)

    op.create_table(
        "community_dm_threads",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("user_a_id", sa.Integer(), nullable=False),
        sa.Column("user_b_id", sa.Integer(), nullable=False),
        sa.Column("empresa_context_id", sa.Integer(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.Column("blocked_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["user_a_id"], ["usuarios.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["user_b_id"], ["usuarios.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["empresa_context_id"], ["empresas.id"], ondelete="SET NULL"),
        sa.UniqueConstraint("user_a_id", "user_b_id", name="uq_community_dm_threads_pair"),
    )
    op.create_index(op.f("ix_community_dm_threads_user_a_id"), "community_dm_threads", ["user_a_id"], unique=False)
    op.create_index(op.f("ix_community_dm_threads_user_b_id"), "community_dm_threads", ["user_b_id"], unique=False)
    op.create_index(op.f("ix_community_dm_threads_empresa_context_id"), "community_dm_threads", ["empresa_context_id"], unique=False)
    op.create_index(op.f("ix_community_dm_threads_created_at"), "community_dm_threads", ["created_at"], unique=False)
    op.create_index(op.f("ix_community_dm_threads_updated_at"), "community_dm_threads", ["updated_at"], unique=False)
    op.create_index(op.f("ix_community_dm_threads_blocked_at"), "community_dm_threads", ["blocked_at"], unique=False)

    op.create_table(
        "community_dm_messages",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("thread_id", sa.Integer(), nullable=False),
        sa.Column("author_user_id", sa.Integer(), nullable=False),
        sa.Column("body", sa.Text(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.Column("read_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["thread_id"], ["community_dm_threads.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["author_user_id"], ["usuarios.id"], ondelete="CASCADE"),
    )
    op.create_index(op.f("ix_community_dm_messages_thread_id"), "community_dm_messages", ["thread_id"], unique=False)
    op.create_index(op.f("ix_community_dm_messages_author_user_id"), "community_dm_messages", ["author_user_id"], unique=False)
    op.create_index(op.f("ix_community_dm_messages_created_at"), "community_dm_messages", ["created_at"], unique=False)
    op.create_index(op.f("ix_community_dm_messages_read_at"), "community_dm_messages", ["read_at"], unique=False)
    op.create_index(op.f("ix_community_dm_messages_deleted_at"), "community_dm_messages", ["deleted_at"], unique=False)

    op.create_table(
        "community_sanctions",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("target_user_id", sa.Integer(), nullable=False),
        sa.Column("issued_by_user_id", sa.Integer(), nullable=True),
        sa.Column("sanction_type", sa.String(length=40), nullable=False),
        sa.Column("scope", sa.String(length=40), nullable=False),
        sa.Column("target_empresa_id", sa.Integer(), nullable=True),
        sa.Column("reason", sa.Text(), nullable=True),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["target_user_id"], ["usuarios.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["issued_by_user_id"], ["usuarios.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["target_empresa_id"], ["empresas.id"], ondelete="CASCADE"),
    )
    op.create_index(op.f("ix_community_sanctions_target_user_id"), "community_sanctions", ["target_user_id"], unique=False)
    op.create_index(op.f("ix_community_sanctions_issued_by_user_id"), "community_sanctions", ["issued_by_user_id"], unique=False)
    op.create_index(op.f("ix_community_sanctions_sanction_type"), "community_sanctions", ["sanction_type"], unique=False)
    op.create_index(op.f("ix_community_sanctions_scope"), "community_sanctions", ["scope"], unique=False)
    op.create_index(op.f("ix_community_sanctions_target_empresa_id"), "community_sanctions", ["target_empresa_id"], unique=False)
    op.create_index(op.f("ix_community_sanctions_is_active"), "community_sanctions", ["is_active"], unique=False)
    op.create_index(op.f("ix_community_sanctions_created_at"), "community_sanctions", ["created_at"], unique=False)
    op.create_index(op.f("ix_community_sanctions_expires_at"), "community_sanctions", ["expires_at"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_community_sanctions_expires_at"), table_name="community_sanctions")
    op.drop_index(op.f("ix_community_sanctions_created_at"), table_name="community_sanctions")
    op.drop_index(op.f("ix_community_sanctions_is_active"), table_name="community_sanctions")
    op.drop_index(op.f("ix_community_sanctions_target_empresa_id"), table_name="community_sanctions")
    op.drop_index(op.f("ix_community_sanctions_scope"), table_name="community_sanctions")
    op.drop_index(op.f("ix_community_sanctions_sanction_type"), table_name="community_sanctions")
    op.drop_index(op.f("ix_community_sanctions_issued_by_user_id"), table_name="community_sanctions")
    op.drop_index(op.f("ix_community_sanctions_target_user_id"), table_name="community_sanctions")
    op.drop_table("community_sanctions")

    op.drop_index(op.f("ix_community_dm_messages_deleted_at"), table_name="community_dm_messages")
    op.drop_index(op.f("ix_community_dm_messages_read_at"), table_name="community_dm_messages")
    op.drop_index(op.f("ix_community_dm_messages_created_at"), table_name="community_dm_messages")
    op.drop_index(op.f("ix_community_dm_messages_author_user_id"), table_name="community_dm_messages")
    op.drop_index(op.f("ix_community_dm_messages_thread_id"), table_name="community_dm_messages")
    op.drop_table("community_dm_messages")

    op.drop_index(op.f("ix_community_dm_threads_blocked_at"), table_name="community_dm_threads")
    op.drop_index(op.f("ix_community_dm_threads_updated_at"), table_name="community_dm_threads")
    op.drop_index(op.f("ix_community_dm_threads_created_at"), table_name="community_dm_threads")
    op.drop_index(op.f("ix_community_dm_threads_empresa_context_id"), table_name="community_dm_threads")
    op.drop_index(op.f("ix_community_dm_threads_user_b_id"), table_name="community_dm_threads")
    op.drop_index(op.f("ix_community_dm_threads_user_a_id"), table_name="community_dm_threads")
    op.drop_table("community_dm_threads")

    op.drop_index(op.f("ix_community_post_replies_deleted_at"), table_name="community_post_replies")
    op.drop_index(op.f("ix_community_post_replies_created_at"), table_name="community_post_replies")
    op.drop_index(op.f("ix_community_post_replies_status"), table_name="community_post_replies")
    op.drop_index(op.f("ix_community_post_replies_author_user_id"), table_name="community_post_replies")
    op.drop_index(op.f("ix_community_post_replies_parent_reply_id"), table_name="community_post_replies")
    op.drop_index(op.f("ix_community_post_replies_post_id"), table_name="community_post_replies")
    op.drop_table("community_post_replies")

    op.drop_index(op.f("ix_community_posts_deleted_at"), table_name="community_posts")
    op.drop_index(op.f("ix_community_posts_created_at"), table_name="community_posts")
    op.drop_index(op.f("ix_community_posts_target_empresa_id"), table_name="community_posts")
    op.drop_index(op.f("ix_community_posts_empresa_id"), table_name="community_posts")
    op.drop_index(op.f("ix_community_posts_author_user_id"), table_name="community_posts")
    op.drop_index(op.f("ix_community_posts_status"), table_name="community_posts")
    op.drop_index(op.f("ix_community_posts_scope"), table_name="community_posts")
    op.drop_table("community_posts")
