from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Integer, String, Table, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base


system_announcement_companies = Table(
    "system_announcement_companies",
    Base.metadata,
    Column("announcement_id", Integer, ForeignKey("system_announcements.id", ondelete="CASCADE"), primary_key=True),
    Column("empresa_id", Integer, ForeignKey("empresas.id", ondelete="CASCADE"), primary_key=True),
)


class SystemAnnouncement(Base):
    __tablename__ = "system_announcements"

    id = Column(Integer, primary_key=True, index=True)
    titulo = Column(String(255), nullable=False, index=True)
    mensaje = Column(Text, nullable=False)
    tipo = Column(String(20), nullable=False, default="info")
    scope = Column(String(20), nullable=False, default="global")
    empresa_id = Column(Integer, ForeignKey("empresas.id", ondelete="CASCADE"), nullable=True, index=True)
    display_duration_seconds = Column(Integer, nullable=True, default=30)
    starts_at = Column(DateTime(timezone=True), nullable=True)
    ends_at = Column(DateTime(timezone=True), nullable=True)
    is_active = Column(Boolean, nullable=False, default=True, server_default="true")
    created_by = Column(Integer, ForeignKey("usuarios.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    updated_at = Column(DateTime(timezone=True), nullable=True, onupdate=func.now())

    empresa = relationship("Empresa")
    empresas = relationship("Empresa", secondary=system_announcement_companies)
    creador = relationship("Usuario")
