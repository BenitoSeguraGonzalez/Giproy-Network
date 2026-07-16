"""bim cde contextual reviews"""

from alembic import op
import sqlalchemy as sa


revision = "de2032a1b2c3"
down_revision = "de2031a1b2c3"
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "bim_cde_reviews",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("empresa_id", sa.Integer(), sa.ForeignKey("empresas.id", ondelete="CASCADE"), nullable=False),
        sa.Column("proyecto_id", sa.Integer(), sa.ForeignKey("proyectos.id", ondelete="CASCADE"), nullable=False),
        sa.Column("review_number", sa.String(length=30), nullable=False),
        sa.Column("title", sa.String(length=500), nullable=False),
        sa.Column("status", sa.String(length=30), nullable=False, server_default="open"),
        sa.Column("document_revision_id", sa.Integer(), sa.ForeignKey("bim_cde_document_revisions.id", ondelete="RESTRICT"), nullable=False),
        sa.Column("global_id", sa.String(length=64), nullable=True),
        sa.Column("viewpoint_json", sa.JSON(), nullable=True),
        sa.Column("assigned_to", sa.Integer(), sa.ForeignKey("usuarios.id", ondelete="SET NULL"), nullable=False),
        sa.Column("due_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("created_by", sa.Integer(), sa.ForeignKey("usuarios.id", ondelete="SET NULL"), nullable=True),
        sa.Column("resolved_by", sa.Integer(), sa.ForeignKey("usuarios.id", ondelete="SET NULL"), nullable=True),
        sa.Column("closed_by", sa.Integer(), sa.ForeignKey("usuarios.id", ondelete="SET NULL"), nullable=True),
        sa.Column("resolution", sa.Text(), nullable=True),
        sa.Column("lock_version", sa.Integer(), nullable=False, server_default="1"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("resolved_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("closed_at", sa.DateTime(timezone=True), nullable=True),
        sa.UniqueConstraint("empresa_id", "proyecto_id", "review_number", name="uq_bim_cde_review_number"),
    )
    for column in ("empresa_id", "proyecto_id", "status", "document_revision_id", "global_id", "assigned_to", "created_by", "due_at"):
        op.create_index(f"ix_bim_cde_reviews_{column}", "bim_cde_reviews", [column])
    op.create_table(
        "bim_cde_review_comments",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("review_id", sa.Integer(), sa.ForeignKey("bim_cde_reviews.id", ondelete="CASCADE"), nullable=False),
        sa.Column("body", sa.Text(), nullable=False),
        sa.Column("created_by", sa.Integer(), sa.ForeignKey("usuarios.id", ondelete="SET NULL"), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_bim_cde_review_comments_review_id", "bim_cde_review_comments", ["review_id"])
    op.create_table(
        "bim_cde_review_notifications",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("review_id", sa.Integer(), sa.ForeignKey("bim_cde_reviews.id", ondelete="CASCADE"), nullable=False),
        sa.Column("empresa_id", sa.Integer(), sa.ForeignKey("empresas.id", ondelete="CASCADE"), nullable=False),
        sa.Column("proyecto_id", sa.Integer(), sa.ForeignKey("proyectos.id", ondelete="CASCADE"), nullable=False),
        sa.Column("usuario_id", sa.Integer(), sa.ForeignKey("usuarios.id", ondelete="CASCADE"), nullable=False),
        sa.Column("event_type", sa.String(length=50), nullable=False),
        sa.Column("dedupe_key", sa.String(length=255), nullable=False),
        sa.Column("read_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.UniqueConstraint("dedupe_key", name="uq_bim_cde_review_notification_dedupe"),
    )
    for column in ("review_id", "empresa_id", "proyecto_id", "usuario_id", "read_at"):
        op.create_index(f"ix_bim_cde_review_notifications_{column}", "bim_cde_review_notifications", [column])


def downgrade():
    op.drop_table("bim_cde_review_notifications")
    op.drop_table("bim_cde_review_comments")
    op.drop_table("bim_cde_reviews")
