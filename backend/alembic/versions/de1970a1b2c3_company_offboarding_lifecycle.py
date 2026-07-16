"""company offboarding lifecycle

Revision ID: de1970a1b2c3
Revises: de1959a1b2c3
Create Date: 2026-06-22
"""

from alembic import op
import sqlalchemy as sa


revision = "de1970a1b2c3"
down_revision = "de1959a1b2c3"
branch_labels = None
depends_on = None


def _columns(table_name: str) -> set[str]:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    if table_name not in inspector.get_table_names():
        return set()
    return {column["name"] for column in inspector.get_columns(table_name)}


def upgrade() -> None:
    columns = _columns("empresas")
    if "lifecycle_status" not in columns:
        op.add_column("empresas", sa.Column("lifecycle_status", sa.String(length=40), server_default="active", nullable=False))
        op.create_index(op.f("ix_empresas_lifecycle_status"), "empresas", ["lifecycle_status"], unique=False)
    if "baja_purged_at" not in columns:
        op.add_column("empresas", sa.Column("baja_purged_at", sa.DateTime(timezone=True), nullable=True))
    if "baja_backup_hash" not in columns:
        op.add_column("empresas", sa.Column("baja_backup_hash", sa.String(length=128), nullable=True))
        op.create_index(op.f("ix_empresas_baja_backup_hash"), "empresas", ["baja_backup_hash"], unique=False)
    if "baja_backup_manifest" not in columns:
        op.add_column("empresas", sa.Column("baja_backup_manifest", sa.JSON(), nullable=True))
    if "baja_purged_counts" not in columns:
        op.add_column("empresas", sa.Column("baja_purged_counts", sa.JSON(), nullable=True))
    if "baja_requested_by_email" not in columns:
        op.add_column("empresas", sa.Column("baja_requested_by_email", sa.String(length=255), nullable=True))
    if "baja_recovery_required" not in columns:
        op.add_column("empresas", sa.Column("baja_recovery_required", sa.Boolean(), server_default="0", nullable=False))


def downgrade() -> None:
    columns = _columns("empresas")
    if "baja_recovery_required" in columns:
        op.drop_column("empresas", "baja_recovery_required")
    if "baja_requested_by_email" in columns:
        op.drop_column("empresas", "baja_requested_by_email")
    if "baja_purged_counts" in columns:
        op.drop_column("empresas", "baja_purged_counts")
    if "baja_backup_manifest" in columns:
        op.drop_column("empresas", "baja_backup_manifest")
    if "baja_backup_hash" in columns:
        op.drop_index(op.f("ix_empresas_baja_backup_hash"), table_name="empresas")
        op.drop_column("empresas", "baja_backup_hash")
    if "baja_purged_at" in columns:
        op.drop_column("empresas", "baja_purged_at")
    if "lifecycle_status" in columns:
        op.drop_index(op.f("ix_empresas_lifecycle_status"), table_name="empresas")
        op.drop_column("empresas", "lifecycle_status")
