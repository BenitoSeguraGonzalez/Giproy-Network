from sqlalchemy import Column, DateTime, ForeignKey, Integer, Numeric, String, Text, UniqueConstraint
from sqlalchemy.sql import func

from app.core.database import Base


class BimCostChangeOrder(Base):
    __tablename__ = "bim_cost_change_orders"
    __table_args__ = (
        UniqueConstraint(
            "empresa_id", "proyecto_id", "contract_id", "change_number",
            name="uq_bim_cost_change_order_number",
        ),
    )

    id = Column(Integer, primary_key=True, index=True)
    empresa_id = Column(Integer, ForeignKey("empresas.id", ondelete="CASCADE"), nullable=False, index=True)
    proyecto_id = Column(Integer, ForeignKey("proyectos.id", ondelete="CASCADE"), nullable=False, index=True)
    contract_id = Column(Integer, ForeignKey("bim_cost_contracts.id", ondelete="RESTRICT"), nullable=False, index=True)
    change_number = Column(String(100), nullable=False)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    currency = Column(String(3), nullable=False)
    requested_cost_delta = Column(Numeric(18, 2), nullable=False)
    requested_schedule_days = Column(Integer, nullable=False, default=0)
    approved_cost_delta = Column(Numeric(18, 2), nullable=True)
    approved_schedule_days = Column(Integer, nullable=True)
    contract_amount_before = Column(Numeric(18, 2), nullable=True)
    contract_amount_after = Column(Numeric(18, 2), nullable=True)
    status = Column(String(30), nullable=False, default="potential", index=True)
    transition_reason = Column(Text, nullable=True)
    decision_reason = Column(Text, nullable=True)
    lock_version = Column(Integer, nullable=False, default=1)
    created_by = Column(Integer, ForeignKey("usuarios.id", ondelete="SET NULL"), nullable=True)
    submitted_by = Column(Integer, ForeignKey("usuarios.id", ondelete="SET NULL"), nullable=True)
    decided_by = Column(Integer, ForeignKey("usuarios.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    submitted_at = Column(DateTime(timezone=True), nullable=True)
    decided_at = Column(DateTime(timezone=True), nullable=True)
