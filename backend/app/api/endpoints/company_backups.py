from fastapi import APIRouter, Depends, File, Form, HTTPException, Response, UploadFile, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_active_user
from app.core.database import get_db
from app.models.company_backup import CompanyBackupOperation
from app.models.usuario import Usuario
from app.schemas.company_backup import (
    CompanyBackupContractResponse,
    CompanyBackupCrossCompanyRestoreAttemptsResponse,
    CompanyBackupOffboardingExecuteResponse,
    CompanyBackupOffboardingPreflightResponse,
    CompanyBackupInternalArtifactListResponse,
    CompanyBackupPreflightRequest,
    CompanyBackupPrepareRestoreResponse,
    CompanyBackupPreflightResponse,
    CompanyBackupRestoreExecuteResponse,
    CompanyBackupRestorePreflightResponse,
)
from app.services.audit_event import record_audit_event
from app.services.company_backup import COMPANY_BACKUP_MEDIA_TYPE, CompanyBackupPolicyError, company_backup_service


router = APIRouter()


def _policy_error_to_http(exc: CompanyBackupPolicyError) -> HTTPException:
    forbidden_codes = {
        "company_backup_role_forbidden",
        "company_backup_company_scope_forbidden",
        "company_backup_superadmin_required",
    }
    not_found_codes = {"company_backup_company_not_found"}
    if exc.code in forbidden_codes:
        status_code = status.HTTP_403_FORBIDDEN
    elif exc.code in not_found_codes:
        status_code = status.HTTP_404_NOT_FOUND
    else:
        status_code = status.HTTP_400_BAD_REQUEST
    return HTTPException(status_code=status_code, detail={"code": exc.code, "message": exc.message})


@router.get("/contract", response_model=CompanyBackupContractResponse)
def get_company_backup_contract():
    return CompanyBackupContractResponse()


@router.post("/saas/offboarding/preflight", response_model=CompanyBackupOffboardingPreflightResponse)
def preflight_company_offboarding_purge(
    payload: CompanyBackupPreflightRequest,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user),
):
    try:
        if not payload.empresa_id:
            raise CompanyBackupPolicyError("company_backup_company_required", "Seleccione una empresa para dar de baja.")
        result = company_backup_service.build_offboarding_preflight(db, current_user, empresa_id=payload.empresa_id)
        return CompanyBackupOffboardingPreflightResponse(**result)
    except CompanyBackupPolicyError as exc:
        db.rollback()
        raise _policy_error_to_http(exc) from exc


@router.post("/saas/offboarding/execute", response_model=CompanyBackupOffboardingExecuteResponse)
async def execute_company_offboarding_purge(
    file: UploadFile = File(...),
    empresa_id: int = Form(...),
    confirm_phrase: str = Form(...),
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user),
):
    try:
        archive_bytes = await file.read()
        result = company_backup_service.execute_offboarding_purge(
            db,
            current_user,
            empresa_id=empresa_id,
            archive_bytes=archive_bytes,
            filename=file.filename,
            confirm_phrase=confirm_phrase,
        )
        record_audit_event(
            db,
            module="company_backup",
            event_type="company_offboarding_purge_completed",
            severity="critical",
            actor=current_user,
            empresa_id=empresa_id,
            target_empresa_id=empresa_id,
            entity_type="company_backup_operation",
            entity_id=result["operation_id"],
            message="Empresa dada de baja con purga de datos y copia cliente validada.",
            payload={
                "operation_id": result["operation_id"],
                "backup_hash": result["backup_hash"],
                "purged_counts": result["purged_counts"],
                "lifecycle_status": result["lifecycle_status"],
            },
        )
        db.commit()
        return CompanyBackupOffboardingExecuteResponse(**result)
    except CompanyBackupPolicyError as exc:
        db.rollback()
        raise _policy_error_to_http(exc) from exc


@router.post("/preflight/export", response_model=CompanyBackupPreflightResponse)
def preflight_company_backup_export(
    payload: CompanyBackupPreflightRequest,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user),
):
    try:
        preflight = company_backup_service.build_export_preflight(
            db,
            current_user,
            empresa_id=payload.empresa_id,
        )
        operation = CompanyBackupOperation(
            empresa_id=preflight["empresa"]["empresa_id"],
            requested_by_user_id=current_user.id,
            requested_by_email=current_user.email,
            requested_by_role=current_user.rol,
            operation_type="export_preflight",
            source="external",
            scope=preflight["scope"],
            status="blocked" if preflight["blockers"] else "preflight",
            backup_format_version=preflight["contract_version"],
            preflight_json=preflight,
            counts_json=preflight["counts"],
            file_manifest_json=preflight["file_references"],
            marketplace_impact_json=preflight["marketplace_impact"],
            warnings_json=preflight["warnings"],
            blockers_json=preflight["blockers"],
        )
        db.add(operation)
        db.commit()
        db.refresh(operation)

        record_audit_event(
            db,
            module="company_backup",
            event_type="company_backup_export_preflight",
            severity="warning" if preflight["blockers"] else "info",
            actor=current_user,
            empresa_id=preflight["empresa"]["empresa_id"],
            target_empresa_id=preflight["empresa"]["empresa_id"],
            entity_type="company_backup_operation",
            entity_id=operation.id,
            message="Preflight de backup completo de empresa ejecutado.",
            payload={
                "operation_id": operation.id,
                "exportable": preflight["exportable"],
                "blockers": preflight["blockers"],
                "counts": preflight["counts"],
                "marketplace_impact": preflight["marketplace_impact"],
            },
        )
        preflight["operation_id"] = operation.id
        return CompanyBackupPreflightResponse(**preflight)
    except CompanyBackupPolicyError as exc:
        db.rollback()
        raise _policy_error_to_http(exc) from exc


@router.post("/export")
def export_company_backup(
    payload: CompanyBackupPreflightRequest,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user),
):
    try:
        archive = company_backup_service.build_export_archive(
            db,
            current_user,
            empresa_id=payload.empresa_id,
        )
        preflight = archive["preflight"]
        operation = CompanyBackupOperation(
            empresa_id=preflight["empresa"]["empresa_id"],
            requested_by_user_id=current_user.id,
            requested_by_email=current_user.email,
            requested_by_role=current_user.rol,
            operation_type="export",
            source="external",
            scope=preflight["scope"],
            status="completed",
            backup_hash=archive["backup_hash"],
            backup_format_version=preflight["contract_version"],
            backup_filename=archive["filename"],
            preflight_json=preflight,
            counts_json=preflight["counts"],
            file_manifest_json=archive["manifest"]["files"],
            marketplace_impact_json=preflight["marketplace_impact"],
            warnings_json=preflight["warnings"],
            blockers_json=[],
            metadata_json={
                "payload_hash": archive["payload_hash"],
                "size_bytes": archive["size_bytes"],
                "manifest": archive["manifest"],
            },
        )
        db.add(operation)
        db.commit()
        db.refresh(operation)

        record_audit_event(
            db,
            module="company_backup",
            event_type="company_backup_export_completed",
            severity="info",
            actor=current_user,
            empresa_id=preflight["empresa"]["empresa_id"],
            target_empresa_id=preflight["empresa"]["empresa_id"],
            entity_type="company_backup_operation",
            entity_id=operation.id,
            message="Backup completo de empresa exportado.",
            payload={
                "operation_id": operation.id,
                "backup_hash": archive["backup_hash"],
                "payload_hash": archive["payload_hash"],
                "filename": archive["filename"],
                "size_bytes": archive["size_bytes"],
                "counts": preflight["counts"],
                "table_counts": archive["manifest"]["table_counts"],
                "marketplace_impact": preflight["marketplace_impact"],
            },
        )
        headers = {
            "Content-Disposition": f'attachment; filename="{archive["filename"]}"',
            "X-GiProy-Backup-Hash": archive["backup_hash"],
            "X-GiProy-Backup-Operation-Id": str(operation.id),
            "X-GiProy-Backup-Size": str(archive["size_bytes"]),
        }
        return Response(content=archive["archive_bytes"], media_type=COMPANY_BACKUP_MEDIA_TYPE, headers=headers)
    except CompanyBackupPolicyError as exc:
        db.rollback()
        raise _policy_error_to_http(exc) from exc


@router.get("/internal-artifacts", response_model=CompanyBackupInternalArtifactListResponse)
def list_company_backup_internal_artifacts(
    empresa_id: int | None = None,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user),
):
    try:
        payload = company_backup_service.list_internal_artifacts(
            db,
            current_user,
            empresa_id=empresa_id,
        )
        db.commit()
        return CompanyBackupInternalArtifactListResponse(**payload)
    except CompanyBackupPolicyError as exc:
        db.rollback()
        raise _policy_error_to_http(exc) from exc


@router.get("/restore/cross-company-attempts", response_model=CompanyBackupCrossCompanyRestoreAttemptsResponse)
def list_company_backup_cross_company_restore_attempts(
    limit: int = 200,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user),
):
    try:
        payload = company_backup_service.list_cross_company_restore_attempts(
            db,
            current_user,
            limit=limit,
        )
        return CompanyBackupCrossCompanyRestoreAttemptsResponse(**payload)
    except CompanyBackupPolicyError as exc:
        db.rollback()
        raise _policy_error_to_http(exc) from exc


@router.post("/preflight/restore", response_model=CompanyBackupRestorePreflightResponse)
async def preflight_company_backup_restore(
    file: UploadFile = File(...),
    empresa_id: int | None = Form(default=None),
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user),
):
    try:
        archive_bytes = await file.read()
        preflight = company_backup_service.build_restore_preflight(
            db,
            current_user,
            archive_bytes=archive_bytes,
            filename=file.filename,
            empresa_id=empresa_id,
        )
        operation = CompanyBackupOperation(
            empresa_id=preflight["empresa"]["empresa_id"],
            requested_by_user_id=current_user.id,
            requested_by_email=current_user.email,
            requested_by_role=current_user.rol,
            operation_type="restore_preflight",
            source="external",
            scope=preflight["scope"],
            status="blocked" if preflight["blockers"] else "preflight",
            backup_hash=preflight["backup_hash"],
            backup_format_version=preflight["contract_version"],
            backup_filename=file.filename,
            preflight_json=preflight,
            counts_json=preflight["current_counts"],
            marketplace_impact_json=preflight["marketplace_impact"],
            warnings_json=preflight["warnings"],
            blockers_json=preflight["blockers"],
            metadata_json={
                "backup_counts": preflight["backup_counts"],
                "backup_table_counts": preflight["backup_table_counts"],
                "required_confirmations": preflight["required_confirmations"],
                "same_company": preflight["same_company"],
                "attempted_empresa": preflight["empresa"],
                "backup_empresa": preflight["backup_empresa"],
            },
        )
        db.add(operation)
        db.commit()
        db.refresh(operation)

        record_audit_event(
            db,
            module="company_backup",
            event_type="company_backup_restore_preflight",
            severity="warning" if preflight["blockers"] else "info",
            actor=current_user,
            empresa_id=preflight["empresa"]["empresa_id"],
            target_empresa_id=preflight["empresa"]["empresa_id"],
            entity_type="company_backup_operation",
            entity_id=operation.id,
            message="Preflight de restauracion de backup completo ejecutado.",
            payload={
                "operation_id": operation.id,
                "restorable": preflight["restorable"],
                "same_company": preflight["same_company"],
                "blockers": preflight["blockers"],
                "backup_hash": preflight["backup_hash"],
                "current_counts": preflight["current_counts"],
                "backup_counts": preflight["backup_counts"],
                "marketplace_impact": preflight["marketplace_impact"],
            },
        )
        if preflight["same_company"] is False:
            record_audit_event(
                db,
                module="company_backup",
                event_type="company_backup_cross_company_restore_attempt",
                severity="critical",
                actor=current_user,
                empresa_id=preflight["empresa"]["empresa_id"],
                target_empresa_id=preflight["empresa"]["empresa_id"],
                entity_type="company_backup_operation",
                entity_id=operation.id,
                message="Intento bloqueado de restaurar una copia de otra empresa.",
                payload={
                    "operation_id": operation.id,
                    "attempted_empresa": preflight["empresa"],
                    "backup_empresa": preflight["backup_empresa"],
                    "backup_hash": preflight["backup_hash"],
                    "requested_by_email": current_user.email,
                },
            )
        preflight["operation_id"] = operation.id
        return CompanyBackupRestorePreflightResponse(**preflight)
    except CompanyBackupPolicyError as exc:
        db.rollback()
        raise _policy_error_to_http(exc) from exc


@router.post("/restore/prepare-internal-safety-backup", response_model=CompanyBackupPrepareRestoreResponse)
async def prepare_company_backup_restore_internal_safety_backup(
    file: UploadFile = File(...),
    empresa_id: int | None = Form(default=None),
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user),
):
    try:
        archive_bytes = await file.read()
        preflight = company_backup_service.build_restore_preflight(
            db,
            current_user,
            archive_bytes=archive_bytes,
            filename=file.filename,
            empresa_id=empresa_id,
        )
        prepared = company_backup_service.create_internal_safety_backup(
            db,
            current_user,
            restore_preflight=preflight,
            source_backup_filename=file.filename,
        )
        db.commit()
        db.refresh(prepared["artifact"])
        db.refresh(prepared["operation"])

        record_audit_event(
            db,
            module="company_backup",
            event_type="company_backup_internal_safety_backup_created",
            severity="warning",
            actor=current_user,
            empresa_id=preflight["empresa"]["empresa_id"],
            target_empresa_id=preflight["empresa"]["empresa_id"],
            entity_type="company_backup_internal_artifact",
            entity_id=prepared["artifact"].id,
            message="Copia automatica previa a restauracion creada y registrada.",
            payload={
                "operation_id": prepared["operation"].id,
                "internal_artifact_id": prepared["artifact"].id,
                "internal_backup_hash": prepared["artifact"].backup_hash,
                "source_backup_hash": preflight["backup_hash"],
                "expires_at": prepared["artifact"].expires_at.isoformat() if prepared["artifact"].expires_at else None,
                "counts": prepared["artifact"].counts_json,
            },
        )
        db.commit()
        db.refresh(prepared["artifact"])

        preflight["operation_id"] = prepared["operation"].id
        preflight["next_allowed_action"] = "final_confirmation_required_before_destructive_restore"
        return CompanyBackupPrepareRestoreResponse(
            restore_preflight=CompanyBackupRestorePreflightResponse(**preflight),
            internal_safety_backup=company_backup_service._artifact_summary(prepared["artifact"]),
            destructive_allowed=False,
            next_allowed_action="final_confirmation_required_before_destructive_restore",
        )
    except CompanyBackupPolicyError as exc:
        db.rollback()
        raise _policy_error_to_http(exc) from exc


@router.post("/restore/execute", response_model=CompanyBackupRestoreExecuteResponse)
async def execute_company_backup_restore(
    file: UploadFile = File(...),
    empresa_id: int | None = Form(default=None),
    internal_artifact_id: int | None = Form(default=None),
    confirm_phrase: str = Form(...),
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user),
):
    try:
        archive_bytes = await file.read()
        restored = company_backup_service.execute_destructive_restore(
            db,
            current_user,
            archive_bytes=archive_bytes,
            filename=file.filename,
            empresa_id=empresa_id,
            internal_artifact_id=internal_artifact_id,
            confirm_phrase=confirm_phrase,
        )
        db.commit()
        db.refresh(restored["operation"])
        db.refresh(restored["artifact"])

        record_audit_event(
            db,
            module="company_backup",
            event_type="company_backup_restore_completed",
            severity="critical",
            actor=current_user,
            empresa_id=restored["empresa"]["empresa_id"],
            target_empresa_id=restored["empresa"]["empresa_id"],
            entity_type="company_backup_operation",
            entity_id=restored["operation"].id,
            message="Restauracion destructiva 1:1 de empresa completada con confirmacion final.",
            payload={
                "operation_id": restored["operation"].id,
                "internal_artifact_id": restored["artifact"].id,
                "backup_hash": restored["backup_hash"],
                "restored_counts": restored["restored_counts"],
                "deleted_counts": restored["deleted_counts"],
                "inserted_counts": restored["inserted_counts"],
                "updated_counts": restored["updated_counts"],
                "marketplace_impact": restored["marketplace_impact"],
                "confirmations": restored["operation"].confirmations_json,
            },
        )
        db.commit()
        db.refresh(restored["artifact"])

        return CompanyBackupRestoreExecuteResponse(
            operation_id=restored["operation"].id,
            empresa=restored["empresa"],
            backup_hash=restored["backup_hash"],
            internal_safety_backup=company_backup_service._artifact_summary(restored["artifact"]),
            restored_counts=restored["restored_counts"],
            deleted_counts=restored["deleted_counts"],
            inserted_counts=restored["inserted_counts"],
            updated_counts=restored["updated_counts"],
            marketplace_impact=restored["marketplace_impact"],
            warnings=restored["warnings"],
        )
    except CompanyBackupPolicyError as exc:
        db.rollback()
        raise _policy_error_to_http(exc) from exc


@router.post("/restore/internal-artifact/execute", response_model=CompanyBackupRestoreExecuteResponse)
def execute_company_backup_internal_artifact_restore(
    empresa_id: int | None = Form(default=None),
    internal_artifact_id: int = Form(...),
    confirm_phrase: str = Form(...),
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user),
):
    try:
        restored = company_backup_service.execute_internal_artifact_restore(
            db,
            current_user,
            empresa_id=empresa_id,
            internal_artifact_id=internal_artifact_id,
            confirm_phrase=confirm_phrase,
        )
        db.commit()
        db.refresh(restored["operation"])
        db.refresh(restored["artifact"])

        record_audit_event(
            db,
            module="company_backup",
            event_type="company_backup_internal_restore_completed",
            severity="critical",
            actor=current_user,
            empresa_id=restored["empresa"]["empresa_id"],
            target_empresa_id=restored["empresa"]["empresa_id"],
            entity_type="company_backup_operation",
            entity_id=restored["operation"].id,
            message="Restauracion destructiva 1:1 desde copia automatica interna completada.",
            payload={
                "operation_id": restored["operation"].id,
                "internal_artifact_id": restored["artifact"].id,
                "backup_hash": restored["backup_hash"],
                "restored_counts": restored["restored_counts"],
                "deleted_counts": restored["deleted_counts"],
                "inserted_counts": restored["inserted_counts"],
                "updated_counts": restored["updated_counts"],
                "marketplace_impact": restored["marketplace_impact"],
                "confirmations": restored["operation"].confirmations_json,
            },
        )
        db.commit()
        db.refresh(restored["artifact"])

        return CompanyBackupRestoreExecuteResponse(
            operation_id=restored["operation"].id,
            empresa=restored["empresa"],
            backup_hash=restored["backup_hash"],
            internal_safety_backup=company_backup_service._artifact_summary(restored["artifact"]),
            restored_counts=restored["restored_counts"],
            deleted_counts=restored["deleted_counts"],
            inserted_counts=restored["inserted_counts"],
            updated_counts=restored["updated_counts"],
            marketplace_impact=restored["marketplace_impact"],
            warnings=restored["warnings"],
        )
    except CompanyBackupPolicyError as exc:
        db.rollback()
        raise _policy_error_to_http(exc) from exc
