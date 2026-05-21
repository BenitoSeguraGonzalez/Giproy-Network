from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, UniqueConstraint
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.core.database import Base


class ProyectoApuCpc(Base):
    """Codigo CPC asignado a un APU dentro de un proyecto raiz."""

    __tablename__ = "proyecto_apu_cpc"

    id = Column(Integer, primary_key=True, index=True)
    empresa_id = Column(Integer, ForeignKey("empresas.id", ondelete="CASCADE"), nullable=False, index=True)
    proyecto_root_codigo = Column(String(50), nullable=False, index=True)
    apu_id = Column(Integer, ForeignKey("apus.id", ondelete="CASCADE"), nullable=False, index=True)
    cod_cpc_id = Column(Integer, ForeignKey("codcpc.id", ondelete="CASCADE"), nullable=False, index=True)
    updated_by_usuario_id = Column(Integer, ForeignKey("usuarios.id", ondelete="SET NULL"), nullable=True)
    fecha_creacion = Column(DateTime(timezone=True), server_default=func.now())
    ultima_modificacion = Column(DateTime(timezone=True), onupdate=func.now())

    __table_args__ = (
        UniqueConstraint(
            "empresa_id",
            "proyecto_root_codigo",
            "apu_id",
            name="uq_proyecto_apu_cpc_empresa_root_apu",
        ),
    )

    empresa = relationship("Empresa")
    apu = relationship("APU")
    cpc = relationship("CodCPC")
    updated_by = relationship("Usuario")
