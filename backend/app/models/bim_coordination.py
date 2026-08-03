from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Integer, JSON, Numeric, String, Text, UniqueConstraint
from sqlalchemy.sql import func

from app.core.database import Base


class ProjectCoordinationSet(Base):
    __tablename__ = "project_coordination_sets"
    __table_args__ = (
        UniqueConstraint("empresa_id", "proyecto_id", "revision", name="uq_project_coordination_set_revision"),
    )

    id = Column(Integer, primary_key=True, index=True)
    empresa_id = Column(Integer, ForeignKey("empresas.id", ondelete="CASCADE"), nullable=False, index=True)
    proyecto_id = Column(Integer, ForeignKey("proyectos.id", ondelete="CASCADE"), nullable=False, index=True)
    proyecto_codigo_root = Column(String(80), nullable=False, index=True)
    proyecto_revision = Column(Integer, nullable=False, default=0)
    revision = Column(Integer, nullable=False, default=1)
    presupuesto_id = Column(Integer, ForeignKey("presupuestos.id", ondelete="SET NULL"), nullable=True, index=True)
    presupuesto_revision = Column(Integer, nullable=True)
    cronograma_trabajo_id = Column(Integer, ForeignKey("cronogramas_trabajo.id", ondelete="SET NULL"), nullable=True, index=True)
    baseline_id = Column(Integer, ForeignKey("bim_4d_baselines.id", ondelete="SET NULL"), nullable=True, index=True)
    bim_version_ids_json = Column(JSON, nullable=False, default=list)
    process_status = Column(String(40), nullable=False, default="draft")
    coordination_status = Column(String(40), nullable=False, default="not_configured")
    omniclass_status = Column(String(40), nullable=False, default="disabled")
    official = Column(Boolean, nullable=False, default=False)
    active = Column(Boolean, nullable=False, default=True)
    created_by = Column(Integer, ForeignKey("usuarios.id", ondelete="SET NULL"), nullable=True)
    approved_by = Column(Integer, ForeignKey("usuarios.id", ondelete="SET NULL"), nullable=True)
    approved_at = Column(DateTime(timezone=True), nullable=True)
    fecha_creacion = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    fecha_actualizacion = Column(DateTime(timezone=True), onupdate=func.now())


class CoordinationLink(Base):
    __tablename__ = "coordination_links"
    __table_args__ = (
        UniqueConstraint(
            "coordination_set_id", "budget_line_id", "activity_ref", "bim_element_id", "allocation_key",
            name="uq_coordination_link_identity",
        ),
    )

    id = Column(Integer, primary_key=True, index=True)
    empresa_id = Column(Integer, ForeignKey("empresas.id", ondelete="CASCADE"), nullable=False, index=True)
    proyecto_id = Column(Integer, ForeignKey("proyectos.id", ondelete="CASCADE"), nullable=False, index=True)
    coordination_set_id = Column(Integer, ForeignKey("project_coordination_sets.id", ondelete="CASCADE"), nullable=False, index=True)
    budget_line_id = Column(Integer, ForeignKey("presupuesto_detalles.id", ondelete="SET NULL"), nullable=True, index=True)
    apu_id = Column(Integer, ForeignKey("apus.id", ondelete="SET NULL"), nullable=True, index=True)
    activity_ref = Column(String(160), nullable=True, index=True)
    activity_snapshot_id = Column(Integer, ForeignKey("bim_4d_activity_snapshots.id", ondelete="SET NULL"), nullable=True, index=True)
    bim_element_id = Column(Integer, ForeignKey("bim_elements.id", ondelete="SET NULL"), nullable=True, index=True)
    bim_global_id = Column(String(128), nullable=True, index=True)
    allocation_key = Column(String(100), nullable=False, default="primary")
    allocation_type = Column(String(30), nullable=False, default="percentage")
    allocation_value = Column(Numeric(18, 8), nullable=False, default=100)
    unit = Column(String(40), nullable=True)
    additive = Column(Boolean, nullable=False, default=True)
    source = Column(String(40), nullable=False, default="manual")
    status = Column(String(40), nullable=False, default="draft")
    valid_from_revision = Column(Integer, nullable=False, default=1)
    valid_to_revision = Column(Integer, nullable=True)
    notes = Column(Text, nullable=True)
    created_by = Column(Integer, ForeignKey("usuarios.id", ondelete="SET NULL"), nullable=True)
    fecha_creacion = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    fecha_actualizacion = Column(DateTime(timezone=True), onupdate=func.now())


class CoordinationProposal(Base):
    __tablename__ = "coordination_proposals"

    id = Column(Integer, primary_key=True, index=True)
    empresa_id = Column(Integer, ForeignKey("empresas.id", ondelete="CASCADE"), nullable=False, index=True)
    proyecto_id = Column(Integer, ForeignKey("proyectos.id", ondelete="CASCADE"), nullable=False, index=True)
    coordination_set_id = Column(Integer, ForeignKey("project_coordination_sets.id", ondelete="CASCADE"), nullable=False, index=True)
    proposal_type = Column(String(60), nullable=False, index=True)
    status = Column(String(40), nullable=False, default="draft", index=True)
    source_domain = Column(String(40), nullable=False)
    target_domain = Column(String(40), nullable=False)
    diff_json = Column(JSON, nullable=False, default=dict)
    impact_json = Column(JSON, nullable=False, default=dict)
    reason = Column(Text, nullable=True)
    correlation_id = Column(String(100), nullable=False, index=True)
    proposed_by = Column(Integer, ForeignKey("usuarios.id", ondelete="SET NULL"), nullable=True)
    decided_by = Column(Integer, ForeignKey("usuarios.id", ondelete="SET NULL"), nullable=True)
    decision_reason = Column(Text, nullable=True)
    decided_at = Column(DateTime(timezone=True), nullable=True)
    applied_at = Column(DateTime(timezone=True), nullable=True)
    version = Column(Integer, nullable=False, default=1)
    fecha_creacion = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    fecha_actualizacion = Column(DateTime(timezone=True), onupdate=func.now())


class CoordinationConflict(Base):
    __tablename__ = "coordination_conflicts"

    id = Column(Integer, primary_key=True, index=True)
    empresa_id = Column(Integer, ForeignKey("empresas.id", ondelete="CASCADE"), nullable=False, index=True)
    proyecto_id = Column(Integer, ForeignKey("proyectos.id", ondelete="CASCADE"), nullable=False, index=True)
    coordination_set_id = Column(Integer, ForeignKey("project_coordination_sets.id", ondelete="CASCADE"), nullable=False, index=True)
    conflict_type = Column(String(80), nullable=False, index=True)
    severity = Column(String(20), nullable=False, default="warning", index=True)
    status = Column(String(40), nullable=False, default="open", index=True)
    entity_refs_json = Column(JSON, nullable=False, default=list)
    detail_json = Column(JSON, nullable=False, default=dict)
    resolution = Column(Text, nullable=True)
    resolved_by = Column(Integer, ForeignKey("usuarios.id", ondelete="SET NULL"), nullable=True)
    resolved_at = Column(DateTime(timezone=True), nullable=True)
    fecha_creacion = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)


class BimClassificationResolution(Base):
    __tablename__ = "bim_classification_resolutions"
    __table_args__ = (
        UniqueConstraint("bim_element_id", "bim_model_version_id", "system", "edition", name="uq_bim_classification_resolution"),
    )

    id = Column(Integer, primary_key=True, index=True)
    empresa_id = Column(Integer, ForeignKey("empresas.id", ondelete="CASCADE"), nullable=False, index=True)
    proyecto_id = Column(Integer, ForeignKey("proyectos.id", ondelete="CASCADE"), nullable=False, index=True)
    bim_element_id = Column(Integer, ForeignKey("bim_elements.id", ondelete="CASCADE"), nullable=False, index=True)
    bim_model_version_id = Column(Integer, ForeignKey("bim_model_versions.id", ondelete="CASCADE"), nullable=False, index=True)
    system = Column(String(80), nullable=False, default="OmniClass")
    edition = Column(String(40), nullable=False, default="unknown")
    table_code = Column(String(20), nullable=True)
    source_code = Column(String(100), nullable=True, index=True)
    source_title = Column(Text, nullable=True)
    omniclass_id = Column(Integer, ForeignKey("omniclass_maestro.id", ondelete="SET NULL"), nullable=True, index=True)
    resolution_status = Column(String(40), nullable=False, default="unresolved", index=True)
    confidence = Column(Numeric(5, 4), nullable=True)
    source = Column(String(40), nullable=False, default="ifc")
    approved_by = Column(Integer, ForeignKey("usuarios.id", ondelete="SET NULL"), nullable=True)
    approved_at = Column(DateTime(timezone=True), nullable=True)
    fecha_creacion = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    fecha_actualizacion = Column(DateTime(timezone=True), onupdate=func.now())


class CoordinationImportStage(Base):
    __tablename__ = "coordination_import_stages"
    __table_args__ = (
        UniqueConstraint("empresa_id", "proyecto_id", "source_format", "checksum_sha256", name="uq_coordination_import_stage_checksum"),
    )

    id = Column(Integer, primary_key=True, index=True)
    empresa_id = Column(Integer, ForeignKey("empresas.id", ondelete="CASCADE"), nullable=False, index=True)
    proyecto_id = Column(Integer, ForeignKey("proyectos.id", ondelete="CASCADE"), nullable=False, index=True)
    coordination_set_id = Column(Integer, ForeignKey("project_coordination_sets.id", ondelete="SET NULL"), nullable=True, index=True)
    source_domain = Column(String(40), nullable=False, index=True)
    source_format = Column(String(40), nullable=False, index=True)
    filename = Column(String(255), nullable=False)
    checksum_sha256 = Column(String(64), nullable=False, index=True)
    byte_size = Column(Integer, nullable=False)
    status = Column(String(40), nullable=False, default="preflight_ready", index=True)
    manifest_json = Column(JSON, nullable=False, default=dict)
    errors_json = Column(JSON, nullable=False, default=list)
    confirmed_by = Column(Integer, ForeignKey("usuarios.id", ondelete="SET NULL"), nullable=True)
    confirmed_at = Column(DateTime(timezone=True), nullable=True)
    created_by = Column(Integer, ForeignKey("usuarios.id", ondelete="SET NULL"), nullable=True)
    fecha_creacion = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
