"""project georef map cache

Revision ID: ab6c7d8e9f10
Revises: ff5a6b7c8d9e
Create Date: 2026-05-07
"""

from alembic import op
import sqlalchemy as sa


revision = "ab6c7d8e9f10"
down_revision = "ff5a6b7c8d9e"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("proyecto_detalles", sa.Column("georef_map_url", sa.String(length=1024), nullable=True))
    op.add_column("proyecto_detalles", sa.Column("georef_map_status", sa.String(length=40), nullable=True, server_default="pending"))
    op.add_column("proyecto_detalles", sa.Column("georef_map_signature", sa.String(length=120), nullable=True))
    op.add_column("proyecto_detalles", sa.Column("georef_map_generated_at", sa.DateTime(timezone=True), nullable=True))
    op.add_column("proyecto_detalles", sa.Column("georef_map_error", sa.Text(), nullable=True))
    op.execute("UPDATE proyecto_detalles SET georef_map_status = 'pending' WHERE georef_map_status IS NULL")
    op.alter_column("proyecto_detalles", "georef_map_status", server_default=None)


def downgrade() -> None:
    op.drop_column("proyecto_detalles", "georef_map_error")
    op.drop_column("proyecto_detalles", "georef_map_generated_at")
    op.drop_column("proyecto_detalles", "georef_map_signature")
    op.drop_column("proyecto_detalles", "georef_map_status")
    op.drop_column("proyecto_detalles", "georef_map_url")
