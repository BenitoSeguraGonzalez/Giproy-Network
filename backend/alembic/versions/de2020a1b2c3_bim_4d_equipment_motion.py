"""bim 4d equipment motion plans"""
from alembic import op
import sqlalchemy as sa

revision = "de2020a1b2c3"
down_revision = "de2019a1b2c3"
branch_labels = None
depends_on = None


def upgrade():
    op.create_table("bim_4d_equipment", sa.Column("id", sa.Integer(), primary_key=True), sa.Column("empresa_id", sa.Integer(), sa.ForeignKey("empresas.id", ondelete="CASCADE"), nullable=False), sa.Column("proyecto_id", sa.Integer(), sa.ForeignKey("proyectos.id", ondelete="CASCADE"), nullable=False), sa.Column("code", sa.String(100), nullable=False), sa.Column("name", sa.String(255), nullable=False), sa.Column("equipment_type", sa.String(50), nullable=False), sa.Column("dimensions_json", sa.JSON(), nullable=False), sa.Column("created_by", sa.Integer(), sa.ForeignKey("usuarios.id", ondelete="SET NULL")), sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False), sa.UniqueConstraint("empresa_id", "proyecto_id", "code", name="uq_bim_4d_equipment_code"))
    op.create_table("bim_4d_equipment_motion_plans", sa.Column("id", sa.Integer(), primary_key=True), sa.Column("empresa_id", sa.Integer(), sa.ForeignKey("empresas.id", ondelete="CASCADE"), nullable=False), sa.Column("proyecto_id", sa.Integer(), sa.ForeignKey("proyectos.id", ondelete="CASCADE"), nullable=False), sa.Column("equipment_id", sa.Integer(), sa.ForeignKey("bim_4d_equipment.id", ondelete="CASCADE"), nullable=False), sa.Column("activity_snapshot_id", sa.Integer(), sa.ForeignKey("bim_4d_activity_snapshots.id", ondelete="CASCADE"), nullable=False), sa.Column("revision", sa.String(100), nullable=False), sa.Column("path_json", sa.JSON(), nullable=False), sa.Column("operation_radius", sa.Float(), nullable=False), sa.Column("temporary_geometry_json", sa.JSON(), nullable=False), sa.Column("created_by", sa.Integer(), sa.ForeignKey("usuarios.id", ondelete="SET NULL")), sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False), sa.UniqueConstraint("equipment_id", "revision", name="uq_bim_4d_equipment_motion_revision"))
    for table, columns in (("bim_4d_equipment", ("empresa_id", "proyecto_id")), ("bim_4d_equipment_motion_plans", ("empresa_id", "proyecto_id", "equipment_id", "activity_snapshot_id"))):
        for column in columns: op.create_index(f"ix_{table}_{column}", table, [column])


def downgrade():
    op.drop_table("bim_4d_equipment_motion_plans")
    op.drop_table("bim_4d_equipment")
