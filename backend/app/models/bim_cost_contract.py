from sqlalchemy import Column, Date, DateTime, ForeignKey, Integer, Numeric, String, Text, UniqueConstraint
from sqlalchemy.sql import func

from app.core.database import Base


class BimCostContract(Base):
    __tablename__ = "bim_cost_contracts"
    __table_args__ = (
        UniqueConstraint(
            "empresa_id",
            "proyecto_id",
            "contract_number",
            name="uq_bim_cost_contract_number",
        ),
    )

    id = Column(Integer, primary_key=True, index=True)
    empresa_id = Column(Integer, ForeignKey("empresas.id", ondelete="CASCADE"), nullable=False, index=True)
    proyecto_id = Column(Integer, ForeignKey("proyectos.id", ondelete="CASCADE"), nullable=False, index=True)
    estimate_id = Column(Integer, ForeignKey("bim_cost_estimates.id", ondelete="RESTRICT"), nullable=False, index=True)
    contract_number = Column(String(100), nullable=False)
    title = Column(String(255), nullable=False)
    counterparty_name = Column(String(255), nullable=False)
    currency = Column(String(3), nullable=False)
    committed_amount = Column(Numeric(18, 2), nullable=False)
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=False)
    status = Column(String(30), nullable=False, default="draft", index=True)
    transition_reason = Column(Text, nullable=True)
    lock_version = Column(Integer, nullable=False, default=1)
    created_by = Column(Integer, ForeignKey("usuarios.id", ondelete="SET NULL"), nullable=True)
    transitioned_by = Column(Integer, ForeignKey("usuarios.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    transitioned_at = Column(DateTime(timezone=True), nullable=True)
