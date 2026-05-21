"""add personal todo items

Revision ID: fc2d3e4f5a6b
Revises: fb1c2d3e4f5a
Create Date: 2026-04-23 23:59:59.000000
"""

from alembic import op
import sqlalchemy as sa


revision = "fc2d3e4f5a6b"
down_revision = "fb1c2d3e4f5a"
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "personal_todo_items",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("empresa_id", sa.Integer(), nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("title", sa.String(length=255), nullable=False),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("is_completed", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("sort_order", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("completed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["empresa_id"], ["empresas.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["user_id"], ["usuarios.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_personal_todo_items_id"), "personal_todo_items", ["id"], unique=False)
    op.create_index(op.f("ix_personal_todo_items_empresa_id"), "personal_todo_items", ["empresa_id"], unique=False)
    op.create_index(op.f("ix_personal_todo_items_user_id"), "personal_todo_items", ["user_id"], unique=False)
    op.create_index(op.f("ix_personal_todo_items_is_completed"), "personal_todo_items", ["is_completed"], unique=False)


def downgrade():
    op.drop_index(op.f("ix_personal_todo_items_is_completed"), table_name="personal_todo_items")
    op.drop_index(op.f("ix_personal_todo_items_user_id"), table_name="personal_todo_items")
    op.drop_index(op.f("ix_personal_todo_items_empresa_id"), table_name="personal_todo_items")
    op.drop_index(op.f("ix_personal_todo_items_id"), table_name="personal_todo_items")
    op.drop_table("personal_todo_items")
