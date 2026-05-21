from sqlalchemy import Column, DateTime, ForeignKey, Integer, String
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.core.database import Base


class BimStorey(Base):
    __tablename__ = "bim_storeys"

    id = Column(Integer, primary_key=True, index=True)
    bim_model_version_id = Column(Integer, ForeignKey("bim_model_versions.id", ondelete="CASCADE"), nullable=False, index=True)
    nombre = Column(String(255), nullable=False)
    codigo = Column(String(100), nullable=True, index=True)
    elevation = Column(String(100), nullable=True)
    orden = Column(Integer, nullable=False, default=0)
    fecha_creacion = Column(DateTime(timezone=True), server_default=func.now())

    version = relationship("BimModelVersion", back_populates="storeys")
