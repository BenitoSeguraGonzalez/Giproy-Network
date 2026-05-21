"""add project detail scope and measurement fields

Revision ID: aa6b7c8d9e0f
Revises: ff5a6b7c8d9e
Create Date: 2026-04-24 23:10:00.000000
"""

from alembic import op
import sqlalchemy as sa


revision = "aa6b7c8d9e0f"
down_revision = "ff5a6b7c8d9e"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("proyecto_detalles", sa.Column("descripcion_breve", sa.String(length=200), nullable=True))
    op.add_column("proyecto_detalles", sa.Column("alcance_detallado", sa.Text(), nullable=True))
    op.add_column("proyecto_detalles", sa.Column("tipo_medicion", sa.String(length=50), nullable=True, server_default="area"))
    op.add_column("proyecto_detalles", sa.Column("num_niveles", sa.Integer(), nullable=True))
    op.add_column("proyecto_detalles", sa.Column("longitud_total", sa.DECIMAL(15, 2), nullable=True))
    op.add_column("proyecto_detalles", sa.Column("unidad_longitud", sa.String(length=10), nullable=True, server_default="m"))
    op.add_column("proyecto_detalles", sa.Column("ancho_promedio", sa.DECIMAL(15, 2), nullable=True))
    op.add_column("proyecto_detalles", sa.Column("volumen_total", sa.DECIMAL(15, 2), nullable=True))
    op.add_column("proyecto_detalles", sa.Column("cantidad_unidades", sa.Integer(), nullable=True))
    op.add_column("proyecto_detalles", sa.Column("descripcion_unidad", sa.String(length=255), nullable=True))
    op.alter_column("proyecto_detalles", "tipo_medicion", server_default=None)
    op.alter_column("proyecto_detalles", "unidad_longitud", server_default=None)


def downgrade() -> None:
    op.drop_column("proyecto_detalles", "descripcion_unidad")
    op.drop_column("proyecto_detalles", "cantidad_unidades")
    op.drop_column("proyecto_detalles", "volumen_total")
    op.drop_column("proyecto_detalles", "ancho_promedio")
    op.drop_column("proyecto_detalles", "unidad_longitud")
    op.drop_column("proyecto_detalles", "longitud_total")
    op.drop_column("proyecto_detalles", "num_niveles")
    op.drop_column("proyecto_detalles", "tipo_medicion")
    op.drop_column("proyecto_detalles", "alcance_detallado")
    op.drop_column("proyecto_detalles", "descripcion_breve")
