"""remove supervisor role

Revision ID: f2a4c6e8b9d1
Revises: e1f2a3b4c5d6
Create Date: 2026-03-12
"""

from alembic import op
import sqlalchemy as sa


revision = "f2a4c6e8b9d1"
down_revision = "e1f2a3b4c5d6"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute(
        """
        UPDATE usuarios
        SET rol = 'administrador'
        WHERE lower(rol) = 'supervisor'
        """
    )

    op.execute(
        """
        UPDATE empresas
        SET limite_supervisores = 0
        WHERE COALESCE(limite_supervisores, 0) <> 0
        """
    )

    op.drop_column("empresas", "limite_supervisores")


def downgrade() -> None:
    op.add_column(
        "empresas",
        sa.Column("limite_supervisores", sa.Integer(), nullable=False, server_default="0"),
    )
    op.alter_column("empresas", "limite_supervisores", server_default=None)
