from sqlalchemy import Column, Date, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.core.database import Base


class ProjectCalendarEntry(Base):
    __tablename__ = "project_calendar_entries"

    id = Column(Integer, primary_key=True, index=True)
    empresa_id = Column(Integer, ForeignKey("empresas.id", ondelete="CASCADE"), nullable=False, index=True)
    proyecto_codigo_root = Column(String(50), nullable=True, index=True)
    calendar_date = Column(Date, nullable=False, index=True)
    entry_type = Column(String(20), nullable=False, index=True, default="annotation")
    title = Column(String(255), nullable=True)
    message = Column(Text, nullable=False)
    created_by = Column(Integer, ForeignKey("usuarios.id", ondelete="CASCADE"), nullable=False, index=True)
    updated_by = Column(Integer, ForeignKey("usuarios.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    updated_at = Column(DateTime(timezone=True), nullable=True, onupdate=func.now())

    empresa = relationship("Empresa")
    author = relationship("Usuario", foreign_keys=[created_by])
    updater = relationship("Usuario", foreign_keys=[updated_by])
