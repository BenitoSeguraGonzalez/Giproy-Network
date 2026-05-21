from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.core.database import Base


class BimModelVersion(Base):
    __tablename__ = "bim_model_versions"

    id = Column(Integer, primary_key=True, index=True)
    bim_model_id = Column(Integer, ForeignKey("bim_models.id", ondelete="CASCADE"), nullable=False, index=True)
    version_label = Column(String(50), nullable=False)
    source_filename = Column(String(255), nullable=True)
    artifact_path = Column(String(500), nullable=True)
    status = Column(String(50), nullable=False, default="draft")
    is_active = Column(Boolean, default=False, nullable=False)
    element_count = Column(Integer, nullable=True)
    storey_count = Column(Integer, nullable=True)
    notes = Column(Text, nullable=True)
    fecha_creacion = Column(DateTime(timezone=True), server_default=func.now())
    fecha_actualizacion = Column(DateTime(timezone=True), onupdate=func.now())

    bim_model = relationship("BimModel", back_populates="versions")
    elements = relationship("BimElement", back_populates="version", cascade="all, delete-orphan")
    storeys = relationship("BimStorey", back_populates="version", cascade="all, delete-orphan")
    view_states = relationship("BimViewState", back_populates="version", cascade="all, delete-orphan")
