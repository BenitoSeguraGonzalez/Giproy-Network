"""bim qto approval governance"""

from alembic import op
import sqlalchemy as sa


revision = "de2025a1b2c3"
down_revision = "de2024a1b2c3"
branch_labels = None
depends_on = None


def upgrade():
    op.add_column("bim_qto_snapshots", sa.Column("status", sa.String(30), nullable=False, server_default="draft"))
    op.add_column("bim_qto_snapshots", sa.Column("decision_reason", sa.Text(), nullable=True))
    op.add_column("bim_qto_snapshots", sa.Column("lock_version", sa.Integer(), nullable=False, server_default="1"))
    op.add_column("bim_qto_snapshots", sa.Column("decided_by", sa.Integer(), sa.ForeignKey("usuarios.id", ondelete="SET NULL"), nullable=True))
    op.add_column("bim_qto_snapshots", sa.Column("decided_at", sa.DateTime(timezone=True), nullable=True))
    op.create_index("ix_bim_qto_snapshots_status", "bim_qto_snapshots", ["status"])
    op.create_index(
        "uq_bim_qto_snapshot_active_approval",
        "bim_qto_snapshots",
        ["empresa_id", "proyecto_id", "bim_model_version_id"],
        unique=True,
        postgresql_where=sa.text("status = 'approved'"),
    )


def downgrade():
    op.drop_index("uq_bim_qto_snapshot_active_approval", table_name="bim_qto_snapshots")
    op.drop_index("ix_bim_qto_snapshots_status", table_name="bim_qto_snapshots")
    op.drop_column("bim_qto_snapshots", "decided_at")
    op.drop_column("bim_qto_snapshots", "decided_by")
    op.drop_column("bim_qto_snapshots", "lock_version")
    op.drop_column("bim_qto_snapshots", "decision_reason")
    op.drop_column("bim_qto_snapshots", "status")
