"""add project calendar entries

Revision ID: c5d6e7f8a9b0
Revises: c4d5e6f7a8b9
Create Date: 2026-04-23
"""

from alembic import op
import sqlalchemy as sa


revision = "c5d6e7f8a9b0"
down_revision = "c4d5e6f7a8b9"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "project_calendar_entries",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("empresa_id", sa.Integer(), nullable=False),
        sa.Column("proyecto_codigo_root", sa.String(length=50), nullable=True),
        sa.Column("calendar_date", sa.Date(), nullable=False),
        sa.Column("entry_type", sa.String(length=20), nullable=False, server_default="annotation"),
        sa.Column("title", sa.String(length=255), nullable=True),
        sa.Column("message", sa.Text(), nullable=False),
        sa.Column("created_by", sa.Integer(), nullable=False),
        sa.Column("updated_by", sa.Integer(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["created_by"], ["usuarios.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["empresa_id"], ["empresas.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["updated_by"], ["usuarios.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_project_calendar_entries_id"), "project_calendar_entries", ["id"], unique=False)
    op.create_index(op.f("ix_project_calendar_entries_empresa_id"), "project_calendar_entries", ["empresa_id"], unique=False)
    op.create_index(op.f("ix_project_calendar_entries_proyecto_codigo_root"), "project_calendar_entries", ["proyecto_codigo_root"], unique=False)
    op.create_index(op.f("ix_project_calendar_entries_calendar_date"), "project_calendar_entries", ["calendar_date"], unique=False)
    op.create_index(op.f("ix_project_calendar_entries_entry_type"), "project_calendar_entries", ["entry_type"], unique=False)
    op.create_index(op.f("ix_project_calendar_entries_created_by"), "project_calendar_entries", ["created_by"], unique=False)
    op.execute("UPDATE project_calendar_entries SET entry_type = 'annotation' WHERE entry_type IS NULL")
    op.alter_column("project_calendar_entries", "entry_type", server_default=None)


def downgrade() -> None:
    op.drop_index(op.f("ix_project_calendar_entries_created_by"), table_name="project_calendar_entries")
    op.drop_index(op.f("ix_project_calendar_entries_entry_type"), table_name="project_calendar_entries")
    op.drop_index(op.f("ix_project_calendar_entries_calendar_date"), table_name="project_calendar_entries")
    op.drop_index(op.f("ix_project_calendar_entries_proyecto_codigo_root"), table_name="project_calendar_entries")
    op.drop_index(op.f("ix_project_calendar_entries_empresa_id"), table_name="project_calendar_entries")
    op.drop_index(op.f("ix_project_calendar_entries_id"), table_name="project_calendar_entries")
    op.drop_table("project_calendar_entries")
