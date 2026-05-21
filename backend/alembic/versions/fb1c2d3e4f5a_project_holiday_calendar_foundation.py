"""project holiday calendar foundation

Revision ID: fb1c2d3e4f5a
Revises: fa0b1c2d3e4f
Create Date: 2026-04-11 00:00:00.000000
"""

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "fb1c2d3e4f5a"
down_revision = "fa0b1c2d3e4f"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "calendar_holiday_sources",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("country_code", sa.String(length=8), nullable=False),
        sa.Column("scope_type", sa.String(length=24), nullable=False),
        sa.Column("scope_code", sa.String(length=120), nullable=True),
        sa.Column("source_name", sa.String(length=255), nullable=False),
        sa.Column("source_url", sa.String(length=1024), nullable=False),
        sa.Column("source_kind", sa.String(length=64), nullable=False),
        sa.Column("priority", sa.Integer(), nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=False),
        sa.Column("last_checked_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("last_success_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_calendar_holiday_sources_country_code"), "calendar_holiday_sources", ["country_code"], unique=False)
    op.create_index(op.f("ix_calendar_holiday_sources_scope_code"), "calendar_holiday_sources", ["scope_code"], unique=False)
    op.create_index(op.f("ix_calendar_holiday_sources_scope_type"), "calendar_holiday_sources", ["scope_type"], unique=False)

    op.create_table(
        "calendar_holidays",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("source_id", sa.Integer(), nullable=True),
        sa.Column("country_code", sa.String(length=8), nullable=False),
        sa.Column("year", sa.Integer(), nullable=False),
        sa.Column("holiday_date", sa.Date(), nullable=False),
        sa.Column("observed_date", sa.Date(), nullable=False),
        sa.Column("holiday_name", sa.String(length=255), nullable=False),
        sa.Column("scope_type", sa.String(length=24), nullable=False),
        sa.Column("scope_code", sa.String(length=120), nullable=True),
        sa.Column("province_code", sa.String(length=120), nullable=True),
        sa.Column("canton_code", sa.String(length=120), nullable=True),
        sa.Column("is_official", sa.Boolean(), nullable=False),
        sa.Column("legal_reference", sa.String(length=255), nullable=True),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["source_id"], ["calendar_holiday_sources.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint(
            "country_code",
            "year",
            "observed_date",
            "scope_type",
            "scope_code",
            "holiday_name",
            name="uq_calendar_holidays_scope_observed_name",
        ),
    )
    for column in ("source_id", "country_code", "year", "holiday_date", "observed_date", "scope_type", "scope_code", "province_code", "canton_code"):
        op.create_index(op.f(f"ix_calendar_holidays_{column}"), "calendar_holidays", [column], unique=False)

    op.create_table(
        "project_calendar_snapshots",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("proyecto_id", sa.Integer(), nullable=False),
        sa.Column("empresa_id", sa.Integer(), nullable=False),
        sa.Column("country_code", sa.String(length=8), nullable=False),
        sa.Column("province_code", sa.String(length=120), nullable=True),
        sa.Column("canton_code", sa.String(length=120), nullable=True),
        sa.Column("start_date", sa.Date(), nullable=False),
        sa.Column("end_date", sa.Date(), nullable=False),
        sa.Column("generated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("master_signature", sa.String(length=128), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["empresa_id"], ["empresas.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["proyecto_id"], ["proyectos.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("proyecto_id", "empresa_id", name="uq_project_calendar_snapshot_project_empresa"),
    )
    for column in ("proyecto_id", "empresa_id", "province_code", "canton_code"):
        op.create_index(op.f(f"ix_project_calendar_snapshots_{column}"), "project_calendar_snapshots", [column], unique=False)

    op.create_table(
        "project_calendar_snapshot_days",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("snapshot_id", sa.Integer(), nullable=False),
        sa.Column("holiday_date", sa.Date(), nullable=False),
        sa.Column("observed_date", sa.Date(), nullable=False),
        sa.Column("holiday_name", sa.String(length=255), nullable=False),
        sa.Column("scope_type", sa.String(length=24), nullable=False),
        sa.Column("scope_code", sa.String(length=120), nullable=True),
        sa.Column("province_code", sa.String(length=120), nullable=True),
        sa.Column("canton_code", sa.String(length=120), nullable=True),
        sa.Column("origin_type", sa.String(length=24), nullable=False),
        sa.Column("source_id", sa.Integer(), nullable=True),
        sa.Column("master_holiday_id", sa.Integer(), nullable=True),
        sa.Column("source_url", sa.String(length=1024), nullable=True),
        sa.Column("is_working_day", sa.Boolean(), nullable=False),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["master_holiday_id"], ["calendar_holidays.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["snapshot_id"], ["project_calendar_snapshots.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["source_id"], ["calendar_holiday_sources.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("snapshot_id", "observed_date", "holiday_name", "origin_type", name="uq_project_calendar_snapshot_day"),
    )
    for column in ("snapshot_id", "holiday_date", "observed_date", "scope_type", "scope_code", "province_code", "canton_code", "source_id", "master_holiday_id"):
        op.create_index(op.f(f"ix_project_calendar_snapshot_days_{column}"), "project_calendar_snapshot_days", [column], unique=False)

    op.create_table(
        "project_calendar_overrides",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("proyecto_id", sa.Integer(), nullable=False),
        sa.Column("empresa_id", sa.Integer(), nullable=False),
        sa.Column("override_date", sa.Date(), nullable=False),
        sa.Column("holiday_name", sa.String(length=255), nullable=False),
        sa.Column("action", sa.String(length=24), nullable=False),
        sa.Column("scope_type", sa.String(length=24), nullable=False),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("created_by", sa.Integer(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["created_by"], ["usuarios.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["empresa_id"], ["empresas.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["proyecto_id"], ["proyectos.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint(
            "proyecto_id",
            "empresa_id",
            "override_date",
            "action",
            "holiday_name",
            name="uq_project_calendar_override_identity",
        ),
    )
    for column in ("proyecto_id", "empresa_id", "override_date", "created_by"):
        op.create_index(op.f(f"ix_project_calendar_overrides_{column}"), "project_calendar_overrides", [column], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_project_calendar_overrides_created_by"), table_name="project_calendar_overrides")
    op.drop_index(op.f("ix_project_calendar_overrides_override_date"), table_name="project_calendar_overrides")
    op.drop_index(op.f("ix_project_calendar_overrides_empresa_id"), table_name="project_calendar_overrides")
    op.drop_index(op.f("ix_project_calendar_overrides_proyecto_id"), table_name="project_calendar_overrides")
    op.drop_table("project_calendar_overrides")

    op.drop_index(op.f("ix_project_calendar_snapshot_days_master_holiday_id"), table_name="project_calendar_snapshot_days")
    op.drop_index(op.f("ix_project_calendar_snapshot_days_source_id"), table_name="project_calendar_snapshot_days")
    op.drop_index(op.f("ix_project_calendar_snapshot_days_canton_code"), table_name="project_calendar_snapshot_days")
    op.drop_index(op.f("ix_project_calendar_snapshot_days_province_code"), table_name="project_calendar_snapshot_days")
    op.drop_index(op.f("ix_project_calendar_snapshot_days_scope_code"), table_name="project_calendar_snapshot_days")
    op.drop_index(op.f("ix_project_calendar_snapshot_days_scope_type"), table_name="project_calendar_snapshot_days")
    op.drop_index(op.f("ix_project_calendar_snapshot_days_observed_date"), table_name="project_calendar_snapshot_days")
    op.drop_index(op.f("ix_project_calendar_snapshot_days_holiday_date"), table_name="project_calendar_snapshot_days")
    op.drop_index(op.f("ix_project_calendar_snapshot_days_snapshot_id"), table_name="project_calendar_snapshot_days")
    op.drop_table("project_calendar_snapshot_days")

    op.drop_index(op.f("ix_project_calendar_snapshots_canton_code"), table_name="project_calendar_snapshots")
    op.drop_index(op.f("ix_project_calendar_snapshots_province_code"), table_name="project_calendar_snapshots")
    op.drop_index(op.f("ix_project_calendar_snapshots_empresa_id"), table_name="project_calendar_snapshots")
    op.drop_index(op.f("ix_project_calendar_snapshots_proyecto_id"), table_name="project_calendar_snapshots")
    op.drop_table("project_calendar_snapshots")

    op.drop_index(op.f("ix_calendar_holidays_canton_code"), table_name="calendar_holidays")
    op.drop_index(op.f("ix_calendar_holidays_province_code"), table_name="calendar_holidays")
    op.drop_index(op.f("ix_calendar_holidays_scope_code"), table_name="calendar_holidays")
    op.drop_index(op.f("ix_calendar_holidays_scope_type"), table_name="calendar_holidays")
    op.drop_index(op.f("ix_calendar_holidays_observed_date"), table_name="calendar_holidays")
    op.drop_index(op.f("ix_calendar_holidays_holiday_date"), table_name="calendar_holidays")
    op.drop_index(op.f("ix_calendar_holidays_year"), table_name="calendar_holidays")
    op.drop_index(op.f("ix_calendar_holidays_country_code"), table_name="calendar_holidays")
    op.drop_index(op.f("ix_calendar_holidays_source_id"), table_name="calendar_holidays")
    op.drop_table("calendar_holidays")

    op.drop_index(op.f("ix_calendar_holiday_sources_scope_type"), table_name="calendar_holiday_sources")
    op.drop_index(op.f("ix_calendar_holiday_sources_scope_code"), table_name="calendar_holiday_sources")
    op.drop_index(op.f("ix_calendar_holiday_sources_country_code"), table_name="calendar_holiday_sources")
    op.drop_table("calendar_holiday_sources")
