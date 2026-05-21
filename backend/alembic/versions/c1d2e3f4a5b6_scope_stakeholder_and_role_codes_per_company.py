"""scope stakeholder and role codes per company

Revision ID: c1d2e3f4a5b6
Revises: b2c3d4e5f607
Create Date: 2026-03-24 00:00:00.000000
"""

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "c1d2e3f4a5b6"
down_revision = "b2c3d4e5f607"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.drop_index("ix_roles_codigo", table_name="roles")
    op.create_unique_constraint("uq_roles_codigo_empresa", "roles", ["codigo", "empresa_id"])

    op.drop_index("ix_stakeholders_codigo", table_name="stakeholders")
    op.create_unique_constraint("uq_stakeholders_codigo_empresa", "stakeholders", ["codigo", "empresa_id"])


def downgrade() -> None:
    op.drop_constraint("uq_stakeholders_codigo_empresa", "stakeholders", type_="unique")
    op.create_index("ix_stakeholders_codigo", "stakeholders", ["codigo"], unique=True)

    op.drop_constraint("uq_roles_codigo_empresa", "roles", type_="unique")
    op.create_index("ix_roles_codigo", "roles", ["codigo"], unique=True)
