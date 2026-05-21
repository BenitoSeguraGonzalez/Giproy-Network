"""add governing_resource_kind to recursos

Revision ID: fa0b1c2d3e4f
Revises: f1e2d3c4b5a6
Create Date: 2026-04-11 16:55:00.000000
"""

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "fa0b1c2d3e4f"
down_revision = "f1e2d3c4b5a6"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("recursos", sa.Column("governing_resource_kind", sa.String(length=40), nullable=True))
    op.execute(
        """
        UPDATE recursos
        SET governing_resource_kind = NULL
        WHERE governing_resource_kind IS NOT NULL
          AND governing_resource_kind NOT IN (
              'equipo_maquinaria',
              'herramientas',
              'mano_obra_especializada',
              'mano_obra_semiespecializada',
              'mano_obra_no_especializada',
              'materiales',
              'transporte'
          )
        """
    )
    op.execute(
        """
        UPDATE recursos AS r
        SET governing_resource_kind = CASE
            WHEN si.subcategoria_codigo = 1 AND lower(coalesce(r.descripcion, '')) LIKE '%herramient%' THEN 'herramientas'
            WHEN si.subcategoria_codigo = 1 THEN 'equipo_maquinaria'
            WHEN si.subcategoria_codigo = 2 THEN 'materiales'
            WHEN si.subcategoria_codigo = 3 THEN 'transporte'
            WHEN si.subcategoria_codigo = 4 THEN 'mano_obra_no_especializada'
            ELSE NULL
        END
        FROM subcategorias_items AS si
        WHERE r.subcategoria_item_id = si.id
          AND (r.governing_resource_kind IS NULL OR btrim(r.governing_resource_kind) = '')
        """
    )
    op.create_index(op.f("ix_recursos_governing_resource_kind"), "recursos", ["governing_resource_kind"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_recursos_governing_resource_kind"), table_name="recursos")
    op.drop_column("recursos", "governing_resource_kind")
