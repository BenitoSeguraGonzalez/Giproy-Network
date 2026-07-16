from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    ForeignKey,
    Integer,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.sql import func

from app.core.database import Base


class SriRucDatasetVersion(Base):
    __tablename__ = "sri_ruc_dataset_versions"

    id = Column(Integer, primary_key=True)
    province_code = Column(String(2), nullable=False, index=True)
    province_name = Column(String(100), nullable=False)
    source_url = Column(String(500), nullable=False)
    source_etag = Column(String(255), nullable=True)
    source_last_modified = Column(String(255), nullable=True)
    checksum_sha256 = Column(String(64), nullable=False, index=True)
    status = Column(String(30), nullable=False, default="staging", index=True)
    is_active = Column(Boolean, nullable=False, default=False, index=True)
    row_count = Column(Integer, nullable=False, default=0)
    accepted_count = Column(Integer, nullable=False, default=0)
    rejected_count = Column(Integer, nullable=False, default=0)
    conflict_count = Column(Integer, nullable=False, default=0)
    error_code = Column(String(100), nullable=True)
    error_message = Column(Text, nullable=True)
    imported_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    activated_at = Column(DateTime(timezone=True), nullable=True)

    __table_args__ = (
        UniqueConstraint("province_code", "checksum_sha256", name="uq_sri_ruc_version_province_checksum"),
    )


class SriRucRecord(Base):
    __tablename__ = "sri_ruc_records"

    id = Column(Integer, primary_key=True)
    version_id = Column(Integer, ForeignKey("sri_ruc_dataset_versions.id", ondelete="CASCADE"), nullable=False, index=True)
    ruc = Column(String(13), nullable=False, index=True)
    business_name = Column(Text, nullable=False)
    taxpayer_status = Column(String(100), nullable=True)
    taxpayer_type = Column(String(150), nullable=True)
    start_date = Column(String(50), nullable=True)
    economic_activity = Column(Text, nullable=True)
    establishment_number = Column(String(10), nullable=True)
    identity_conflict = Column(Boolean, nullable=False, default=False)

    __table_args__ = (
        UniqueConstraint("version_id", "ruc", name="uq_sri_ruc_record_version_ruc"),
    )


class EmpresaFiscalHistory(Base):
    __tablename__ = "empresa_fiscal_history"

    id = Column(Integer, primary_key=True)
    empresa_id = Column(Integer, ForeignKey("empresas.id", ondelete="CASCADE"), nullable=False, index=True)
    field_name = Column(String(80), nullable=False)
    old_value = Column(Text, nullable=True)
    new_value = Column(Text, nullable=True)
    source = Column(String(50), nullable=False)
    source_version_id = Column(Integer, ForeignKey("sri_ruc_dataset_versions.id", ondelete="SET NULL"), nullable=True)
    changed_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())


class SriRucVerifiedOverride(Base):
    __tablename__ = "sri_ruc_verified_overrides"

    id = Column(Integer, primary_key=True)
    ruc = Column(String(13), nullable=False, unique=True, index=True)
    business_name = Column(Text, nullable=False)
    taxpayer_status = Column(String(100), nullable=True)
    taxpayer_type = Column(String(150), nullable=True)
    start_date = Column(String(50), nullable=True)
    economic_activity = Column(Text, nullable=True)
    certificate_hash = Column(String(64), nullable=False)
    verified_by_user_id = Column(Integer, ForeignKey("usuarios.id", ondelete="SET NULL"), nullable=True)
    verified_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    reconciled_at = Column(DateTime(timezone=True), nullable=True)


class RucManualVerification(Base):
    __tablename__ = "ruc_manual_verifications"

    id = Column(Integer, primary_key=True)
    ruc = Column(String(13), nullable=False, index=True)
    email = Column(String(255), nullable=False, index=True)
    status = Column(String(30), nullable=False, default="pending", index=True)
    encrypted_certificate_code = Column(Text, nullable=True)
    certificate_hash = Column(String(64), nullable=False)
    status_token_hash = Column(String(64), nullable=False, unique=True, index=True)
    registration_token_hash = Column(String(64), nullable=True, unique=True, index=True)
    business_name = Column(Text, nullable=True)
    taxpayer_status = Column(String(100), nullable=True)
    taxpayer_type = Column(String(150), nullable=True)
    start_date = Column(String(50), nullable=True)
    economic_activity = Column(Text, nullable=True)
    rejection_reason = Column(String(80), nullable=True)
    rejection_note = Column(Text, nullable=True)
    reviewed_by_user_id = Column(Integer, ForeignKey("usuarios.id", ondelete="SET NULL"), nullable=True)
    reviewed_at = Column(DateTime(timezone=True), nullable=True)
    approval_expires_at = Column(DateTime(timezone=True), nullable=True)
    registration_token_expires_at = Column(DateTime(timezone=True), nullable=True)
    registration_token_used_at = Column(DateTime(timezone=True), nullable=True)
    email_delivery_status = Column(String(30), nullable=True)
    created_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    updated_at = Column(DateTime(timezone=True), nullable=True, onupdate=func.now())
    expires_at = Column(DateTime(timezone=True), nullable=False)


class SriRucLookupAttempt(Base):
    __tablename__ = "sri_ruc_lookup_attempts"

    id = Column(Integer, primary_key=True)
    ip_hash = Column(String(64), nullable=False, index=True)
    created_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now(), index=True)
