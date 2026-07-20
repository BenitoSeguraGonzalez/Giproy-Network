from sqlalchemy import Column, DateTime, ForeignKey, Integer, JSON, String, UniqueConstraint
from sqlalchemy.sql import func

from app.core.database import Base


class BimCdeCollaborationPresence(Base):
    __tablename__ = "bim_cde_collaboration_presences"
    __table_args__ = (
        UniqueConstraint(
            "empresa_id",
            "proyecto_id",
            "usuario_id",
            "session_key",
            name="uq_bim_cde_collaboration_presence_session",
        ),
    )

    id = Column(Integer, primary_key=True, index=True)
    empresa_id = Column(Integer, ForeignKey("empresas.id", ondelete="CASCADE"), nullable=False, index=True)
    proyecto_id = Column(Integer, ForeignKey("proyectos.id", ondelete="CASCADE"), nullable=False, index=True)
    usuario_id = Column(Integer, ForeignKey("usuarios.id", ondelete="CASCADE"), nullable=False, index=True)
    session_key = Column(String(64), nullable=False)
    workspace = Column(String(30), nullable=False)
    context_json = Column(JSON, nullable=False, default=dict)
    last_seen_at = Column(DateTime(timezone=True), nullable=False, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)


class BimCdeCollaborationEvent(Base):
    __tablename__ = "bim_cde_collaboration_events"

    id = Column(Integer, primary_key=True, index=True)
    empresa_id = Column(Integer, ForeignKey("empresas.id", ondelete="CASCADE"), nullable=False, index=True)
    proyecto_id = Column(Integer, ForeignKey("proyectos.id", ondelete="CASCADE"), nullable=False, index=True)
    actor_id = Column(Integer, ForeignKey("usuarios.id", ondelete="SET NULL"), nullable=True, index=True)
    event_type = Column(String(80), nullable=False, index=True)
    entity_type = Column(String(80), nullable=True)
    entity_id = Column(Integer, nullable=True)
    summary = Column(String(500), nullable=False)
    payload_json = Column(JSON, nullable=False, default=dict)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False, index=True)
