"""bim schedule import revisions"""

from alembic import op
import sqlalchemy as sa


revision = "de2023a1b2c3"
down_revision = "de2022a1b2c3"
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "bim_schedule_import_revisions",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("empresa_id", sa.Integer(), sa.ForeignKey("empresas.id", ondelete="CASCADE"), nullable=False),
        sa.Column("proyecto_id", sa.Integer(), sa.ForeignKey("proyectos.id", ondelete="CASCADE"), nullable=False),
        sa.Column("revision", sa.Integer(), nullable=False),
        sa.Column("version", sa.Integer(), nullable=False, server_default="1"),
        sa.Column("source_format", sa.String(30), nullable=False),
        sa.Column("source_filename", sa.String(255), nullable=False),
        sa.Column("source_checksum_sha256", sa.String(64), nullable=False),
        sa.Column("normalized_checksum_sha256", sa.String(64), nullable=False),
        sa.Column("status", sa.String(30), nullable=False, server_default="pending"),
        sa.Column("document_json", sa.JSON(), nullable=False),
        sa.Column("preflight_json", sa.JSON(), nullable=False),
        sa.Column("previous_approved_revision_id", sa.Integer(), sa.ForeignKey("bim_schedule_import_revisions.id", ondelete="SET NULL")),
        sa.Column("decision_reason", sa.Text()),
        sa.Column("rollback_reason", sa.Text()),
        sa.Column("created_by", sa.Integer(), sa.ForeignKey("usuarios.id", ondelete="SET NULL")),
        sa.Column("decided_by", sa.Integer(), sa.ForeignKey("usuarios.id", ondelete="SET NULL")),
        sa.Column("rolled_back_by", sa.Integer(), sa.ForeignKey("usuarios.id", ondelete="SET NULL")),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("decided_at", sa.DateTime(timezone=True)),
        sa.Column("rolled_back_at", sa.DateTime(timezone=True)),
        sa.UniqueConstraint("empresa_id", "proyecto_id", "revision", name="uq_bim_schedule_import_project_revision"),
    )
    for column in ("empresa_id", "proyecto_id", "source_format", "status"):
        op.create_index(
            f"ix_bim_schedule_import_revisions_{column}",
            "bim_schedule_import_revisions",
            [column],
        )
    op.create_index(
        "uq_bim_schedule_import_active",
        "bim_schedule_import_revisions",
        ["empresa_id", "proyecto_id"],
        unique=True,
        postgresql_where=sa.text("status = 'approved'"),
        sqlite_where=sa.text("status = 'approved'"),
    )


def downgrade():
    op.drop_table("bim_schedule_import_revisions")
