"""bim cde rfi workflow"""

from alembic import op
import sqlalchemy as sa


revision = "de2028a1b2c3"
down_revision = "de2027a1b2c3"
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "bim_cde_rfis",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("empresa_id", sa.Integer(), sa.ForeignKey("empresas.id", ondelete="CASCADE"), nullable=False),
        sa.Column("proyecto_id", sa.Integer(), sa.ForeignKey("proyectos.id", ondelete="CASCADE"), nullable=False),
        sa.Column("rfi_number", sa.String(30), nullable=False), sa.Column("subject", sa.String(500), nullable=False),
        sa.Column("question", sa.Text(), nullable=False), sa.Column("priority", sa.String(30), nullable=False, server_default="normal"),
        sa.Column("status", sa.String(30), nullable=False, server_default="draft"), sa.Column("due_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("document_id", sa.Integer(), sa.ForeignKey("bim_cde_documents.id", ondelete="SET NULL"), nullable=True),
        sa.Column("global_id", sa.String(64), nullable=True), sa.Column("assigned_to", sa.Integer(), sa.ForeignKey("usuarios.id", ondelete="SET NULL"), nullable=True),
        sa.Column("answer", sa.Text(), nullable=True), sa.Column("created_by", sa.Integer(), sa.ForeignKey("usuarios.id", ondelete="SET NULL"), nullable=True),
        sa.Column("answered_by", sa.Integer(), sa.ForeignKey("usuarios.id", ondelete="SET NULL"), nullable=True),
        sa.Column("closed_by", sa.Integer(), sa.ForeignKey("usuarios.id", ondelete="SET NULL"), nullable=True),
        sa.Column("lock_version", sa.Integer(), nullable=False, server_default="1"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("submitted_at", sa.DateTime(timezone=True), nullable=True), sa.Column("answered_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("closed_at", sa.DateTime(timezone=True), nullable=True), sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.UniqueConstraint("empresa_id", "proyecto_id", "rfi_number", name="uq_bim_cde_rfi_number"),
    )
    for column in ("empresa_id", "proyecto_id", "status", "due_at", "document_id", "global_id", "assigned_to"):
        op.create_index(f"ix_bim_cde_rfis_{column}", "bim_cde_rfis", [column])
    op.create_table(
        "bim_cde_rfi_events",
        sa.Column("id", sa.Integer(), primary_key=True), sa.Column("rfi_id", sa.Integer(), sa.ForeignKey("bim_cde_rfis.id", ondelete="CASCADE"), nullable=False),
        sa.Column("event_type", sa.String(50), nullable=False), sa.Column("payload_json", sa.JSON(), nullable=False),
        sa.Column("created_by", sa.Integer(), sa.ForeignKey("usuarios.id", ondelete="SET NULL"), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_bim_cde_rfi_events_rfi_id", "bim_cde_rfi_events", ["rfi_id"])


def downgrade():
    op.drop_table("bim_cde_rfi_events")
    op.drop_table("bim_cde_rfis")
