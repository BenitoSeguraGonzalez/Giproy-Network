"""bim 4d non destructive partition specs"""
from alembic import op
import sqlalchemy as sa

revision = "de2018a1b2c3"
down_revision = "de2017a1b2c3"
branch_labels = None
depends_on = None


def upgrade():
    op.create_table("bim_4d_partition_specs", sa.Column("id", sa.Integer(), primary_key=True), sa.Column("empresa_id", sa.Integer(), sa.ForeignKey("empresas.id", ondelete="CASCADE"), nullable=False), sa.Column("proyecto_id", sa.Integer(), sa.ForeignKey("proyectos.id", ondelete="CASCADE"), nullable=False), sa.Column("bim_model_version_id", sa.Integer(), sa.ForeignKey("bim_model_versions.id", ondelete="CASCADE"), nullable=False), sa.Column("bim_element_id", sa.Integer(), sa.ForeignKey("bim_elements.id", ondelete="CASCADE"), nullable=False), sa.Column("revision", sa.String(100), nullable=False), sa.Column("axis", sa.String(1), nullable=False), sa.Column("segment_count", sa.Integer(), nullable=False), sa.Column("gap_ratio", sa.Float(), nullable=False, server_default="0"), sa.Column("status", sa.String(30), nullable=False, server_default="preview"), sa.Column("created_by", sa.Integer(), sa.ForeignKey("usuarios.id", ondelete="SET NULL")), sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()), sa.UniqueConstraint("bim_element_id", "revision", name="uq_bim_4d_partition_element_revision"))
    for column in ("empresa_id", "proyecto_id", "bim_model_version_id", "bim_element_id"): op.create_index(f"ix_bim_4d_partition_specs_{column}", "bim_4d_partition_specs", [column])


def downgrade():
    op.drop_table("bim_4d_partition_specs")
