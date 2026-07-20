"""Add governed BIM ERP progress and time exchange packages."""
from alembic import op
import sqlalchemy as sa

revision = "de2055a1b2c3"
down_revision = "de2054a1b2c3"
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "bim_erp_exchange_packages",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("empresa_id", sa.Integer(), sa.ForeignKey("empresas.id", ondelete="CASCADE"), nullable=False),
        sa.Column("proyecto_id", sa.Integer(), sa.ForeignKey("proyectos.id", ondelete="CASCADE"), nullable=False),
        sa.Column("revision", sa.Integer(), nullable=False),
        sa.Column("status", sa.String(length=30), nullable=False),
        sa.Column("project_root_code", sa.String(length=50), nullable=True),
        sa.Column("project_revision", sa.Integer(), nullable=False),
        sa.Column("cutoff_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("payload_json", sa.JSON(), nullable=False),
        sa.Column("checksum_sha256", sa.String(length=64), nullable=False),
        sa.Column("activity_count", sa.Integer(), nullable=False),
        sa.Column("timecard_count", sa.Integer(), nullable=False),
        sa.Column("regular_hours", sa.Float(), nullable=False),
        sa.Column("overtime_hours", sa.Float(), nullable=False),
        sa.Column("justification", sa.Text(), nullable=False),
        sa.Column("lock_version", sa.Integer(), nullable=False),
        sa.Column("created_by", sa.Integer(), sa.ForeignKey("usuarios.id", ondelete="SET NULL"), nullable=True),
        sa.Column("published_by", sa.Integer(), sa.ForeignKey("usuarios.id", ondelete="SET NULL"), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("published_at", sa.DateTime(timezone=True), nullable=True),
        sa.CheckConstraint("status IN ('draft','published','superseded','revoked')", name="ck_bim_erp_exchange_status"),
        sa.UniqueConstraint("empresa_id", "proyecto_id", "revision", name="uq_bim_erp_exchange_revision"),
    )
    for column in ("id", "empresa_id", "proyecto_id", "status", "cutoff_at", "checksum_sha256"):
        op.create_index(f"ix_bim_erp_exchange_packages_{column}", "bim_erp_exchange_packages", [column])


def downgrade():
    op.drop_table("bim_erp_exchange_packages")
