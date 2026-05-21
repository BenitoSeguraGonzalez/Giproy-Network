"""normalize stakeholders to root project

Revision ID: f7a8b9c0d1e2
Revises: e6f7a8b9c0d1
Create Date: 2026-03-22
"""

from alembic import op


revision = 'f7a8b9c0d1e2'
down_revision = 'e6f7a8b9c0d1'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute(
        """
        UPDATE stakeholders AS s
        SET proyecto_codigo_root = COALESCE(p.codigo_root, p.codigo)
        FROM proyectos AS p
        WHERE p.empresa_id = s.empresa_id
          AND p.codigo = s.proyecto_codigo_root
          AND COALESCE(p.codigo_root, p.codigo) <> s.proyecto_codigo_root
        """
    )

    op.execute(
        """
        WITH first_root AS (
            SELECT
                p.empresa_id,
                COALESCE(p.codigo_root, p.codigo) AS root_code,
                ROW_NUMBER() OVER (
                    PARTITION BY p.empresa_id
                    ORDER BY COALESCE(p.codigo_root, p.codigo) ASC, p.revision ASC, p.id ASC
                ) AS rn
            FROM proyectos AS p
        )
        UPDATE stakeholders AS s
        SET proyecto_codigo_root = fr.root_code
        FROM first_root AS fr
        WHERE fr.empresa_id = s.empresa_id
          AND fr.rn = 1
          AND NOT EXISTS (
              SELECT 1
              FROM proyectos AS p
              WHERE p.empresa_id = s.empresa_id
                AND COALESCE(p.codigo_root, p.codigo) = s.proyecto_codigo_root
          )
        """
    )

    op.execute(
        """
        WITH root_map AS (
            SELECT
                current_project.id AS revision_id,
                root_project.id AS root_id
            FROM proyectos AS current_project
            JOIN LATERAL (
                SELECT p.id
                FROM proyectos AS p
                WHERE p.empresa_id = current_project.empresa_id
                  AND COALESCE(p.codigo_root, p.codigo) = COALESCE(current_project.codigo_root, current_project.codigo)
                ORDER BY p.revision ASC, p.codigo ASC, p.id ASC
                LIMIT 1
            ) AS root_project ON TRUE
        )
        UPDATE proyecto_stakeholders AS ps
        SET proyecto_id = rm.root_id
        FROM root_map AS rm
        WHERE ps.proyecto_id = rm.revision_id
          AND ps.proyecto_id <> rm.root_id
        """
    )

    op.execute(
        """
        WITH ranked AS (
            SELECT
                id,
                ROW_NUMBER() OVER (
                    PARTITION BY proyecto_id, stakeholder_id
                    ORDER BY CASE WHEN rol_id IS NULL THEN 1 ELSE 0 END ASC, id ASC
                ) AS rn
            FROM proyecto_stakeholders
        )
        DELETE FROM proyecto_stakeholders AS ps
        USING ranked
        WHERE ps.id = ranked.id
          AND ranked.rn > 1
        """
    )

    op.create_unique_constraint(
        "uq_proyecto_stakeholder_root_pair",
        "proyecto_stakeholders",
        ["proyecto_id", "stakeholder_id"],
    )


def downgrade() -> None:
    op.drop_constraint("uq_proyecto_stakeholder_root_pair", "proyecto_stakeholders", type_="unique")
