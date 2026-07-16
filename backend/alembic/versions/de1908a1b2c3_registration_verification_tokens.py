"""registration verification tokens

Revision ID: de1908a1b2c3
Revises: de1899f0a1b2
Create Date: 2026-06-10
"""

from alembic import op
import sqlalchemy as sa


revision = "de1908a1b2c3"
down_revision = "de1899f0a1b2"
branch_labels = None
depends_on = None


def upgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    if "registration_verification_tokens" in inspector.get_table_names():
        return

    op.create_table(
        "registration_verification_tokens",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("token", sa.String(length=255), nullable=False),
        sa.Column("email", sa.String(length=255), nullable=False),
        sa.Column("empresa_id", sa.Integer(), nullable=False),
        sa.Column("usuario_id", sa.Integer(), nullable=False),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("used_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["empresa_id"], ["empresas.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["usuario_id"], ["usuarios.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        op.f("ix_registration_verification_tokens_email"),
        "registration_verification_tokens",
        ["email"],
        unique=False,
    )
    op.create_index(
        op.f("ix_registration_verification_tokens_empresa_id"),
        "registration_verification_tokens",
        ["empresa_id"],
        unique=False,
    )
    op.create_index(
        op.f("ix_registration_verification_tokens_id"),
        "registration_verification_tokens",
        ["id"],
        unique=False,
    )
    op.create_index(
        op.f("ix_registration_verification_tokens_token"),
        "registration_verification_tokens",
        ["token"],
        unique=True,
    )
    op.create_index(
        op.f("ix_registration_verification_tokens_usuario_id"),
        "registration_verification_tokens",
        ["usuario_id"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index(op.f("ix_registration_verification_tokens_usuario_id"), table_name="registration_verification_tokens")
    op.drop_index(op.f("ix_registration_verification_tokens_token"), table_name="registration_verification_tokens")
    op.drop_index(op.f("ix_registration_verification_tokens_id"), table_name="registration_verification_tokens")
    op.drop_index(op.f("ix_registration_verification_tokens_empresa_id"), table_name="registration_verification_tokens")
    op.drop_index(op.f("ix_registration_verification_tokens_email"), table_name="registration_verification_tokens")
    op.drop_table("registration_verification_tokens")
