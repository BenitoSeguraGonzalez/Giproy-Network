"""bim 4d native resources and assignments"""
from alembic import op
import sqlalchemy as sa

revision = "de2017a1b2c3"
down_revision = "de2016a1b2c3"
branch_labels = None
depends_on = None


def upgrade():
    op.create_table("bim_4d_resources", sa.Column("id", sa.Integer(), primary_key=True), sa.Column("empresa_id", sa.Integer(), sa.ForeignKey("empresas.id", ondelete="CASCADE"), nullable=False), sa.Column("proyecto_id", sa.Integer(), sa.ForeignKey("proyectos.id", ondelete="CASCADE"), nullable=False), sa.Column("code", sa.String(100), nullable=False), sa.Column("name", sa.String(255), nullable=False), sa.Column("resource_type", sa.String(30), nullable=False), sa.Column("unit", sa.String(30), nullable=False), sa.Column("capacity_per_day", sa.Float(), nullable=False), sa.Column("source_kind", sa.String(50), nullable=False), sa.Column("source_ref", sa.String(255)), sa.Column("created_by", sa.Integer(), sa.ForeignKey("usuarios.id", ondelete="SET NULL")), sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False), sa.UniqueConstraint("empresa_id", "proyecto_id", "code", name="uq_bim_4d_resource_code"))
    op.create_index("ix_bim_4d_resources_empresa_id", "bim_4d_resources", ["empresa_id"]); op.create_index("ix_bim_4d_resources_proyecto_id", "bim_4d_resources", ["proyecto_id"])
    op.create_table("bim_4d_resource_assignments", sa.Column("id", sa.Integer(), primary_key=True), sa.Column("empresa_id", sa.Integer(), sa.ForeignKey("empresas.id", ondelete="CASCADE"), nullable=False), sa.Column("proyecto_id", sa.Integer(), sa.ForeignKey("proyectos.id", ondelete="CASCADE"), nullable=False), sa.Column("resource_id", sa.Integer(), sa.ForeignKey("bim_4d_resources.id", ondelete="CASCADE"), nullable=False), sa.Column("activity_snapshot_id", sa.Integer(), sa.ForeignKey("bim_4d_activity_snapshots.id", ondelete="CASCADE"), nullable=False), sa.Column("demand_per_day", sa.Float(), nullable=False), sa.Column("created_by", sa.Integer(), sa.ForeignKey("usuarios.id", ondelete="SET NULL")), sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False), sa.UniqueConstraint("resource_id", "activity_snapshot_id", name="uq_bim_4d_resource_activity"))
    for column in ("empresa_id", "proyecto_id", "resource_id", "activity_snapshot_id"): op.create_index(f"ix_bim_4d_resource_assignments_{column}", "bim_4d_resource_assignments", [column])


def downgrade():
    op.drop_table("bim_4d_resource_assignments")
    op.drop_table("bim_4d_resources")
