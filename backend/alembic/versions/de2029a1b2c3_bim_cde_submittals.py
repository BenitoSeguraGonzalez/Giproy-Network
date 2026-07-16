"""bim cde submittal workflow"""

from alembic import op
import sqlalchemy as sa


revision = "de2029a1b2c3"
down_revision = "de2028a1b2c3"
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "bim_cde_submittals",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("empresa_id", sa.Integer(), sa.ForeignKey("empresas.id", ondelete="CASCADE"), nullable=False),
        sa.Column("proyecto_id", sa.Integer(), sa.ForeignKey("proyectos.id", ondelete="CASCADE"), nullable=False),
        sa.Column("submittal_number", sa.String(30), nullable=False), sa.Column("title", sa.String(500), nullable=False),
        sa.Column("submittal_type", sa.String(40), nullable=False), sa.Column("discipline", sa.String(80), nullable=False),
        sa.Column("specification_section", sa.String(120), nullable=True),
        sa.Column("reviewer_id", sa.Integer(), sa.ForeignKey("usuarios.id", ondelete="SET NULL"), nullable=True),
        sa.Column("required_at", sa.DateTime(timezone=True), nullable=False), sa.Column("status", sa.String(30), nullable=False, server_default="draft"),
        sa.Column("current_revision", sa.Integer(), nullable=False, server_default="1"), sa.Column("lock_version", sa.Integer(), nullable=False, server_default="1"),
        sa.Column("created_by", sa.Integer(), sa.ForeignKey("usuarios.id", ondelete="SET NULL"), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.UniqueConstraint("empresa_id", "proyecto_id", "submittal_number", name="uq_bim_cde_submittal_number"),
    )
    for column in ("empresa_id", "proyecto_id", "submittal_type", "discipline", "reviewer_id", "required_at", "status"):
        op.create_index(f"ix_bim_cde_submittals_{column}", "bim_cde_submittals", [column])
    op.create_table(
        "bim_cde_submittal_revisions",
        sa.Column("id", sa.Integer(), primary_key=True), sa.Column("submittal_id", sa.Integer(), sa.ForeignKey("bim_cde_submittals.id", ondelete="CASCADE"), nullable=False),
        sa.Column("revision", sa.Integer(), nullable=False), sa.Column("document_id", sa.Integer(), sa.ForeignKey("bim_cde_documents.id", ondelete="RESTRICT"), nullable=False),
        sa.Column("document_revision_id", sa.Integer(), sa.ForeignKey("bim_cde_document_revisions.id", ondelete="RESTRICT"), nullable=False),
        sa.Column("status", sa.String(30), nullable=False, server_default="draft"), sa.Column("submission_notes", sa.Text(), nullable=True),
        sa.Column("decision_comment", sa.Text(), nullable=True), sa.Column("submitted_by", sa.Integer(), sa.ForeignKey("usuarios.id", ondelete="SET NULL"), nullable=True),
        sa.Column("reviewed_by", sa.Integer(), sa.ForeignKey("usuarios.id", ondelete="SET NULL"), nullable=True),
        sa.Column("submitted_at", sa.DateTime(timezone=True), nullable=True), sa.Column("reviewed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.UniqueConstraint("submittal_id", "revision", name="uq_bim_cde_submittal_revision"),
    )
    for column in ("submittal_id", "document_id", "document_revision_id", "status"):
        op.create_index(f"ix_bim_cde_submittal_revisions_{column}", "bim_cde_submittal_revisions", [column])
    op.create_table(
        "bim_cde_submittal_events",
        sa.Column("id", sa.Integer(), primary_key=True), sa.Column("submittal_id", sa.Integer(), sa.ForeignKey("bim_cde_submittals.id", ondelete="CASCADE"), nullable=False),
        sa.Column("event_type", sa.String(50), nullable=False), sa.Column("payload_json", sa.JSON(), nullable=False),
        sa.Column("created_by", sa.Integer(), sa.ForeignKey("usuarios.id", ondelete="SET NULL"), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_bim_cde_submittal_events_submittal_id", "bim_cde_submittal_events", ["submittal_id"])


def downgrade():
    op.drop_table("bim_cde_submittal_events")
    op.drop_table("bim_cde_submittal_revisions")
    op.drop_table("bim_cde_submittals")
