from sqlalchemy import Column, DateTime, String, Text
from sqlalchemy.sql import func

from app.core.database import Base


class SystemConfig(Base):
    __tablename__ = "system_config"

    clave = Column(String(255), primary_key=True, index=True)
    valor = Column(Text, nullable=True)
    descripcion = Column(Text, nullable=True)
    updated_at = Column(DateTime(timezone=True), nullable=True, onupdate=func.now())
