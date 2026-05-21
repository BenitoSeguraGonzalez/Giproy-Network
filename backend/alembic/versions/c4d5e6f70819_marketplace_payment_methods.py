"""marketplace payment methods

Revision ID: c4d5e6f70819
Revises: b3c4d5e6f708
Create Date: 2026-03-30 16:30:00.000000
"""

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "c4d5e6f70819"
down_revision = "b3c4d5e6f708"
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "marketplace_payment_methods",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("slug", sa.String(length=40), nullable=False),
        sa.Column("nombre", sa.String(length=120), nullable=False),
        sa.Column("descripcion", sa.Text(), nullable=True),
        sa.Column("provider", sa.String(length=40), nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.Column("priority", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("environment_mode", sa.String(length=20), nullable=False, server_default="sandbox"),
        sa.Column("readiness_status", sa.String(length=30), nullable=False, server_default="incomplete"),
        sa.Column("config_version", sa.String(length=40), nullable=True),
        sa.Column("config_json", sa.JSON(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=True),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("slug"),
    )
    op.create_index(op.f("ix_marketplace_payment_methods_id"), "marketplace_payment_methods", ["id"], unique=False)
    op.create_index(op.f("ix_marketplace_payment_methods_slug"), "marketplace_payment_methods", ["slug"], unique=False)
    op.create_index(op.f("ix_marketplace_payment_methods_provider"), "marketplace_payment_methods", ["provider"], unique=False)
    op.create_index(op.f("ix_marketplace_payment_methods_is_active"), "marketplace_payment_methods", ["is_active"], unique=False)
    op.create_index(op.f("ix_marketplace_payment_methods_priority"), "marketplace_payment_methods", ["priority"], unique=False)
    op.create_index(op.f("ix_marketplace_payment_methods_environment_mode"), "marketplace_payment_methods", ["environment_mode"], unique=False)
    op.create_index(op.f("ix_marketplace_payment_methods_readiness_status"), "marketplace_payment_methods", ["readiness_status"], unique=False)


def downgrade():
    op.drop_index(op.f("ix_marketplace_payment_methods_readiness_status"), table_name="marketplace_payment_methods")
    op.drop_index(op.f("ix_marketplace_payment_methods_environment_mode"), table_name="marketplace_payment_methods")
    op.drop_index(op.f("ix_marketplace_payment_methods_priority"), table_name="marketplace_payment_methods")
    op.drop_index(op.f("ix_marketplace_payment_methods_is_active"), table_name="marketplace_payment_methods")
    op.drop_index(op.f("ix_marketplace_payment_methods_provider"), table_name="marketplace_payment_methods")
    op.drop_index(op.f("ix_marketplace_payment_methods_slug"), table_name="marketplace_payment_methods")
    op.drop_index(op.f("ix_marketplace_payment_methods_id"), table_name="marketplace_payment_methods")
    op.drop_table("marketplace_payment_methods")
