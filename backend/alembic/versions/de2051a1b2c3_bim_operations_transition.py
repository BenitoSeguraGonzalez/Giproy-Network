"""Add governed BIM transition to Operations."""
from alembic import op
import sqlalchemy as sa

revision = "de2051a1b2c3"
down_revision = "de2050a1b2c3"
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "bim_operations_transitions",
        sa.Column("id", sa.Integer(), primary_key=True), sa.Column("empresa_id", sa.Integer(), sa.ForeignKey("empresas.id", ondelete="CASCADE"), nullable=False), sa.Column("proyecto_id", sa.Integer(), sa.ForeignKey("proyectos.id", ondelete="CASCADE"), nullable=False), sa.Column("handover_dossier_id", sa.Integer(), sa.ForeignKey("bim_handover_dossiers.id", ondelete="RESTRICT"), nullable=False),
        sa.Column("revision", sa.String(100), nullable=False), sa.Column("operating_organization", sa.String(255), nullable=False), sa.Column("responsible_role", sa.String(150), nullable=False), sa.Column("effective_date", sa.Date(), nullable=False), sa.Column("readiness_criteria_json", sa.JSON(), nullable=False), sa.Column("asset_baseline_json", sa.JSON(), nullable=False), sa.Column("baseline_checksum_sha256", sa.String(64), nullable=False), sa.Column("total_systems", sa.Integer(), nullable=False), sa.Column("total_assets", sa.Integer(), nullable=False), sa.Column("transition_notes", sa.Text(), nullable=False), sa.Column("status", sa.String(30), nullable=False, server_default="submitted"), sa.Column("decision_reason", sa.Text()), sa.Column("lock_version", sa.Integer(), nullable=False, server_default="1"), sa.Column("submitted_by", sa.Integer(), sa.ForeignKey("usuarios.id", ondelete="SET NULL")), sa.Column("decided_by", sa.Integer(), sa.ForeignKey("usuarios.id", ondelete="SET NULL")), sa.Column("submitted_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()), sa.Column("decided_at", sa.DateTime(timezone=True)),
        sa.CheckConstraint("status IN ('submitted','accepted','rejected','superseded')", name="ck_bim_operations_transition_status"), sa.UniqueConstraint("empresa_id", "proyecto_id", "revision", name="uq_bim_operations_transition_revision"),
    )
    for column in ("empresa_id", "proyecto_id", "handover_dossier_id", "status"):
        op.create_index(f"ix_bim_operations_transitions_{column}", "bim_operations_transitions", [column])


def downgrade():
    op.drop_table("bim_operations_transitions")
