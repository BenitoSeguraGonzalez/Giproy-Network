"""bim field inspection checklists and punch items"""

from alembic import op
import sqlalchemy as sa


revision = "de2034a1b2c3"
down_revision = "de2033a1b2c3"
branch_labels = None
depends_on = None


def upgrade():
    op.add_column("bim_4d_safety_inspections", sa.Column("checklist_json", sa.JSON(), nullable=False, server_default=sa.text("'[]'::json")))
    op.create_table(
        "bim_4d_safety_punch_items",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("empresa_id", sa.Integer(), sa.ForeignKey("empresas.id", ondelete="CASCADE"), nullable=False),
        sa.Column("proyecto_id", sa.Integer(), sa.ForeignKey("proyectos.id", ondelete="CASCADE"), nullable=False),
        sa.Column("risk_id", sa.Integer(), sa.ForeignKey("bim_4d_safety_risks.id", ondelete="CASCADE"), nullable=False),
        sa.Column("inspection_id", sa.Integer(), sa.ForeignKey("bim_4d_safety_inspections.id", ondelete="CASCADE"), nullable=False),
        sa.Column("title", sa.String(255), nullable=False),
        sa.Column("description", sa.Text()),
        sa.Column("priority", sa.String(20), nullable=False, server_default="normal"),
        sa.Column("status", sa.String(30), nullable=False, server_default="open"),
        sa.Column("due_at", sa.DateTime(timezone=True)),
        sa.Column("created_by", sa.Integer(), sa.ForeignKey("usuarios.id", ondelete="SET NULL")),
        sa.Column("closed_by", sa.Integer(), sa.ForeignKey("usuarios.id", ondelete="SET NULL")),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("closed_at", sa.DateTime(timezone=True)),
    )
    for column in ("empresa_id", "proyecto_id", "risk_id", "inspection_id", "status"):
        op.create_index(f"ix_bim_4d_safety_punch_items_{column}", "bim_4d_safety_punch_items", [column])


def downgrade():
    op.drop_table("bim_4d_safety_punch_items")
    op.drop_column("bim_4d_safety_inspections", "checklist_json")
