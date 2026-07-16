from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Integer, JSON, String, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.core.database import Base


class BimImportJob(Base):
    __tablename__ = "bim_import_jobs"

    id = Column(Integer, primary_key=True, index=True)
    proyecto_id = Column(Integer, ForeignKey("proyectos.id", ondelete="CASCADE"), nullable=False, index=True)
    empresa_id = Column(Integer, ForeignKey("empresas.id", ondelete="CASCADE"), nullable=False, index=True)
    requested_by = Column(Integer, ForeignKey("usuarios.id", ondelete="SET NULL"), nullable=True, index=True)
    bim_model_version_id = Column(
        Integer,
        ForeignKey("bim_model_versions.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    idempotency_key = Column(String(64), nullable=False, unique=True, index=True)
    model_name = Column(String(255), nullable=False)
    version_label = Column(String(50), nullable=False)
    discipline = Column(String(100), nullable=True)
    description = Column(Text, nullable=True)
    notes = Column(Text, nullable=True)
    source_filename = Column(String(255), nullable=False)
    source_artifact_path = Column(String(500), nullable=False)
    checksum_sha256 = Column(String(64), nullable=False)
    file_size_bytes = Column(Integer, nullable=False)
    status = Column(String(50), nullable=False, default="queued", index=True)
    stage = Column(String(50), nullable=False, default="queued")
    progress = Column(Integer, nullable=False, default=0)
    attempt_count = Column(Integer, nullable=False, default=0)
    max_attempts = Column(Integer, nullable=False, default=3)
    cancellation_requested = Column(Boolean, nullable=False, default=False)
    error_code = Column(String(100), nullable=True)
    error_message = Column(Text, nullable=True)
    result_json = Column(JSON, nullable=True)
    fecha_creacion = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    fecha_inicio = Column(DateTime(timezone=True), nullable=True)
    fecha_finalizacion = Column(DateTime(timezone=True), nullable=True)
    fecha_actualizacion = Column(DateTime(timezone=True), onupdate=func.now())

    proyecto = relationship("Proyecto")
    empresa = relationship("Empresa")
    requester = relationship("Usuario")
    version = relationship("BimModelVersion")

    @property
    def correlation_id(self):
        return f"bim-job-{self.id}" if self.id is not None else None
