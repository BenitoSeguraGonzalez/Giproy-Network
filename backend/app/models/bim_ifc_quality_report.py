from sqlalchemy import Column, DateTime, ForeignKey, Integer, JSON, String
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.core.database import Base


class BimIfcQualityReport(Base):
    __tablename__ = "bim_ifc_quality_reports"

    id = Column(Integer, primary_key=True, index=True)
    bim_model_version_id = Column(
        Integer,
        ForeignKey("bim_model_versions.id", ondelete="CASCADE"),
        nullable=False,
        unique=True,
        index=True,
    )
    proyecto_id = Column(Integer, ForeignKey("proyectos.id", ondelete="CASCADE"), nullable=False, index=True)
    empresa_id = Column(Integer, ForeignKey("empresas.id", ondelete="CASCADE"), nullable=False, index=True)
    contract_version = Column(String(64), nullable=False)
    source_checksum_sha256 = Column(String(64), nullable=False)
    schema_identifier = Column(String(50), nullable=True)
    step_status = Column(String(30), nullable=False)
    schema_status = Column(String(30), nullable=False)
    semantic_status = Column(String(30), nullable=False)
    overall_status = Column(String(30), nullable=False, index=True)
    error_count = Column(Integer, nullable=False, default=0)
    warning_count = Column(Integer, nullable=False, default=0)
    findings = Column(JSON, nullable=False, default=list)
    summary_json = Column(JSON, nullable=False, default=dict)
    fecha_generacion = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    fecha_actualizacion = Column(DateTime(timezone=True), onupdate=func.now())

    version = relationship("BimModelVersion")
    proyecto = relationship("Proyecto")
    empresa = relationship("Empresa")
