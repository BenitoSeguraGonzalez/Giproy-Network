"""Expand official legal-name fields without truncating SRI data.

Revision ID: de2022ruc002
Revises: de2022ruc001
Create Date: 2026-07-13
"""

from alembic import op
import sqlalchemy as sa


revision = "de2022ruc002"
down_revision = "de2022ruc001"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.alter_column("empresas", "nombre", existing_type=sa.String(255), type_=sa.Text(), existing_nullable=False)
    op.alter_column("sri_ruc_records", "business_name", existing_type=sa.String(500), type_=sa.Text(), existing_nullable=False)
    op.alter_column("sri_ruc_verified_overrides", "business_name", existing_type=sa.String(500), type_=sa.Text(), existing_nullable=False)
    op.alter_column("ruc_manual_verifications", "business_name", existing_type=sa.String(500), type_=sa.Text(), existing_nullable=True)


def downgrade() -> None:
    op.execute("""
        DO $$
        BEGIN
            IF EXISTS (SELECT 1 FROM empresas WHERE length(nombre) > 255)
               OR EXISTS (SELECT 1 FROM sri_ruc_records WHERE length(business_name) > 500)
               OR EXISTS (SELECT 1 FROM sri_ruc_verified_overrides WHERE length(business_name) > 500)
               OR EXISTS (SELECT 1 FROM ruc_manual_verifications WHERE length(business_name) > 500) THEN
                RAISE EXCEPTION 'No se puede reducir el tamaño: existen razones sociales que serían truncadas.';
            END IF;
        END $$
    """)
    op.alter_column("ruc_manual_verifications", "business_name", existing_type=sa.Text(), type_=sa.String(500), existing_nullable=True)
    op.alter_column("sri_ruc_verified_overrides", "business_name", existing_type=sa.Text(), type_=sa.String(500), existing_nullable=False)
    op.alter_column("sri_ruc_records", "business_name", existing_type=sa.Text(), type_=sa.String(500), existing_nullable=False)
    op.alter_column("empresas", "nombre", existing_type=sa.Text(), type_=sa.String(255), existing_nullable=False)
