from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.core.database import Base


class LicenseEvent(Base):
    __tablename__ = "license_events"

    id = Column(Integer, primary_key=True, index=True)
    empresa_id = Column(Integer, ForeignKey("empresas.id", ondelete="CASCADE"), nullable=False, index=True)
    empresa_licencia_id = Column(Integer, ForeignKey("empresa_licencias.id", ondelete="SET NULL"), nullable=True, index=True)
    licencia_id = Column(Integer, ForeignKey("licencias.id", ondelete="SET NULL"), nullable=True, index=True)
    actor_usuario_id = Column(Integer, ForeignKey("usuarios.id", ondelete="SET NULL"), nullable=True, index=True)

    event_type = Column(String(60), nullable=False, index=True)
    notes = Column(String(500), nullable=True)
    payload = Column(JSON, nullable=True)
    occurred_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now(), index=True)

    empresa = relationship("Empresa")
    empresa_licencia = relationship("EmpresaLicencia")
    licencia = relationship("Licencia")
    actor_usuario = relationship("Usuario")
