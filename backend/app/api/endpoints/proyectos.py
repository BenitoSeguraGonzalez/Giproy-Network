from typing import Any, List, Optional
import hashlib
import json
from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException, status, Query, Request
from pydantic import BaseModel
from sqlalchemy.orm import Session
from starlette.concurrency import run_in_threadpool

from app.api import deps
from app.schemas.proyecto import ProyectoCreate, ProyectoUpdate, ProyectoResponse
from app.schemas.usuario import UsuarioResponse
from app.services.proyecto import proyecto_service
from app.services.marketplace_asset_origin import marketplace_asset_origin_service
from app.services.project_marketplace_exporter import project_marketplace_exporter
from app.services.public_procurement_project_import_access import validate_public_procurement_project_importer_access
from app.services.public_procurement_project_materializer import public_procurement_project_materializer
from app.services.public_procurement_technical_analysis import public_procurement_technical_analysis_service
from app.models.usuario import Usuario
from app.models.proyecto_asignacion import ProyectoAsignacion
from app.models.proyecto import Proyecto
from app.models.system_audit_event import SystemAuditEvent
from app.schemas.project_capability import (
    ProjectCapabilityCatalogResponse,
    ProjectCapabilityGrantRequest,
    ProjectCapabilityResponse,
)
from app.services.audit_event import record_audit_event
from app.services.project_capability import (
    PROFILE_CAPABILITIES,
    PROJECT_ACTION_CAPABILITIES,
    PROJECT_CAPABILITIES,
    require_project_capability,
    resolve_project_capabilities,
    save_project_capability_grant,
)

router = APIRouter()


def _record_project_event(db, *, project: Proyecto, actor: Usuario, event_type: str, message: str, entity_type: str = "project", entity_id=None, operation_status: str = "applied", payload: dict | None = None):
    return record_audit_event(
        db, module="proyecto", event_type=event_type, message=message,
        actor=actor, empresa_id=project.empresa_id, proyecto_id=project.id,
        proyecto_codigo_root=project.codigo_root, proyecto_revision=project.revision,
        entity_type=entity_type, entity_id=entity_id if entity_id is not None else project.id,
        operation_status=operation_status, payload=payload or {},
    )


class PublicProcurementProjectMaterializeRequest(BaseModel):
    import_analysis: dict
    project_name: str | None = None
    superadmin_incident_consent: bool = False


class ProjectMarketplaceExportRequest(BaseModel):
    project_id: int
    product_type: Optional[str] = None
    titulo: Optional[str] = None
    resumen: Optional[str] = None
    descripcion: Optional[str] = None
    incluye: Optional[str] = None
    no_incluye: Optional[str] = None
    etiquetas: Optional[list[str]] = None
    product_meta: Optional[dict] = None
    portal_meta: Optional[dict] = None


@router.post("/public-procurement-import/preview")
async def preview_public_procurement_project_import(
    request: Request,
    current_user: Usuario = Depends(deps.get_current_active_user),
) -> Any:
    validate_public_procurement_project_importer_access(current_user)

    form = await request.form()

    def form_text(name: str) -> str | None:
        value = form.get(name)
        if value is None or hasattr(value, "read"):
            return None
        return str(value)

    source_roles_json = form_text("source_roles_json")
    existing_analysis_json = form_text("existing_analysis_json")

    uploaded_files: list[tuple[str, bytes]] = []
    seen_uploads: set[tuple[str, str]] = set()
    requested_files = [
        uploaded
        for uploaded in [*form.getlist("files"), *form.getlist("file")]
        if hasattr(uploaded, "read")
    ]
    for uploaded in requested_files:
        filename = Path(uploaded.filename or "compra_publica_fuente").name
        content = await uploaded.read()
        if not content:
            continue
        fingerprint = hashlib.sha1(content).hexdigest()
        dedupe_key = (filename, fingerprint)
        if dedupe_key in seen_uploads:
            continue
        seen_uploads.add(dedupe_key)
        uploaded_files.append((filename, content))

    if not uploaded_files:
        raise HTTPException(status_code=400, detail="Debes subir al menos un archivo valido para analizar la compra publica.")

    source_role_hints: dict[str, str] = {}
    if source_roles_json:
        try:
            parsed = json.loads(source_roles_json)
            if isinstance(parsed, dict):
                source_role_hints = {
                    str(key): str(value)
                    for key, value in parsed.items()
                    if str(value).strip()
                }
        except Exception as exc:
            raise HTTPException(status_code=400, detail="No se pudieron interpretar los roles manuales de archivos.") from exc

    existing_analysis = None
    if existing_analysis_json:
        try:
            parsed_existing = json.loads(existing_analysis_json)
            if isinstance(parsed_existing, dict):
                existing_analysis = parsed_existing
        except Exception as exc:
            raise HTTPException(status_code=400, detail="No se pudo interpretar el bundle existente para reimportacion incremental.") from exc

    analysis = await run_in_threadpool(
        public_procurement_technical_analysis_service.analyze_uploads,
        uploaded_files,
        source_role_hints,
        existing_analysis,
        include_parser_contract=True,
    )
    return {
        "import_source_kind": "proyecto_import_preview",
        "import_source_reference": analysis.get("source_filename"),
        "import_analysis": analysis,
    }


@router.post("/public-procurement-import/materialize", status_code=status.HTTP_201_CREATED)
def materialize_public_procurement_project_import(
    payload: PublicProcurementProjectMaterializeRequest,
    db: Session = Depends(deps.get_db),
    current_user: Usuario = Depends(deps.get_current_active_user),
) -> Any:
    validate_public_procurement_project_importer_access(current_user)

    target_empresa_id = getattr(current_user, "empresa_id", None) or getattr(getattr(current_user, "empresa", None), "id", None)
    if not target_empresa_id:
        raise HTTPException(status_code=400, detail="No se pudo resolver la empresa activa para materializar la compra publica.")

    try:
        result = public_procurement_project_materializer.materialize(
            db,
            analysis=payload.import_analysis,
            empresa_id=int(target_empresa_id),
            project_name=payload.project_name,
            current_user_id=getattr(current_user, "id", None),
            superadmin_incident_consent=payload.superadmin_incident_consent,
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"No se pudo materializar la compra publica: {exc}") from exc

    return {
        "import_source_kind": "proyecto_import_materialized",
        "materialization": result,
    }


@router.post("/marketplace-export", status_code=status.HTTP_201_CREATED)
def export_project_to_marketplace(
    payload: ProjectMarketplaceExportRequest,
    db: Session = Depends(deps.get_db),
    current_user: Usuario = Depends(deps.get_current_active_user),
    empresa_id: Optional[int] = Query(None),
) -> Any:
    target_empresa_id = empresa_id or current_user.empresa_id
    if not target_empresa_id:
        raise HTTPException(status_code=400, detail="No se pudo resolver la empresa activa para exportar el proyecto.")

    return project_marketplace_exporter.export_project(
        db,
        project_id=payload.project_id,
        empresa_id=int(target_empresa_id),
        current_user=current_user,
        requested_product_type=payload.product_type,
        overrides={
            "titulo": payload.titulo,
            "resumen": payload.resumen,
            "descripcion": payload.descripcion,
            "incluye": payload.incluye,
            "no_incluye": payload.no_incluye,
            "etiquetas": payload.etiquetas,
            "product_meta": payload.product_meta,
            "portal_meta": payload.portal_meta,
        },
    )


@router.post("/marketplace-export/preview")
def preview_project_marketplace_export(
    payload: ProjectMarketplaceExportRequest,
    db: Session = Depends(deps.get_db),
    current_user: Usuario = Depends(deps.get_current_active_user),
    empresa_id: Optional[int] = Query(None),
) -> Any:
    target_empresa_id = empresa_id or current_user.empresa_id
    if not target_empresa_id:
        raise HTTPException(status_code=400, detail="No se pudo resolver la empresa activa para exportar el proyecto.")

    return project_marketplace_exporter.preview_project_export(
        db,
        project_id=payload.project_id,
        empresa_id=int(target_empresa_id),
        current_user=current_user,
        requested_product_type=payload.product_type,
    )


@router.get("/marketplace-export/statuses")
def read_project_marketplace_export_statuses(
    db: Session = Depends(deps.get_db),
    current_user: Usuario = Depends(deps.get_current_active_user),
    empresa_id: Optional[int] = Query(None),
) -> Any:
    target_empresa_id = empresa_id or current_user.empresa_id
    if not target_empresa_id:
        raise HTTPException(status_code=400, detail="No se pudo resolver la empresa activa para consultar Marketplace.")

    return project_marketplace_exporter.list_project_export_statuses(
        db,
        empresa_id=int(target_empresa_id),
        current_user=current_user,
    )


@router.get("/", response_model=List[ProyectoResponse])
def read_proyectos(
    db: Session = Depends(deps.get_db),
    skip: int = 0,
    limit: int = 100,
    current_user: Usuario = Depends(deps.get_current_active_user),
    empresa_id: Optional[int] = Query(None),
    solo_raices: bool = Query(True)
) -> Any:
    """
    Recupera los proyectos. Superadmin puede filtrar por cualquier empresa_id.
    """
    target_empresa_id = current_user.empresa_id
    user_role = current_user.rol.lower() if current_user.rol else ""
    if user_role == "superadministrador" and empresa_id:
        target_empresa_id = empresa_id
        
    if solo_raices:
        proyectos = proyecto_service.get_projects_roots(db=db, current_user=current_user, empresa_id=target_empresa_id, skip=skip, limit=limit)
    else:
        # Simplificando, también filtramos por asignación si es colaborador
        from app.repositories.proyecto import proyecto_repo
        query = db.query(Proyecto).filter(Proyecto.empresa_id == target_empresa_id)
        if user_role == "usuario":
            query = query.join(ProyectoAsignacion).filter(ProyectoAsignacion.usuario_id == current_user.id)
        proyectos = query.offset(skip).limit(limit).all()
    return proyectos

@router.post("/", response_model=ProyectoResponse, status_code=status.HTTP_201_CREATED)
def create_proyecto(
    *,
    db: Session = Depends(deps.get_db),
    proyecto_in: ProyectoCreate,
    current_user: Usuario = Depends(deps.get_current_active_user),
    empresa_id: Optional[int] = Query(None)
) -> Any:
    """
    Crea un nuevo proyecto asociado a la empresa del usuario. Superadmin puede especificar empresa_id.
    """
    user_role = current_user.rol.lower() if current_user.rol else ""
    if user_role not in ["administrador", "superadministrador"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Solo los administradores pueden crear proyectos."
        )

    target_empresa_id = current_user.empresa_id
    if user_role == "superadministrador" and empresa_id:
        target_empresa_id = empresa_id

    try:
        proyecto = proyecto_service.create_proyecto(db=db, obj_in=proyecto_in, empresa_id=target_empresa_id)
        _record_project_event(db, project=proyecto, actor=current_user, event_type="project_created", message="Proyecto creado.", payload={"nombre": proyecto.nombre, "revision": proyecto.revision})
        return proyecto
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Error inesperado: {str(e)}")


@router.get("/papelera", response_model=List[ProyectoResponse])
def list_recycled_projects(
    db: Session = Depends(deps.get_db),
    skip: int = 0,
    limit: int = 100,
    current_user: Usuario = Depends(deps.get_current_active_user),
    empresa_id: Optional[int] = Query(None),
) -> Any:
    normalized_role = (current_user.rol or "").strip().lower()
    if normalized_role not in ["administrador", "superadministrador"]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="No tiene permisos para consultar la papelera de proyectos.")
    target_empresa_id = current_user.empresa_id
    if normalized_role == "superadministrador" and empresa_id:
        target_empresa_id = empresa_id
    elif empresa_id and empresa_id != current_user.empresa_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="No tiene permisos para consultar proyectos de otra empresa.")
    return proyecto_service.list_recycled_projects(db=db, empresa_id=target_empresa_id, skip=skip, limit=limit)


@router.post("/papelera/purge-expired", response_model=dict)
def purge_expired_recycled_projects(
    db: Session = Depends(deps.get_db),
    current_user: Usuario = Depends(deps.get_current_active_user),
    empresa_id: Optional[int] = Query(None),
) -> Any:
    normalized_role = (current_user.rol or "").strip().lower()
    if normalized_role not in ["administrador", "superadministrador"]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="No tiene permisos para purgar la papelera de proyectos.")
    target_empresa_id = current_user.empresa_id
    if normalized_role == "superadministrador" and empresa_id:
        target_empresa_id = empresa_id
    elif empresa_id and empresa_id != current_user.empresa_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="No tiene permisos para purgar proyectos de otra empresa.")
    purged = proyecto_service.purge_expired_recycled_projects(db=db, empresa_id=target_empresa_id)
    return {"purged": purged}


@router.post("/papelera/{id}/restore", response_model=ProyectoResponse)
def restore_recycled_project(
    *,
    db: Session = Depends(deps.get_db),
    id: int,
    current_user: Usuario = Depends(deps.get_current_active_user),
    empresa_id: Optional[int] = Query(None),
) -> Any:
    normalized_role = (current_user.rol or "").strip().lower()
    if normalized_role not in ["administrador", "superadministrador"]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="No tiene permisos para restaurar proyectos.")
    target_empresa_id = current_user.empresa_id
    if normalized_role == "superadministrador" and empresa_id:
        target_empresa_id = empresa_id
    elif empresa_id and empresa_id != current_user.empresa_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="No tiene permisos para restaurar proyectos de otra empresa.")
    try:
        restored = proyecto_service.restore_full_project(db=db, proyecto_id=id, empresa_id=target_empresa_id, current_user=current_user)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(exc)) from exc
    if not restored:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Proyecto no encontrado en papelera.")
    _record_project_event(db, project=restored, actor=current_user, event_type="project_restored", message="Proyecto restaurado desde la papelera.")
    return restored


@router.delete("/papelera/{id}/purge", status_code=status.HTTP_204_NO_CONTENT)
def purge_recycled_project(
    *,
    db: Session = Depends(deps.get_db),
    id: int,
    current_user: Usuario = Depends(deps.get_current_active_user),
    empresa_id: Optional[int] = Query(None),
) -> None:
    normalized_role = (current_user.rol or "").strip().lower()
    if normalized_role not in ["administrador", "superadministrador"]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="No tiene permisos para purgar proyectos.")
    target_empresa_id = current_user.empresa_id
    if normalized_role == "superadministrador" and empresa_id:
        target_empresa_id = empresa_id
    elif empresa_id and empresa_id != current_user.empresa_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="No tiene permisos para purgar proyectos de otra empresa.")
    target = db.query(Proyecto).filter(Proyecto.id == id, Proyecto.empresa_id == target_empresa_id).first()
    target_snapshot = {"id": target.id, "codigo_root": target.codigo_root, "revision": target.revision} if target else None
    success = proyecto_service.purge_recycled_project(db=db, proyecto_id=id, empresa_id=target_empresa_id, current_user=current_user)
    if not success:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Proyecto no encontrado en papelera.")
    if target_snapshot:
        record_audit_event(db, module="proyecto", event_type="project_purged", message="Proyecto eliminado definitivamente de la papelera.", actor=current_user, empresa_id=target_empresa_id, proyecto_codigo_root=target_snapshot["codigo_root"], proyecto_revision=target_snapshot["revision"], entity_type="project", entity_id=target_snapshot["id"], operation_status="purged", payload={"deleted_project_id": target_snapshot["id"]})
    return


@router.get("/{codigo_root}/revisiones", response_model=List[ProyectoResponse])
def get_revisions(
    *,
    db: Session = Depends(deps.get_db),
    codigo_root: str,
    current_user: Usuario = Depends(deps.get_current_active_user),
    empresa_id: Optional[int] = Query(None)
) -> Any:
    """
    Recupera todas las revisiones dado un codigo_root.
    """
    target_empresa_id = current_user.empresa_id
    user_role = current_user.rol.lower() if current_user.rol else ""
    if user_role == "superadministrador" and empresa_id:
        target_empresa_id = empresa_id

    from app.repositories.proyecto import proyecto_repo
    # Si es Superadmin y no se especificó empresa_id, intentamos buscar primero en su contexto,
    # pero si no hay resultados, buscamos en todo el sistema.
    revisions = proyecto_repo.get_revisions_by_codigo_root(db=db, codigo_root=codigo_root, empresa_id=target_empresa_id)
    
    if not revisions and user_role == "superadministrador" and not empresa_id:
        # Búsqueda global para Superadmin
        from app.models.proyecto import Proyecto
        revisions = db.query(Proyecto).filter(
            Proyecto.codigo_root == codigo_root,
            Proyecto.deleted_at.is_(None),
        ).order_by(Proyecto.revision.asc()).all()

    if not revisions:
        raise HTTPException(status_code= status.HTTP_404_NOT_FOUND, detail="No se encontraron revisiones para este código raíz.")
    return revisions

@router.post("/{id}/revision", response_model=ProyectoResponse, status_code=status.HTTP_201_CREATED)
def create_revision(
    *,
    db: Session = Depends(deps.get_db),
    id: int,
    current_user: Usuario = Depends(deps.get_current_active_user),
    empresa_id: Optional[int] = Query(None)
) -> Any:
    """
    Genera una nueva revisión para el proyecto clonando sus datos básicos y presupuesto.
    """
    target_empresa_id = current_user.empresa_id
    if current_user.rol.lower() == "superadministrador" and empresa_id:
        target_empresa_id = empresa_id

    try:
        nuevo_proyecto = proyecto_service.create_revision(db=db, proyecto_id=id, empresa_id=target_empresa_id)
        if not nuevo_proyecto:
            raise HTTPException(status_code=404, detail="Proyecto original no encontrado.")
        _record_project_event(db, project=nuevo_proyecto, actor=current_user, event_type="project_revision_created", message="Revisión de proyecto creada.", payload={"source_project_id": id, "revision": nuevo_proyecto.revision})
        return nuevo_proyecto
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Error inesperado al crear revisión: {str(e)}")

@router.delete("/{id}/revision", status_code=status.HTTP_204_NO_CONTENT)
def delete_revision(
    *,
    db: Session = Depends(deps.get_db),
    id: int,
    current_user: Usuario = Depends(deps.get_current_active_user),
    empresa_id: Optional[int] = Query(None)
) -> None:
    """
    Elimina una revisión individual de un proyecto.
    La revisión base R000 no puede eliminarse.
    Solo accesible para Administradores y Superadministradores.
    """
    if current_user.rol.lower() not in ["administrador", "superadministrador"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tiene permisos para eliminar revisiones."
        )

    target_empresa_id = current_user.empresa_id
    if current_user.rol.lower() == "superadministrador" and empresa_id:
        target_empresa_id = empresa_id

    target = db.query(Proyecto).filter(Proyecto.id == id, Proyecto.empresa_id == target_empresa_id).first()
    target_snapshot = {"id": target.id, "codigo_root": target.codigo_root, "revision": target.revision} if target else None
    try:
        success = proyecto_service.delete_revision(db=db, proyecto_id=id, empresa_id=target_empresa_id)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"No se pudo eliminar la revisión: {str(exc)}"
        )

    if not success:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Revisión no encontrada.")

    if target_snapshot:
        record_audit_event(db, module="proyecto", event_type="project_revision_deleted", message="Revisión de proyecto eliminada.", actor=current_user, empresa_id=target_empresa_id, proyecto_codigo_root=target_snapshot["codigo_root"], proyecto_revision=target_snapshot["revision"], entity_type="project_revision", entity_id=target_snapshot["id"], operation_status="deleted", payload={"deleted_project_id": target_snapshot["id"]})

    return

@router.get("/{id}", response_model=ProyectoResponse)
def read_proyecto(
    *,
    db: Session = Depends(deps.get_db),
    id: int,
    current_user: Usuario = Depends(deps.get_current_active_user),
    empresa_id: Optional[int] = Query(None)
) -> Any:
    """
    Obtener un proyecto por ID. Revisa que pertenezca al Tenant correcto.
    """
    target_empresa_id = current_user.empresa_id
    if current_user.rol.lower() == "superadministrador" and empresa_id:
        target_empresa_id = empresa_id

    from app.repositories.proyecto import proyecto_repo
    proyecto = proyecto_repo.get_by_id(db=db, id=id, empresa_id=target_empresa_id)
    if not proyecto:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Proyecto no encontrado o acceso denegado.")
    marketplace_asset_origin_service.validate_company_ownership(
        db,
        empresa_id=target_empresa_id,
        entity_type="proyecto",
        entity_id=proyecto.id,
    )
    return proyecto

@router.put("/{id}", response_model=ProyectoResponse)
def update_proyecto(
    *,
    db: Session = Depends(deps.get_db),
    id: int,
    proyecto_in: ProyectoUpdate,
    current_user: Usuario = Depends(deps.get_current_active_user),
    empresa_id: Optional[int] = Query(None)
) -> Any:
    """
    Actualiza un proyecto. Revisa reglas de Multi-Tenancy (empresa_id).
    """
    target_empresa_id = current_user.empresa_id
    if current_user.rol.lower() == "superadministrador" and empresa_id:
        target_empresa_id = empresa_id

    proyecto = proyecto_service.update_proyecto(
        db=db,
        proyecto_id=id,
        obj_in=proyecto_in,
        empresa_id=target_empresa_id,
        user_id=current_user.id,
    )
    if not proyecto:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Proyecto no encontrado o acceso denegado.")
    _record_project_event(db, project=proyecto, actor=current_user, event_type="project_updated", message="Datos principales del proyecto actualizados.", payload={"changed_fields": sorted(proyecto_in.model_dump(exclude_unset=True).keys())})
    return proyecto

@router.get("/by-base/{base_id}", response_model=ProyectoResponse)
def read_proyecto_by_base(
    *,
    db: Session = Depends(deps.get_db),
    base_id: int,
    current_user: Usuario = Depends(deps.get_current_active_user),
    empresa_id: Optional[int] = Query(None)
) -> Any:
    """
    Obtener un proyecto buscando por su base_trabajo_id asociado.
    """
    target_empresa_id = current_user.empresa_id
    if current_user.rol.lower() == "superadministrador" and empresa_id:
        target_empresa_id = empresa_id

    from app.repositories.proyecto import proyecto_repo
    proyecto = proyecto_repo.get_by_base_id(db=db, base_id=base_id, empresa_id=target_empresa_id)
    if not proyecto:
        raise HTTPException(status_code=404, detail="Proyecto vinculado a esta base no encontrado.")
    marketplace_asset_origin_service.validate_company_ownership(
        db,
        empresa_id=target_empresa_id,
        entity_type="proyecto",
        entity_id=proyecto.id,
    )
    return proyecto

@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_proyecto(
    *,
    db: Session = Depends(deps.get_db),
    id: int,
    current_user: Usuario = Depends(deps.get_current_active_user),
    empresa_id: Optional[int] = Query(None),
    delete_project_base: bool = Query(True, description="Si es false, conserva la Base de Proyecto como Base Maestra reutilizable.")
) -> None:
    """
    Mueve un proyecto y todos sus datos relacionados a papelera durante 7 dias.
    Solo accesible para Administradores y Superadministradores.
    """
    normalized_role = (current_user.rol or "").strip().lower()
    if normalized_role not in ["administrador", "superadministrador"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tiene permisos para eliminar proyectos."
        )
    
    target_empresa_id = current_user.empresa_id
    if normalized_role == "superadministrador" and empresa_id:
        target_empresa_id = empresa_id
    elif empresa_id and empresa_id != current_user.empresa_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tiene permisos para eliminar proyectos de otra empresa."
        )

    target = db.query(Proyecto).filter(Proyecto.id == id, Proyecto.empresa_id == target_empresa_id).first()
    try:
        success = proyecto_service.soft_delete_full_project(
            db=db,
            proyecto_id=id,
            empresa_id=target_empresa_id,
            current_user=current_user,
            delete_project_base=delete_project_base,
        )
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"No se pudo eliminar el proyecto: {str(exc)}",
        ) from exc
    if not success:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Proyecto no encontrado.")
    if target:
        _record_project_event(db, project=target, actor=current_user, event_type="project_recycled", message="Proyecto movido a la papelera.", operation_status="recycled", payload={"delete_project_base": delete_project_base})
    return

@router.post("/{id}/assign", response_model=Any)
def assign_user(
    *,
    db: Session = Depends(deps.get_db),
    id: int,
    usuario_id: int,
    edt_id: Optional[int] = Query(None),
    modulo: str = Query("todos"),
    es_global: bool = Query(False),
    current_user: Usuario = Depends(deps.get_current_active_user)
) -> Any:
    """
    Asigna un usuario a un proyecto. Solo para Administradores.
    """
    if current_user.rol.lower() not in ["administrador", "superadministrador"]:
        raise HTTPException(status_code=403, detail="No tiene permisos para asignar personal.")
    
    project = _project_capability_scope(db, id, current_user)
    proyecto_service.assign_user(db, proyecto_id=id, usuario_id=usuario_id, asignado_por_id=current_user.id, edt_id=edt_id, modulo=modulo, es_global=es_global)
    _record_project_event(db, project=project, actor=current_user, event_type="project_user_assigned", message="Usuario asignado al proyecto.", entity_type="project_assignment", entity_id=usuario_id, payload={"target_user_id": usuario_id, "edt_id": edt_id, "module": modulo, "global": es_global})
    return {"status": "success"}

@router.delete("/{id}/assign/{usuario_id}", status_code=status.HTTP_204_NO_CONTENT)
def unassign_user(
    *,
    db: Session = Depends(deps.get_db),
    id: int,
    usuario_id: int,
    edt_id: Optional[int] = Query(None),
    modulo: str = Query("todos"),
    es_global: bool = Query(False),
    current_user: Usuario = Depends(deps.get_current_active_user)
) -> None:
    """
    Quita la asignación de un usuario a un proyecto. Solo para Administradores.
    """
    if current_user.rol.lower() not in ["administrador", "superadministrador"]:
        raise HTTPException(status_code=403, detail="No tiene permisos para desasignar personal.")
    
    project = _project_capability_scope(db, id, current_user)
    proyecto_service.unassign_user(db, proyecto_id=id, usuario_id=usuario_id, edt_id=edt_id, modulo=modulo, es_global=es_global)
    _record_project_event(db, project=project, actor=current_user, event_type="project_user_unassigned", message="Usuario retirado del proyecto.", entity_type="project_assignment", entity_id=usuario_id, operation_status="removed", payload={"target_user_id": usuario_id, "edt_id": edt_id, "module": modulo, "global": es_global})
    return

@router.get("/{id}/assigned-users", response_model=List[UsuarioResponse])
def get_assigned_users(
    *,
    db: Session = Depends(deps.get_db),
    id: int,
    edt_id: Optional[int] = Query(None),
    modulo: str = Query("todos"),
    current_user: Usuario = Depends(deps.get_current_active_user)
) -> Any:
    """
    Lista los usuarios asignados a un proyecto (filtrado por módulo).
    """
    users = proyecto_service.get_assigned_users(db, proyecto_id=id, edt_id=edt_id, modulo=modulo)
    return [UsuarioResponse.model_validate(u) for u in users]

@router.get("/{id}/permissions", response_model=Any)
def get_project_permissions(
    *,
    db: Session = Depends(deps.get_db),
    id: int,
    current_user: Usuario = Depends(deps.get_current_active_user)
) -> Any:
    """
    Obtiene los permisos y restricciones del usuario actual sobre el proyecto.
    """
    return proyecto_service.get_user_permissions(db, proyecto_id=id, usuario_id=current_user.id)


def _project_capability_scope(
    db: Session,
    project_id: int,
    current_user: Usuario,
    empresa_id: Optional[int] = None,
) -> Proyecto:
    resolved_company_id = current_user.empresa_id
    if (current_user.rol or "").lower() == "superadministrador" and empresa_id:
        resolved_company_id = empresa_id
    project = db.query(Proyecto).filter(
        Proyecto.id == project_id,
        Proyecto.empresa_id == resolved_company_id,
    ).first()
    if not project:
        raise HTTPException(status_code=404, detail="Proyecto fuera de la empresa activa.")
    return project


@router.get("/{id}/capabilities/catalog", response_model=ProjectCapabilityCatalogResponse)
def get_project_capability_catalog(
    id: int,
    empresa_id: Optional[int] = Query(None),
    db: Session = Depends(deps.get_db),
    current_user: Usuario = Depends(deps.get_current_active_user),
) -> Any:
    project = _project_capability_scope(db, id, current_user, empresa_id)
    require_project_capability(
        db,
        capability="project.manage",
        project_id=project.id,
        user_id=current_user.id,
        company_id=project.empresa_id,
        role=current_user.rol,
    )
    return {
        "capabilities": sorted(PROJECT_CAPABILITIES),
        "profiles": {key: sorted(value) for key, value in PROFILE_CAPABILITIES.items()},
        "actions": PROJECT_ACTION_CAPABILITIES,
    }


@router.get("/{id}/capabilities/me", response_model=ProjectCapabilityResponse)
def get_my_project_capabilities(
    id: int,
    edt_id: Optional[int] = Query(None),
    empresa_id: Optional[int] = Query(None),
    db: Session = Depends(deps.get_db),
    current_user: Usuario = Depends(deps.get_current_active_user),
) -> Any:
    project = _project_capability_scope(db, id, current_user, empresa_id)
    resolved = resolve_project_capabilities(
        db,
        project_id=project.id,
        user_id=current_user.id,
        company_id=project.empresa_id,
        role=current_user.rol,
        edt_id=edt_id,
    )
    return {
        "capabilities": sorted(resolved.capabilities),
        "edt_ids": list(resolved.edt_ids),
        "modules": list(resolved.modules),
        "source": resolved.source,
    }


@router.put("/{id}/capability-grants/{user_id}", response_model=ProjectCapabilityResponse)
def put_project_capability_grant(
    id: int,
    user_id: int,
    payload: ProjectCapabilityGrantRequest,
    empresa_id: Optional[int] = Query(None),
    db: Session = Depends(deps.get_db),
    current_user: Usuario = Depends(deps.get_current_active_user),
) -> Any:
    project = _project_capability_scope(db, id, current_user, empresa_id)
    require_project_capability(
        db,
        capability="project.manage",
        project_id=project.id,
        user_id=current_user.id,
        company_id=project.empresa_id,
        role=current_user.rol,
    )
    grant = save_project_capability_grant(
        db,
        project_id=project.id,
        company_id=project.empresa_id,
        user_id=user_id,
        capabilities=payload.capabilities,
        granted_by=current_user.id,
        edt_id=payload.edt_id,
        profile_code=payload.profile_code,
    )
    record_audit_event(
        db,
        module="proyecto",
        event_type="project_capabilities_updated",
        message="Capacidades funcionales del proyecto actualizadas.",
        actor=current_user,
        empresa_id=project.empresa_id,
        proyecto_id=project.id,
        proyecto_codigo_root=project.codigo_root,
        proyecto_revision=project.revision,
        capability="project.manage",
        entity_type="project_capability_grant",
        entity_id=grant.id,
        operation_status="applied",
        payload={
            "target_user_id": user_id,
            "edt_id": payload.edt_id,
            "profile_code": payload.profile_code,
            "capabilities": grant.capabilities_json,
        },
    )
    resolved = resolve_project_capabilities(
        db,
        project_id=project.id,
        user_id=user_id,
        company_id=project.empresa_id,
        role=(db.query(Usuario).filter(Usuario.id == user_id).first().rol),
        edt_id=payload.edt_id,
    )
    return {
        "capabilities": sorted(resolved.capabilities),
        "edt_ids": list(resolved.edt_ids),
        "modules": list(resolved.modules),
        "source": resolved.source,
    }


@router.get("/{id}/audit-events", response_model=Any)
def get_project_audit_events(
    id: int,
    empresa_id: Optional[int] = Query(None),
    module: Optional[str] = Query(None),
    correlation_id: Optional[str] = Query(None),
    limit: int = Query(100, ge=1, le=500),
    db: Session = Depends(deps.get_db),
    current_user: Usuario = Depends(deps.get_current_active_user),
) -> Any:
    project = _project_capability_scope(db, id, current_user, empresa_id)
    require_project_capability(
        db,
        capability="project.audit.view",
        project_id=project.id,
        user_id=current_user.id,
        company_id=project.empresa_id,
        role=current_user.rol,
    )
    query = db.query(SystemAuditEvent).filter(
        SystemAuditEvent.empresa_id == project.empresa_id,
        (SystemAuditEvent.proyecto_id == project.id)
        | (SystemAuditEvent.proyecto_codigo_root == project.codigo_root),
    )
    if module:
        query = query.filter(SystemAuditEvent.module == module)
    if correlation_id:
        query = query.filter(SystemAuditEvent.correlation_id == correlation_id)
    items = query.order_by(SystemAuditEvent.created_at.desc(), SystemAuditEvent.id.desc()).limit(limit).all()
    return {
        "items": [
            {
                "id": item.id,
                "module": item.module,
                "event_type": item.event_type,
                "severity": item.severity,
                "message": item.message,
                "actor_user_id": item.actor_user_id,
                "actor_role": item.actor_role,
                "capability": item.capability,
                "correlation_id": item.correlation_id,
                "operation_status": item.operation_status,
                "entity_type": item.entity_type,
                "entity_id": item.entity_id,
                "proyecto_revision": item.proyecto_revision,
                "detail": item.detail_json,
                "created_at": item.created_at,
            }
            for item in items
        ],
        "total": len(items),
    }

@router.get("/{id}/assignment-dashboard", response_model=List[Any])
def get_assignment_dashboard(
    *,
    db: Session = Depends(deps.get_db),
    id: int,
    modulo: str = Query("todos"),
    current_user: Usuario = Depends(deps.get_current_active_user)
) -> Any:
    """
    Resumen visual de asignaciones para el dashboard de equipo.
    """
    user_role = current_user.rol.lower() if current_user.rol else ""
    if user_role not in ["administrador", "superadministrador"]:
        raise HTTPException(status_code=403, detail="No tiene permisos para ver el dashboard de equipo.")
    
    return proyecto_service.get_assignment_dashboard(db, proyecto_id=id, modulo=modulo)
@router.get("/{id}/user-summary/{usuario_id}", response_model=Any)
def get_user_assignment_summary(
    *,
    db: Session = Depends(deps.get_db),
    id: int,
    usuario_id: int,
    current_user: Usuario = Depends(deps.get_current_active_user)
) -> Any:
    """
    Obtiene un resumen de las asignaciones de un usuario específico en un proyecto.
    """
    user_role = current_user.rol.lower() if current_user.rol else ""
    if user_role not in ["administrador", "superadministrador"]:
        raise HTTPException(status_code=403, detail="No tiene permisos para ver resúmenes de asignación.")
    
    return proyecto_service.get_user_assignment_summary(db, proyecto_id=id, usuario_id=usuario_id)
