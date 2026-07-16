"""Add governed BIM punch-list closure."""
from alembic import op
import sqlalchemy as sa

revision = "de2048a1b2c3"
down_revision = "de2047a1b2c3"
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "bim_punch_closures",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("empresa_id", sa.Integer(), sa.ForeignKey("empresas.id", ondelete="CASCADE"), nullable=False),
        sa.Column("proyecto_id", sa.Integer(), sa.ForeignKey("proyectos.id", ondelete="CASCADE"), nullable=False),
        sa.Column("as_built_acceptance_id", sa.Integer(), sa.ForeignKey("bim_as_built_acceptances.id", ondelete="RESTRICT"), nullable=False),
        sa.Column("revision", sa.String(100), nullable=False), sa.Column("punch_item_ids_json", sa.JSON(), nullable=False),
        sa.Column("punch_snapshot_sha256", sa.String(64), nullable=False), sa.Column("total_items", sa.Integer(), nullable=False),
        sa.Column("critical_items", sa.Integer(), nullable=False), sa.Column("closure_criteria_json", sa.JSON(), nullable=False),
        sa.Column("verification_notes", sa.Text(), nullable=False), sa.Column("status", sa.String(30), nullable=False, server_default="submitted"),
        sa.Column("decision_reason", sa.Text()), sa.Column("lock_version", sa.Integer(), nullable=False, server_default="1"),
        sa.Column("submitted_by", sa.Integer(), sa.ForeignKey("usuarios.id", ondelete="SET NULL")),
        sa.Column("decided_by", sa.Integer(), sa.ForeignKey("usuarios.id", ondelete="SET NULL")),
        sa.Column("submitted_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()), sa.Column("decided_at", sa.DateTime(timezone=True)),
        sa.CheckConstraint("status IN ('submitted','accepted','rejected','superseded')", name="ck_bim_punch_closure_status"),
        sa.UniqueConstraint("empresa_id", "proyecto_id", "revision", name="uq_bim_punch_closure_revision"),
    )
    for column in ("empresa_id", "proyecto_id", "as_built_acceptance_id", "status"):
        op.create_index(f"ix_bim_punch_closures_{column}", "bim_punch_closures", [column])
    op.create_index("uq_bim_punch_closure_current", "bim_punch_closures", ["empresa_id", "proyecto_id"], unique=True, postgresql_where=sa.text("status = 'accepted'"))


def downgrade():
    op.drop_table("bim_punch_closures")
