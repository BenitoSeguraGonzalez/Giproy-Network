"""marketplace admin notes

Revision ID: a9b8c7d6e5f4
Revises: 7c1e4d2b9f10
Create Date: 2026-03-27 18:40:00.000000
"""

from alembic import op
import sqlalchemy as sa


revision = "a9b8c7d6e5f4"
down_revision = "7c1e4d2b9f10"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("marketplace_products", sa.Column("admin_notes", sa.Text(), nullable=True))


def downgrade() -> None:
    op.drop_column("marketplace_products", "admin_notes")
