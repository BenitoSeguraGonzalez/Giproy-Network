"""Add tenant-scoped BIM CDE presence and incremental collaboration feed."""
from alembic import op
import sqlalchemy as sa


revision = "de2057a1b2c3"
down_revision = "de2056a1b2c3"
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "bim_cde_collaboration_presences",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("empresa_id", sa.Integer(), sa.ForeignKey("empresas.id", ondelete="CASCADE"), nullable=False),
        sa.Column("proyecto_id", sa.Integer(), sa.ForeignKey("proyectos.id", ondelete="CASCADE"), nullable=False),
        sa.Column("usuario_id", sa.Integer(), sa.ForeignKey("usuarios.id", ondelete="CASCADE"), nullable=False),
        sa.Column("session_key", sa.String(length=64), nullable=False),
        sa.Column("workspace", sa.String(length=30), nullable=False),
        sa.Column("context_json", sa.JSON(), nullable=False),
        sa.Column("last_seen_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.UniqueConstraint("empresa_id", "proyecto_id", "usuario_id", "session_key", name="uq_bim_cde_collaboration_presence_session"),
    )
    op.create_table(
        "bim_cde_collaboration_events",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("empresa_id", sa.Integer(), sa.ForeignKey("empresas.id", ondelete="CASCADE"), nullable=False),
        sa.Column("proyecto_id", sa.Integer(), sa.ForeignKey("proyectos.id", ondelete="CASCADE"), nullable=False),
        sa.Column("actor_id", sa.Integer(), sa.ForeignKey("usuarios.id", ondelete="SET NULL"), nullable=True),
        sa.Column("event_type", sa.String(length=80), nullable=False),
        sa.Column("entity_type", sa.String(length=80), nullable=True),
        sa.Column("entity_id", sa.Integer(), nullable=True),
        sa.Column("summary", sa.String(length=500), nullable=False),
        sa.Column("payload_json", sa.JSON(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    for column in ("id", "empresa_id", "proyecto_id", "usuario_id", "last_seen_at"):
        op.create_index(f"ix_bim_cde_collaboration_presences_{column}", "bim_cde_collaboration_presences", [column])
    for column in ("id", "empresa_id", "proyecto_id", "actor_id", "event_type", "created_at"):
        op.create_index(f"ix_bim_cde_collaboration_events_{column}", "bim_cde_collaboration_events", [column])
    op.create_index(
        "ix_bim_cde_collaboration_events_project_cursor",
        "bim_cde_collaboration_events",
        ["empresa_id", "proyecto_id", "id"],
    )


def downgrade():
    op.drop_table("bim_cde_collaboration_events")
    op.drop_table("bim_cde_collaboration_presences")
