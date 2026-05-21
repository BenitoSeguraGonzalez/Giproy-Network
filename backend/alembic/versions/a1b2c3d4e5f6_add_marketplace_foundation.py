"""add marketplace foundation

Revision ID: a1b2c3d4e5f6
Revises: f8a9b0c1d2e3
Create Date: 2026-03-23 07:05:00.000000
"""

from alembic import op
import sqlalchemy as sa


revision = "a1b2c3d4e5f6"
down_revision = "f8a9b0c1d2e3"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("usuarios", sa.Column("marketplace_permissions", sa.JSON(), nullable=True))

    op.create_table(
        "marketplace_product_categories",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("nombre", sa.String(length=150), nullable=False),
        sa.Column("slug", sa.String(length=160), nullable=False),
        sa.Column("descripcion", sa.Text(), nullable=True),
        sa.Column("parent_id", sa.Integer(), nullable=True),
        sa.Column("activa", sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column("sort_order", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("fecha_creacion", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=True),
        sa.ForeignKeyConstraint(["parent_id"], ["marketplace_product_categories.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("slug"),
    )
    op.create_index(op.f("ix_marketplace_product_categories_id"), "marketplace_product_categories", ["id"], unique=False)
    op.create_index(op.f("ix_marketplace_product_categories_slug"), "marketplace_product_categories", ["slug"], unique=False)

    op.create_table(
        "marketplace_products",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("titulo", sa.String(length=255), nullable=False),
        sa.Column("slug", sa.String(length=280), nullable=False),
        sa.Column("resumen", sa.String(length=500), nullable=True),
        sa.Column("descripcion", sa.Text(), nullable=True),
        sa.Column("incluye", sa.Text(), nullable=True),
        sa.Column("no_incluye", sa.Text(), nullable=True),
        sa.Column("vista_previa", sa.JSON(), nullable=True),
        sa.Column("etiquetas", sa.JSON(), nullable=True),
        sa.Column("product_type", sa.String(length=50), nullable=False, server_default="adicional"),
        sa.Column("product_kind", sa.String(length=50), nullable=False, server_default="manual"),
        sa.Column("source_type", sa.String(length=50), nullable=True),
        sa.Column("source_id", sa.Integer(), nullable=True),
        sa.Column("precio", sa.Numeric(15, 2), nullable=False, server_default="0"),
        sa.Column("moneda", sa.String(length=10), nullable=False, server_default="USD"),
        sa.Column("estado", sa.String(length=50), nullable=False, server_default="pending"),
        sa.Column("activo", sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column("requiere_aprobacion", sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column("ventas_count", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("rating_promedio", sa.Numeric(4, 2), nullable=False, server_default="0"),
        sa.Column("category_id", sa.Integer(), nullable=True),
        sa.Column("seller_user_id", sa.Integer(), nullable=False),
        sa.Column("approved_by_user_id", sa.Integer(), nullable=True),
        sa.Column("fecha_creacion", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=True),
        sa.Column("fecha_actualizacion", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["approved_by_user_id"], ["usuarios.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["category_id"], ["marketplace_product_categories.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["seller_user_id"], ["usuarios.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("seller_user_id", "source_type", "source_id", name="uq_marketplace_product_source_owner"),
        sa.UniqueConstraint("slug"),
    )
    op.create_index(op.f("ix_marketplace_products_id"), "marketplace_products", ["id"], unique=False)
    op.create_index(op.f("ix_marketplace_products_slug"), "marketplace_products", ["slug"], unique=False)
    op.create_index(op.f("ix_marketplace_products_titulo"), "marketplace_products", ["titulo"], unique=False)
    op.create_index(op.f("ix_marketplace_products_product_type"), "marketplace_products", ["product_type"], unique=False)
    op.create_index(op.f("ix_marketplace_products_product_kind"), "marketplace_products", ["product_kind"], unique=False)
    op.create_index(op.f("ix_marketplace_products_source_type"), "marketplace_products", ["source_type"], unique=False)
    op.create_index(op.f("ix_marketplace_products_source_id"), "marketplace_products", ["source_id"], unique=False)
    op.create_index(op.f("ix_marketplace_products_estado"), "marketplace_products", ["estado"], unique=False)
    op.create_index(op.f("ix_marketplace_products_seller_user_id"), "marketplace_products", ["seller_user_id"], unique=False)

    op.create_table(
        "marketplace_orders",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("buyer_user_id", sa.Integer(), nullable=False),
        sa.Column("total", sa.Numeric(15, 2), nullable=False, server_default="0"),
        sa.Column("commission_amount", sa.Numeric(15, 2), nullable=False, server_default="0"),
        sa.Column("seller_amount", sa.Numeric(15, 2), nullable=False, server_default="0"),
        sa.Column("currency", sa.String(length=10), nullable=False, server_default="USD"),
        sa.Column("status", sa.String(length=50), nullable=False, server_default="pending"),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=True),
        sa.ForeignKeyConstraint(["buyer_user_id"], ["usuarios.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_marketplace_orders_id"), "marketplace_orders", ["id"], unique=False)
    op.create_index(op.f("ix_marketplace_orders_buyer_user_id"), "marketplace_orders", ["buyer_user_id"], unique=False)
    op.create_index(op.f("ix_marketplace_orders_status"), "marketplace_orders", ["status"], unique=False)

    op.create_table(
        "marketplace_order_items",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("order_id", sa.Integer(), nullable=False),
        sa.Column("product_id", sa.Integer(), nullable=True),
        sa.Column("seller_user_id", sa.Integer(), nullable=True),
        sa.Column("product_title_snapshot", sa.String(length=255), nullable=False),
        sa.Column("product_type_snapshot", sa.String(length=50), nullable=False),
        sa.Column("source_type_snapshot", sa.String(length=50), nullable=True),
        sa.Column("source_id_snapshot", sa.Integer(), nullable=True),
        sa.Column("delivered_entity_type", sa.String(length=50), nullable=True),
        sa.Column("delivered_entity_id", sa.Integer(), nullable=True),
        sa.Column("price", sa.Numeric(15, 2), nullable=False, server_default="0"),
        sa.ForeignKeyConstraint(["order_id"], ["marketplace_orders.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["product_id"], ["marketplace_products.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["seller_user_id"], ["usuarios.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_marketplace_order_items_id"), "marketplace_order_items", ["id"], unique=False)
    op.create_index(op.f("ix_marketplace_order_items_order_id"), "marketplace_order_items", ["order_id"], unique=False)
    op.create_index(op.f("ix_marketplace_order_items_product_id"), "marketplace_order_items", ["product_id"], unique=False)
    op.create_index(op.f("ix_marketplace_order_items_seller_user_id"), "marketplace_order_items", ["seller_user_id"], unique=False)

    op.create_table(
        "marketplace_reviews",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("product_id", sa.Integer(), nullable=False),
        sa.Column("order_id", sa.Integer(), nullable=True),
        sa.Column("buyer_user_id", sa.Integer(), nullable=False),
        sa.Column("rating", sa.Integer(), nullable=False),
        sa.Column("comment", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=True),
        sa.ForeignKeyConstraint(["buyer_user_id"], ["usuarios.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["order_id"], ["marketplace_orders.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["product_id"], ["marketplace_products.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_marketplace_reviews_id"), "marketplace_reviews", ["id"], unique=False)
    op.create_index(op.f("ix_marketplace_reviews_product_id"), "marketplace_reviews", ["product_id"], unique=False)
    op.create_index(op.f("ix_marketplace_reviews_order_id"), "marketplace_reviews", ["order_id"], unique=False)
    op.create_index(op.f("ix_marketplace_reviews_buyer_user_id"), "marketplace_reviews", ["buyer_user_id"], unique=False)

    op.create_table(
        "marketplace_asset_origins",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("empresa_id", sa.Integer(), nullable=False),
        sa.Column("entity_type", sa.String(length=50), nullable=False),
        sa.Column("entity_id", sa.Integer(), nullable=False),
        sa.Column("ownership_kind", sa.String(length=30), nullable=False, server_default="owned"),
        sa.Column("origin_kind", sa.String(length=30), nullable=False, server_default="native"),
        sa.Column("origin_label", sa.String(length=255), nullable=True),
        sa.Column("source_entity_type", sa.String(length=50), nullable=True),
        sa.Column("source_entity_id", sa.Integer(), nullable=True),
        sa.Column("source_company_id", sa.Integer(), nullable=True),
        sa.Column("source_user_id", sa.Integer(), nullable=True),
        sa.Column("marketplace_product_id", sa.Integer(), nullable=True),
        sa.Column("marketplace_order_id", sa.Integer(), nullable=True),
        sa.Column("marketplace_order_item_id", sa.Integer(), nullable=True),
        sa.Column("metadata_json", sa.JSON(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=True),
        sa.ForeignKeyConstraint(["empresa_id"], ["empresas.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["marketplace_order_id"], ["marketplace_orders.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["marketplace_order_item_id"], ["marketplace_order_items.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["marketplace_product_id"], ["marketplace_products.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["source_company_id"], ["empresas.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["source_user_id"], ["usuarios.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("empresa_id", "entity_type", "entity_id", name="uq_marketplace_asset_origin_entity"),
    )
    op.create_index(op.f("ix_marketplace_asset_origins_id"), "marketplace_asset_origins", ["id"], unique=False)
    op.create_index(op.f("ix_marketplace_asset_origins_empresa_id"), "marketplace_asset_origins", ["empresa_id"], unique=False)
    op.create_index(op.f("ix_marketplace_asset_origins_entity_type"), "marketplace_asset_origins", ["entity_type"], unique=False)
    op.create_index(op.f("ix_marketplace_asset_origins_entity_id"), "marketplace_asset_origins", ["entity_id"], unique=False)
    op.create_index(op.f("ix_marketplace_asset_origins_ownership_kind"), "marketplace_asset_origins", ["ownership_kind"], unique=False)
    op.create_index(op.f("ix_marketplace_asset_origins_origin_kind"), "marketplace_asset_origins", ["origin_kind"], unique=False)
    op.create_index(op.f("ix_marketplace_asset_origins_source_entity_type"), "marketplace_asset_origins", ["source_entity_type"], unique=False)
    op.create_index(op.f("ix_marketplace_asset_origins_source_entity_id"), "marketplace_asset_origins", ["source_entity_id"], unique=False)
    op.create_index(op.f("ix_marketplace_asset_origins_source_company_id"), "marketplace_asset_origins", ["source_company_id"], unique=False)
    op.create_index(op.f("ix_marketplace_asset_origins_source_user_id"), "marketplace_asset_origins", ["source_user_id"], unique=False)
    op.create_index(op.f("ix_marketplace_asset_origins_marketplace_product_id"), "marketplace_asset_origins", ["marketplace_product_id"], unique=False)
    op.create_index(op.f("ix_marketplace_asset_origins_marketplace_order_id"), "marketplace_asset_origins", ["marketplace_order_id"], unique=False)
    op.create_index(op.f("ix_marketplace_asset_origins_marketplace_order_item_id"), "marketplace_asset_origins", ["marketplace_order_item_id"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_marketplace_asset_origins_marketplace_order_item_id"), table_name="marketplace_asset_origins")
    op.drop_index(op.f("ix_marketplace_asset_origins_marketplace_order_id"), table_name="marketplace_asset_origins")
    op.drop_index(op.f("ix_marketplace_asset_origins_marketplace_product_id"), table_name="marketplace_asset_origins")
    op.drop_index(op.f("ix_marketplace_asset_origins_source_user_id"), table_name="marketplace_asset_origins")
    op.drop_index(op.f("ix_marketplace_asset_origins_source_company_id"), table_name="marketplace_asset_origins")
    op.drop_index(op.f("ix_marketplace_asset_origins_source_entity_id"), table_name="marketplace_asset_origins")
    op.drop_index(op.f("ix_marketplace_asset_origins_source_entity_type"), table_name="marketplace_asset_origins")
    op.drop_index(op.f("ix_marketplace_asset_origins_origin_kind"), table_name="marketplace_asset_origins")
    op.drop_index(op.f("ix_marketplace_asset_origins_ownership_kind"), table_name="marketplace_asset_origins")
    op.drop_index(op.f("ix_marketplace_asset_origins_entity_id"), table_name="marketplace_asset_origins")
    op.drop_index(op.f("ix_marketplace_asset_origins_entity_type"), table_name="marketplace_asset_origins")
    op.drop_index(op.f("ix_marketplace_asset_origins_empresa_id"), table_name="marketplace_asset_origins")
    op.drop_index(op.f("ix_marketplace_asset_origins_id"), table_name="marketplace_asset_origins")
    op.drop_table("marketplace_asset_origins")

    op.drop_index(op.f("ix_marketplace_reviews_buyer_user_id"), table_name="marketplace_reviews")
    op.drop_index(op.f("ix_marketplace_reviews_order_id"), table_name="marketplace_reviews")
    op.drop_index(op.f("ix_marketplace_reviews_product_id"), table_name="marketplace_reviews")
    op.drop_index(op.f("ix_marketplace_reviews_id"), table_name="marketplace_reviews")
    op.drop_table("marketplace_reviews")

    op.drop_index(op.f("ix_marketplace_order_items_seller_user_id"), table_name="marketplace_order_items")
    op.drop_index(op.f("ix_marketplace_order_items_product_id"), table_name="marketplace_order_items")
    op.drop_index(op.f("ix_marketplace_order_items_order_id"), table_name="marketplace_order_items")
    op.drop_index(op.f("ix_marketplace_order_items_id"), table_name="marketplace_order_items")
    op.drop_table("marketplace_order_items")

    op.drop_index(op.f("ix_marketplace_orders_status"), table_name="marketplace_orders")
    op.drop_index(op.f("ix_marketplace_orders_buyer_user_id"), table_name="marketplace_orders")
    op.drop_index(op.f("ix_marketplace_orders_id"), table_name="marketplace_orders")
    op.drop_table("marketplace_orders")

    op.drop_index(op.f("ix_marketplace_products_seller_user_id"), table_name="marketplace_products")
    op.drop_index(op.f("ix_marketplace_products_estado"), table_name="marketplace_products")
    op.drop_index(op.f("ix_marketplace_products_source_id"), table_name="marketplace_products")
    op.drop_index(op.f("ix_marketplace_products_source_type"), table_name="marketplace_products")
    op.drop_index(op.f("ix_marketplace_products_product_kind"), table_name="marketplace_products")
    op.drop_index(op.f("ix_marketplace_products_product_type"), table_name="marketplace_products")
    op.drop_index(op.f("ix_marketplace_products_titulo"), table_name="marketplace_products")
    op.drop_index(op.f("ix_marketplace_products_slug"), table_name="marketplace_products")
    op.drop_index(op.f("ix_marketplace_products_id"), table_name="marketplace_products")
    op.drop_table("marketplace_products")

    op.drop_index(op.f("ix_marketplace_product_categories_slug"), table_name="marketplace_product_categories")
    op.drop_index(op.f("ix_marketplace_product_categories_id"), table_name="marketplace_product_categories")
    op.drop_table("marketplace_product_categories")

    op.drop_column("usuarios", "marketplace_permissions")
