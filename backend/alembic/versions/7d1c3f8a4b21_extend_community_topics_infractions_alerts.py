"""extend_community_topics_infractions_alerts

Revision ID: 7d1c3f8a4b21
Revises: 4b3f2d1c9a10
Create Date: 2026-03-21 18:40:00.000000
"""
from alembic import op
import sqlalchemy as sa


revision = "7d1c3f8a4b21"
down_revision = "4b3f2d1c9a10"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "community_topics",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("scope", sa.String(length=30), nullable=False),
        sa.Column("nombre", sa.String(length=160), nullable=False),
        sa.Column("descripcion", sa.Text(), nullable=True),
        sa.Column("is_restricted", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.Column("target_empresa_id", sa.Integer(), nullable=True),
        sa.Column("created_by_user_id", sa.Integer(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["target_empresa_id"], ["empresas.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["created_by_user_id"], ["usuarios.id"], ondelete="SET NULL"),
    )
    op.create_index(op.f("ix_community_topics_scope"), "community_topics", ["scope"], unique=False)
    op.create_index(op.f("ix_community_topics_nombre"), "community_topics", ["nombre"], unique=False)
    op.create_index(op.f("ix_community_topics_is_restricted"), "community_topics", ["is_restricted"], unique=False)
    op.create_index(op.f("ix_community_topics_is_active"), "community_topics", ["is_active"], unique=False)
    op.create_index(op.f("ix_community_topics_target_empresa_id"), "community_topics", ["target_empresa_id"], unique=False)
    op.create_index(op.f("ix_community_topics_created_by_user_id"), "community_topics", ["created_by_user_id"], unique=False)
    op.create_index(op.f("ix_community_topics_created_at"), "community_topics", ["created_at"], unique=False)

    op.create_table(
        "community_topic_members",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("topic_id", sa.Integer(), nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("added_by_user_id", sa.Integer(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.ForeignKeyConstraint(["topic_id"], ["community_topics.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["user_id"], ["usuarios.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["added_by_user_id"], ["usuarios.id"], ondelete="SET NULL"),
        sa.UniqueConstraint("topic_id", "user_id", name="uq_community_topic_members_topic_user"),
    )
    op.create_index(op.f("ix_community_topic_members_topic_id"), "community_topic_members", ["topic_id"], unique=False)
    op.create_index(op.f("ix_community_topic_members_user_id"), "community_topic_members", ["user_id"], unique=False)
    op.create_index(op.f("ix_community_topic_members_added_by_user_id"), "community_topic_members", ["added_by_user_id"], unique=False)
    op.create_index(op.f("ix_community_topic_members_created_at"), "community_topic_members", ["created_at"], unique=False)

    op.add_column("community_posts", sa.Column("topic_id", sa.Integer(), nullable=True))
    op.create_foreign_key(
        "fk_community_posts_topic_id_community_topics",
        "community_posts",
        "community_topics",
        ["topic_id"],
        ["id"],
        ondelete="SET NULL",
    )
    op.create_index(op.f("ix_community_posts_topic_id"), "community_posts", ["topic_id"], unique=False)

    op.create_table(
        "community_infractions",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("target_user_id", sa.Integer(), nullable=False),
        sa.Column("scope", sa.String(length=40), nullable=False),
        sa.Column("infraction_type", sa.String(length=40), nullable=False),
        sa.Column("content_type", sa.String(length=30), nullable=False),
        sa.Column("content_excerpt", sa.Text(), nullable=True),
        sa.Column("detected_link", sa.String(length=500), nullable=True),
        sa.Column("target_empresa_id", sa.Integer(), nullable=True),
        sa.Column("triggered_sanction_id", sa.Integer(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.ForeignKeyConstraint(["target_user_id"], ["usuarios.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["target_empresa_id"], ["empresas.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["triggered_sanction_id"], ["community_sanctions.id"], ondelete="SET NULL"),
    )
    op.create_index(op.f("ix_community_infractions_target_user_id"), "community_infractions", ["target_user_id"], unique=False)
    op.create_index(op.f("ix_community_infractions_scope"), "community_infractions", ["scope"], unique=False)
    op.create_index(op.f("ix_community_infractions_infraction_type"), "community_infractions", ["infraction_type"], unique=False)
    op.create_index(op.f("ix_community_infractions_content_type"), "community_infractions", ["content_type"], unique=False)
    op.create_index(op.f("ix_community_infractions_target_empresa_id"), "community_infractions", ["target_empresa_id"], unique=False)
    op.create_index(op.f("ix_community_infractions_triggered_sanction_id"), "community_infractions", ["triggered_sanction_id"], unique=False)
    op.create_index(op.f("ix_community_infractions_created_at"), "community_infractions", ["created_at"], unique=False)

    op.create_table(
        "community_admin_alerts",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("alert_type", sa.String(length=40), nullable=False),
        sa.Column("title", sa.String(length=255), nullable=False),
        sa.Column("message", sa.Text(), nullable=False),
        sa.Column("target_empresa_id", sa.Integer(), nullable=True),
        sa.Column("target_user_id", sa.Integer(), nullable=True),
        sa.Column("infraction_id", sa.Integer(), nullable=True),
        sa.Column("is_read", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.Column("read_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["target_empresa_id"], ["empresas.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["target_user_id"], ["usuarios.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["infraction_id"], ["community_infractions.id"], ondelete="SET NULL"),
    )
    op.create_index(op.f("ix_community_admin_alerts_alert_type"), "community_admin_alerts", ["alert_type"], unique=False)
    op.create_index(op.f("ix_community_admin_alerts_target_empresa_id"), "community_admin_alerts", ["target_empresa_id"], unique=False)
    op.create_index(op.f("ix_community_admin_alerts_target_user_id"), "community_admin_alerts", ["target_user_id"], unique=False)
    op.create_index(op.f("ix_community_admin_alerts_infraction_id"), "community_admin_alerts", ["infraction_id"], unique=False)
    op.create_index(op.f("ix_community_admin_alerts_is_read"), "community_admin_alerts", ["is_read"], unique=False)
    op.create_index(op.f("ix_community_admin_alerts_created_at"), "community_admin_alerts", ["created_at"], unique=False)
    op.create_index(op.f("ix_community_admin_alerts_read_at"), "community_admin_alerts", ["read_at"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_community_admin_alerts_read_at"), table_name="community_admin_alerts")
    op.drop_index(op.f("ix_community_admin_alerts_created_at"), table_name="community_admin_alerts")
    op.drop_index(op.f("ix_community_admin_alerts_is_read"), table_name="community_admin_alerts")
    op.drop_index(op.f("ix_community_admin_alerts_infraction_id"), table_name="community_admin_alerts")
    op.drop_index(op.f("ix_community_admin_alerts_target_user_id"), table_name="community_admin_alerts")
    op.drop_index(op.f("ix_community_admin_alerts_target_empresa_id"), table_name="community_admin_alerts")
    op.drop_index(op.f("ix_community_admin_alerts_alert_type"), table_name="community_admin_alerts")
    op.drop_table("community_admin_alerts")

    op.drop_index(op.f("ix_community_infractions_created_at"), table_name="community_infractions")
    op.drop_index(op.f("ix_community_infractions_triggered_sanction_id"), table_name="community_infractions")
    op.drop_index(op.f("ix_community_infractions_target_empresa_id"), table_name="community_infractions")
    op.drop_index(op.f("ix_community_infractions_content_type"), table_name="community_infractions")
    op.drop_index(op.f("ix_community_infractions_infraction_type"), table_name="community_infractions")
    op.drop_index(op.f("ix_community_infractions_scope"), table_name="community_infractions")
    op.drop_index(op.f("ix_community_infractions_target_user_id"), table_name="community_infractions")
    op.drop_table("community_infractions")

    op.drop_index(op.f("ix_community_posts_topic_id"), table_name="community_posts")
    op.drop_constraint("fk_community_posts_topic_id_community_topics", "community_posts", type_="foreignkey")
    op.drop_column("community_posts", "topic_id")

    op.drop_index(op.f("ix_community_topic_members_created_at"), table_name="community_topic_members")
    op.drop_index(op.f("ix_community_topic_members_added_by_user_id"), table_name="community_topic_members")
    op.drop_index(op.f("ix_community_topic_members_user_id"), table_name="community_topic_members")
    op.drop_index(op.f("ix_community_topic_members_topic_id"), table_name="community_topic_members")
    op.drop_table("community_topic_members")

    op.drop_index(op.f("ix_community_topics_created_at"), table_name="community_topics")
    op.drop_index(op.f("ix_community_topics_created_by_user_id"), table_name="community_topics")
    op.drop_index(op.f("ix_community_topics_target_empresa_id"), table_name="community_topics")
    op.drop_index(op.f("ix_community_topics_is_active"), table_name="community_topics")
    op.drop_index(op.f("ix_community_topics_is_restricted"), table_name="community_topics")
    op.drop_index(op.f("ix_community_topics_nombre"), table_name="community_topics")
    op.drop_index(op.f("ix_community_topics_scope"), table_name="community_topics")
    op.drop_table("community_topics")
