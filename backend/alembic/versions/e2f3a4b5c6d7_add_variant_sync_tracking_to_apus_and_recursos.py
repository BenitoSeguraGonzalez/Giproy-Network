"""add variant sync tracking to apus and recursos

Revision ID: e2f3a4b5c6d7
Revises: d1e2f3a4b5c6
Create Date: 2026-03-25 14:30:00.000000
"""

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "e2f3a4b5c6d7"
down_revision = "d1e2f3a4b5c6"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("apus", sa.Column("source_apu_id", sa.Integer(), nullable=True))
    op.add_column("apus", sa.Column("content_origin", sa.String(length=20), nullable=False, server_default="native"))
    op.add_column("apus", sa.Column("sync_status", sa.String(length=20), nullable=False, server_default="not_applicable"))
    op.add_column("apus", sa.Column("last_sync_at", sa.DateTime(timezone=True), nullable=True))
    op.create_index(op.f("ix_apus_source_apu_id"), "apus", ["source_apu_id"], unique=False)
    op.create_foreign_key("fk_apus_source_apu_id", "apus", "apus", ["source_apu_id"], ["id"], ondelete="SET NULL")

    op.add_column("recursos", sa.Column("source_recurso_id", sa.Integer(), nullable=True))
    op.add_column("recursos", sa.Column("content_origin", sa.String(length=20), nullable=False, server_default="native"))
    op.add_column("recursos", sa.Column("sync_status", sa.String(length=20), nullable=False, server_default="not_applicable"))
    op.add_column("recursos", sa.Column("last_sync_at", sa.DateTime(timezone=True), nullable=True))
    op.create_index(op.f("ix_recursos_source_recurso_id"), "recursos", ["source_recurso_id"], unique=False)
    op.create_foreign_key("fk_recursos_source_recurso_id", "recursos", "recursos", ["source_recurso_id"], ["id"], ondelete="SET NULL")

    op.alter_column("apus", "content_origin", server_default=None)
    op.alter_column("apus", "sync_status", server_default=None)
    op.alter_column("recursos", "content_origin", server_default=None)
    op.alter_column("recursos", "sync_status", server_default=None)


def downgrade() -> None:
    op.drop_constraint("fk_recursos_source_recurso_id", "recursos", type_="foreignkey")
    op.drop_index(op.f("ix_recursos_source_recurso_id"), table_name="recursos")
    op.drop_column("recursos", "last_sync_at")
    op.drop_column("recursos", "sync_status")
    op.drop_column("recursos", "content_origin")
    op.drop_column("recursos", "source_recurso_id")

    op.drop_constraint("fk_apus_source_apu_id", "apus", type_="foreignkey")
    op.drop_index(op.f("ix_apus_source_apu_id"), table_name="apus")
    op.drop_column("apus", "last_sync_at")
    op.drop_column("apus", "sync_status")
    op.drop_column("apus", "content_origin")
    op.drop_column("apus", "source_apu_id")
