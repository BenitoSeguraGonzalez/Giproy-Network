from sqlalchemy import Column, Integer, ForeignKey, Date, Boolean, DateTime, String, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base

class EmpresaLicencia(Base):
    """
    Asignación de una licencia a una empresa con vigencia.
    """
    __tablename__ = "empresa_licencias"

    id = Column(Integer, primary_key=True, index=True)
    empresa_id = Column(Integer, ForeignKey("empresas.id", ondelete="CASCADE"), nullable=False, index=True)
    licencia_id = Column(Integer, ForeignKey("licencias.id"), nullable=False)
    
    starts_at = Column(Date, nullable=False)
    ends_at = Column(Date, nullable=True) # null = ilimitado (poco común)

    status = Column(String(30), nullable=False, default="active", server_default="active", index=True)
    source = Column(String(30), nullable=False, default="manual_admin", server_default="manual_admin")
    activated_at = Column(DateTime(timezone=True), nullable=True)
    payment_confirmed_at = Column(DateTime(timezone=True), nullable=True)
    expired_at = Column(DateTime(timezone=True), nullable=True)
    grace_ends_at = Column(Date, nullable=True)
    queued_from_assignment_id = Column(Integer, ForeignKey("empresa_licencias.id"), nullable=True)
    read_only_mode = Column(Boolean, default=False, nullable=False, server_default="0")
    detalles = Column(JSON, nullable=True)
    activa = Column(Boolean, default=True)

    fecha_creacion = Column(DateTime(timezone=True), server_default=func.now())

    empresa = relationship("Empresa")
    licencia = relationship("Licencia")
    queued_from_assignment = relationship("EmpresaLicencia", remote_side=[id])
