"""add project detail contract financial fields

Revision ID: ab7c8d9e0f1a
Revises: aa6b7c8d9e0f
Create Date: 2026-04-24 00:00:00.000000
"""

from alembic import op
import sqlalchemy as sa


revision = "ab7c8d9e0f1a"
down_revision = "aa6b7c8d9e0f"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("proyecto_detalles", sa.Column("cliente_contratante_preliminar", sa.String(length=255), nullable=True))
    op.add_column("proyecto_detalles", sa.Column("presupuesto_referencial", sa.DECIMAL(precision=15, scale=2), nullable=True))
    op.add_column("proyecto_detalles", sa.Column("moneda", sa.String(length=10), nullable=True))
    op.add_column("proyecto_detalles", sa.Column("fuente_financiamiento", sa.String(length=100), nullable=True))
    op.add_column("proyecto_detalles", sa.Column("numero_contrato", sa.String(length=120), nullable=True))
    op.add_column("proyecto_detalles", sa.Column("fecha_firma_contrato", sa.DateTime(timezone=True), nullable=True))
    op.execute("UPDATE proyecto_detalles SET moneda = 'USD' WHERE moneda IS NULL")


def downgrade() -> None:
    op.drop_column("proyecto_detalles", "fecha_firma_contrato")
    op.drop_column("proyecto_detalles", "numero_contrato")
    op.drop_column("proyecto_detalles", "fuente_financiamiento")
    op.drop_column("proyecto_detalles", "moneda")
    op.drop_column("proyecto_detalles", "presupuesto_referencial")
    op.drop_column("proyecto_detalles", "cliente_contratante_preliminar")
