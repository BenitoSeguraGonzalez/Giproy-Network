"""bim cde versioned documents"""

from alembic import op
import sqlalchemy as sa


revision = "de2027a1b2c3"
down_revision = "de2026a1b2c3"
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "bim_cde_documents",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("empresa_id", sa.Integer(), sa.ForeignKey("empresas.id", ondelete="CASCADE"), nullable=False),
        sa.Column("proyecto_id", sa.Integer(), sa.ForeignKey("proyectos.id", ondelete="CASCADE"), nullable=False),
        sa.Column("document_code", sa.String(120), nullable=False),
        sa.Column("title", sa.String(500), nullable=False),
        sa.Column("category", sa.String(50), nullable=False),
        sa.Column("status", sa.String(30), nullable=False, server_default="active"),
        sa.Column("current_revision", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("created_by", sa.Integer(), sa.ForeignKey("usuarios.id", ondelete="SET NULL"), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.UniqueConstraint("empresa_id", "proyecto_id", "document_code", name="uq_bim_cde_document_code"),
    )
    for column in ("empresa_id", "proyecto_id", "category", "status"):
        op.create_index(f"ix_bim_cde_documents_{column}", "bim_cde_documents", [column])
    op.create_table(
        "bim_cde_document_revisions",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("document_id", sa.Integer(), sa.ForeignKey("bim_cde_documents.id", ondelete="CASCADE"), nullable=False),
        sa.Column("empresa_id", sa.Integer(), sa.ForeignKey("empresas.id", ondelete="CASCADE"), nullable=False),
        sa.Column("proyecto_id", sa.Integer(), sa.ForeignKey("proyectos.id", ondelete="CASCADE"), nullable=False),
        sa.Column("revision", sa.Integer(), nullable=False),
        sa.Column("version_label", sa.String(100), nullable=False),
        sa.Column("source_filename", sa.String(255), nullable=False),
        sa.Column("stored_path", sa.String(700), nullable=False),
        sa.Column("media_type", sa.String(150), nullable=False),
        sa.Column("file_size_bytes", sa.Integer(), nullable=False),
        sa.Column("checksum_sha256", sa.String(64), nullable=False),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("status", sa.String(30), nullable=False, server_default="current"),
        sa.Column("created_by", sa.Integer(), sa.ForeignKey("usuarios.id", ondelete="SET NULL"), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.UniqueConstraint("document_id", "revision", name="uq_bim_cde_document_revision"),
    )
    for column in ("document_id", "empresa_id", "proyecto_id", "status"):
        op.create_index(f"ix_bim_cde_document_revisions_{column}", "bim_cde_document_revisions", [column])
    op.create_index("uq_bim_cde_document_current_revision", "bim_cde_document_revisions", ["document_id"], unique=True, postgresql_where=sa.text("status = 'current'"))


def downgrade():
    op.drop_table("bim_cde_document_revisions")
    op.drop_table("bim_cde_documents")
