from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.core.database import Base


class SystemMaintenance(Base):
    __tablename__ = "system_maintenance"

    id = Column(Integer, primary_key=True, index=True)
    titulo = Column(String(255), nullable=False, default="Mantenimiento del sistema")
    mensaje = Column(Text, nullable=True)
    mode = Column(String(20), nullable=False, default="readonly")
    is_enabled = Column(Boolean, nullable=False, default=False, server_default="false")
    starts_at = Column(DateTime(timezone=True), nullable=True)
    ends_at = Column(DateTime(timezone=True), nullable=True)
    updated_by = Column(Integer, ForeignKey("usuarios.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    updated_at = Column(DateTime(timezone=True), nullable=True, onupdate=func.now())

    updater = relationship("Usuario")
