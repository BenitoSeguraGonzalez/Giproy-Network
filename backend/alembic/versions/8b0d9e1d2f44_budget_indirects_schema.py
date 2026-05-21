"""budget_indirects_schema

Revision ID: 8b0d9e1d2f44
Revises: dcc7c6a3f3f1
Create Date: 2026-03-12 10:15:00.000000
"""

from alembic import op
import sqlalchemy as sa


revision = "8b0d9e1d2f44"
down_revision = "dcc7c6a3f3f1"
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

    if _has_table(inspector, "presupuestos") and not _has_column(inspector, "presupuestos", "indirectos_total"):
        op.add_column("presupuestos", sa.Column("indirectos_total", sa.DECIMAL(15, 4), nullable=True, server_default="0"))
        inspector = sa.inspect(bind)

    if not _has_table(inspector, "presupuesto_indirectos"):
        op.create_table(
            "presupuesto_indirectos",
            sa.Column("id", sa.Integer(), primary_key=True, nullable=False),
            sa.Column("presupuesto_id", sa.Integer(), nullable=False),
            sa.Column("empresa_id", sa.Integer(), nullable=False),
            sa.Column("concepto_codigo", sa.String(length=100), nullable=False),
            sa.Column("concepto_id", sa.Integer(), nullable=True),
            sa.Column("categoria_codigo", sa.String(length=20), nullable=False),
            sa.Column("nombre", sa.String(length=255), nullable=False),
            sa.Column("porcentaje", sa.DECIMAL(8, 4), nullable=False, server_default="0"),
            sa.Column("observaciones", sa.Text(), nullable=True),
            sa.Column("fijo", sa.Boolean(), nullable=False, server_default=sa.text("false")),
            sa.Column("usuario", sa.Boolean(), nullable=False, server_default=sa.text("false")),
            sa.Column("custom", sa.Boolean(), nullable=False, server_default=sa.text("false")),
            sa.Column("fecha_creacion", sa.DateTime(timezone=True), nullable=True, server_default=sa.text("now()")),
            sa.Column("ultima_modificacion", sa.DateTime(timezone=True), nullable=True),
            sa.ForeignKeyConstraint(["presupuesto_id"], ["presupuestos.id"], ondelete="CASCADE"),
            sa.ForeignKeyConstraint(["empresa_id"], ["empresas.id"], ondelete="CASCADE"),
        )
        inspector = sa.inspect(bind)

    if _has_table(inspector, "presupuesto_indirectos"):
        for index_name, columns in (
            ("ix_presupuesto_indirectos_id", ["id"]),
            ("ix_presupuesto_indirectos_presupuesto_id", ["presupuesto_id"]),
            ("ix_presupuesto_indirectos_empresa_id", ["empresa_id"]),
            ("ix_presupuesto_indirectos_concepto_codigo", ["concepto_codigo"]),
            ("ix_presupuesto_indirectos_categoria_codigo", ["categoria_codigo"]),
        ):
            if not _has_index(inspector, "presupuesto_indirectos", index_name):
                op.create_index(index_name, "presupuesto_indirectos", columns, unique=False)
                inspector = sa.inspect(bind)


def downgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)

    if _has_table(inspector, "presupuesto_indirectos"):
        for index_name in (
            "ix_presupuesto_indirectos_categoria_codigo",
            "ix_presupuesto_indirectos_concepto_codigo",
            "ix_presupuesto_indirectos_empresa_id",
            "ix_presupuesto_indirectos_presupuesto_id",
            "ix_presupuesto_indirectos_id",
        ):
            if _has_index(inspector, "presupuesto_indirectos", index_name):
                op.drop_index(index_name, table_name="presupuesto_indirectos")
                inspector = sa.inspect(bind)
        op.drop_table("presupuesto_indirectos")
        inspector = sa.inspect(bind)

    if _has_table(inspector, "presupuestos") and _has_column(inspector, "presupuestos", "indirectos_total"):
        op.drop_column("presupuestos", "indirectos_total")
