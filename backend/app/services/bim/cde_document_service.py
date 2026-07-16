from __future__ import annotations

import hashlib
import re
from pathlib import Path

from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.bim_cde import BimCdeDocument, BimCdeDocumentRevision
from app.services.bim.cde_acl_service import has_document_permission, require_document_permission


MAX_CDE_DOCUMENT_BYTES = 100 * 1024 * 1024
ALLOWED_CATEGORIES = {"drawing", "specification", "report", "procedure", "contract", "model", "other"}
BLOCKED_EXTENSIONS = {".bat", ".cmd", ".com", ".dll", ".exe", ".js", ".msi", ".ps1", ".scr", ".vbs"}


def _safe_code(value: str) -> str:
    normalized = re.sub(r"[^A-Za-z0-9._-]+", "-", value.strip()).strip("-.")
    if not normalized or len(normalized) > 120:
        raise ValueError("Codigo documental CDE invalido.")
    return normalized


def _safe_filename(value: str) -> str:
    filename = re.sub(r"[^A-Za-z0-9._-]+", "_", Path(value or "document.bin").name)
    if Path(filename).suffix.lower() in BLOCKED_EXTENSIONS:
        raise ValueError("Tipo de archivo no permitido en el CDE BIM.")
    return filename[:255] or "document.bin"


def _get_document(db: Session, *, document_id: int, project_id: int, company_id: int) -> BimCdeDocument:
    document = db.query(BimCdeDocument).filter(
        BimCdeDocument.id == document_id,
        BimCdeDocument.proyecto_id == project_id,
        BimCdeDocument.empresa_id == company_id,
    ).first()
    if document is None:
        raise HTTPException(status_code=404, detail="Documento CDE BIM no encontrado.")
    return document


def _current_revision(db: Session, document_id: int) -> BimCdeDocumentRevision | None:
    return db.query(BimCdeDocumentRevision).filter(
        BimCdeDocumentRevision.document_id == document_id,
        BimCdeDocumentRevision.status == "current",
    ).first()


def _serialize_revision(revision: BimCdeDocumentRevision) -> dict:
    return {
        "id": revision.id,
        "document_id": revision.document_id,
        "revision": revision.revision,
        "version_label": revision.version_label,
        "source_filename": revision.source_filename,
        "media_type": revision.media_type,
        "file_size_bytes": revision.file_size_bytes,
        "checksum_sha256": revision.checksum_sha256,
        "notes": revision.notes,
        "status": revision.status,
        "created_by": revision.created_by,
        "created_at": revision.created_at,
    }


def _serialize_document(db: Session, document: BimCdeDocument) -> dict:
    current = _current_revision(db, document.id)
    return {
        "id": document.id,
        "project_id": document.proyecto_id,
        "company_id": document.empresa_id,
        "document_code": document.document_code,
        "title": document.title,
        "category": document.category,
        "status": document.status,
        "current_revision": document.current_revision,
        "created_by": document.created_by,
        "created_at": document.created_at,
        "updated_at": document.updated_at,
        "current": _serialize_revision(current) if current else None,
    }


def create_document_revision(
    db: Session,
    *,
    project_id: int,
    company_id: int,
    user_id: int,
    document_code: str,
    title: str,
    category: str,
    version_label: str,
    notes: str | None,
    source_filename: str,
    media_type: str | None,
    content: bytes,
    storage_root: Path | None = None,
    requester_role: str | None = None,
) -> dict:
    code = _safe_code(document_code)
    filename = _safe_filename(source_filename)
    category = category.strip().lower()
    if category not in ALLOWED_CATEGORIES:
        raise ValueError("Categoria documental CDE no soportada.")
    if not title.strip() or len(title.strip()) > 500:
        raise ValueError("Titulo documental CDE invalido.")
    if not version_label.strip() or len(version_label.strip()) > 100:
        raise ValueError("Etiqueta de version CDE invalida.")
    if not content:
        raise ValueError("El documento CDE esta vacio.")
    if len(content) > MAX_CDE_DOCUMENT_BYTES:
        raise ValueError("El documento CDE supera el limite de 100 MB.")

    checksum = hashlib.sha256(content).hexdigest()
    document = db.query(BimCdeDocument).filter(
        BimCdeDocument.empresa_id == company_id,
        BimCdeDocument.proyecto_id == project_id,
        BimCdeDocument.document_code == code,
    ).first()
    if document is not None:
        require_document_permission(db, document=document, user_id=user_id, role=requester_role, permission="revise")
    if document and document.status == "archived":
        raise ValueError("El documento CDE esta archivado.")
    if document is None:
        document = BimCdeDocument(
            empresa_id=company_id,
            proyecto_id=project_id,
            document_code=code,
            title=title.strip(),
            category=category,
            status="active",
            current_revision=0,
            created_by=user_id,
        )
        db.add(document)
        db.flush()

    current = _current_revision(db, document.id)
    if current and current.checksum_sha256 == checksum:
        raise ValueError("El contenido coincide con la revision CDE vigente.")

    revision_number = document.current_revision + 1
    root = Path(storage_root or settings.BIM_LOCAL_STORAGE_DIR).resolve()
    target_dir = root / str(company_id) / str(project_id) / "cde" / str(document.id)
    target_dir.mkdir(parents=True, exist_ok=True)
    suffix = Path(filename).suffix.lower() or ".bin"
    target_path = (target_dir / f"revision-{revision_number}{suffix}").resolve()
    if root not in target_path.parents:
        raise ValueError("Ruta de almacenamiento CDE invalida.")
    temporary = target_path.with_suffix(f"{target_path.suffix}.tmp")
    temporary.write_bytes(content)
    temporary.replace(target_path)

    try:
        if current:
            current.status = "superseded"
        revision = BimCdeDocumentRevision(
            document_id=document.id,
            empresa_id=company_id,
            proyecto_id=project_id,
            revision=revision_number,
            version_label=version_label.strip(),
            source_filename=filename,
            stored_path=str(target_path),
            media_type=(media_type or "application/octet-stream")[:150],
            file_size_bytes=len(content),
            checksum_sha256=checksum,
            notes=notes.strip() if notes and notes.strip() else None,
            status="current",
            created_by=user_id,
        )
        document.title = title.strip()
        document.category = category
        document.current_revision = revision_number
        db.add(revision)
        db.commit()
        db.refresh(document)
        return _serialize_document(db, document)
    except Exception:
        db.rollback()
        target_path.unlink(missing_ok=True)
        raise


def list_documents(db: Session, *, project_id: int, company_id: int, include_archived: bool = False, requester_id: int | None = None, requester_role: str | None = None) -> list[dict]:
    query = db.query(BimCdeDocument).filter(
        BimCdeDocument.proyecto_id == project_id,
        BimCdeDocument.empresa_id == company_id,
    )
    if not include_archived:
        query = query.filter(BimCdeDocument.status == "active")
    rows = query.order_by(BimCdeDocument.document_code.asc()).all()
    if requester_id is not None:
        rows = [item for item in rows if has_document_permission(db, document=item, user_id=requester_id, role=requester_role, permission="view")]
    return [_serialize_document(db, item) for item in rows]


def list_document_revisions(db: Session, *, document_id: int, project_id: int, company_id: int, requester_id: int | None = None, requester_role: str | None = None) -> list[dict]:
    document = _get_document(db, document_id=document_id, project_id=project_id, company_id=company_id)
    if requester_id is not None:
        require_document_permission(db, document=document, user_id=requester_id, role=requester_role, permission="view")
    rows = db.query(BimCdeDocumentRevision).filter(
        BimCdeDocumentRevision.document_id == document.id,
        BimCdeDocumentRevision.proyecto_id == project_id,
        BimCdeDocumentRevision.empresa_id == company_id,
    ).order_by(BimCdeDocumentRevision.revision.desc()).all()
    return [_serialize_revision(item) for item in rows]


def get_revision_file(db: Session, *, revision_id: int, project_id: int, company_id: int, storage_root: Path | None = None, requester_id: int | None = None, requester_role: str | None = None) -> tuple[BimCdeDocumentRevision, Path]:
    revision = db.query(BimCdeDocumentRevision).filter(
        BimCdeDocumentRevision.id == revision_id,
        BimCdeDocumentRevision.proyecto_id == project_id,
        BimCdeDocumentRevision.empresa_id == company_id,
    ).first()
    if revision is None:
        raise HTTPException(status_code=404, detail="Revision CDE BIM no encontrada.")
    if requester_id is not None:
        document = _get_document(db, document_id=revision.document_id, project_id=project_id, company_id=company_id)
        require_document_permission(db, document=document, user_id=requester_id, role=requester_role, permission="download")
    root = Path(storage_root or settings.BIM_LOCAL_STORAGE_DIR).resolve()
    path = Path(revision.stored_path).resolve()
    if root not in path.parents or not path.is_file():
        raise HTTPException(status_code=409, detail="Archivo CDE BIM no disponible.")
    if hashlib.sha256(path.read_bytes()).hexdigest() != revision.checksum_sha256:
        raise HTTPException(status_code=409, detail="El archivo CDE BIM no supera integridad SHA-256.")
    return revision, path


def archive_document(db: Session, *, document_id: int, project_id: int, company_id: int, requester_id: int | None = None, requester_role: str | None = None) -> dict:
    document = _get_document(db, document_id=document_id, project_id=project_id, company_id=company_id)
    if requester_id is not None:
        require_document_permission(db, document=document, user_id=requester_id, role=requester_role, permission="manage")
    document.status = "archived"
    db.commit()
    db.refresh(document)
    return _serialize_document(db, document)
