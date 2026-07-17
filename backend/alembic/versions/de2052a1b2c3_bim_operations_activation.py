"""Enforce one accepted BIM Operations transition per project."""
from alembic import op
import sqlalchemy as sa

revision = "de2052a1b2c3"
down_revision = "de2051a1b2c3"
branch_labels = None
depends_on = None


def upgrade():
    op.create_index("uq_bim_operations_transition_current", "bim_operations_transitions", ["empresa_id", "proyecto_id"], unique=True, postgresql_where=sa.text("status = 'accepted'"))


def downgrade():
    op.drop_index("uq_bim_operations_transition_current", table_name="bim_operations_transitions")
