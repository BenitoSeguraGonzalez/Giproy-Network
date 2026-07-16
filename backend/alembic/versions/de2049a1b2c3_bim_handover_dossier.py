"""Add governed BIM digital handover dossier."""
from alembic import op
import sqlalchemy as sa

revision = "de2049a1b2c3"
down_revision = "de2048a1b2c3"
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "bim_handover_dossiers",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("empresa_id", sa.Integer(), sa.ForeignKey("empresas.id", ondelete="CASCADE"), nullable=False),
        sa.Column("proyecto_id", sa.Integer(), sa.ForeignKey("proyectos.id", ondelete="CASCADE"), nullable=False),
        sa.Column("as_built_acceptance_id", sa.Integer(), sa.ForeignKey("bim_as_built_acceptances.id", ondelete="RESTRICT"), nullable=False),
        sa.Column("punch_closure_id", sa.Integer(), sa.ForeignKey("bim_punch_closures.id", ondelete="RESTRICT"), nullable=False),
        sa.Column("revision", sa.String(100), nullable=False), sa.Column("manifest_json", sa.JSON(), nullable=False),
        sa.Column("manifest_checksum_sha256", sa.String(64), nullable=False), sa.Column("system_ids_json", sa.JSON(), nullable=False),
        sa.Column("asset_ids_json", sa.JSON(), nullable=False), sa.Column("cde_revision_ids_json", sa.JSON(), nullable=False),
        sa.Column("total_systems", sa.Integer(), nullable=False), sa.Column("total_assets", sa.Integer(), nullable=False),
        sa.Column("total_documents", sa.Integer(), nullable=False), sa.Column("assembly_notes", sa.Text(), nullable=False),
        sa.Column("status", sa.String(30), nullable=False, server_default="submitted"), sa.Column("decision_reason", sa.Text()),
        sa.Column("lock_version", sa.Integer(), nullable=False, server_default="1"),
        sa.Column("submitted_by", sa.Integer(), sa.ForeignKey("usuarios.id", ondelete="SET NULL")),
        sa.Column("decided_by", sa.Integer(), sa.ForeignKey("usuarios.id", ondelete="SET NULL")),
        sa.Column("submitted_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()), sa.Column("decided_at", sa.DateTime(timezone=True)),
        sa.CheckConstraint("status IN ('submitted','accepted','rejected','superseded')", name="ck_bim_handover_dossier_status"),
        sa.UniqueConstraint("empresa_id", "proyecto_id", "revision", name="uq_bim_handover_dossier_revision"),
    )
    for column in ("empresa_id", "proyecto_id", "as_built_acceptance_id", "punch_closure_id", "status"):
        op.create_index(f"ix_bim_handover_dossiers_{column}", "bim_handover_dossiers", [column])


def downgrade():
    op.drop_table("bim_handover_dossiers")
