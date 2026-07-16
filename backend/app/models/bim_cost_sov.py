from sqlalchemy import Column, DateTime, ForeignKey, Index, Integer, JSON, Numeric, String, Text, UniqueConstraint, text
from sqlalchemy.sql import func

from app.core.database import Base


class BimCostScheduleOfValues(Base):
    __tablename__ = "bim_cost_schedules_of_values"
    __table_args__ = (
        UniqueConstraint(
            "empresa_id", "proyecto_id", "contract_id", "revision",
            name="uq_bim_cost_sov_revision",
        ),
        Index(
            "uq_bim_cost_sov_active_approval", "empresa_id", "proyecto_id", "contract_id",
            unique=True, postgresql_where=text("status = 'approved'"),
            sqlite_where=text("status = 'approved'"),
        ),
    )

    id = Column(Integer, primary_key=True, index=True)
    empresa_id = Column(Integer, ForeignKey("empresas.id", ondelete="CASCADE"), nullable=False, index=True)
    proyecto_id = Column(Integer, ForeignKey("proyectos.id", ondelete="CASCADE"), nullable=False, index=True)
    contract_id = Column(Integer, ForeignKey("bim_cost_contracts.id", ondelete="RESTRICT"), nullable=False, index=True)
    revision = Column(String(100), nullable=False)
    lines_json = Column(JSON, nullable=False)
    total_scheduled_value = Column(Numeric(18, 2), nullable=False)
    status = Column(String(30), nullable=False, default="draft", index=True)
    decision_reason = Column(Text, nullable=True)
    lock_version = Column(Integer, nullable=False, default=1)
    created_by = Column(Integer, ForeignKey("usuarios.id", ondelete="SET NULL"), nullable=True)
    decided_by = Column(Integer, ForeignKey("usuarios.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    decided_at = Column(DateTime(timezone=True), nullable=True)
