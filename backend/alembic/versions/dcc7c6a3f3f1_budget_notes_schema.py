"""budget_notes_schema

Revision ID: dcc7c6a3f3f1
Revises: c798fff6206e
Create Date: 2026-03-11 16:20:00.000000
"""

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "dcc7c6a3f3f1"
down_revision = "c798fff6206e"
branch_labels = None
depends_on = None


def _has_table(inspector: sa.Inspector, table_name: str) -> bool:
    return table_name in inspector.get_table_names()


def _has_index(inspector: sa.Inspector, table_name: str, index_name: str) -> bool:
    return any(index["name"] == index_name for index in inspector.get_indexes(table_name))


def _has_column(inspector: sa.Inspector, table_name: str, column_name: str) -> bool:
    return any(column["name"] == column_name for column in inspector.get_columns(table_name))


def upgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)

    if not _has_table(inspector, "presupuesto_notas"):
        op.create_table(
            "presupuesto_notas",
            sa.Column("id", sa.Integer(), primary_key=True, nullable=False),
            sa.Column("presupuesto_id", sa.Integer(), nullable=False),
            sa.Column("linea_presupuesto_id", sa.Integer(), nullable=True),
            sa.Column("autor_usuario_id", sa.Integer(), nullable=True),
            sa.Column("autor_nombre_snapshot", sa.String(length=255), nullable=False),
            sa.Column("tipo", sa.String(length=20), nullable=False),
            sa.Column("texto", sa.Text(), nullable=False),
            sa.Column("fecha_creacion", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
            sa.ForeignKeyConstraint(["autor_usuario_id"], ["usuarios.id"], ondelete="SET NULL"),
            sa.ForeignKeyConstraint(["linea_presupuesto_id"], ["presupuesto_detalles.id"], ondelete="CASCADE"),
            sa.ForeignKeyConstraint(["presupuesto_id"], ["presupuestos.id"], ondelete="CASCADE"),
        )
        inspector = sa.inspect(bind)

    if _has_table(inspector, "presupuesto_notas"):
        for index_name, columns in (
            ("ix_presupuesto_notas_id", ["id"]),
            ("ix_presupuesto_notas_presupuesto_id", ["presupuesto_id"]),
            ("ix_presupuesto_notas_linea_presupuesto_id", ["linea_presupuesto_id"]),
            ("ix_presupuesto_notas_autor_usuario_id", ["autor_usuario_id"]),
            ("ix_presupuesto_notas_tipo", ["tipo"]),
            ("ix_presupuesto_notas_fecha_creacion", ["fecha_creacion"]),
        ):
            if not _has_index(inspector, "presupuesto_notas", index_name):
                op.create_index(index_name, "presupuesto_notas", columns, unique=False)
                inspector = sa.inspect(bind)

    if not _has_table(inspector, "presupuesto_vistas_usuario"):
        op.create_table(
            "presupuesto_vistas_usuario",
            sa.Column("id", sa.Integer(), primary_key=True, nullable=False),
            sa.Column("presupuesto_id", sa.Integer(), nullable=False),
            sa.Column("usuario_id", sa.Integer(), nullable=False),
            sa.Column("last_opened_at", sa.DateTime(timezone=True), nullable=True),
            sa.Column("last_seen_general_notes_at", sa.DateTime(timezone=True), nullable=True),
            sa.Column("fecha_actualizacion", sa.DateTime(timezone=True), nullable=True, server_default=sa.text("now()")),
            sa.ForeignKeyConstraint(["presupuesto_id"], ["presupuestos.id"], ondelete="CASCADE"),
            sa.ForeignKeyConstraint(["usuario_id"], ["usuarios.id"], ondelete="CASCADE"),
        )
        inspector = sa.inspect(bind)
    elif not _has_column(inspector, "presupuesto_vistas_usuario", "last_seen_general_notes_at"):
        op.add_column(
            "presupuesto_vistas_usuario",
            sa.Column("last_seen_general_notes_at", sa.DateTime(timezone=True), nullable=True),
        )
        inspector = sa.inspect(bind)

    if _has_table(inspector, "presupuesto_vistas_usuario"):
        for index_name, columns in (
            ("ix_presupuesto_vistas_usuario_id", ["id"]),
            ("ix_presupuesto_vistas_usuario_presupuesto_id", ["presupuesto_id"]),
            ("ix_presupuesto_vistas_usuario_usuario_id", ["usuario_id"]),
        ):
            if not _has_index(inspector, "presupuesto_vistas_usuario", index_name):
                op.create_index(index_name, "presupuesto_vistas_usuario", columns, unique=False)
                inspector = sa.inspect(bind)

    if not _has_table(inspector, "presupuesto_linea_vistas_usuario"):
        op.create_table(
            "presupuesto_linea_vistas_usuario",
            sa.Column("id", sa.Integer(), primary_key=True, nullable=False),
            sa.Column("presupuesto_id", sa.Integer(), nullable=False),
            sa.Column("linea_presupuesto_id", sa.Integer(), nullable=False),
            sa.Column("usuario_id", sa.Integer(), nullable=False),
            sa.Column("last_seen_at", sa.DateTime(timezone=True), nullable=True),
            sa.Column("fecha_actualizacion", sa.DateTime(timezone=True), nullable=True, server_default=sa.text("now()")),
            sa.ForeignKeyConstraint(["linea_presupuesto_id"], ["presupuesto_detalles.id"], ondelete="CASCADE"),
            sa.ForeignKeyConstraint(["presupuesto_id"], ["presupuestos.id"], ondelete="CASCADE"),
            sa.ForeignKeyConstraint(["usuario_id"], ["usuarios.id"], ondelete="CASCADE"),
        )
        inspector = sa.inspect(bind)

    if _has_table(inspector, "presupuesto_linea_vistas_usuario"):
        for index_name, columns in (
            ("ix_presupuesto_linea_vistas_usuario_id", ["id"]),
            ("ix_presupuesto_linea_vistas_usuario_presupuesto_id", ["presupuesto_id"]),
            ("ix_presupuesto_linea_vistas_usuario_linea_presupuesto_id", ["linea_presupuesto_id"]),
            ("ix_presupuesto_linea_vistas_usuario_usuario_id", ["usuario_id"]),
        ):
            if not _has_index(inspector, "presupuesto_linea_vistas_usuario", index_name):
                op.create_index(index_name, "presupuesto_linea_vistas_usuario", columns, unique=False)
                inspector = sa.inspect(bind)


def downgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)

    if _has_table(inspector, "presupuesto_linea_vistas_usuario"):
        for index_name in (
            "ix_presupuesto_linea_vistas_usuario_usuario_id",
            "ix_presupuesto_linea_vistas_usuario_linea_presupuesto_id",
            "ix_presupuesto_linea_vistas_usuario_presupuesto_id",
            "ix_presupuesto_linea_vistas_usuario_id",
        ):
            if _has_index(inspector, "presupuesto_linea_vistas_usuario", index_name):
                op.drop_index(index_name, table_name="presupuesto_linea_vistas_usuario")
                inspector = sa.inspect(bind)
        op.drop_table("presupuesto_linea_vistas_usuario")
        inspector = sa.inspect(bind)

    if _has_table(inspector, "presupuesto_vistas_usuario"):
        for index_name in (
            "ix_presupuesto_vistas_usuario_usuario_id",
            "ix_presupuesto_vistas_usuario_presupuesto_id",
            "ix_presupuesto_vistas_usuario_id",
        ):
            if _has_index(inspector, "presupuesto_vistas_usuario", index_name):
                op.drop_index(index_name, table_name="presupuesto_vistas_usuario")
                inspector = sa.inspect(bind)
        op.drop_table("presupuesto_vistas_usuario")
        inspector = sa.inspect(bind)

    if _has_table(inspector, "presupuesto_notas"):
        for index_name in (
            "ix_presupuesto_notas_fecha_creacion",
            "ix_presupuesto_notas_tipo",
            "ix_presupuesto_notas_autor_usuario_id",
            "ix_presupuesto_notas_linea_presupuesto_id",
            "ix_presupuesto_notas_presupuesto_id",
            "ix_presupuesto_notas_id",
        ):
            if _has_index(inspector, "presupuesto_notas", index_name):
                op.drop_index(index_name, table_name="presupuesto_notas")
                inspector = sa.inspect(bind)
        op.drop_table("presupuesto_notas")
