"""bim field material and equipment movements"""

from alembic import op
import sqlalchemy as sa


revision = "de2036a1b2c3"
down_revision = "de2035a1b2c3"
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "bim_4d_field_resource_movements",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("empresa_id", sa.Integer(), sa.ForeignKey("empresas.id", ondelete="CASCADE"), nullable=False),
        sa.Column("proyecto_id", sa.Integer(), sa.ForeignKey("proyectos.id", ondelete="CASCADE"), nullable=False),
        sa.Column("resource_id", sa.Integer(), sa.ForeignKey("bim_4d_resources.id", ondelete="RESTRICT"), nullable=False),
        sa.Column("activity_snapshot_id", sa.Integer(), sa.ForeignKey("bim_4d_activity_snapshots.id", ondelete="SET NULL")),
        sa.Column("work_area_id", sa.Integer(), sa.ForeignKey("bim_4d_work_areas.id", ondelete="SET NULL")),
        sa.Column("movement_type", sa.String(20), nullable=False),
        sa.Column("quantity", sa.Float(), nullable=False),
        sa.Column("occurred_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("reference", sa.String(120)),
        sa.Column("note", sa.Text(), nullable=False),
        sa.Column("created_by", sa.Integer(), sa.ForeignKey("usuarios.id", ondelete="SET NULL")),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.CheckConstraint("quantity > 0", name="ck_bim_4d_field_resource_movement_quantity"),
        sa.CheckConstraint("movement_type IN ('receipt', 'consume', 'return')", name="ck_bim_4d_field_resource_movement_type"),
    )
    for column in ("empresa_id", "proyecto_id", "resource_id", "activity_snapshot_id", "work_area_id", "movement_type", "occurred_at"):
        op.create_index(f"ix_bim_4d_field_resource_movements_{column}", "bim_4d_field_resource_movements", [column])


def downgrade():
    op.drop_table("bim_4d_field_resource_movements")
