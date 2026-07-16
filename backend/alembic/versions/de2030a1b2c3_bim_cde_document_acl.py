"""bim cde document acl"""

from alembic import op
import sqlalchemy as sa


revision = "de2030a1b2c3"
down_revision = "de2029a1b2c3"
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "bim_cde_document_acls",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("document_id", sa.Integer(), sa.ForeignKey("bim_cde_documents.id", ondelete="CASCADE"), nullable=False),
        sa.Column("empresa_id", sa.Integer(), sa.ForeignKey("empresas.id", ondelete="CASCADE"), nullable=False),
        sa.Column("proyecto_id", sa.Integer(), sa.ForeignKey("proyectos.id", ondelete="CASCADE"), nullable=False),
        sa.Column("usuario_id", sa.Integer(), sa.ForeignKey("usuarios.id", ondelete="CASCADE"), nullable=False),
        sa.Column("can_view", sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column("can_download", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("can_revise", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("can_manage", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("active", sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column("granted_by", sa.Integer(), sa.ForeignKey("usuarios.id", ondelete="SET NULL"), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.UniqueConstraint("document_id", "usuario_id", name="uq_bim_cde_document_acl_user"),
    )
    for column in ("document_id", "empresa_id", "proyecto_id", "usuario_id", "active"):
        op.create_index(f"ix_bim_cde_document_acls_{column}", "bim_cde_document_acls", [column])


def downgrade():
    op.drop_table("bim_cde_document_acls")
