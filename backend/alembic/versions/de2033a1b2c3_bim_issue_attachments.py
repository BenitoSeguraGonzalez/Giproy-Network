"""bim issue photographic attachments"""

from alembic import op
import sqlalchemy as sa


revision = "de2033a1b2c3"
down_revision = "de2032a1b2c3"
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "bim_issue_attachments",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("bim_issue_id", sa.Integer(), sa.ForeignKey("bim_issues.id", ondelete="CASCADE"), nullable=False),
        sa.Column("filename", sa.String(length=255), nullable=False),
        sa.Column("content_type", sa.String(length=100), nullable=False),
        sa.Column("byte_size", sa.Integer(), nullable=False),
        sa.Column("checksum_sha256", sa.String(length=64), nullable=False),
        sa.Column("content", sa.LargeBinary(), nullable=False),
        sa.Column("uploaded_by", sa.Integer(), sa.ForeignKey("usuarios.id", ondelete="SET NULL"), nullable=True),
        sa.Column("uploaded_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.UniqueConstraint("bim_issue_id", "checksum_sha256", name="uq_bim_issue_attachment_checksum"),
    )
    op.create_index("ix_bim_issue_attachments_bim_issue_id", "bim_issue_attachments", ["bim_issue_id"])
    op.create_index("ix_bim_issue_attachments_uploaded_at", "bim_issue_attachments", ["uploaded_at"])


def downgrade():
    op.drop_table("bim_issue_attachments")
