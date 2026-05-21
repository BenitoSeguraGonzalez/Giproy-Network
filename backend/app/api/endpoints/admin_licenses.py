from datetime import date, timedelta
from fastapi import APIRouter, Depends, HTTPException, status, Body, Query
from sqlalchemy.orm import Session, joinedload

from app.api.deps import get_current_user
from app.core.database import get_db
from app.models.empresa import Empresa
from app.models.usuario import Usuario
from app.models.licencia import Licencia
from app.models.empresa_licencia import EmpresaLicencia
from app.models.empresa_uso import EmpresaUso
from app.models.license_event import LicenseEvent
from app.services.license import license_service
from app.schemas.license import LicenseAssignment

router = APIRouter()

def check_superadmin(current_user: Usuario = Depends(get_current_user)):
    if current_user.rol.lower() != "superadministrador":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Operación permitida solo para Superadministradores"
        )
    return current_user

@router.get("/me")
def read_current_company_license(
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
    empresa_id: int | None = Query(default=None),
):
    """Retorna la licencia y uso de la empresa del usuario actual."""
    target_empresa_id = current_user.empresa_id
    if current_user.rol.lower() == "superadministrador" and empresa_id:
        target_empresa_id = empresa_id

    if not target_empresa_id:
        raise HTTPException(status_code=404, detail="Usuario no pertenece a ninguna empresa")

    snapshot = license_service.get_company_license_snapshot(db, target_empresa_id)
    assignment = snapshot["current_assignment"]
    licencia = assignment.licencia if assignment else None
    next_assignment = snapshot["next_assignment"]
    uso = license_service.update_usage_metrics(db, target_empresa_id)
    empresa = db.query(Empresa).get(target_empresa_id)

    return {
        "licencia_actual": licencia.nombre if licencia else "Sin Licencia",
        "license_status": snapshot["license_status"],
        "access_mode": snapshot["access_mode"],
        "grace_days_remaining": snapshot["grace_days_remaining"],
        "next_license": {
            "nombre": next_assignment.licencia.nombre,
            "starts_at": next_assignment.starts_at,
            "ends_at": next_assignment.ends_at,
        } if next_assignment else None,
        "limites": {
            "usuarios": uso.max_usuarios,
            "proyectos": uso.max_proyectos,
            "almacenamiento_gb": uso.max_almacenamiento_bytes / (1024**3)
        },
        "usados": {
            "usuarios": uso.usuarios_count,
            "proyectos": uso.proyectos_count,
            "almacenamiento_gb": uso.almacenamiento_bytes / (1024**3)
        },
        "license_end_date": empresa.license_end_date,
        "license_banner_message": snapshot["banner_message"],
    }

@router.get("/summary")
def read_admin_license_summary(
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(check_superadmin),
):
    # Obtener todas las empresas con sus licencias y uso
    empresas = db.query(Empresa).options(
        joinedload(Empresa.usuarios)
    ).all()

    items = []
    totals = {
        "empresas": len(empresas),
        "activas": 0,
        "licencias_activas": 0,
        "usuarios_totales": 0,
        "usuarios_usados": 0,
        "alertas": 0
    }

    for empresa in empresas:
        snapshot = license_service.get_company_license_snapshot(db, empresa.id)
        assignment = snapshot["current_assignment"]
        licencia = assignment.licencia if assignment else None
        next_assignment = snapshot["next_assignment"]
        uso = db.query(EmpresaUso).filter(EmpresaUso.empresa_id == empresa.id).first()
        if not uso:
            uso = license_service.update_usage_metrics(db, empresa.id)

        is_active = empresa.activa
        license_status = snapshot["license_status"]
        
        item = {
            "empresa_id": empresa.id,
            "empresa_nombre": empresa.nombre,
            "activa": is_active,
            "license_status": license_status,
            "access_mode": snapshot["access_mode"],
            "licencia_actual": licencia.nombre if licencia else "Sin Licencia",
            "licencia_id": licencia.id if licencia else None,
            "next_license": {
                "nombre": next_assignment.licencia.nombre,
                "starts_at": next_assignment.starts_at,
                "ends_at": next_assignment.ends_at,
            } if next_assignment else None,
            "limites": {
                "administradores": uso.max_usuarios,
                "usuarios": uso.max_usuarios,
                "proyectos": uso.max_proyectos,
                "almacenamiento_gb": uso.max_almacenamiento_bytes / (1024**3)
            },
            "usados": {
                "administradores": uso.usuarios_count,
                "usuarios": uso.usuarios_count,
                "proyectos": uso.proyectos_count,
                "almacenamiento_gb": uso.almacenamiento_bytes / (1024**3)
            },
            "status": {
                "administradores": "ok" if uso.usuarios_count < uso.max_usuarios else "warning",
                "usuarios": "ok" if uso.usuarios_count < uso.max_usuarios else "warning"
            },
            "license_start_date": assignment.starts_at if assignment else empresa.license_start_date,
            "license_end_date": assignment.ends_at if assignment else empresa.license_end_date,
            "flags": license_service.get_company_special_flags(db, empresa.id) if licencia else {
                "is_tester": False,
                "is_academic": False,
                "is_training": False,
                "is_commercial": True,
                "reset_periodical": False,
            }
        }
        
        items.append(item)
        
        if is_active: totals["activas"] += 1
        if licencia: totals["licencias_activas"] += 1
        totals["usuarios_totales"] += uso.max_usuarios
        totals["usuarios_usados"] += uso.usuarios_count
        if item["status"]["administradores"] != "ok" or license_status == "expired":
            totals["alertas"] += 1

    return {
        "totals": totals,
        "items": items
    }

@router.get("/catalog")
def get_license_catalog(
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(check_superadmin)
):
    license_service.ensure_default_catalog(db)
    db.commit()
    return db.query(Licencia).filter(Licencia.activo == True).order_by(Licencia.sort_order.asc(), Licencia.nombre.asc()).all()


@router.get("/history/{empresa_id}")
def get_company_license_history(
    empresa_id: int,
    limit: int = Query(default=20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(check_superadmin),
):
    empresa = db.query(Empresa).filter(Empresa.id == empresa_id).first()
    if not empresa:
        raise HTTPException(status_code=404, detail="Empresa no encontrada.")

    events = (
        db.query(LicenseEvent)
        .options(
            joinedload(LicenseEvent.licencia),
            joinedload(LicenseEvent.actor_usuario),
            joinedload(LicenseEvent.empresa_licencia),
        )
        .filter(LicenseEvent.empresa_id == empresa_id)
        .order_by(LicenseEvent.occurred_at.desc(), LicenseEvent.id.desc())
        .limit(limit)
        .all()
    )

    return {
        "empresa_id": empresa.id,
        "empresa_nombre": empresa.nombre,
        "items": [
            {
                "id": event.id,
                "event_type": event.event_type,
                "notes": event.notes,
                "payload": event.payload or {},
                "occurred_at": event.occurred_at,
                "license_name": event.licencia.nombre if event.licencia else None,
                "actor_name": event.actor_usuario.nombre_completo if event.actor_usuario else None,
                "assignment_id": event.empresa_licencia_id,
            }
            for event in events
        ],
    }

@router.post("/assign")
def assign_license_to_company(
    assignment_data: LicenseAssignment,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(check_superadmin)
):
    nueva = license_service.assign_license_to_company(
        db,
        empresa_id=assignment_data.empresa_id,
        licencia_id=assignment_data.licencia_id,
        months=assignment_data.months,
        actor_usuario_id=current_user.id,
        start_on=assignment_data.start_on,
        notes=assignment_data.notes,
        force_immediate=assignment_data.force_immediate,
        source="manual_admin",
    )

    license_service.update_usage_metrics(db, assignment_data.empresa_id)

    return {
        "message": "Licencia asignada con éxito",
        "assignment_id": nueva.id,
        "status": nueva.status,
        "starts_at": nueva.starts_at,
        "ends_at": nueva.ends_at,
    }

@router.post("/recalculate/{empresa_id}")
def recalculate_usage(
    empresa_id: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(check_superadmin)
):
    return license_service.update_usage_metrics(db, empresa_id)


@router.post("/housekeeping/run")
def run_license_housekeeping(
    empresa_id: int | None = Body(default=None, embed=True),
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(check_superadmin),
):
    if empresa_id:
        empresa = db.query(Empresa).filter(Empresa.id == empresa_id).first()
        if not empresa:
            raise HTTPException(status_code=404, detail="Empresa no encontrada.")

        changed = license_service.run_license_housekeeping_for_company(db, empresa_id, commit=True)
        return {
            "scope": "company",
            "empresa_id": empresa.id,
            "empresa_nombre": empresa.nombre,
            "expired": changed.get("expired", 0),
            "activated": changed.get("activated", 0),
        }

    return {
        "scope": "all",
        **license_service.run_license_housekeeping_for_all_companies(db, commit=True),
    }


@router.post("/academy-cleanup/{empresa_id}")
def run_academy_cleanup(
    empresa_id: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(check_superadmin),
):
    return license_service.run_periodic_cleanup(db, empresa_id)
