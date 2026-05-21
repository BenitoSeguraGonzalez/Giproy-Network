"""marketplace checkout payment core

Revision ID: b3c4d5e6f708
Revises: a9b8c7d6e5f4
Create Date: 2026-03-30 18:10:00.000000
"""

from alembic import op
import sqlalchemy as sa


revision = "b3c4d5e6f708"
down_revision = "a9b8c7d6e5f4"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "marketplace_checkout_drafts",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("company_id", sa.Integer(), nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("status", sa.String(length=30), nullable=False, server_default="open"),
        sa.Column("payment_method", sa.String(length=40), nullable=True),
        sa.Column("currency", sa.String(length=10), nullable=False, server_default="USD"),
        sa.Column("total", sa.Numeric(15, 2), nullable=False, server_default="0"),
        sa.Column("snapshot_json", sa.JSON(), nullable=True),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("last_activity_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("CURRENT_TIMESTAMP")),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=True, server_default=sa.text("CURRENT_TIMESTAMP")),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["company_id"], ["empresas.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["user_id"], ["usuarios.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_marketplace_checkout_drafts_id"), "marketplace_checkout_drafts", ["id"], unique=False)
    op.create_index(op.f("ix_marketplace_checkout_drafts_company_id"), "marketplace_checkout_drafts", ["company_id"], unique=False)
    op.create_index(op.f("ix_marketplace_checkout_drafts_user_id"), "marketplace_checkout_drafts", ["user_id"], unique=False)
    op.create_index(op.f("ix_marketplace_checkout_drafts_status"), "marketplace_checkout_drafts", ["status"], unique=False)
    op.create_index(op.f("ix_marketplace_checkout_drafts_payment_method"), "marketplace_checkout_drafts", ["payment_method"], unique=False)
    op.create_index(op.f("ix_marketplace_checkout_drafts_expires_at"), "marketplace_checkout_drafts", ["expires_at"], unique=False)
    op.create_index(op.f("ix_marketplace_checkout_drafts_last_activity_at"), "marketplace_checkout_drafts", ["last_activity_at"], unique=False)

    op.create_table(
        "marketplace_payment_attempts",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("order_id", sa.Integer(), nullable=True),
        sa.Column("checkout_draft_id", sa.Integer(), nullable=True),
        sa.Column("payment_method", sa.String(length=40), nullable=False),
        sa.Column("payment_provider", sa.String(length=40), nullable=True),
        sa.Column("status", sa.String(length=40), nullable=False, server_default="draft"),
        sa.Column("amount", sa.Numeric(15, 2), nullable=False, server_default="0"),
        sa.Column("currency", sa.String(length=10), nullable=False, server_default="USD"),
        sa.Column("provider_order_id", sa.String(length=120), nullable=True),
        sa.Column("provider_transaction_id", sa.String(length=120), nullable=True),
        sa.Column("client_transaction_id", sa.String(length=120), nullable=True),
        sa.Column("idempotency_key", sa.String(length=120), nullable=True),
        sa.Column("config_version", sa.String(length=40), nullable=True),
        sa.Column("environment_mode", sa.String(length=20), nullable=True),
        sa.Column("payload_json", sa.JSON(), nullable=True),
        sa.Column("retry_count", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=True, server_default=sa.text("CURRENT_TIMESTAMP")),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["order_id"], ["marketplace_orders.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["checkout_draft_id"], ["marketplace_checkout_drafts.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_marketplace_payment_attempts_id"), "marketplace_payment_attempts", ["id"], unique=False)
    op.create_index(op.f("ix_marketplace_payment_attempts_order_id"), "marketplace_payment_attempts", ["order_id"], unique=False)
    op.create_index(op.f("ix_marketplace_payment_attempts_checkout_draft_id"), "marketplace_payment_attempts", ["checkout_draft_id"], unique=False)
    op.create_index(op.f("ix_marketplace_payment_attempts_payment_method"), "marketplace_payment_attempts", ["payment_method"], unique=False)
    op.create_index(op.f("ix_marketplace_payment_attempts_payment_provider"), "marketplace_payment_attempts", ["payment_provider"], unique=False)
    op.create_index(op.f("ix_marketplace_payment_attempts_status"), "marketplace_payment_attempts", ["status"], unique=False)
    op.create_index(op.f("ix_marketplace_payment_attempts_provider_order_id"), "marketplace_payment_attempts", ["provider_order_id"], unique=False)
    op.create_index(op.f("ix_marketplace_payment_attempts_provider_transaction_id"), "marketplace_payment_attempts", ["provider_transaction_id"], unique=False)
    op.create_index(op.f("ix_marketplace_payment_attempts_client_transaction_id"), "marketplace_payment_attempts", ["client_transaction_id"], unique=False)
    op.create_index(op.f("ix_marketplace_payment_attempts_idempotency_key"), "marketplace_payment_attempts", ["idempotency_key"], unique=False)
    op.create_index(op.f("ix_marketplace_payment_attempts_environment_mode"), "marketplace_payment_attempts", ["environment_mode"], unique=False)

    op.create_table(
        "marketplace_payment_events",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("payment_attempt_id", sa.Integer(), nullable=False),
        sa.Column("provider", sa.String(length=40), nullable=True),
        sa.Column("event_type", sa.String(length=80), nullable=False),
        sa.Column("event_origin", sa.String(length=40), nullable=True),
        sa.Column("correlation_id", sa.String(length=120), nullable=True),
        sa.Column("payload_json", sa.JSON(), nullable=True),
        sa.Column("processed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=True, server_default=sa.text("CURRENT_TIMESTAMP")),
        sa.ForeignKeyConstraint(["payment_attempt_id"], ["marketplace_payment_attempts.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_marketplace_payment_events_id"), "marketplace_payment_events", ["id"], unique=False)
    op.create_index(op.f("ix_marketplace_payment_events_payment_attempt_id"), "marketplace_payment_events", ["payment_attempt_id"], unique=False)
    op.create_index(op.f("ix_marketplace_payment_events_provider"), "marketplace_payment_events", ["provider"], unique=False)
    op.create_index(op.f("ix_marketplace_payment_events_event_type"), "marketplace_payment_events", ["event_type"], unique=False)
    op.create_index(op.f("ix_marketplace_payment_events_event_origin"), "marketplace_payment_events", ["event_origin"], unique=False)
    op.create_index(op.f("ix_marketplace_payment_events_correlation_id"), "marketplace_payment_events", ["correlation_id"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_marketplace_payment_events_correlation_id"), table_name="marketplace_payment_events")
    op.drop_index(op.f("ix_marketplace_payment_events_event_origin"), table_name="marketplace_payment_events")
    op.drop_index(op.f("ix_marketplace_payment_events_event_type"), table_name="marketplace_payment_events")
    op.drop_index(op.f("ix_marketplace_payment_events_provider"), table_name="marketplace_payment_events")
    op.drop_index(op.f("ix_marketplace_payment_events_payment_attempt_id"), table_name="marketplace_payment_events")
    op.drop_index(op.f("ix_marketplace_payment_events_id"), table_name="marketplace_payment_events")
    op.drop_table("marketplace_payment_events")

    op.drop_index(op.f("ix_marketplace_payment_attempts_environment_mode"), table_name="marketplace_payment_attempts")
    op.drop_index(op.f("ix_marketplace_payment_attempts_idempotency_key"), table_name="marketplace_payment_attempts")
    op.drop_index(op.f("ix_marketplace_payment_attempts_client_transaction_id"), table_name="marketplace_payment_attempts")
    op.drop_index(op.f("ix_marketplace_payment_attempts_provider_transaction_id"), table_name="marketplace_payment_attempts")
    op.drop_index(op.f("ix_marketplace_payment_attempts_provider_order_id"), table_name="marketplace_payment_attempts")
    op.drop_index(op.f("ix_marketplace_payment_attempts_status"), table_name="marketplace_payment_attempts")
    op.drop_index(op.f("ix_marketplace_payment_attempts_payment_provider"), table_name="marketplace_payment_attempts")
    op.drop_index(op.f("ix_marketplace_payment_attempts_payment_method"), table_name="marketplace_payment_attempts")
    op.drop_index(op.f("ix_marketplace_payment_attempts_checkout_draft_id"), table_name="marketplace_payment_attempts")
    op.drop_index(op.f("ix_marketplace_payment_attempts_order_id"), table_name="marketplace_payment_attempts")
    op.drop_index(op.f("ix_marketplace_payment_attempts_id"), table_name="marketplace_payment_attempts")
    op.drop_table("marketplace_payment_attempts")

    op.drop_index(op.f("ix_marketplace_checkout_drafts_last_activity_at"), table_name="marketplace_checkout_drafts")
    op.drop_index(op.f("ix_marketplace_checkout_drafts_expires_at"), table_name="marketplace_checkout_drafts")
    op.drop_index(op.f("ix_marketplace_checkout_drafts_payment_method"), table_name="marketplace_checkout_drafts")
    op.drop_index(op.f("ix_marketplace_checkout_drafts_status"), table_name="marketplace_checkout_drafts")
    op.drop_index(op.f("ix_marketplace_checkout_drafts_user_id"), table_name="marketplace_checkout_drafts")
    op.drop_index(op.f("ix_marketplace_checkout_drafts_company_id"), table_name="marketplace_checkout_drafts")
    op.drop_index(op.f("ix_marketplace_checkout_drafts_id"), table_name="marketplace_checkout_drafts")
    op.drop_table("marketplace_checkout_drafts")
