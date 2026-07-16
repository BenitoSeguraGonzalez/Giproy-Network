from sqlalchemy import Column, Date, DateTime, ForeignKey, Integer, Numeric, String, Text, UniqueConstraint
from sqlalchemy.sql import func

from app.core.database import Base


class BimCostPaymentApplication(Base):
    __tablename__ = "bim_cost_payment_applications"
    __table_args__ = (
        UniqueConstraint(
            "empresa_id", "proyecto_id", "contract_id", "application_number",
            name="uq_bim_cost_payment_application_number",
        ),
    )

    id = Column(Integer, primary_key=True, index=True)
    empresa_id = Column(Integer, ForeignKey("empresas.id", ondelete="CASCADE"), nullable=False, index=True)
    proyecto_id = Column(Integer, ForeignKey("proyectos.id", ondelete="CASCADE"), nullable=False, index=True)
    contract_id = Column(Integer, ForeignKey("bim_cost_contracts.id", ondelete="RESTRICT"), nullable=False, index=True)
    application_number = Column(String(100), nullable=False)
    period_start = Column(Date, nullable=False)
    period_end = Column(Date, nullable=False)
    currency = Column(String(3), nullable=False)
    gross_requested = Column(Numeric(18, 2), nullable=False)
    retention_requested = Column(Numeric(18, 2), nullable=False, default=0)
    net_requested = Column(Numeric(18, 2), nullable=False)
    certified_gross = Column(Numeric(18, 2), nullable=True)
    certified_retention = Column(Numeric(18, 2), nullable=True)
    certified_net = Column(Numeric(18, 2), nullable=True)
    status = Column(String(30), nullable=False, default="draft", index=True)
    decision_reason = Column(Text, nullable=True)
    lock_version = Column(Integer, nullable=False, default=1)
    created_by = Column(Integer, ForeignKey("usuarios.id", ondelete="SET NULL"), nullable=True)
    submitted_by = Column(Integer, ForeignKey("usuarios.id", ondelete="SET NULL"), nullable=True)
    decided_by = Column(Integer, ForeignKey("usuarios.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    submitted_at = Column(DateTime(timezone=True), nullable=True)
    decided_at = Column(DateTime(timezone=True), nullable=True)
