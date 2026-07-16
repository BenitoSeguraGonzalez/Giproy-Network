"""transferencias foundation

Revision ID: de1917a1b2c3
Revises: de1912a1b2c3
Create Date: 2026-06-16 00:00:00.000000
"""

from alembic import op
import sqlalchemy as sa


revision = "de1917a1b2c3"
down_revision = "de1912a1b2c3"
branch_labels = None
depends_on = None


def _table_exists(table_name: str) -> bool:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    return table_name in inspector.get_table_names()


def upgrade() -> None:
    if not _table_exists("transfer_admin_public_codes"):
        op.create_table(
            "transfer_admin_public_codes",
            sa.Column("id", sa.Integer(), nullable=False),
            sa.Column("usuario_id", sa.Integer(), nullable=False),
            sa.Column("empresa_id", sa.Integer(), nullable=False),
            sa.Column("public_code", sa.String(length=9), nullable=False),
            sa.Column("status", sa.String(length=30), server_default="active", nullable=False),
            sa.Column("generated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
            sa.Column("revoked_at", sa.DateTime(timezone=True), nullable=True),
            sa.Column("metadata_json", sa.JSON(), nullable=True),
            sa.ForeignKeyConstraint(["empresa_id"], ["empresas.id"], ondelete="CASCADE"),
            sa.ForeignKeyConstraint(["usuario_id"], ["usuarios.id"], ondelete="CASCADE"),
            sa.PrimaryKeyConstraint("id"),
            sa.UniqueConstraint("public_code"),
            sa.UniqueConstraint("usuario_id"),
        )
        op.create_index("ix_transfer_admin_codes_empresa", "transfer_admin_public_codes", ["empresa_id"])
        op.create_index("ix_transfer_admin_codes_status", "transfer_admin_public_codes", ["status"])

    if not _table_exists("transfer_extra_recipient_packs"):
        op.create_table(
            "transfer_extra_recipient_packs",
            sa.Column("id", sa.Integer(), nullable=False),
            sa.Column("empresa_id", sa.Integer(), nullable=False),
            sa.Column("marketplace_order_item_id", sa.Integer(), nullable=True),
            sa.Column("product_code", sa.String(length=80), server_default="CONECTA_TRANSFERENCIAS", nullable=False),
            sa.Column("status", sa.String(length=30), server_default="active", nullable=False),
            sa.Column("slots_total", sa.Integer(), server_default=sa.text("3"), nullable=False),
            sa.Column("slots_used", sa.Integer(), server_default=sa.text("0"), nullable=False),
            sa.Column("purchased_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
            sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
            sa.Column("metadata_json", sa.JSON(), nullable=True),
            sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
            sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True),
            sa.ForeignKeyConstraint(["empresa_id"], ["empresas.id"], ondelete="CASCADE"),
            sa.ForeignKeyConstraint(["marketplace_order_item_id"], ["marketplace_order_items.id"], ondelete="SET NULL"),
            sa.PrimaryKeyConstraint("id"),
        )
        op.create_index("ix_transfer_extra_packs_empresa", "transfer_extra_recipient_packs", ["empresa_id"])
        op.create_index("ix_transfer_extra_packs_expires", "transfer_extra_recipient_packs", ["expires_at"])
        op.create_index("ix_transfer_extra_packs_status", "transfer_extra_recipient_packs", ["status"])

    if not _table_exists("transfer_allowed_company_recipients"):
        op.create_table(
            "transfer_allowed_company_recipients",
            sa.Column("id", sa.Integer(), nullable=False),
            sa.Column("empresa_id", sa.Integer(), nullable=False),
            sa.Column("recipient_empresa_id", sa.Integer(), nullable=False),
            sa.Column("recipient_kind", sa.String(length=30), nullable=False),
            sa.Column("status", sa.String(length=30), server_default="active", nullable=False),
            sa.Column("source_pack_id", sa.Integer(), nullable=True),
            sa.Column("created_by_user_id", sa.Integer(), nullable=True),
            sa.Column("confirmed_by_user_id", sa.Integer(), nullable=True),
            sa.Column("expires_at", sa.DateTime(timezone=True), nullable=True),
            sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
            sa.Column("blocked_at", sa.DateTime(timezone=True), nullable=True),
            sa.Column("metadata_json", sa.JSON(), nullable=True),
            sa.ForeignKeyConstraint(["confirmed_by_user_id"], ["usuarios.id"], ondelete="SET NULL"),
            sa.ForeignKeyConstraint(["created_by_user_id"], ["usuarios.id"], ondelete="SET NULL"),
            sa.ForeignKeyConstraint(["empresa_id"], ["empresas.id"], ondelete="CASCADE"),
            sa.ForeignKeyConstraint(["recipient_empresa_id"], ["empresas.id"], ondelete="CASCADE"),
            sa.ForeignKeyConstraint(["source_pack_id"], ["transfer_extra_recipient_packs.id"], ondelete="SET NULL"),
            sa.PrimaryKeyConstraint("id"),
            sa.UniqueConstraint("empresa_id", "recipient_empresa_id", name="uq_transfer_recipient_empresa_pair"),
        )
        op.create_index("ix_transfer_recipients_empresa", "transfer_allowed_company_recipients", ["empresa_id"])
        op.create_index("ix_transfer_recipients_recipient", "transfer_allowed_company_recipients", ["recipient_empresa_id"])
        op.create_index("ix_transfer_recipients_status", "transfer_allowed_company_recipients", ["status"])

    if not _table_exists("transfer_code_attempt_guards"):
        op.create_table(
            "transfer_code_attempt_guards",
            sa.Column("id", sa.Integer(), nullable=False),
            sa.Column("empresa_id", sa.Integer(), nullable=False),
            sa.Column("attempted_code", sa.String(length=9), nullable=True),
            sa.Column("consecutive_failures", sa.Integer(), server_default=sa.text("0"), nullable=False),
            sa.Column("window_failures", sa.Integer(), server_default=sa.text("0"), nullable=False),
            sa.Column("window_started_at", sa.DateTime(timezone=True), nullable=True),
            sa.Column("paused_until", sa.DateTime(timezone=True), nullable=True),
            sa.Column("banned_until", sa.DateTime(timezone=True), nullable=True),
            sa.Column("last_attempt_at", sa.DateTime(timezone=True), nullable=True),
            sa.Column("metadata_json", sa.JSON(), nullable=True),
            sa.ForeignKeyConstraint(["empresa_id"], ["empresas.id"], ondelete="CASCADE"),
            sa.PrimaryKeyConstraint("id"),
        )
        op.create_index("ix_transfer_code_guards_empresa", "transfer_code_attempt_guards", ["empresa_id"])
        op.create_index("ix_transfer_code_guards_banned", "transfer_code_attempt_guards", ["banned_until"])
        op.create_index("ix_transfer_code_guards_paused", "transfer_code_attempt_guards", ["paused_until"])

    if not _table_exists("transfer_shipments"):
        op.create_table(
            "transfer_shipments",
            sa.Column("id", sa.Integer(), nullable=False),
            sa.Column("sender_empresa_id", sa.Integer(), nullable=False),
            sa.Column("receiver_empresa_id", sa.Integer(), nullable=False),
            sa.Column("created_by_user_id", sa.Integer(), nullable=True),
            sa.Column("sent_by_user_id", sa.Integer(), nullable=True),
            sa.Column("status", sa.String(length=40), server_default="borrador_preflight", nullable=False),
            sa.Column("asset_type", sa.String(length=40), nullable=False),
            sa.Column("asset_id", sa.Integer(), nullable=False),
            sa.Column("description", sa.Text(), nullable=False),
            sa.Column("contract_version", sa.String(length=40), server_default="transfer-v1", nullable=False),
            sa.Column("snapshot_hash", sa.String(length=128), nullable=True),
            sa.Column("preflight_payload", sa.JSON(), nullable=True),
            sa.Column("marketplace_blocked", sa.Boolean(), server_default=sa.text("false"), nullable=False),
            sa.Column("expires_at", sa.DateTime(timezone=True), nullable=True),
            sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
            sa.Column("sent_at", sa.DateTime(timezone=True), nullable=True),
            sa.Column("received_at", sa.DateTime(timezone=True), nullable=True),
            sa.Column("opened_at", sa.DateTime(timezone=True), nullable=True),
            sa.Column("imported_at", sa.DateTime(timezone=True), nullable=True),
            sa.Column("rejected_at", sa.DateTime(timezone=True), nullable=True),
            sa.Column("cancelled_at", sa.DateTime(timezone=True), nullable=True),
            sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True),
            sa.Column("metadata_json", sa.JSON(), nullable=True),
            sa.ForeignKeyConstraint(["created_by_user_id"], ["usuarios.id"], ondelete="SET NULL"),
            sa.ForeignKeyConstraint(["receiver_empresa_id"], ["empresas.id"], ondelete="CASCADE"),
            sa.ForeignKeyConstraint(["sender_empresa_id"], ["empresas.id"], ondelete="CASCADE"),
            sa.ForeignKeyConstraint(["sent_by_user_id"], ["usuarios.id"], ondelete="SET NULL"),
            sa.PrimaryKeyConstraint("id"),
        )
        op.create_index("ix_transfer_shipments_sender", "transfer_shipments", ["sender_empresa_id"])
        op.create_index("ix_transfer_shipments_receiver", "transfer_shipments", ["receiver_empresa_id"])
        op.create_index("ix_transfer_shipments_status", "transfer_shipments", ["status"])
        op.create_index("ix_transfer_shipments_created", "transfer_shipments", ["created_at"])

    if not _table_exists("transfer_shipment_items"):
        op.create_table(
            "transfer_shipment_items",
            sa.Column("id", sa.Integer(), nullable=False),
            sa.Column("shipment_id", sa.Integer(), nullable=False),
            sa.Column("asset_type", sa.String(length=40), nullable=False),
            sa.Column("asset_id", sa.Integer(), nullable=False),
            sa.Column("asset_name_snapshot", sa.String(length=255), nullable=True),
            sa.Column("contract_version", sa.String(length=40), server_default="transfer-v1", nullable=False),
            sa.Column("payload_hash", sa.String(length=128), nullable=True),
            sa.Column("payload_json", sa.JSON(), nullable=True),
            sa.Column("metadata_json", sa.JSON(), nullable=True),
            sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
            sa.ForeignKeyConstraint(["shipment_id"], ["transfer_shipments.id"], ondelete="CASCADE"),
            sa.PrimaryKeyConstraint("id"),
        )
        op.create_index("ix_transfer_items_shipment", "transfer_shipment_items", ["shipment_id"])

    if not _table_exists("transfer_marketplace_requirements"):
        op.create_table(
            "transfer_marketplace_requirements",
            sa.Column("id", sa.Integer(), nullable=False),
            sa.Column("shipment_id", sa.Integer(), nullable=False),
            sa.Column("product_id", sa.Integer(), nullable=True),
            sa.Column("product_title_snapshot", sa.String(length=255), nullable=False),
            sa.Column("status", sa.String(length=40), server_default="pending_purchase", nullable=False),
            sa.Column("required", sa.Boolean(), server_default=sa.text("true"), nullable=False),
            sa.Column("price_snapshot", sa.Numeric(15, 2), nullable=True),
            sa.Column("currency", sa.String(length=10), server_default="USD", nullable=False),
            sa.Column("receiver_order_item_id", sa.Integer(), nullable=True),
            sa.Column("metadata_json", sa.JSON(), nullable=True),
            sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
            sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True),
            sa.ForeignKeyConstraint(["product_id"], ["marketplace_products.id"], ondelete="SET NULL"),
            sa.ForeignKeyConstraint(["receiver_order_item_id"], ["marketplace_order_items.id"], ondelete="SET NULL"),
            sa.ForeignKeyConstraint(["shipment_id"], ["transfer_shipments.id"], ondelete="CASCADE"),
            sa.PrimaryKeyConstraint("id"),
        )
        op.create_index("ix_transfer_market_req_shipment", "transfer_marketplace_requirements", ["shipment_id"])
        op.create_index("ix_transfer_market_req_status", "transfer_marketplace_requirements", ["status"])

    if not _table_exists("transfer_audit_events"):
        op.create_table(
            "transfer_audit_events",
            sa.Column("id", sa.Integer(), nullable=False),
            sa.Column("shipment_id", sa.Integer(), nullable=True),
            sa.Column("empresa_id", sa.Integer(), nullable=True),
            sa.Column("user_id", sa.Integer(), nullable=True),
            sa.Column("event_type", sa.String(length=80), nullable=False),
            sa.Column("actor_scope", sa.String(length=40), nullable=True),
            sa.Column("message", sa.Text(), nullable=True),
            sa.Column("payload_json", sa.JSON(), nullable=True),
            sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
            sa.ForeignKeyConstraint(["empresa_id"], ["empresas.id"], ondelete="SET NULL"),
            sa.ForeignKeyConstraint(["shipment_id"], ["transfer_shipments.id"], ondelete="CASCADE"),
            sa.ForeignKeyConstraint(["user_id"], ["usuarios.id"], ondelete="SET NULL"),
            sa.PrimaryKeyConstraint("id"),
        )
        op.create_index("ix_transfer_audit_events_shipment", "transfer_audit_events", ["shipment_id"])
        op.create_index("ix_transfer_audit_events_type", "transfer_audit_events", ["event_type"])
        op.create_index("ix_transfer_audit_events_created", "transfer_audit_events", ["created_at"])

    if not _table_exists("transfer_import_results"):
        op.create_table(
            "transfer_import_results",
            sa.Column("id", sa.Integer(), nullable=False),
            sa.Column("shipment_id", sa.Integer(), nullable=False),
            sa.Column("receiver_empresa_id", sa.Integer(), nullable=False),
            sa.Column("status", sa.String(length=40), server_default="pending", nullable=False),
            sa.Column("attempts_count", sa.Integer(), server_default=sa.text("0"), nullable=False),
            sa.Column("imported_entity_type", sa.String(length=40), nullable=True),
            sa.Column("imported_entity_id", sa.Integer(), nullable=True),
            sa.Column("payload_hash", sa.String(length=128), nullable=True),
            sa.Column("last_error", sa.Text(), nullable=True),
            sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
            sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True),
            sa.Column("completed_at", sa.DateTime(timezone=True), nullable=True),
            sa.Column("metadata_json", sa.JSON(), nullable=True),
            sa.ForeignKeyConstraint(["receiver_empresa_id"], ["empresas.id"], ondelete="CASCADE"),
            sa.ForeignKeyConstraint(["shipment_id"], ["transfer_shipments.id"], ondelete="CASCADE"),
            sa.PrimaryKeyConstraint("id"),
            sa.UniqueConstraint("shipment_id"),
        )
        op.create_index("ix_transfer_import_results_receiver", "transfer_import_results", ["receiver_empresa_id"])
        op.create_index("ix_transfer_import_results_status", "transfer_import_results", ["status"])

    if not _table_exists("transfer_import_references"):
        op.create_table(
            "transfer_import_references",
            sa.Column("id", sa.Integer(), nullable=False),
            sa.Column("shipment_id", sa.Integer(), nullable=False),
            sa.Column("import_result_id", sa.Integer(), nullable=True),
            sa.Column("source_empresa_id", sa.Integer(), nullable=True),
            sa.Column("target_empresa_id", sa.Integer(), nullable=False),
            sa.Column("source_entity_type", sa.String(length=40), nullable=False),
            sa.Column("source_entity_id", sa.Integer(), nullable=False),
            sa.Column("target_entity_type", sa.String(length=40), nullable=True),
            sa.Column("target_entity_id", sa.Integer(), nullable=True),
            sa.Column("metadata_json", sa.JSON(), nullable=True),
            sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
            sa.ForeignKeyConstraint(["import_result_id"], ["transfer_import_results.id"], ondelete="CASCADE"),
            sa.ForeignKeyConstraint(["shipment_id"], ["transfer_shipments.id"], ondelete="CASCADE"),
            sa.ForeignKeyConstraint(["source_empresa_id"], ["empresas.id"], ondelete="SET NULL"),
            sa.ForeignKeyConstraint(["target_empresa_id"], ["empresas.id"], ondelete="CASCADE"),
            sa.PrimaryKeyConstraint("id"),
        )
        op.create_index("ix_transfer_import_refs_shipment", "transfer_import_references", ["shipment_id"])
        op.create_index("ix_transfer_import_refs_target", "transfer_import_references", ["target_empresa_id"])


def downgrade() -> None:
    for table_name in (
        "transfer_import_references",
        "transfer_import_results",
        "transfer_audit_events",
        "transfer_marketplace_requirements",
        "transfer_shipment_items",
        "transfer_shipments",
        "transfer_code_attempt_guards",
        "transfer_allowed_company_recipients",
        "transfer_extra_recipient_packs",
        "transfer_admin_public_codes",
    ):
        if _table_exists(table_name):
            op.drop_table(table_name)
