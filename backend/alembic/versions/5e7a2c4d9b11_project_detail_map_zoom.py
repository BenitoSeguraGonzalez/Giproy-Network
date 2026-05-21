"""project detail map zoom

Revision ID: 5e7a2c4d9b11
Revises: f4c6d9b8a1e2
Create Date: 2026-03-12
"""

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "5e7a2c4d9b11"
down_revision = "f4c6d9b8a1e2"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "proyecto_detalles",
        sa.Column("map_zoom", sa.Integer(), nullable=True, server_default="13"),
    )
    op.execute("UPDATE proyecto_detalles SET map_zoom = 13 WHERE map_zoom IS NULL")
    op.alter_column("proyecto_detalles", "map_zoom", server_default=None)


def downgrade() -> None:
    op.drop_column("proyecto_detalles", "map_zoom")
