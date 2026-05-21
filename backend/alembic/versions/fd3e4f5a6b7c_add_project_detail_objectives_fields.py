"""add project detail objectives fields

Revision ID: fd3e4f5a6b7c
Revises: fc2d3e4f5a6b
Create Date: 2026-04-24 16:20:00.000000
"""

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "fd3e4f5a6b7c"
down_revision = "fc2d3e4f5a6b"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("proyecto_detalles", sa.Column("objetivos_clave", sa.Text(), nullable=True))
    op.add_column("proyecto_detalles", sa.Column("restricciones_conocidas", sa.Text(), nullable=True))
    op.add_column("proyecto_detalles", sa.Column("supuestos_iniciales", sa.Text(), nullable=True))


def downgrade() -> None:
    op.drop_column("proyecto_detalles", "supuestos_iniciales")
    op.drop_column("proyecto_detalles", "restricciones_conocidas")
    op.drop_column("proyecto_detalles", "objetivos_clave")
