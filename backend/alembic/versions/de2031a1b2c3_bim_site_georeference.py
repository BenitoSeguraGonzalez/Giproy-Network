"""bim site georeference"""

from alembic import op
import sqlalchemy as sa


revision = "de2031a1b2c3"
down_revision = "de2030a1b2c3"
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "bim_site_georeferences",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("proyecto_id", sa.Integer(), sa.ForeignKey("proyectos.id", ondelete="CASCADE"), nullable=False),
        sa.Column("empresa_id", sa.Integer(), sa.ForeignKey("empresas.id", ondelete="CASCADE"), nullable=False),
        sa.Column("revision", sa.Integer(), nullable=False),
        sa.Column("status", sa.String(length=30), nullable=False, server_default="active"),
        sa.Column("project_root_code", sa.String(length=50), nullable=True),
        sa.Column("project_revision", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("crs", sa.String(length=100), nullable=False, server_default="EPSG:4326"),
        sa.Column("latitude", sa.Float(), nullable=False),
        sa.Column("longitude", sa.Float(), nullable=False),
        sa.Column("altitude", sa.Float(), nullable=False, server_default="0"),
        sa.Column("local_origin_x", sa.Float(), nullable=False, server_default="0"),
        sa.Column("local_origin_y", sa.Float(), nullable=False, server_default="0"),
        sa.Column("local_origin_z", sa.Float(), nullable=False, server_default="0"),
        sa.Column("heading_degrees", sa.Float(), nullable=False, server_default="0"),
        sa.Column("map_zoom", sa.Integer(), nullable=False, server_default="18"),
        sa.Column("justification", sa.Text(), nullable=False),
        sa.Column("created_by", sa.Integer(), sa.ForeignKey("usuarios.id", ondelete="SET NULL"), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.UniqueConstraint("proyecto_id", "empresa_id", "revision", name="uq_bim_site_georef_project_revision"),
    )
    for column in ("proyecto_id", "empresa_id", "status"):
        op.create_index(f"ix_bim_site_georeferences_{column}", "bim_site_georeferences", [column])
    op.create_index(
        "uq_bim_site_georeference_active",
        "bim_site_georeferences",
        ["proyecto_id", "empresa_id"],
        unique=True,
        postgresql_where=sa.text("status = 'active'"),
    )


def downgrade():
    op.drop_table("bim_site_georeferences")
