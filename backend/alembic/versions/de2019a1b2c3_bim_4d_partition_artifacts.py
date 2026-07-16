"""bim 4d parametric partition artifacts"""
from alembic import op
import sqlalchemy as sa

revision = "de2019a1b2c3"
down_revision = "de2018a1b2c3"
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "bim_4d_partition_artifacts",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("empresa_id", sa.Integer(), sa.ForeignKey("empresas.id", ondelete="CASCADE"), nullable=False),
        sa.Column("proyecto_id", sa.Integer(), sa.ForeignKey("proyectos.id", ondelete="CASCADE"), nullable=False),
        sa.Column("bim_model_version_id", sa.Integer(), sa.ForeignKey("bim_model_versions.id", ondelete="CASCADE"), nullable=False),
        sa.Column("bim_element_id", sa.Integer(), sa.ForeignKey("bim_elements.id", ondelete="CASCADE"), nullable=False),
        sa.Column("partition_spec_id", sa.Integer(), sa.ForeignKey("bim_4d_partition_specs.id", ondelete="CASCADE"), nullable=False),
        sa.Column("contract_version", sa.String(80), nullable=False),
        sa.Column("geometry_method", sa.String(50), nullable=False),
        sa.Column("checksum_sha256", sa.String(64), nullable=False),
        sa.Column("geometry_json", sa.JSON(), nullable=False),
        sa.Column("total_volume", sa.Float(), nullable=False),
        sa.Column("total_surface_area", sa.Float(), nullable=False),
        sa.Column("created_by", sa.Integer(), sa.ForeignKey("usuarios.id", ondelete="SET NULL")),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.UniqueConstraint("partition_spec_id", name="uq_bim_4d_partition_artifact_spec"),
    )
    for column in ("empresa_id", "proyecto_id", "bim_model_version_id", "bim_element_id", "partition_spec_id"):
        op.create_index(f"ix_bim_4d_partition_artifacts_{column}", "bim_4d_partition_artifacts", [column])


def downgrade():
    op.drop_table("bim_4d_partition_artifacts")
