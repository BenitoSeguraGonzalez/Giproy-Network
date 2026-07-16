from sqlalchemy import Column, DateTime, ForeignKey, Integer, JSON, String, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.core.database import Base


class SaasEquipoSeat(Base):
    __tablename__ = "saas_equipo_seats"

    id = Column(Integer, primary_key=True, index=True)
    empresa_id = Column(Integer, ForeignKey("empresas.id", ondelete="CASCADE"), nullable=False, index=True)
    owner_user_id = Column(Integer, ForeignKey("usuarios.id", ondelete="CASCADE"), nullable=False, index=True)
    collaborator_user_id = Column(Integer, ForeignKey("usuarios.id", ondelete="SET NULL"), nullable=True, index=True)
    invited_email = Column(String(255), nullable=True, index=True)
    status = Column(String(30), nullable=False, default="active", server_default="active", index=True)
    source_right_code = Column(String(80), nullable=True, index=True)
    assigned_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now(), index=True)
    released_at = Column(DateTime(timezone=True), nullable=True)
    forced_by_user_id = Column(Integer, ForeignKey("usuarios.id", ondelete="SET NULL"), nullable=True, index=True)
    audit_reason = Column(String(500), nullable=True)
    metadata_json = Column(JSON, nullable=True)
    created_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    updated_at = Column(DateTime(timezone=True), nullable=True, onupdate=func.now())

    empresa = relationship("Empresa")
    owner_user = relationship("Usuario", foreign_keys=[owner_user_id])
    collaborator_user = relationship("Usuario", foreign_keys=[collaborator_user_id])
    forced_by_user = relationship("Usuario", foreign_keys=[forced_by_user_id])
    assignments = relationship("SaasEquipoEdtAssignment", back_populates="seat", cascade="all, delete-orphan")


class SaasEquipoEdtAssignment(Base):
    __tablename__ = "saas_equipo_edt_assignments"

    id = Column(Integer, primary_key=True, index=True)
    seat_id = Column(Integer, ForeignKey("saas_equipo_seats.id", ondelete="CASCADE"), nullable=False, index=True)
    empresa_id = Column(Integer, ForeignKey("empresas.id", ondelete="CASCADE"), nullable=False, index=True)
    proyecto_id = Column(Integer, ForeignKey("proyectos.id", ondelete="CASCADE"), nullable=False, index=True)
    edt_id = Column(Integer, ForeignKey("edt_nodes.id", ondelete="CASCADE"), nullable=False, index=True)
    usuario_id = Column(Integer, ForeignKey("usuarios.id", ondelete="CASCADE"), nullable=False, index=True)
    proyecto_asignacion_id = Column(Integer, ForeignKey("proyectos_asignaciones.id", ondelete="SET NULL"), nullable=True, index=True)
    modulo = Column(String(50), nullable=False, default="presupuestos", server_default="presupuestos", index=True)
    status = Column(String(30), nullable=False, default="active", server_default="active", index=True)
    assigned_by_user_id = Column(Integer, ForeignKey("usuarios.id", ondelete="SET NULL"), nullable=True, index=True)
    revoked_by_user_id = Column(Integer, ForeignKey("usuarios.id", ondelete="SET NULL"), nullable=True, index=True)
    assigned_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now(), index=True)
    revoked_at = Column(DateTime(timezone=True), nullable=True)
    metadata_json = Column(JSON, nullable=True)

    seat = relationship("SaasEquipoSeat", back_populates="assignments")
    empresa = relationship("Empresa")
    proyecto = relationship("Proyecto")
    edt_node = relationship("EdtNode")
    usuario = relationship("Usuario", foreign_keys=[usuario_id])
    proyecto_asignacion = relationship("ProyectoAsignacion")
    assigned_by_user = relationship("Usuario", foreign_keys=[assigned_by_user_id])
    revoked_by_user = relationship("Usuario", foreign_keys=[revoked_by_user_id])


class SaasEquipoLock(Base):
    __tablename__ = "saas_equipo_locks"

    id = Column(Integer, primary_key=True, index=True)
    empresa_id = Column(Integer, ForeignKey("empresas.id", ondelete="CASCADE"), nullable=False, index=True)
    proyecto_id = Column(Integer, ForeignKey("proyectos.id", ondelete="CASCADE"), nullable=False, index=True)
    edt_id = Column(Integer, ForeignKey("edt_nodes.id", ondelete="CASCADE"), nullable=False, index=True)
    presupuesto_linea_id = Column(Integer, ForeignKey("presupuesto_detalles.id", ondelete="CASCADE"), nullable=True, index=True)
    locked_by_user_id = Column(Integer, ForeignKey("usuarios.id", ondelete="CASCADE"), nullable=False, index=True)
    status = Column(String(30), nullable=False, default="active", server_default="active", index=True)
    reason = Column(String(500), nullable=True)
    locked_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now(), index=True)
    released_at = Column(DateTime(timezone=True), nullable=True)
    expires_at = Column(DateTime(timezone=True), nullable=True, index=True)
    metadata_json = Column(JSON, nullable=True)

    empresa = relationship("Empresa")
    proyecto = relationship("Proyecto")
    edt_node = relationship("EdtNode")
    presupuesto_linea = relationship("PresupuestoDetalle")
    locked_by_user = relationship("Usuario")


class SaasEquipoChangeProposal(Base):
    __tablename__ = "saas_equipo_change_proposals"

    id = Column(Integer, primary_key=True, index=True)
    empresa_id = Column(Integer, ForeignKey("empresas.id", ondelete="CASCADE"), nullable=False, index=True)
    proyecto_id = Column(Integer, ForeignKey("proyectos.id", ondelete="CASCADE"), nullable=False, index=True)
    edt_id = Column(Integer, ForeignKey("edt_nodes.id", ondelete="CASCADE"), nullable=False, index=True)
    presupuesto_id = Column(Integer, ForeignKey("presupuestos.id", ondelete="CASCADE"), nullable=True, index=True)
    presupuesto_linea_id = Column(Integer, ForeignKey("presupuesto_detalles.id", ondelete="CASCADE"), nullable=True, index=True)
    submitted_by_user_id = Column(Integer, ForeignKey("usuarios.id", ondelete="SET NULL"), nullable=True, index=True)
    reviewed_by_user_id = Column(Integer, ForeignKey("usuarios.id", ondelete="SET NULL"), nullable=True, index=True)
    status = Column(String(30), nullable=False, default="pending", server_default="pending", index=True)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    proposed_changes = Column(JSON, nullable=False, default=dict)
    review_notes = Column(Text, nullable=True)
    submitted_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now(), index=True)
    reviewed_at = Column(DateTime(timezone=True), nullable=True)
    applied_at = Column(DateTime(timezone=True), nullable=True)
    metadata_json = Column(JSON, nullable=True)

    empresa = relationship("Empresa")
    proyecto = relationship("Proyecto")
    edt_node = relationship("EdtNode")
    presupuesto = relationship("Presupuesto")
    presupuesto_linea = relationship("PresupuestoDetalle")
    submitted_by_user = relationship("Usuario", foreign_keys=[submitted_by_user_id])
    reviewed_by_user = relationship("Usuario", foreign_keys=[reviewed_by_user_id])
