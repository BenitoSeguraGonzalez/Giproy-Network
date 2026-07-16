"""project and base recycle bin

Revision ID: de1951a1b2c3
Revises: de1933a1b2c3
Create Date: 2026-06-18 00:00:00.000000
"""

from alembic import op
import sqlalchemy as sa


revision = "de1951a1b2c3"
down_revision = "de1933a1b2c3"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("proyectos", sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True))
    op.add_column("proyectos", sa.Column("deleted_by_user_id", sa.Integer(), nullable=True))
    op.add_column("proyectos", sa.Column("recycle_expires_at", sa.DateTime(timezone=True), nullable=True))
    op.add_column("proyectos", sa.Column("deletion_reason", sa.Text(), nullable=True))
    op.add_column("proyectos", sa.Column("trash_original_nombre", sa.String(length=255), nullable=True))
    op.add_column("proyectos", sa.Column("trash_original_codigo", sa.String(length=50), nullable=True))
    op.create_index(op.f("ix_proyectos_deleted_at"), "proyectos", ["deleted_at"], unique=False)
    op.create_index(op.f("ix_proyectos_deleted_by_user_id"), "proyectos", ["deleted_by_user_id"], unique=False)
    op.create_index(op.f("ix_proyectos_recycle_expires_at"), "proyectos", ["recycle_expires_at"], unique=False)
    op.create_foreign_key(
        "fk_proyectos_deleted_by_user_id_usuarios",
        "proyectos",
        "usuarios",
        ["deleted_by_user_id"],
        ["id"],
        ondelete="SET NULL",
    )

    op.add_column("bases_trabajo", sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True))
    op.add_column("bases_trabajo", sa.Column("deleted_by_user_id", sa.Integer(), nullable=True))
    op.add_column("bases_trabajo", sa.Column("recycle_expires_at", sa.DateTime(timezone=True), nullable=True))
    op.add_column("bases_trabajo", sa.Column("deletion_reason", sa.Text(), nullable=True))
    op.add_column("bases_trabajo", sa.Column("trash_original_nombre", sa.String(length=255), nullable=True))
    op.add_column("bases_trabajo", sa.Column("trash_original_codigo_unico", sa.String(length=100), nullable=True))
    op.add_column("bases_trabajo", sa.Column("trash_original_activa", sa.Boolean(), nullable=True))
    op.create_index(op.f("ix_bases_trabajo_deleted_at"), "bases_trabajo", ["deleted_at"], unique=False)
    op.create_index(op.f("ix_bases_trabajo_deleted_by_user_id"), "bases_trabajo", ["deleted_by_user_id"], unique=False)
    op.create_index(op.f("ix_bases_trabajo_recycle_expires_at"), "bases_trabajo", ["recycle_expires_at"], unique=False)
    op.create_foreign_key(
        "fk_bases_trabajo_deleted_by_user_id_usuarios",
        "bases_trabajo",
        "usuarios",
        ["deleted_by_user_id"],
        ["id"],
        ondelete="SET NULL",
    )


def downgrade() -> None:
    op.drop_constraint("fk_bases_trabajo_deleted_by_user_id_usuarios", "bases_trabajo", type_="foreignkey")
    op.drop_index(op.f("ix_bases_trabajo_recycle_expires_at"), table_name="bases_trabajo")
    op.drop_index(op.f("ix_bases_trabajo_deleted_by_user_id"), table_name="bases_trabajo")
    op.drop_index(op.f("ix_bases_trabajo_deleted_at"), table_name="bases_trabajo")
    op.drop_column("bases_trabajo", "trash_original_activa")
    op.drop_column("bases_trabajo", "trash_original_codigo_unico")
    op.drop_column("bases_trabajo", "trash_original_nombre")
    op.drop_column("bases_trabajo", "deletion_reason")
    op.drop_column("bases_trabajo", "recycle_expires_at")
    op.drop_column("bases_trabajo", "deleted_by_user_id")
    op.drop_column("bases_trabajo", "deleted_at")

    op.drop_constraint("fk_proyectos_deleted_by_user_id_usuarios", "proyectos", type_="foreignkey")
    op.drop_index(op.f("ix_proyectos_recycle_expires_at"), table_name="proyectos")
    op.drop_index(op.f("ix_proyectos_deleted_by_user_id"), table_name="proyectos")
    op.drop_index(op.f("ix_proyectos_deleted_at"), table_name="proyectos")
    op.drop_column("proyectos", "trash_original_codigo")
    op.drop_column("proyectos", "trash_original_nombre")
    op.drop_column("proyectos", "deletion_reason")
    op.drop_column("proyectos", "recycle_expires_at")
    op.drop_column("proyectos", "deleted_by_user_id")
    op.drop_column("proyectos", "deleted_at")
