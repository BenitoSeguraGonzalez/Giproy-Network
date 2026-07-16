"""Enforce one accepted BIM handover dossier per project."""
from alembic import op
import sqlalchemy as sa

revision = "de2050a1b2c3"
down_revision = "de2049a1b2c3"
branch_labels = None
depends_on = None


def upgrade():
    op.create_index(
        "uq_bim_handover_dossier_current",
        "bim_handover_dossiers",
        ["empresa_id", "proyecto_id"],
        unique=True,
        postgresql_where=sa.text("status = 'accepted'"),
    )


def downgrade():
    op.drop_index("uq_bim_handover_dossier_current", table_name="bim_handover_dossiers")
