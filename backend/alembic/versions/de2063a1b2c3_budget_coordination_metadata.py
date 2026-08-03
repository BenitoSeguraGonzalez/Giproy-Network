"""Add recoverable coordination metadata to budget lines."""

from alembic import op
import sqlalchemy as sa


revision = "de2063a1b2c3"
down_revision = "de2062a1b2c3"
branch_labels = None
depends_on = None


def upgrade():
    op.add_column("presupuesto_detalles", sa.Column("coordination_metadata_json", sa.JSON(), nullable=True))


def downgrade():
    op.drop_column("presupuesto_detalles", "coordination_metadata_json")
