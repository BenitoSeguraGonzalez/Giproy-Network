from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.models.bim_cde import BimCdeDocument
from app.models.bim_cde_acl import BimCdeDocumentAcl
from app.models.usuario import Usuario
from app.services.bim.role_policy import is_bim_company_operator


PERMISSION_COLUMNS = {"view": "can_view", "download": "can_download", "revise": "can_revise", "manage": "can_manage"}


def get_acl_document(db: Session, *, document_id: int, project_id: int, company_id: int) -> BimCdeDocument:
    document = db.query(BimCdeDocument).filter(BimCdeDocument.id == document_id, BimCdeDocument.proyecto_id == project_id, BimCdeDocument.empresa_id == company_id).first()
    if document is None:
        raise HTTPException(status_code=404, detail="Documento CDE BIM no encontrado.")
    return document


def has_document_permission(db: Session, *, document: BimCdeDocument, user_id: int, role: str | None, permission: str) -> bool:
    if permission not in PERMISSION_COLUMNS:
        raise ValueError("Permiso documental BIM invalido.")
    if is_bim_company_operator(role) or document.created_by == user_id:
        return True
    acl_count = db.query(BimCdeDocumentAcl).filter(BimCdeDocumentAcl.document_id == document.id).count()
    if acl_count == 0:
        return True
    grant = db.query(BimCdeDocumentAcl).filter(BimCdeDocumentAcl.document_id == document.id, BimCdeDocumentAcl.usuario_id == user_id, BimCdeDocumentAcl.active.is_(True)).first()
    return bool(grant and (grant.can_manage or getattr(grant, PERMISSION_COLUMNS[permission])))


def require_document_permission(db: Session, *, document: BimCdeDocument, user_id: int, role: str | None, permission: str) -> None:
    if not has_document_permission(db, document=document, user_id=user_id, role=role, permission=permission):
        raise HTTPException(status_code=403, detail=f"Permiso CDE requerido: {permission}.")


def _require_acl_manager(db: Session, *, document: BimCdeDocument, user_id: int, role: str | None) -> None:
    if is_bim_company_operator(role) or document.created_by == user_id:
        return
    grant = db.query(BimCdeDocumentAcl).filter(BimCdeDocumentAcl.document_id == document.id, BimCdeDocumentAcl.usuario_id == user_id, BimCdeDocumentAcl.active.is_(True), BimCdeDocumentAcl.can_manage.is_(True)).first()
    if grant is None:
        raise HTTPException(status_code=403, detail="Permiso CDE requerido: manage ACL.")


def _serialize(grant: BimCdeDocumentAcl, user: Usuario) -> dict:
    return {"id": grant.id, "document_id": grant.document_id, "user_id": grant.usuario_id, "user_name": user.nombre_completo or user.email, "user_email": user.email, "can_view": grant.can_view, "can_download": grant.can_download, "can_revise": grant.can_revise, "can_manage": grant.can_manage, "active": grant.active, "granted_by": grant.granted_by, "created_at": grant.created_at, "updated_at": grant.updated_at}


def list_document_acl(db: Session, *, document_id: int, project_id: int, company_id: int, requester_id: int, requester_role: str | None) -> list[dict]:
    document = get_acl_document(db, document_id=document_id, project_id=project_id, company_id=company_id)
    _require_acl_manager(db, document=document, user_id=requester_id, role=requester_role)
    rows = db.query(BimCdeDocumentAcl, Usuario).join(Usuario, Usuario.id == BimCdeDocumentAcl.usuario_id).filter(BimCdeDocumentAcl.document_id == document.id, BimCdeDocumentAcl.empresa_id == company_id, BimCdeDocumentAcl.proyecto_id == project_id).order_by(Usuario.nombre_completo.asc(), Usuario.id.asc()).all()
    return [_serialize(grant, user) for grant, user in rows]


def save_document_acl(db: Session, *, document_id: int, project_id: int, company_id: int, requester_id: int, requester_role: str | None, payload) -> dict:
    document = get_acl_document(db, document_id=document_id, project_id=project_id, company_id=company_id)
    _require_acl_manager(db, document=document, user_id=requester_id, role=requester_role)
    user = db.query(Usuario).filter(Usuario.id == payload.user_id, Usuario.empresa_id == company_id).first()
    if user is None:
        raise HTTPException(status_code=404, detail="Usuario ACL fuera de la empresa activa.")
    grant = db.query(BimCdeDocumentAcl).filter(BimCdeDocumentAcl.document_id == document.id, BimCdeDocumentAcl.usuario_id == user.id).first()
    if grant is None:
        grant = BimCdeDocumentAcl(document_id=document.id, empresa_id=company_id, proyecto_id=project_id, usuario_id=user.id, granted_by=requester_id)
        db.add(grant)
    grant.can_manage = payload.can_manage
    grant.can_revise = payload.can_revise or payload.can_manage
    grant.can_download = payload.can_download or grant.can_revise
    grant.can_view = payload.can_view or grant.can_download
    grant.active = payload.active
    grant.granted_by = requester_id
    db.commit(); db.refresh(grant)
    return _serialize(grant, user)
