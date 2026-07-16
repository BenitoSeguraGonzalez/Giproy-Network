"""transfer company public codes

Revision ID: de1933a1b2c3
Revises: de1917a1b2c3
Create Date: 2026-06-17 00:00:00.000000
"""

from alembic import op
import sqlalchemy as sa


revision = "de1933a1b2c3"
down_revision = "de1917a1b2c3"
branch_labels = None
depends_on = None


def _table_exists(table_name: str) -> bool:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    return table_name in inspector.get_table_names()


def upgrade() -> None:
    if not _table_exists("transfer_company_public_codes"):
        op.create_table(
            "transfer_company_public_codes",
            sa.Column("id", sa.Integer(), nullable=False),
            sa.Column("empresa_id", sa.Integer(), nullable=False),
            sa.Column("public_code", sa.String(length=9), nullable=False),
            sa.Column("status", sa.String(length=30), server_default="active", nullable=False),
            sa.Column("generated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
            sa.Column("revoked_at", sa.DateTime(timezone=True), nullable=True),
            sa.Column("metadata_json", sa.JSON(), nullable=True),
            sa.ForeignKeyConstraint(["empresa_id"], ["empresas.id"], ondelete="CASCADE"),
            sa.PrimaryKeyConstraint("id"),
            sa.UniqueConstraint("empresa_id"),
            sa.UniqueConstraint("public_code"),
        )
        op.create_index("ix_transfer_company_codes_empresa", "transfer_company_public_codes", ["empresa_id"])
        op.create_index("ix_transfer_company_codes_public_code", "transfer_company_public_codes", ["public_code"])
        op.create_index("ix_transfer_company_codes_status", "transfer_company_public_codes", ["status"])


def downgrade() -> None:
    if _table_exists("transfer_company_public_codes"):
        op.drop_index("ix_transfer_company_codes_status", table_name="transfer_company_public_codes")
        op.drop_index("ix_transfer_company_codes_public_code", table_name="transfer_company_public_codes")
        op.drop_index("ix_transfer_company_codes_empresa", table_name="transfer_company_public_codes")
        op.drop_table("transfer_company_public_codes")
