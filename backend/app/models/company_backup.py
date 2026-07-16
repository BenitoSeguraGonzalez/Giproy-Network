from sqlalchemy import Column, DateTime, ForeignKey, Integer, JSON, String, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.core.database import Base


class CompanyBackupOperation(Base):
    __tablename__ = "company_backup_operations"

    id = Column(Integer, primary_key=True, index=True)
    empresa_id = Column(Integer, ForeignKey("empresas.id", ondelete="CASCADE"), nullable=False, index=True)
    requested_by_user_id = Column(Integer, ForeignKey("usuarios.id", ondelete="SET NULL"), nullable=True, index=True)
    requested_by_email = Column(String(255), nullable=True, index=True)
    requested_by_role = Column(String(100), nullable=True)

    operation_type = Column(String(50), nullable=False, index=True)
    source = Column(String(40), nullable=False, default="external", server_default="external", index=True)
    scope = Column(String(80), nullable=False, default="company-full-1to1", server_default="company-full-1to1")
    status = Column(String(40), nullable=False, default="preflight", server_default="preflight", index=True)

    backup_hash = Column(String(128), nullable=True, index=True)
    backup_format_version = Column(String(40), nullable=True)
    backup_filename = Column(String(255), nullable=True)
    internal_artifact_id = Column(
        Integer,
        ForeignKey(
            "company_backup_internal_artifacts.id",
            ondelete="SET NULL",
            use_alter=True,
            name="fk_company_backup_operations_internal_artifact",
        ),
        nullable=True,
        index=True,
    )

    preflight_json = Column(JSON, nullable=True)
    confirmations_json = Column(JSON, nullable=True)
    counts_json = Column(JSON, nullable=True)
    file_manifest_json = Column(JSON, nullable=True)
    marketplace_impact_json = Column(JSON, nullable=True)
    warnings_json = Column(JSON, nullable=True)
    blockers_json = Column(JSON, nullable=True)
    metadata_json = Column(JSON, nullable=True)
    failure_reason = Column(Text, nullable=True)

    created_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now(), index=True)
    updated_at = Column(DateTime(timezone=True), nullable=True, onupdate=func.now())
    completed_at = Column(DateTime(timezone=True), nullable=True)

    empresa = relationship("Empresa", foreign_keys=[empresa_id])
    requested_by = relationship("Usuario", foreign_keys=[requested_by_user_id])
    internal_artifact = relationship("CompanyBackupInternalArtifact", foreign_keys=[internal_artifact_id])


class CompanyBackupInternalArtifact(Base):
    __tablename__ = "company_backup_internal_artifacts"

    id = Column(Integer, primary_key=True, index=True)
    empresa_id = Column(Integer, ForeignKey("empresas.id", ondelete="CASCADE"), nullable=False, index=True)
    created_by_operation_id = Column(
        Integer,
        ForeignKey(
            "company_backup_operations.id",
            ondelete="SET NULL",
            use_alter=True,
            name="fk_company_backup_internal_artifacts_created_operation",
        ),
        nullable=True,
        index=True,
    )
    created_by_user_id = Column(Integer, ForeignKey("usuarios.id", ondelete="SET NULL"), nullable=True, index=True)
    created_by_email = Column(String(255), nullable=True, index=True)
    created_by_role = Column(String(100), nullable=True)

    reason = Column(String(120), nullable=False, default="pre_restore_safety", server_default="pre_restore_safety", index=True)
    status = Column(String(40), nullable=False, default="available", server_default="available", index=True)
    artifact_path = Column(String(1024), nullable=False)
    backup_hash = Column(String(128), nullable=False, index=True)
    backup_format_version = Column(String(40), nullable=False, default="company-full-backup-v1", server_default="company-full-backup-v1")
    size_bytes = Column(Integer, nullable=False, default=0, server_default="0")

    counts_json = Column(JSON, nullable=True)
    manifest_summary_json = Column(JSON, nullable=True)
    restored_by_operation_id = Column(
        Integer,
        ForeignKey(
            "company_backup_operations.id",
            ondelete="SET NULL",
            use_alter=True,
            name="fk_company_backup_internal_artifacts_restored_operation",
        ),
        nullable=True,
        index=True,
    )
    restored_at = Column(DateTime(timezone=True), nullable=True)
    expires_at = Column(DateTime(timezone=True), nullable=False, index=True)
    cleanup_after = Column(DateTime(timezone=True), nullable=True, index=True)
    deleted_at = Column(DateTime(timezone=True), nullable=True, index=True)
    deletion_reason = Column(Text, nullable=True)

    created_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now(), index=True)
    updated_at = Column(DateTime(timezone=True), nullable=True, onupdate=func.now())

    empresa = relationship("Empresa", foreign_keys=[empresa_id])
    created_by = relationship("Usuario", foreign_keys=[created_by_user_id])
    created_by_operation = relationship("CompanyBackupOperation", foreign_keys=[created_by_operation_id])
    restored_by_operation = relationship("CompanyBackupOperation", foreign_keys=[restored_by_operation_id])
