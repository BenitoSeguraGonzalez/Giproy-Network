"""bim 4d safety risks and inspections"""
from alembic import op
import sqlalchemy as sa

revision = "de2021a1b2c3"
down_revision = "de2020a1b2c3"
branch_labels = None
depends_on = None


def upgrade():
    op.create_table("bim_4d_safety_risks", sa.Column("id", sa.Integer(), primary_key=True), sa.Column("empresa_id", sa.Integer(), sa.ForeignKey("empresas.id", ondelete="CASCADE"), nullable=False), sa.Column("proyecto_id", sa.Integer(), sa.ForeignKey("proyectos.id", ondelete="CASCADE"), nullable=False), sa.Column("activity_snapshot_id", sa.Integer(), sa.ForeignKey("bim_4d_activity_snapshots.id", ondelete="CASCADE"), nullable=False), sa.Column("bim_element_id", sa.Integer(), sa.ForeignKey("bim_elements.id", ondelete="SET NULL")), sa.Column("work_area_id", sa.Integer(), sa.ForeignKey("bim_4d_work_areas.id", ondelete="SET NULL")), sa.Column("title", sa.String(255), nullable=False), sa.Column("hazard_type", sa.String(50), nullable=False), sa.Column("severity", sa.Integer(), nullable=False), sa.Column("likelihood", sa.Integer(), nullable=False), sa.Column("controls_json", sa.JSON(), nullable=False), sa.Column("zone_json", sa.JSON(), nullable=False), sa.Column("active_start", sa.DateTime(timezone=True), nullable=False), sa.Column("active_finish", sa.DateTime(timezone=True), nullable=False), sa.Column("status", sa.String(30), nullable=False, server_default="open"), sa.Column("created_by", sa.Integer(), sa.ForeignKey("usuarios.id", ondelete="SET NULL")), sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False))
    op.create_table("bim_4d_safety_inspections", sa.Column("id", sa.Integer(), primary_key=True), sa.Column("empresa_id", sa.Integer(), sa.ForeignKey("empresas.id", ondelete="CASCADE"), nullable=False), sa.Column("proyecto_id", sa.Integer(), sa.ForeignKey("proyectos.id", ondelete="CASCADE"), nullable=False), sa.Column("risk_id", sa.Integer(), sa.ForeignKey("bim_4d_safety_risks.id", ondelete="CASCADE"), nullable=False), sa.Column("inspected_at", sa.DateTime(timezone=True), nullable=False), sa.Column("result", sa.String(30), nullable=False), sa.Column("note", sa.Text(), nullable=False), sa.Column("evidence_ref", sa.String(500)), sa.Column("inspected_by", sa.Integer(), sa.ForeignKey("usuarios.id", ondelete="SET NULL")), sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False))
    for table, columns in (("bim_4d_safety_risks", ("empresa_id", "proyecto_id", "activity_snapshot_id", "bim_element_id", "work_area_id")), ("bim_4d_safety_inspections", ("empresa_id", "proyecto_id", "risk_id"))):
        for column in columns: op.create_index(f"ix_{table}_{column}", table, [column])


def downgrade():
    op.drop_table("bim_4d_safety_inspections")
    op.drop_table("bim_4d_safety_risks")
