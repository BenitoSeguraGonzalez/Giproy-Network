"""Persist reviewed BIM version reconciliation decisions."""

from alembic import op
import sqlalchemy as sa


revision = "de2064a1b2c3"
down_revision = "de2063a1b2c3"
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "bim_version_reconciliation_decisions",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("empresa_id", sa.Integer(), sa.ForeignKey("empresas.id", ondelete="CASCADE"), nullable=False),
        sa.Column("proyecto_id", sa.Integer(), sa.ForeignKey("proyectos.id", ondelete="CASCADE"), nullable=False),
        sa.Column("source_version_id", sa.Integer(), sa.ForeignKey("bim_model_versions.id", ondelete="RESTRICT"), nullable=False),
        sa.Column("target_version_id", sa.Integer(), sa.ForeignKey("bim_model_versions.id", ondelete="RESTRICT"), nullable=False),
        sa.Column("candidate_hash", sa.String(length=64), nullable=False),
        sa.Column("candidate_json", sa.JSON(), nullable=False),
        sa.Column("decision", sa.String(length=20), nullable=False),
        sa.Column("selected_target_element_id", sa.Integer(), sa.ForeignKey("bim_elements.id", ondelete="RESTRICT"), nullable=True),
        sa.Column("reason", sa.Text(), nullable=False),
        sa.Column("affected_link_count", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("reviewed_by", sa.Integer(), sa.ForeignKey("usuarios.id", ondelete="SET NULL"), nullable=True),
        sa.Column("fecha_creacion", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.UniqueConstraint("empresa_id", "proyecto_id", "source_version_id", "target_version_id", "candidate_hash", name="uq_bim_reconciliation_candidate"),
    )
    for column in ("empresa_id", "proyecto_id", "source_version_id", "target_version_id", "candidate_hash"):
        op.create_index(f"ix_bim_reconciliation_{column}", "bim_version_reconciliation_decisions", [column])


def downgrade():
    for column in reversed(("empresa_id", "proyecto_id", "source_version_id", "target_version_id", "candidate_hash")):
        op.drop_index(f"ix_bim_reconciliation_{column}", table_name="bim_version_reconciliation_decisions")
    op.drop_table("bim_version_reconciliation_decisions")
