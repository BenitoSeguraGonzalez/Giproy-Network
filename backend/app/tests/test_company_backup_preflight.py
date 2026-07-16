import io
import zipfile
from datetime import datetime, timedelta
from pathlib import Path

from fastapi.testclient import TestClient

from app.api.deps import get_current_active_user
from app.core.database import get_db
from app.models.community import CommunityPost
from app.main import app
from app.models.base_trabajo import BaseTrabajo
from app.models.company_backup import CompanyBackupInternalArtifact, CompanyBackupOperation
from app.models.empresa import Empresa
from app.models.marketplace import MarketplaceProduct
from app.models.proyecto import Proyecto
from app.models.proyecto_documento import ProyectoDocumento
from app.models.system_audit_event import SystemAuditEvent
from app.models.usuario import Usuario
from app.schemas.company_backup import (
    COMPANY_BACKUP_AUTHORIZED_ROLES,
    COMPANY_BACKUP_DESTRUCTIVE_CONFIRMATION_PHRASE,
    COMPANY_BACKUP_FORMAT_VERSION,
    COMPANY_BACKUP_SCOPE,
)
from app.services.company_backup import COMPANY_BACKUP_MAGIC, company_backup_service


def _user(db, empresa_id: int, *, rol: str = "administrador", email: str = "backup-admin@giproy.test") -> Usuario:
    user = Usuario(
        email=email,
        hashed_password="x",
        nombre_completo="Backup Admin",
        rol=rol,
        empresa_id=empresa_id,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def _client_for(db, user: Usuario) -> TestClient:
    app.dependency_overrides[get_db] = lambda: db
    app.dependency_overrides[get_current_active_user] = lambda: user
    return TestClient(app)


def _superadmin(db, *, email: str = "backup-superadmin@giproy.test") -> Usuario:
    empresa = Empresa(
        nombre="Administradores Generales",
        codigo="ADMIN-GLOBAL-BACKUP",
        ruc="1790000000001",
        activa=True,
    )
    db.add(empresa)
    db.flush()
    return _user(db, empresa.id, rol="superadministrador", email=email)


def test_company_backup_contract_declares_full_1to1_guardrails():
    with TestClient(app) as client:
        response = client.get("/api/v1/company-backups/contract")

    assert response.status_code == 200
    payload = response.json()
    assert payload["contract_version"] == COMPANY_BACKUP_FORMAT_VERSION
    assert payload["scope"] == COMPANY_BACKUP_SCOPE
    assert payload["authorized_roles"] == COMPANY_BACKUP_AUTHORIZED_ROLES
    assert payload["internal_retention_days"] == 30
    assert payload["restored_internal_cleanup_days"] == 7
    assert payload["destructive_confirmation_phrase"] == COMPANY_BACKUP_DESTRUCTIVE_CONFIRMATION_PHRASE
    assert payload["features"]["same_company_restore_required"] is True
    assert payload["features"]["pre_restore_internal_backup_required"] is True
    assert payload["features"]["final_confirmation_required"] is True
    assert payload["features"]["triple_confirmation_required"] is False
    assert payload["features"]["user_email_confirmation_required"] is False
    assert payload["features"]["referenced_files_must_exist"] is True
    assert payload["features"]["includes_community"] is True
    assert payload["features"]["marketplace_purchases_preserved"] is True


def test_company_backup_preflight_counts_company_scope_and_audits(db, sample_empresa):
    current_user = _user(db, sample_empresa.id)
    base = BaseTrabajo(
        nombre="Base Backup",
        codigo_unico="BACKUP-BASE-001",
        tipo="Base Maestra",
        empresa_id=sample_empresa.id,
    )
    db.add(base)
    db.flush()
    project = Proyecto(
        nombre="Proyecto Backup",
        codigo="BACKUP-001",
        codigo_root="BACKUP-001",
        empresa_id=sample_empresa.id,
        base_trabajo_id=base.id,
    )
    db.add(project)
    db.commit()

    try:
        with _client_for(db, current_user) as client:
            response = client.post(
                "/api/v1/company-backups/preflight/export",
                json={"empresa_id": sample_empresa.id, "dry_run": True},
            )
    finally:
        app.dependency_overrides.clear()

    assert response.status_code == 200, response.text
    payload = response.json()
    assert payload["dry_run"] is True
    assert payload["exportable"] is True
    assert payload["scope"] == COMPANY_BACKUP_SCOPE
    assert payload["empresa"]["empresa_id"] == sample_empresa.id
    assert payload["counts"]["proyectos_total"] == 1
    assert payload["counts"]["proyectos_activos"] == 1
    assert payload["counts"]["bases_total"] == 1
    assert payload["marketplace_impact"]["products_not_in_backup_policy"] == "cancel_despublicar_auditoria_superadmin"
    assert payload["blockers"] == []
    assert payload["next_allowed_action"] == "export_backup"

    operation = db.query(CompanyBackupOperation).filter_by(id=payload["operation_id"]).one()
    assert operation.operation_type == "export_preflight"
    assert operation.status == "preflight"
    assert operation.counts_json["proyectos_total"] == 1

    audit_event = (
        db.query(SystemAuditEvent)
        .filter(SystemAuditEvent.event_type == "company_backup_export_preflight")
        .order_by(SystemAuditEvent.id.desc())
        .first()
    )
    assert audit_event is not None
    assert audit_event.module == "company_backup"
    assert audit_event.empresa_id == sample_empresa.id


def test_company_backup_preflight_blocks_missing_referenced_file(db, sample_empresa):
    current_user = _user(db, sample_empresa.id, email="backup-missing-file@giproy.test")
    document = ProyectoDocumento(
        codigo_root="BACKUP-ROOT",
        empresa_id=sample_empresa.id,
        uploaded_by_user_id=current_user.id,
        file_name="faltante.pdf",
        storage_path="uploads/proyectos/no-existe/faltante.pdf",
        content_type="application/pdf",
        size_bytes=123,
    )
    db.add(document)
    db.commit()

    try:
        with _client_for(db, current_user) as client:
            response = client.post(
                "/api/v1/company-backups/preflight/export",
                json={"empresa_id": sample_empresa.id, "dry_run": True},
            )
    finally:
        app.dependency_overrides.clear()

    assert response.status_code == 200, response.text
    payload = response.json()
    assert payload["exportable"] is False
    assert payload["next_allowed_action"] == "repair_file_integrity"
    assert payload["file_references"][0]["exists"] is False
    assert payload["file_references"][0]["blocker"] == "referenced_file_missing"
    assert "referencia archivo inexistente" in payload["blockers"][0]

    operation = db.query(CompanyBackupOperation).filter_by(id=payload["operation_id"]).one()
    assert operation.status == "blocked"
    assert operation.blockers_json


def test_company_backup_preflight_forbids_non_admin_role(db, sample_empresa):
    current_user = _user(db, sample_empresa.id, rol="usuario", email="backup-user@giproy.test")

    try:
        with _client_for(db, current_user) as client:
            response = client.post(
                "/api/v1/company-backups/preflight/export",
                json={"empresa_id": sample_empresa.id, "dry_run": True},
            )
    finally:
        app.dependency_overrides.clear()

    assert response.status_code == 403
    assert response.json()["detail"]["code"] == "company_backup_role_forbidden"


def test_company_backup_export_generates_encrypted_archive_with_manifest_data_community_and_files(db, sample_empresa, tmp_path):
    current_user = _user(db, sample_empresa.id, email="backup-export@giproy.test")
    base = BaseTrabajo(
        nombre="Base Export",
        codigo_unico="BACKUP-EXPORT-BASE",
        tipo="Base Maestra",
        empresa_id=sample_empresa.id,
    )
    db.add(base)
    db.flush()
    project = Proyecto(
        nombre="Proyecto Export",
        codigo="BACKUP-EXPORT",
        codigo_root="BACKUP-EXPORT",
        empresa_id=sample_empresa.id,
        base_trabajo_id=base.id,
    )
    db.add(project)
    community_post = CommunityPost(
        scope="interno_empresa",
        status="publicado",
        title="Comunidad incluida",
        body="Contenido de comunidad en backup.",
        author_user_id=current_user.id,
        empresa_id=sample_empresa.id,
        target_empresa_id=sample_empresa.id,
    )
    db.add(community_post)
    file_path = tmp_path / "documento-backup.pdf"
    file_path.write_bytes(b"contenido-pdf-backup")
    document = ProyectoDocumento(
        codigo_root="BACKUP-EXPORT",
        empresa_id=sample_empresa.id,
        uploaded_by_user_id=current_user.id,
        file_name="documento-backup.pdf",
        storage_path=str(file_path),
        content_type="application/pdf",
        size_bytes=file_path.stat().st_size,
    )
    db.add(document)
    db.commit()

    try:
        with _client_for(db, current_user) as client:
            response = client.post(
                "/api/v1/company-backups/export",
                json={"empresa_id": sample_empresa.id, "dry_run": False},
            )
    finally:
        app.dependency_overrides.clear()

    assert response.status_code == 200, response.text
    assert response.headers["content-type"].startswith("application/vnd.giproy.company-backup")
    assert response.content.startswith(COMPANY_BACKUP_MAGIC)
    assert not response.content.startswith(b"PK")
    assert response.headers["x-giproy-backup-hash"]
    assert response.headers["content-disposition"].endswith(".giproybackup\"")

    zip_payload = company_backup_service.decrypt_archive_for_verification(response.content)
    with zipfile.ZipFile(io.BytesIO(zip_payload), "r") as package:
        names = set(package.namelist())
        assert "manifest.json" in names
        assert "data/tables/proyectos.json" in names
        assert "data/tables/community_posts.json" in names
        assert "data/tables/proyecto_documentos.json" in names
        assert any(name.startswith("files/") for name in names)

        manifest = package.read("manifest.json").decode("utf-8")
        assert COMPANY_BACKUP_FORMAT_VERSION in manifest
        assert COMPANY_BACKUP_SCOPE in manifest
        assert "includes_community" in manifest
        assert "file_count" in manifest

    operation = db.query(CompanyBackupOperation).order_by(CompanyBackupOperation.id.desc()).first()
    assert operation.operation_type == "export"
    assert operation.status == "completed"
    assert operation.backup_hash == response.headers["x-giproy-backup-hash"]
    assert operation.backup_filename.endswith(".giproybackup")

    audit_event = (
        db.query(SystemAuditEvent)
        .filter(SystemAuditEvent.event_type == "company_backup_export_completed")
        .order_by(SystemAuditEvent.id.desc())
        .first()
    )
    assert audit_event is not None
    assert audit_event.entity_id == str(operation.id)


def test_company_backup_export_blocks_when_preflight_has_missing_file(db, sample_empresa):
    current_user = _user(db, sample_empresa.id, email="backup-export-blocked@giproy.test")
    db.add(
        ProyectoDocumento(
            codigo_root="BACKUP-BLOCK",
            empresa_id=sample_empresa.id,
            uploaded_by_user_id=current_user.id,
            file_name="faltante.pdf",
            storage_path="uploads/proyectos/no-existe/faltante-export.pdf",
            content_type="application/pdf",
            size_bytes=123,
        )
    )
    db.commit()

    try:
        with _client_for(db, current_user) as client:
            response = client.post(
                "/api/v1/company-backups/export",
                json={"empresa_id": sample_empresa.id, "dry_run": False},
            )
    finally:
        app.dependency_overrides.clear()

    assert response.status_code == 400
    assert response.json()["detail"]["code"] == "company_backup_export_blocked"


def test_company_backup_restore_preflight_accepts_same_company_backup_without_destructive_action(db, sample_empresa):
    current_user = _user(db, sample_empresa.id, email="backup-restore@giproy.test")
    db.add(
        Proyecto(
            nombre="Proyecto Restore",
            codigo="BACKUP-RESTORE",
            codigo_root="BACKUP-RESTORE",
            empresa_id=sample_empresa.id,
        )
    )
    db.commit()

    try:
        with _client_for(db, current_user) as client:
            export_response = client.post(
                "/api/v1/company-backups/export",
                json={"empresa_id": sample_empresa.id, "dry_run": False},
            )
            restore_response = client.post(
                "/api/v1/company-backups/preflight/restore",
                data={"empresa_id": str(sample_empresa.id)},
                files={"file": ("empresa.giproybackup", export_response.content, "application/vnd.giproy.company-backup")},
            )
    finally:
        app.dependency_overrides.clear()

    assert export_response.status_code == 200
    assert restore_response.status_code == 200, restore_response.text
    payload = restore_response.json()
    assert payload["restorable"] is True
    assert payload["destructive_allowed"] is False
    assert payload["same_company"] is True
    assert payload["backup_empresa"]["empresa_id"] == sample_empresa.id
    assert payload["backup_counts"]["proyectos_total"] == 1
    assert payload["current_counts"]["proyectos_total"] == 1
    assert payload["next_allowed_action"] == "final_confirmation_required"
    assert "CONFIRMO IMPORTACION" in payload["required_confirmations"][0]

    operation = db.query(CompanyBackupOperation).filter_by(id=payload["operation_id"]).one()
    assert operation.operation_type == "restore_preflight"
    assert operation.status == "preflight"
    assert operation.backup_hash == payload["backup_hash"]


def test_company_backup_restore_preflight_blocks_backup_from_other_company(db, sample_empresa):
    source_user = _user(db, sample_empresa.id, email="backup-source@giproy.test")
    other_empresa = Empresa(
        nombre="Otra Empresa",
        ruc="9999999990001",
        proy_prefijo="OTR",
        proy_periodo="2026",
        proy_secuencial=1,
        proy_secuencial_size=3,
    )
    db.add(other_empresa)
    db.commit()
    db.refresh(other_empresa)
    target_user = _user(db, other_empresa.id, email="backup-target@giproy.test")

    try:
        app.dependency_overrides[get_db] = lambda: db
        app.dependency_overrides[get_current_active_user] = lambda: source_user
        with TestClient(app) as client:
            export_response = client.post(
                "/api/v1/company-backups/export",
                json={"empresa_id": sample_empresa.id, "dry_run": False},
            )
        app.dependency_overrides[get_current_active_user] = lambda: target_user
        with TestClient(app) as client:
            restore_response = client.post(
                "/api/v1/company-backups/preflight/restore",
                data={"empresa_id": str(other_empresa.id)},
                files={"file": ("empresa.giproybackup", export_response.content, "application/vnd.giproy.company-backup")},
            )
    finally:
        app.dependency_overrides.clear()

    assert export_response.status_code == 200
    assert restore_response.status_code == 200, restore_response.text
    payload = restore_response.json()
    assert payload["restorable"] is False
    assert payload["same_company"] is False
    assert payload["next_allowed_action"] == "reject_restore_preflight"
    assert "otra empresa" in payload["blockers"][0].lower()

    operation = db.query(CompanyBackupOperation).filter_by(id=payload["operation_id"]).one()
    assert operation.operation_type == "restore_preflight"
    assert operation.status == "blocked"
    assert operation.metadata_json["same_company"] is False

    audit_event = (
        db.query(SystemAuditEvent)
        .filter(SystemAuditEvent.event_type == "company_backup_cross_company_restore_attempt")
        .order_by(SystemAuditEvent.id.desc())
        .first()
    )
    assert audit_event is not None
    assert audit_event.severity == "critical"

    try:
        app.dependency_overrides[get_db] = lambda: db
        app.dependency_overrides[get_current_active_user] = lambda: _user(
            db,
            sample_empresa.id,
            rol="superadministrador",
            email="restore-audit-super@giproy.test",
        )
        with TestClient(app) as client:
            attempts_response = client.get("/api/v1/company-backups/restore/cross-company-attempts")
    finally:
        app.dependency_overrides.clear()

    assert attempts_response.status_code == 200, attempts_response.text
    attempts = attempts_response.json()["items"]
    assert attempts
    assert attempts[0]["attempted_empresa"]["empresa_id"] == other_empresa.id
    assert attempts[0]["backup_empresa"]["empresa_id"] == sample_empresa.id
    assert attempts[0]["attempts"] >= 1


def test_company_backup_restore_preflight_rejects_invalid_file(db, sample_empresa):
    current_user = _user(db, sample_empresa.id, email="backup-invalid@giproy.test")

    try:
        with _client_for(db, current_user) as client:
            response = client.post(
                "/api/v1/company-backups/preflight/restore",
                data={"empresa_id": str(sample_empresa.id)},
                files={"file": ("mal.giproybackup", b"no-es-un-backup", "application/octet-stream")},
            )
    finally:
        app.dependency_overrides.clear()

    assert response.status_code == 400
    assert response.json()["detail"]["code"] == "company_backup_invalid_magic"


def test_company_offboarding_purge_requires_valid_backup_and_keeps_minimal_company_row(db, sample_empresa, tmp_path):
    superadmin = _superadmin(db, email="offboarding-super@giproy.test")
    base = BaseTrabajo(
        nombre="Base Baja",
        codigo_unico="BAJA-BASE-001",
        tipo="Base Maestra",
        empresa_id=sample_empresa.id,
    )
    db.add(base)
    db.flush()
    project = Proyecto(
        nombre="Proyecto Baja",
        codigo="BAJA-001",
        codigo_root="BAJA-001",
        empresa_id=sample_empresa.id,
        base_trabajo_id=base.id,
    )
    db.add(project)
    db.flush()
    file_path = tmp_path / "baja.pdf"
    file_path.write_bytes(b"archivo-baja")
    db.add(
        ProyectoDocumento(
            codigo_root=project.codigo_root,
            empresa_id=sample_empresa.id,
            file_name="baja.pdf",
            storage_path=str(file_path),
            content_type="application/pdf",
            size_bytes=file_path.stat().st_size,
            uploaded_by_user_id=superadmin.id,
        )
    )
    db.commit()

    try:
        with _client_for(db, superadmin) as client:
            export_response = client.post(
                "/api/v1/company-backups/export",
                json={"empresa_id": sample_empresa.id, "dry_run": False},
            )
            preflight_response = client.post(
                "/api/v1/company-backups/saas/offboarding/preflight",
                json={"empresa_id": sample_empresa.id, "dry_run": True},
            )
            purge_response = client.post(
                "/api/v1/company-backups/saas/offboarding/execute",
                data={"empresa_id": str(sample_empresa.id), "confirm_phrase": "CONFIRMO BAJA PURGADA"},
                files={"file": ("empresa.giproybackup", export_response.content, "application/vnd.giproy.company-backup")},
            )
    finally:
        app.dependency_overrides.clear()

    assert export_response.status_code == 200, export_response.text
    assert preflight_response.status_code == 200, preflight_response.text
    assert preflight_response.json()["exportable"] is True
    assert purge_response.status_code == 200, purge_response.text
    payload = purge_response.json()
    assert payload["lifecycle_status"] == "baja_purgada"
    assert payload["backup_hash"] == export_response.headers["x-giproy-backup-hash"]
    assert payload["purged_counts"]["deleted_tables"]["proyectos"] == 1
    assert payload["purged_counts"]["files"]["files_deleted"] == 1
    assert not file_path.exists()

    db.expire_all()
    empresa = db.query(Empresa).filter(Empresa.id == sample_empresa.id).one()
    assert empresa.activa is False
    assert empresa.lifecycle_status == "baja_purgada"
    assert empresa.baja_recovery_required is True
    assert empresa.baja_backup_hash == payload["backup_hash"]
    assert db.query(Proyecto).filter(Proyecto.empresa_id == sample_empresa.id).count() == 0


def test_company_backup_restore_preflight_blocks_readonly_company(db, sample_empresa, monkeypatch):
    current_user = _user(db, sample_empresa.id, email="backup-readonly@giproy.test")

    try:
        with _client_for(db, current_user) as client:
            export_response = client.post(
                "/api/v1/company-backups/export",
                json={"empresa_id": sample_empresa.id, "dry_run": False},
            )
            monkeypatch.setattr(
                "app.services.company_backup.license_service.get_company_license_snapshot",
                lambda _db, _empresa_id: {"access_mode": "readonly"},
            )
            restore_response = client.post(
                "/api/v1/company-backups/preflight/restore",
                data={"empresa_id": str(sample_empresa.id)},
                files={"file": ("empresa.giproybackup", export_response.content, "application/vnd.giproy.company-backup")},
            )
    finally:
        app.dependency_overrides.clear()

    assert export_response.status_code == 200, export_response.text
    assert restore_response.status_code == 400, restore_response.text
    assert restore_response.json()["detail"]["code"] == "company_backup_restore_readonly_forbidden"


def test_company_backup_prepare_internal_safety_backup_creates_encrypted_artifact_for_superadmin(
    db,
    sample_empresa,
    tmp_path,
    monkeypatch,
):
    current_user = _user(
        db,
        sample_empresa.id,
        rol="superadministrador",
        email="backup-superadmin@giproy.test",
    )
    db.add(
        Proyecto(
            nombre="Proyecto Safety",
            codigo="BACKUP-SAFETY",
            codigo_root="BACKUP-SAFETY",
            empresa_id=sample_empresa.id,
        )
    )
    db.commit()
    monkeypatch.setattr(company_backup_service, "_internal_backup_root", lambda: tmp_path)

    try:
        with _client_for(db, current_user) as client:
            export_response = client.post(
                "/api/v1/company-backups/export",
                json={"empresa_id": sample_empresa.id, "dry_run": False},
            )
            prepare_response = client.post(
                "/api/v1/company-backups/restore/prepare-internal-safety-backup",
                data={"empresa_id": str(sample_empresa.id)},
                files={"file": ("empresa.giproybackup", export_response.content, "application/vnd.giproy.company-backup")},
            )
            list_response = client.get(
                f"/api/v1/company-backups/internal-artifacts?empresa_id={sample_empresa.id}",
            )
    finally:
        app.dependency_overrides.clear()

    assert export_response.status_code == 200, export_response.text
    assert prepare_response.status_code == 200, prepare_response.text
    payload = prepare_response.json()
    assert payload["destructive_allowed"] is False
    assert payload["next_allowed_action"] == "final_confirmation_required_before_destructive_restore"
    assert payload["restore_preflight"]["restorable"] is True
    assert payload["internal_safety_backup"]["status"] == "available"
    assert payload["internal_safety_backup"]["reason"] == "pre_restore_safety"
    assert payload["internal_safety_backup"]["size_bytes"] > 0
    assert payload["internal_safety_backup"]["expires_at"]

    artifact = db.query(CompanyBackupInternalArtifact).filter_by(id=payload["internal_safety_backup"]["id"]).one()
    artifact_path = Path(artifact.artifact_path)
    assert artifact_path.exists()
    assert artifact_path.read_bytes().startswith(COMPANY_BACKUP_MAGIC)
    assert artifact.backup_hash == payload["internal_safety_backup"]["backup_hash"]
    assert artifact.created_by_email == "backup-superadmin@giproy.test"

    operation = db.query(CompanyBackupOperation).filter_by(internal_artifact_id=artifact.id).one()
    assert operation.operation_type == "restore_prepare_internal_safety_backup"
    assert operation.status == "prepared"

    audit_event = (
        db.query(SystemAuditEvent)
        .filter(SystemAuditEvent.event_type == "company_backup_internal_safety_backup_created")
        .order_by(SystemAuditEvent.id.desc())
        .first()
    )
    assert audit_event is not None
    assert audit_event.entity_id == str(artifact.id)

    assert list_response.status_code == 200, list_response.text
    listed = list_response.json()
    assert listed["empresa"]["empresa_id"] == sample_empresa.id
    assert listed["items"][0]["id"] == artifact.id


def test_company_backup_prepare_internal_safety_backup_forbids_company_admin(db, sample_empresa):
    current_user = _user(db, sample_empresa.id, email="backup-admin-restore-blocked@giproy.test")

    try:
        with _client_for(db, current_user) as client:
            export_response = client.post(
                "/api/v1/company-backups/export",
                json={"empresa_id": sample_empresa.id, "dry_run": False},
            )
            response = client.post(
                "/api/v1/company-backups/restore/prepare-internal-safety-backup",
                data={"empresa_id": str(sample_empresa.id)},
                files={"file": ("empresa.giproybackup", export_response.content, "application/vnd.giproy.company-backup")},
            )
    finally:
        app.dependency_overrides.clear()

    assert export_response.status_code == 200
    assert response.status_code == 403
    assert response.json()["detail"]["code"] == "company_backup_superadmin_required"
    assert db.query(CompanyBackupInternalArtifact).count() == 0


def test_company_backup_internal_artifacts_list_forbids_company_admin(db, sample_empresa):
    current_user = _user(db, sample_empresa.id, email="backup-admin-list-blocked@giproy.test")

    try:
        with _client_for(db, current_user) as client:
            response = client.get(f"/api/v1/company-backups/internal-artifacts?empresa_id={sample_empresa.id}")
    finally:
        app.dependency_overrides.clear()

    assert response.status_code == 403
    assert response.json()["detail"]["code"] == "company_backup_superadmin_required"


def test_company_backup_execute_restore_overwrites_company_data_trash_and_community(
    db,
    sample_empresa,
    tmp_path,
    monkeypatch,
):
    current_user = _user(
        db,
        sample_empresa.id,
        rol="superadministrador",
        email="backup-execute@giproy.test",
    )
    base = BaseTrabajo(
        nombre="Base en copia",
        codigo_unico="BACKUP-EXEC-BASE",
        tipo="Base Maestra",
        empresa_id=sample_empresa.id,
        deleted_at=datetime.utcnow(),
        deleted_by_user_id=current_user.id,
    )
    db.add(base)
    db.flush()
    proyecto = Proyecto(
        nombre="Proyecto en copia",
        codigo="BACKUP-EXEC",
        codigo_root="BACKUP-EXEC",
        empresa_id=sample_empresa.id,
        base_trabajo_id=base.id,
        deleted_at=datetime.utcnow(),
        deleted_by_user_id=current_user.id,
    )
    db.add(proyecto)
    community_post = CommunityPost(
        scope="interno_empresa",
        status="publicado",
        title="Comunidad en copia",
        body="Debe volver tras restaurar.",
        author_user_id=current_user.id,
        empresa_id=sample_empresa.id,
        target_empresa_id=sample_empresa.id,
    )
    db.add(community_post)
    db.commit()
    monkeypatch.setattr(company_backup_service, "_internal_backup_root", lambda: tmp_path)

    try:
        with _client_for(db, current_user) as client:
            export_response = client.post(
                "/api/v1/company-backups/export",
                json={"empresa_id": sample_empresa.id, "dry_run": False},
            )

            db.add(
                Proyecto(
                    nombre="Proyecto posterior que debe desaparecer",
                    codigo="BACKUP-EXEC-EXTRA",
                    codigo_root="BACKUP-EXEC-EXTRA",
                    empresa_id=sample_empresa.id,
                )
            )
            db.query(CommunityPost).filter(CommunityPost.id == community_post.id).delete()
            db.commit()

            execute_response = client.post(
                "/api/v1/company-backups/restore/execute",
                data={
                    "empresa_id": str(sample_empresa.id),
                    "confirm_phrase": COMPANY_BACKUP_DESTRUCTIVE_CONFIRMATION_PHRASE,
                },
                files={"file": ("empresa.giproybackup", export_response.content, "application/vnd.giproy.company-backup")},
            )
    finally:
        app.dependency_overrides.clear()

    assert export_response.status_code == 200, export_response.text
    assert execute_response.status_code == 200, execute_response.text
    payload = execute_response.json()
    assert payload["destructive_completed"] is True
    assert payload["restored_counts"]["proyectos_total"] == 1
    assert payload["restored_counts"]["proyectos_papelera"] == 1
    assert payload["restored_counts"]["bases_papelera"] == 1
    assert payload["restored_counts"]["community_posts"] == 1
    assert payload["internal_safety_backup"]["status"] == "restored"
    assert payload["internal_safety_backup"]["cleanup_after"]
    assert payload["internal_safety_backup"]["reason"] == "pre_restore_safety"

    assert db.query(Proyecto).filter(Proyecto.codigo == "BACKUP-EXEC-EXTRA").count() == 0
    restored_project = db.query(Proyecto).filter(Proyecto.codigo == "BACKUP-EXEC").one()
    assert restored_project.deleted_at is not None
    assert db.query(CommunityPost).filter(CommunityPost.title == "Comunidad en copia").count() == 1

    operation = db.query(CompanyBackupOperation).filter_by(id=payload["operation_id"]).one()
    assert operation.operation_type == "restore_execute"
    assert operation.status == "completed"
    assert operation.confirmations_json["confirm_phrase"] == COMPANY_BACKUP_DESTRUCTIVE_CONFIRMATION_PHRASE

    audit_event = (
        db.query(SystemAuditEvent)
        .filter(SystemAuditEvent.event_type == "company_backup_restore_completed")
        .order_by(SystemAuditEvent.id.desc())
        .first()
    )
    assert audit_event is not None
    assert audit_event.severity == "critical"


def test_company_backup_execute_restore_requires_exact_final_confirmation(
    db,
    sample_empresa,
    tmp_path,
    monkeypatch,
):
    current_user = _user(
        db,
        sample_empresa.id,
        rol="superadministrador",
        email="backup-confirm-block@giproy.test",
    )
    db.add(
        Proyecto(
            nombre="Proyecto Confirmacion",
            codigo="BACKUP-CONFIRM",
            codigo_root="BACKUP-CONFIRM",
            empresa_id=sample_empresa.id,
        )
    )
    db.commit()
    monkeypatch.setattr(company_backup_service, "_internal_backup_root", lambda: tmp_path)

    try:
        with _client_for(db, current_user) as client:
            export_response = client.post(
                "/api/v1/company-backups/export",
                json={"empresa_id": sample_empresa.id, "dry_run": False},
            )
            prepare_response = client.post(
                "/api/v1/company-backups/restore/prepare-internal-safety-backup",
                data={"empresa_id": str(sample_empresa.id)},
                files={"file": ("empresa.giproybackup", export_response.content, "application/vnd.giproy.company-backup")},
            )
            artifact_id = prepare_response.json()["internal_safety_backup"]["id"]
            execute_response = client.post(
                "/api/v1/company-backups/restore/execute",
                data={
                    "empresa_id": str(sample_empresa.id),
                    "internal_artifact_id": str(artifact_id),
                    "confirm_phrase": "CONFIRMO RESTAURACION",
                },
                files={"file": ("empresa.giproybackup", export_response.content, "application/vnd.giproy.company-backup")},
            )
    finally:
        app.dependency_overrides.clear()

    assert export_response.status_code == 200
    assert prepare_response.status_code == 200
    assert execute_response.status_code == 400
    assert execute_response.json()["detail"]["code"] == "company_backup_restore_confirmations_invalid"
    assert db.query(CompanyBackupOperation).filter(CompanyBackupOperation.operation_type == "restore_execute").count() == 0


def test_company_backup_execute_internal_artifact_restore_recovers_previous_company_state(
    db,
    sample_empresa,
    tmp_path,
    monkeypatch,
):
    current_user = _user(
        db,
        sample_empresa.id,
        rol="superadministrador",
        email="backup-internal-restore@giproy.test",
    )
    db.add(
        Proyecto(
            nombre="Proyecto interno original",
            codigo="BACKUP-INTERNAL-ORIGINAL",
            codigo_root="BACKUP-INTERNAL-ORIGINAL",
            empresa_id=sample_empresa.id,
        )
    )
    db.commit()
    monkeypatch.setattr(company_backup_service, "_internal_backup_root", lambda: tmp_path)

    try:
        with _client_for(db, current_user) as client:
            export_response = client.post(
                "/api/v1/company-backups/export",
                json={"empresa_id": sample_empresa.id, "dry_run": False},
            )
            prepare_response = client.post(
                "/api/v1/company-backups/restore/prepare-internal-safety-backup",
                data={"empresa_id": str(sample_empresa.id)},
                files={"file": ("empresa.giproybackup", export_response.content, "application/vnd.giproy.company-backup")},
            )
            artifact_id = prepare_response.json()["internal_safety_backup"]["id"]

            db.add(
                Proyecto(
                    nombre="Proyecto interno posterior",
                    codigo="BACKUP-INTERNAL-POSTERIOR",
                    codigo_root="BACKUP-INTERNAL-POSTERIOR",
                    empresa_id=sample_empresa.id,
                )
            )
            db.commit()

            execute_response = client.post(
                "/api/v1/company-backups/restore/internal-artifact/execute",
                data={
                    "empresa_id": str(sample_empresa.id),
                    "internal_artifact_id": str(artifact_id),
                    "confirm_phrase": COMPANY_BACKUP_DESTRUCTIVE_CONFIRMATION_PHRASE,
                },
            )
    finally:
        app.dependency_overrides.clear()

    assert export_response.status_code == 200
    assert prepare_response.status_code == 200
    assert execute_response.status_code == 200, execute_response.text
    payload = execute_response.json()
    assert payload["restored_counts"]["proyectos_total"] == 1
    assert db.query(Proyecto).filter(Proyecto.codigo == "BACKUP-INTERNAL-ORIGINAL").count() == 1
    assert db.query(Proyecto).filter(Proyecto.codigo == "BACKUP-INTERNAL-POSTERIOR").count() == 0

    artifact = db.query(CompanyBackupInternalArtifact).filter_by(id=artifact_id).one()
    assert artifact.status == "restored"
    assert artifact.cleanup_after is not None

    audit_event = (
        db.query(SystemAuditEvent)
        .filter(SystemAuditEvent.event_type == "company_backup_internal_restore_completed")
        .order_by(SystemAuditEvent.id.desc())
        .first()
    )
    assert audit_event is not None
    assert audit_event.severity == "critical"


def test_company_backup_execute_restore_cancels_seller_products_not_in_backup_but_preserves_purchase_context(
    db,
    sample_empresa,
    tmp_path,
    monkeypatch,
):
    current_user = _user(
        db,
        sample_empresa.id,
        rol="superadministrador",
        email="backup-marketplace@giproy.test",
    )
    db.add(
        Proyecto(
            nombre="Proyecto Marketplace",
            codigo="BACKUP-MKT",
            codigo_root="BACKUP-MKT",
            empresa_id=sample_empresa.id,
        )
    )
    db.commit()
    monkeypatch.setattr(company_backup_service, "_internal_backup_root", lambda: tmp_path)

    try:
        with _client_for(db, current_user) as client:
            export_response = client.post(
                "/api/v1/company-backups/export",
                json={"empresa_id": sample_empresa.id, "dry_run": False},
            )

            product = MarketplaceProduct(
                titulo="Producto posterior",
                slug="producto-posterior-restore",
                descripcion="Debe cancelarse si no esta en la copia.",
                product_type="proyecto",
                product_kind="manual",
                precio=10,
                moneda="USD",
                estado="approved",
                activo=True,
                seller_user_id=current_user.id,
            )
            db.add(product)
            db.commit()
            db.refresh(product)

            prepare_response = client.post(
                "/api/v1/company-backups/restore/prepare-internal-safety-backup",
                data={"empresa_id": str(sample_empresa.id)},
                files={"file": ("empresa.giproybackup", export_response.content, "application/vnd.giproy.company-backup")},
            )
            artifact_id = prepare_response.json()["internal_safety_backup"]["id"]
            execute_response = client.post(
                "/api/v1/company-backups/restore/execute",
                data={
                    "empresa_id": str(sample_empresa.id),
                    "internal_artifact_id": str(artifact_id),
                    "confirm_phrase": COMPANY_BACKUP_DESTRUCTIVE_CONFIRMATION_PHRASE,
                },
                files={"file": ("empresa.giproybackup", export_response.content, "application/vnd.giproy.company-backup")},
            )
    finally:
        app.dependency_overrides.clear()

    assert export_response.status_code == 200
    assert prepare_response.status_code == 200
    assert execute_response.status_code == 200, execute_response.text
    restored_product = db.query(MarketplaceProduct).filter(MarketplaceProduct.slug == "producto-posterior-restore").one()
    assert restored_product.activo is False
    assert restored_product.estado == "cancelled"
    assert "Restauracion" in restored_product.admin_notes or "restauracion" in restored_product.admin_notes
