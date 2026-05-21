"""cleanup residual drift indexes

Revision ID: a6f4d2b8c1e0
Revises: 9a2d7c4e1b33
Create Date: 2026-03-22
"""

from alembic import op


# revision identifiers, used by Alembic.
revision = "a6f4d2b8c1e0"
down_revision = "9a2d7c4e1b33"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.drop_index("ix_community_attachments_id", table_name="community_attachments")
    op.drop_index("ix_community_sanction_appeals_id", table_name="community_sanction_appeals")
    op.drop_constraint("omniclass_maestro_tabla_codigo_key", "omniclass_maestro", type_="unique")


def downgrade() -> None:
    op.create_unique_constraint(
        "omniclass_maestro_tabla_codigo_key",
        "omniclass_maestro",
        ["tabla", "codigo"],
    )
    op.create_index("ix_community_sanction_appeals_id", "community_sanction_appeals", ["id"], unique=False)
    op.create_index("ix_community_attachments_id", "community_attachments", ["id"], unique=False)
