from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.core.database import Base


class SystemBimSetting(Base):
    __tablename__ = "system_bim_settings"

    id = Column(Integer, primary_key=True, index=True)
    titulo = Column(String(255), nullable=False, default="Activación BIM")
    descripcion = Column(Text, nullable=True)
    is_enabled = Column(Boolean, nullable=False, default=False, server_default="false")
    superadmin_only = Column(Boolean, nullable=False, default=True, server_default="true")
    allowed_company_ids = Column(Text, nullable=True)
    updated_by = Column(Integer, ForeignKey("usuarios.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    updated_at = Column(DateTime(timezone=True), nullable=True, onupdate=func.now())

    updater = relationship("Usuario")
