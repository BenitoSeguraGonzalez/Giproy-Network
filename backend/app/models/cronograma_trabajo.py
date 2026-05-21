from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, UniqueConstraint, JSON
from sqlalchemy.sql import func
from app.core.database import Base

class CronogramaTrabajo(Base):
    __tablename__ = "cronogramas_trabajo"
    __table_args__ = (
        UniqueConstraint("presupuesto_id", name="uq_cronogramas_trabajo_presupuesto_id"),
    )

    id = Column(Integer, primary_key=True, index=True)
    empresa_id = Column(Integer, ForeignKey("empresas.id", ondelete="CASCADE"), nullable=False, index=True)
    proyecto_id = Column(Integer, ForeignKey("proyectos.id", ondelete="CASCADE"), nullable=False, index=True)
    presupuesto_id = Column(Integer, ForeignKey("presupuestos.id", ondelete="CASCADE"), nullable=False, index=True)
    
    # Store line-specific data like start_date, end_date, duration, predecessors as a JSON object
    # Format recommendation: { "line_id": { "start_date": "...", "duration": 10, ... } }
    schedule_data = Column(JSON, nullable=False, default=dict, server_default='{}')
    
    created_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    updated_at = Column(DateTime(timezone=True), nullable=True, onupdate=func.now())
