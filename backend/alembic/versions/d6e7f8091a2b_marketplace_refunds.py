"""marketplace refunds

Revision ID: d6e7f8091a2b
Revises: c4d5e6f70819
Create Date: 2026-03-31 10:00:00
"""

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "d6e7f8091a2b"
down_revision = "c4d5e6f70819"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "marketplace_refunds",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("order_id", sa.Integer(), nullable=False),
        sa.Column("requested_by_user_id", sa.Integer(), nullable=True),
        sa.Column("reviewed_by_user_id", sa.Integer(), nullable=True),
        sa.Column("refund_mode", sa.String(length=30), nullable=False),
        sa.Column("refund_scope", sa.String(length=20), nullable=False),
        sa.Column("refund_method", sa.String(length=40), nullable=True),
        sa.Column("status", sa.String(length=40), nullable=False),
        sa.Column("amount", sa.Numeric(15, 2), nullable=False),
        sa.Column("currency", sa.String(length=10), nullable=False),
        sa.Column("reason", sa.Text(), nullable=True),
        sa.Column("metadata_json", sa.JSON(), nullable=True),
        sa.Column("requested_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
        sa.Column("reviewed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("completed_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["order_id"], ["marketplace_orders.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["requested_by_user_id"], ["usuarios.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["reviewed_by_user_id"], ["usuarios.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_marketplace_refunds_id"), "marketplace_refunds", ["id"], unique=False)
    op.create_index(op.f("ix_marketplace_refunds_order_id"), "marketplace_refunds", ["order_id"], unique=False)
    op.create_index(op.f("ix_marketplace_refunds_requested_by_user_id"), "marketplace_refunds", ["requested_by_user_id"], unique=False)
    op.create_index(op.f("ix_marketplace_refunds_reviewed_by_user_id"), "marketplace_refunds", ["reviewed_by_user_id"], unique=False)
    op.create_index(op.f("ix_marketplace_refunds_refund_mode"), "marketplace_refunds", ["refund_mode"], unique=False)
    op.create_index(op.f("ix_marketplace_refunds_refund_scope"), "marketplace_refunds", ["refund_scope"], unique=False)
    op.create_index(op.f("ix_marketplace_refunds_refund_method"), "marketplace_refunds", ["refund_method"], unique=False)
    op.create_index(op.f("ix_marketplace_refunds_status"), "marketplace_refunds", ["status"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_marketplace_refunds_status"), table_name="marketplace_refunds")
    op.drop_index(op.f("ix_marketplace_refunds_refund_method"), table_name="marketplace_refunds")
    op.drop_index(op.f("ix_marketplace_refunds_refund_scope"), table_name="marketplace_refunds")
    op.drop_index(op.f("ix_marketplace_refunds_refund_mode"), table_name="marketplace_refunds")
    op.drop_index(op.f("ix_marketplace_refunds_reviewed_by_user_id"), table_name="marketplace_refunds")
    op.drop_index(op.f("ix_marketplace_refunds_requested_by_user_id"), table_name="marketplace_refunds")
    op.drop_index(op.f("ix_marketplace_refunds_order_id"), table_name="marketplace_refunds")
    op.drop_index(op.f("ix_marketplace_refunds_id"), table_name="marketplace_refunds")
    op.drop_table("marketplace_refunds")
