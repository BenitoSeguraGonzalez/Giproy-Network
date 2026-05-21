"""add_community_categories

Revision ID: 1c9a4b2d8e77
Revises: 7d1c3f8a4b21
Create Date: 2026-03-21 22:40:00.000000
"""
from alembic import op
import sqlalchemy as sa


revision = "1c9a4b2d8e77"
down_revision = "7d1c3f8a4b21"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "community_categories",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("scope", sa.String(length=30), nullable=False),
        sa.Column("nombre", sa.String(length=160), nullable=False),
        sa.Column("descripcion", sa.Text(), nullable=True),
        sa.Column("orden", sa.Integer(), nullable=False, server_default=sa.text("0")),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.Column("target_empresa_id", sa.Integer(), nullable=True),
        sa.Column("created_by_user_id", sa.Integer(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["target_empresa_id"], ["empresas.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["created_by_user_id"], ["usuarios.id"], ondelete="SET NULL"),
    )
    op.create_index(op.f("ix_community_categories_scope"), "community_categories", ["scope"], unique=False)
    op.create_index(op.f("ix_community_categories_nombre"), "community_categories", ["nombre"], unique=False)
    op.create_index(op.f("ix_community_categories_orden"), "community_categories", ["orden"], unique=False)
    op.create_index(op.f("ix_community_categories_is_active"), "community_categories", ["is_active"], unique=False)
    op.create_index(op.f("ix_community_categories_target_empresa_id"), "community_categories", ["target_empresa_id"], unique=False)
    op.create_index(op.f("ix_community_categories_created_by_user_id"), "community_categories", ["created_by_user_id"], unique=False)
    op.create_index(op.f("ix_community_categories_created_at"), "community_categories", ["created_at"], unique=False)

    op.add_column("community_topics", sa.Column("category_id", sa.Integer(), nullable=True))
    op.create_foreign_key(
        "fk_community_topics_category_id_community_categories",
        "community_topics",
        "community_categories",
        ["category_id"],
        ["id"],
        ondelete="SET NULL",
    )
    op.create_index(op.f("ix_community_topics_category_id"), "community_topics", ["category_id"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_community_topics_category_id"), table_name="community_topics")
    op.drop_constraint("fk_community_topics_category_id_community_categories", "community_topics", type_="foreignkey")
    op.drop_column("community_topics", "category_id")

    op.drop_index(op.f("ix_community_categories_created_at"), table_name="community_categories")
    op.drop_index(op.f("ix_community_categories_created_by_user_id"), table_name="community_categories")
    op.drop_index(op.f("ix_community_categories_target_empresa_id"), table_name="community_categories")
    op.drop_index(op.f("ix_community_categories_is_active"), table_name="community_categories")
    op.drop_index(op.f("ix_community_categories_orden"), table_name="community_categories")
    op.drop_index(op.f("ix_community_categories_nombre"), table_name="community_categories")
    op.drop_index(op.f("ix_community_categories_scope"), table_name="community_categories")
    op.drop_table("community_categories")
