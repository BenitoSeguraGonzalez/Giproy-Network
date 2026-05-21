"""remove_unique_email_index_usuarios

Revision ID: 6e273af7f68e
Revises: 49865d19f342
Create Date: 2026-03-16 18:06:05.329033
"""
from alembic import op
import sqlalchemy as sa



# revision identifiers, used by Alembic.
revision = '6e273af7f68e'
down_revision = '49865d19f342'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Eliminar el índice único global sobre email que impide multi-empresa
    op.drop_index('ix_usuarios_email', table_name='usuarios')
    # Recrearlo como no único para mantener el rendimiento de búsqueda
    op.create_index('ix_usuarios_email', 'usuarios', ['email'], unique=False)


def downgrade() -> None:
    # Revertir a índice único (advertencia: fallará si hay duplicados multi-empresa)
    op.drop_index('ix_usuarios_email', table_name='usuarios')
    op.create_index('ix_usuarios_email', 'usuarios', ['email'], unique=True)
