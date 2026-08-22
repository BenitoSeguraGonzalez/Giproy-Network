"""add versioned legal acceptance evidence

Revision ID: 001122334455
Revises: ff5a6b7c8d9e
Create Date: 2026-08-11 12:00:00.000000
"""

from alembic import op
import sqlalchemy as sa


revision = "001122334455"
down_revision = "ff5a6b7c8d9e"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("usuarios", sa.Column("acepta_terminos", sa.Boolean(), server_default=sa.false(), nullable=False))
    op.add_column("usuarios", sa.Column("terminos_version", sa.String(32), nullable=True))
    op.add_column("usuarios", sa.Column("terminos_sha256", sa.String(64), nullable=True))
    op.add_column("usuarios", sa.Column("privacidad_version", sa.String(32), nullable=True))
    op.add_column("usuarios", sa.Column("privacidad_sha256", sa.String(64), nullable=True))
    op.add_column("usuarios", sa.Column("consentimiento_origen", sa.String(32), nullable=True))
    op.create_table(
        "legal_acceptances",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("usuario_id", sa.Integer(), sa.ForeignKey("usuarios.id", ondelete="CASCADE"), nullable=False),
        sa.Column("empresa_id", sa.Integer(), sa.ForeignKey("empresas.id", ondelete="CASCADE"), nullable=False),
        sa.Column("document_type", sa.String(32), nullable=False),
        sa.Column("document_version", sa.String(32), nullable=False),
        sa.Column("document_sha256", sa.String(64), nullable=False),
        sa.Column("accepted", sa.Boolean(), nullable=False),
        sa.Column("purpose", sa.String(64), nullable=False),
        sa.Column("origin", sa.String(32), nullable=False),
        sa.Column("request_ip_hmac", sa.String(64), nullable=True),
        sa.Column("user_agent_sha256", sa.String(64), nullable=True),
        sa.Column("accepted_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_legal_acceptances_usuario_id", "legal_acceptances", ["usuario_id"])
    op.create_index("ix_legal_acceptances_empresa_id", "legal_acceptances", ["empresa_id"])


def downgrade() -> None:
    op.drop_index("ix_legal_acceptances_empresa_id", table_name="legal_acceptances")
    op.drop_index("ix_legal_acceptances_usuario_id", table_name="legal_acceptances")
    op.drop_table("legal_acceptances")
    for name in ("consentimiento_origen", "privacidad_sha256", "privacidad_version", "terminos_sha256", "terminos_version", "acepta_terminos"):
        op.drop_column("usuarios", name)
