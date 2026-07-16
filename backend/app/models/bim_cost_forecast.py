from sqlalchemy import Column, DateTime, ForeignKey, Index, Integer, Numeric, String, Text, UniqueConstraint, text
from sqlalchemy.sql import func

from app.core.database import Base


class BimCostForecast(Base):
    __tablename__ = "bim_cost_forecasts"
    __table_args__ = (
        UniqueConstraint("empresa_id", "proyecto_id", "currency", "revision", name="uq_bim_cost_forecast_revision"),
        Index("uq_bim_cost_forecast_approved", "empresa_id", "proyecto_id", "currency", unique=True, postgresql_where=text("status = 'approved'"), sqlite_where=text("status = 'approved'")),
    )

    id = Column(Integer, primary_key=True, index=True)
    empresa_id = Column(Integer, ForeignKey("empresas.id", ondelete="CASCADE"), nullable=False, index=True)
    proyecto_id = Column(Integer, ForeignKey("proyectos.id", ondelete="CASCADE"), nullable=False, index=True)
    estimate_id = Column(Integer, ForeignKey("bim_cost_estimates.id", ondelete="RESTRICT"), nullable=False, index=True)
    revision = Column(String(100), nullable=False)
    currency = Column(String(3), nullable=False)
    baseline_budget = Column(Numeric(18, 2), nullable=False)
    committed_cost = Column(Numeric(18, 2), nullable=False)
    actual_cost = Column(Numeric(18, 2), nullable=False)
    estimate_to_complete = Column(Numeric(18, 2), nullable=False)
    forecast_at_completion = Column(Numeric(18, 2), nullable=False)
    variance_at_completion = Column(Numeric(18, 2), nullable=False)
    rationale = Column(Text, nullable=False)
    status = Column(String(30), nullable=False, default="draft", index=True)
    decision_reason = Column(Text, nullable=True)
    lock_version = Column(Integer, nullable=False, default=1)
    created_by = Column(Integer, ForeignKey("usuarios.id", ondelete="SET NULL"), nullable=True)
    decided_by = Column(Integer, ForeignKey("usuarios.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    decided_at = Column(DateTime(timezone=True), nullable=True)
