from sqlalchemy import Column, DateTime, ForeignKey, Integer, JSON, String, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.core.database import Base


class BimElement(Base):
    __tablename__ = "bim_elements"

    id = Column(Integer, primary_key=True, index=True)
    bim_model_version_id = Column(Integer, ForeignKey("bim_model_versions.id", ondelete="CASCADE"), nullable=False, index=True)
    global_id = Column(String(255), nullable=False, index=True)
    ifc_class = Column(String(100), nullable=True, index=True)
    nombre = Column(String(255), nullable=True)
    storey_name = Column(String(255), nullable=True)
    system_name = Column(String(255), nullable=True)
    classification = Column(String(255), nullable=True)
    properties = Column(JSON, nullable=True)
    metadata_json = Column(JSON, nullable=True)
    descripcion = Column(Text, nullable=True)
    fecha_creacion = Column(DateTime(timezone=True), server_default=func.now())
    fecha_actualizacion = Column(DateTime(timezone=True), onupdate=func.now())

    version = relationship("BimModelVersion", back_populates="elements")
    edt_links = relationship("BimLinkEdt", back_populates="element", cascade="all, delete-orphan")
    apu_links = relationship("BimLinkApu", back_populates="element", cascade="all, delete-orphan")
    presupuesto_links = relationship("BimLinkPresupuesto", back_populates="element", cascade="all, delete-orphan")
