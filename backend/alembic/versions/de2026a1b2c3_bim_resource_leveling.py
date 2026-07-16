"""bim resource leveling scenarios"""

from alembic import op
import sqlalchemy as sa


revision = "de2026a1b2c3"
down_revision = "de2025a1b2c3"
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "bim_4d_resource_leveling_scenarios",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("empresa_id", sa.Integer(), sa.ForeignKey("empresas.id", ondelete="CASCADE"), nullable=False),
        sa.Column("proyecto_id", sa.Integer(), sa.ForeignKey("proyectos.id", ondelete="CASCADE"), nullable=False),
        sa.Column("baseline_id", sa.Integer(), sa.ForeignKey("bim_4d_baselines.id", ondelete="CASCADE"), nullable=False),
        sa.Column("project_revision", sa.Integer(), nullable=False),
        sa.Column("revision", sa.String(100), nullable=False),
        sa.Column("input_json", sa.JSON(), nullable=False),
        sa.Column("result_json", sa.JSON(), nullable=False),
        sa.Column("checksum_sha256", sa.String(64), nullable=False),
        sa.Column("status", sa.String(30), nullable=False, server_default="proposed"),
        sa.Column("decision_reason", sa.Text(), nullable=True),
        sa.Column("lock_version", sa.Integer(), nullable=False, server_default="1"),
        sa.Column("created_by", sa.Integer(), sa.ForeignKey("usuarios.id", ondelete="SET NULL"), nullable=True),
        sa.Column("decided_by", sa.Integer(), sa.ForeignKey("usuarios.id", ondelete="SET NULL"), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("decided_at", sa.DateTime(timezone=True), nullable=True),
        sa.UniqueConstraint("empresa_id", "proyecto_id", "baseline_id", "revision", name="uq_bim_4d_leveling_revision"),
    )
    for column in ("empresa_id", "proyecto_id", "baseline_id", "status"):
        op.create_index(f"ix_bim_4d_resource_leveling_scenarios_{column}", "bim_4d_resource_leveling_scenarios", [column])
    op.create_index(
        "uq_bim_4d_leveling_active",
        "bim_4d_resource_leveling_scenarios",
        ["empresa_id", "proyecto_id", "baseline_id"],
        unique=True,
        postgresql_where=sa.text("status = 'approved'"),
    )


def downgrade():
    op.drop_table("bim_4d_resource_leveling_scenarios")
