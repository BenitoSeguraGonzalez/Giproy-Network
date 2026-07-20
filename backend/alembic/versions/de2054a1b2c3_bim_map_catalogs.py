"""Add tenant-aware BIM map service catalogs."""
from alembic import op
import sqlalchemy as sa

revision = "de2054a1b2c3"
down_revision = "de2053a1b2c3"
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "bim_map_catalogs",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("empresa_id", sa.Integer(), sa.ForeignKey("empresas.id", ondelete="CASCADE"), nullable=False),
        sa.Column("proyecto_id", sa.Integer(), sa.ForeignKey("proyectos.id", ondelete="CASCADE"), nullable=False),
        sa.Column("revision", sa.Integer(), nullable=False),
        sa.Column("status", sa.String(length=30), nullable=False),
        sa.Column("project_root_code", sa.String(length=50), nullable=True),
        sa.Column("project_revision", sa.Integer(), nullable=False),
        sa.Column("layers_json", sa.JSON(), nullable=False),
        sa.Column("justification", sa.Text(), nullable=False),
        sa.Column("created_by", sa.Integer(), sa.ForeignKey("usuarios.id", ondelete="SET NULL"), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.CheckConstraint("status IN ('active','superseded')", name="ck_bim_map_catalog_status"),
        sa.UniqueConstraint("empresa_id", "proyecto_id", "revision", name="uq_bim_map_catalog_revision"),
    )
    for column in ("id", "empresa_id", "proyecto_id", "status"):
        op.create_index(f"ix_bim_map_catalogs_{column}", "bim_map_catalogs", [column])


def downgrade():
    op.drop_table("bim_map_catalogs")
