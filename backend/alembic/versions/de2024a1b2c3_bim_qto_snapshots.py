"""bim qto snapshots"""

from alembic import op
import sqlalchemy as sa


revision = "de2024a1b2c3"
down_revision = "de2023a1b2c3"
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "bim_qto_snapshots",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("empresa_id", sa.Integer(), sa.ForeignKey("empresas.id", ondelete="CASCADE"), nullable=False),
        sa.Column("proyecto_id", sa.Integer(), sa.ForeignKey("proyectos.id", ondelete="CASCADE"), nullable=False),
        sa.Column("bim_model_version_id", sa.Integer(), sa.ForeignKey("bim_model_versions.id", ondelete="CASCADE"), nullable=False),
        sa.Column("revision", sa.String(100), nullable=False),
        sa.Column("grouping_json", sa.JSON(), nullable=False),
        sa.Column("quantity_names_json", sa.JSON(), nullable=False),
        sa.Column("mappings_json", sa.JSON(), nullable=False),
        sa.Column("rows_json", sa.JSON(), nullable=False),
        sa.Column("totals_json", sa.JSON(), nullable=False),
        sa.Column("coverage_json", sa.JSON(), nullable=False),
        sa.Column("checksum_sha256", sa.String(64), nullable=False),
        sa.Column("created_by", sa.Integer(), sa.ForeignKey("usuarios.id", ondelete="SET NULL")),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.UniqueConstraint("empresa_id", "proyecto_id", "bim_model_version_id", "revision", name="uq_bim_qto_snapshot_revision"),
    )
    for column in ("empresa_id", "proyecto_id", "bim_model_version_id"):
        op.create_index(f"ix_bim_qto_snapshots_{column}", "bim_qto_snapshots", [column])


def downgrade():
    op.drop_table("bim_qto_snapshots")
