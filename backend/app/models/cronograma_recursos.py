from sqlalchemy import Column, DateTime, ForeignKey, Integer, UniqueConstraint, JSON
from sqlalchemy.sql import func

from app.core.database import Base


class CronogramaRecursosState(Base):
    __tablename__ = "cronogramas_recursos_state"
    __table_args__ = (
        UniqueConstraint("presupuesto_id", name="uq_cronogramas_recursos_state_presupuesto_id"),
    )

    id = Column(Integer, primary_key=True, index=True)
    empresa_id = Column(Integer, ForeignKey("empresas.id", ondelete="CASCADE"), nullable=False, index=True)
    proyecto_id = Column(Integer, ForeignKey("proyectos.id", ondelete="CASCADE"), nullable=False, index=True)
    presupuesto_id = Column(Integer, ForeignKey("presupuestos.id", ondelete="CASCADE"), nullable=False, index=True)
    version = Column(Integer, nullable=False, default=1, server_default="1")
    adjustments = Column(JSON, nullable=False, default=dict, server_default="{}")
    updated_by_id = Column(Integer, ForeignKey("usuarios.id", ondelete="SET NULL"), nullable=True, index=True)

    created_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    updated_at = Column(DateTime(timezone=True), nullable=True, onupdate=func.now())
