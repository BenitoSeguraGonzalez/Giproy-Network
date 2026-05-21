from sqlalchemy import (
    Boolean,
    Column,
    Date,
    DateTime,
    ForeignKey,
    Integer,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.sql import func

from app.core.database import Base


class CalendarHolidaySource(Base):
    __tablename__ = "calendar_holiday_sources"

    id = Column(Integer, primary_key=True, index=True)
    country_code = Column(String(8), nullable=False, index=True, default="EC")
    scope_type = Column(String(24), nullable=False, default="national", index=True)
    scope_code = Column(String(120), nullable=True, index=True)
    source_name = Column(String(255), nullable=False)
    source_url = Column(String(1024), nullable=False)
    source_kind = Column(String(64), nullable=False, default="official_registry")
    priority = Column(Integer, nullable=False, default=100)
    is_active = Column(Boolean, nullable=False, default=True)
    last_checked_at = Column(DateTime(timezone=True), nullable=True)
    last_success_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    updated_at = Column(DateTime(timezone=True), nullable=True, onupdate=func.now())


class CalendarHoliday(Base):
    __tablename__ = "calendar_holidays"
    __table_args__ = (
        UniqueConstraint(
            "country_code",
            "year",
            "observed_date",
            "scope_type",
            "scope_code",
            "holiday_name",
            name="uq_calendar_holidays_scope_observed_name",
        ),
    )

    id = Column(Integer, primary_key=True, index=True)
    source_id = Column(Integer, ForeignKey("calendar_holiday_sources.id", ondelete="SET NULL"), nullable=True, index=True)
    country_code = Column(String(8), nullable=False, index=True, default="EC")
    year = Column(Integer, nullable=False, index=True)
    holiday_date = Column(Date, nullable=False, index=True)
    observed_date = Column(Date, nullable=False, index=True)
    holiday_name = Column(String(255), nullable=False)
    scope_type = Column(String(24), nullable=False, default="national", index=True)
    scope_code = Column(String(120), nullable=True, index=True)
    province_code = Column(String(120), nullable=True, index=True)
    canton_code = Column(String(120), nullable=True, index=True)
    is_official = Column(Boolean, nullable=False, default=True)
    legal_reference = Column(String(255), nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    updated_at = Column(DateTime(timezone=True), nullable=True, onupdate=func.now())


class ProjectCalendarSnapshot(Base):
    __tablename__ = "project_calendar_snapshots"
    __table_args__ = (
        UniqueConstraint("proyecto_id", "empresa_id", name="uq_project_calendar_snapshot_project_empresa"),
    )

    id = Column(Integer, primary_key=True, index=True)
    proyecto_id = Column(Integer, ForeignKey("proyectos.id", ondelete="CASCADE"), nullable=False, index=True)
    empresa_id = Column(Integer, ForeignKey("empresas.id", ondelete="CASCADE"), nullable=False, index=True)
    country_code = Column(String(8), nullable=False, default="EC")
    province_code = Column(String(120), nullable=True, index=True)
    canton_code = Column(String(120), nullable=True, index=True)
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=False)
    generated_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    master_signature = Column(String(128), nullable=True)
    created_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    updated_at = Column(DateTime(timezone=True), nullable=True, onupdate=func.now())


class ProjectCalendarSnapshotDay(Base):
    __tablename__ = "project_calendar_snapshot_days"
    __table_args__ = (
        UniqueConstraint(
            "snapshot_id",
            "observed_date",
            "holiday_name",
            "origin_type",
            name="uq_project_calendar_snapshot_day",
        ),
    )

    id = Column(Integer, primary_key=True, index=True)
    snapshot_id = Column(Integer, ForeignKey("project_calendar_snapshots.id", ondelete="CASCADE"), nullable=False, index=True)
    holiday_date = Column(Date, nullable=False, index=True)
    observed_date = Column(Date, nullable=False, index=True)
    holiday_name = Column(String(255), nullable=False)
    scope_type = Column(String(24), nullable=False, default="national", index=True)
    scope_code = Column(String(120), nullable=True, index=True)
    province_code = Column(String(120), nullable=True, index=True)
    canton_code = Column(String(120), nullable=True, index=True)
    origin_type = Column(String(24), nullable=False, default="official")
    source_id = Column(Integer, ForeignKey("calendar_holiday_sources.id", ondelete="SET NULL"), nullable=True, index=True)
    master_holiday_id = Column(Integer, ForeignKey("calendar_holidays.id", ondelete="SET NULL"), nullable=True, index=True)
    source_url = Column(String(1024), nullable=True)
    is_working_day = Column(Boolean, nullable=False, default=False)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    updated_at = Column(DateTime(timezone=True), nullable=True, onupdate=func.now())


class ProjectCalendarOverride(Base):
    __tablename__ = "project_calendar_overrides"
    __table_args__ = (
        UniqueConstraint(
            "proyecto_id",
            "empresa_id",
            "override_date",
            "action",
            "holiday_name",
            name="uq_project_calendar_override_identity",
        ),
    )

    id = Column(Integer, primary_key=True, index=True)
    proyecto_id = Column(Integer, ForeignKey("proyectos.id", ondelete="CASCADE"), nullable=False, index=True)
    empresa_id = Column(Integer, ForeignKey("empresas.id", ondelete="CASCADE"), nullable=False, index=True)
    override_date = Column(Date, nullable=False, index=True)
    holiday_name = Column(String(255), nullable=False)
    action = Column(String(24), nullable=False, default="add")
    scope_type = Column(String(24), nullable=False, default="project")
    notes = Column(Text, nullable=True)
    created_by = Column(Integer, ForeignKey("usuarios.id", ondelete="SET NULL"), nullable=True, index=True)
    created_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    updated_at = Column(DateTime(timezone=True), nullable=True, onupdate=func.now())
