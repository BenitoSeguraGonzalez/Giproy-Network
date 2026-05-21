from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, UniqueConstraint, JSON

from sqlalchemy.sql import func

from app.core.database import Base


class CronogramaValorado(Base):
    __tablename__ = "cronogramas_valorados"
    __table_args__ = (
        UniqueConstraint("presupuesto_id", name="uq_cronogramas_valorados_presupuesto_id"),
    )

    id = Column(Integer, primary_key=True, index=True)
    empresa_id = Column(Integer, ForeignKey("empresas.id", ondelete="CASCADE"), nullable=False, index=True)
    proyecto_id = Column(Integer, ForeignKey("proyectos.id", ondelete="CASCADE"), nullable=False, index=True)
    presupuesto_id = Column(Integer, ForeignKey("presupuestos.id", ondelete="CASCADE"), nullable=False, index=True)
    period_type = Column(String(20), nullable=False, default="mensual", server_default="mensual")
    distribution_mode = Column(String(20), nullable=False, default="homogeneo", server_default="homogeneo")
    global_distribution = Column(JSON, nullable=False, default=list)
    line_distribution_overrides = Column(JSON, nullable=False, default=dict)

    created_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    updated_at = Column(DateTime(timezone=True), nullable=True, onupdate=func.now())
