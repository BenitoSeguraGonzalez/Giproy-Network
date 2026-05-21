"""add clone tracking to bases_trabajo

Revision ID: d1e2f3a4b5c6
Revises: c1d2e3f4a5b6
Create Date: 2026-03-25 00:00:00.000000
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "d1e2f3a4b5c6"
down_revision: Union[str, Sequence[str], None] = "c1d2e3f4a5b6"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("bases_trabajo", sa.Column("source_base_id", sa.Integer(), nullable=True))
    op.add_column("bases_trabajo", sa.Column("clone_created_at", sa.DateTime(timezone=True), nullable=True))
    op.add_column("bases_trabajo", sa.Column("last_reconciled_at", sa.DateTime(timezone=True), nullable=True))
    op.add_column(
        "bases_trabajo",
        sa.Column("sync_mode", sa.String(length=30), nullable=False, server_default="snapshot_locked"),
    )
    op.add_column("bases_trabajo", sa.Column("snapshot_subcategories_count", sa.Integer(), nullable=True))
    op.add_column("bases_trabajo", sa.Column("snapshot_resources_count", sa.Integer(), nullable=True))
    op.add_column("bases_trabajo", sa.Column("snapshot_apus_count", sa.Integer(), nullable=True))

    op.create_index(op.f("ix_bases_trabajo_source_base_id"), "bases_trabajo", ["source_base_id"], unique=False)
    op.create_foreign_key(
        "fk_bases_trabajo_source_base_id",
        "bases_trabajo",
        "bases_trabajo",
        ["source_base_id"],
        ["id"],
        ondelete="SET NULL",
    )


def downgrade() -> None:
    op.drop_constraint("fk_bases_trabajo_source_base_id", "bases_trabajo", type_="foreignkey")
    op.drop_index(op.f("ix_bases_trabajo_source_base_id"), table_name="bases_trabajo")
    op.drop_column("bases_trabajo", "snapshot_apus_count")
    op.drop_column("bases_trabajo", "snapshot_resources_count")
    op.drop_column("bases_trabajo", "snapshot_subcategories_count")
    op.drop_column("bases_trabajo", "sync_mode")
    op.drop_column("bases_trabajo", "last_reconciled_at")
    op.drop_column("bases_trabajo", "clone_created_at")
    op.drop_column("bases_trabajo", "source_base_id")
