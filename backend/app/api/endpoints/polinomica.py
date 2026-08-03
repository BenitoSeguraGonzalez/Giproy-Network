import logging
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List
from app.api import deps
from app.schemas.polinomica import FormulaPolinomicaResponse, IndiceINECResponse
from app.services.formula_polinomica import formula_polinomica_service
from app.models.presupuesto import Presupuesto
from app.services.audit_event import record_project_entity_event

router = APIRouter()
logger = logging.getLogger(__name__)

def _verify_module_access(db: Session, presupuesto_id: int, current_user):
    from app.services.proyecto import proyecto_service
    query = db.query(Presupuesto).filter(Presupuesto.id == presupuesto_id)
    if (current_user.rol or "").lower() != "superadministrador":
        query = query.filter(Presupuesto.empresa_id == current_user.empresa_id)
    pres = query.first()
    if not pres:
        raise HTTPException(status_code=404, detail="Presupuesto fuera de la empresa activa")
    
    perms = proyecto_service.get_user_permissions(db, pres.proyecto_id, current_user.id)
    if not perms["has_assignment"]:
        return pres
    if "todos" in perms["allowed_modules"] or "formula_polinomica" in perms["allowed_modules"]:
        return pres
    raise HTTPException(status_code=403, detail="Acceso denegado al módulo fórmula polinómica")

def _audit_formula(db, *, presupuesto: Presupuesto, actor, event_type: str, message: str, payload: dict | None = None):
    record_project_entity_event(db, project_id=presupuesto.proyecto_id, actor=actor, module="formula_polinomica", event_type=event_type, message=message, entity_type="formula_polinomica", entity_id=presupuesto.id, payload={"presupuesto_id": presupuesto.id, **(payload or {})})

@router.get("/{presupuesto_id}", response_model=FormulaPolinomicaResponse)
def get_formula(
    presupuesto_id: int,
    db: Session = Depends(deps.get_db),
    current_user = Depends(deps.get_current_active_user)
):
    """
    Obtiene la fórmula polinómica de un presupuesto.
    Si no existe, el frontend debería invocar la regeneración.
    """
    _verify_module_access(db, presupuesto_id, current_user)
    formula = formula_polinomica_service.get_formula(db, presupuesto_id=presupuesto_id)
    if not formula:
        raise HTTPException(status_code=404, detail="Fórmula no encontrada para este presupuesto")

    if not formula.monomios:
        formula = formula_polinomica_service.regenerate_formula(
            db,
            presupuesto_id=presupuesto_id,
            tipo=formula.tipo or "SIN_DESGLOSE",
        )

    return formula_polinomica_service.decorate_formula_view(db, presupuesto_id, formula)

@router.post("/{presupuesto_id}/regenerate", response_model=FormulaPolinomicaResponse)
def regenerate_formula(
    presupuesto_id: int,
    tipo: str = Query("SIN_DESGLOSE"),
    db: Session = Depends(deps.get_db),
    current_user = Depends(deps.get_current_active_user)
):
    """
    Calcula o recalcula los coeficientes de la fórmula basados en el presupuesto actual.
    """
    pres = _verify_module_access(db, presupuesto_id, current_user)
    logger.info(
        "regenerate_formula called with presupuesto_id=%s tipo=%s",
        presupuesto_id,
        tipo,
    )
    try:
        formula = formula_polinomica_service.regenerate_formula(db, presupuesto_id=presupuesto_id, tipo=tipo)
        _audit_formula(db, presupuesto=pres, actor=current_user, event_type="polynomial_formula_regenerated", message="Fórmula polinómica regenerada.", payload={"type": tipo})
        return formula
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al generar la fórmula: {e}")

@router.get("/indices-inec", response_model=List[IndiceINECResponse])
def get_indices_inec(
    db: Session = Depends(deps.get_db),
    current_user = Depends(deps.get_current_active_user)
):
    """
    Lista el catálogo de índices INEC.
    """
    from app.models.polinomica import IndiceINEC
    return db.query(IndiceINEC).all()

@router.patch("/{presupuesto_id}", response_model=FormulaPolinomicaResponse)
def update_formula(
    presupuesto_id: int,
    obj_in: dict,
    db: Session = Depends(deps.get_db),
    current_user = Depends(deps.get_current_active_user)
):
    """
    Actualiza la cabecera de la fórmula.
    """
    pres = _verify_module_access(db, presupuesto_id, current_user)
    formula = formula_polinomica_service.get_formula(db, presupuesto_id=presupuesto_id)
    if not formula:
        raise HTTPException(status_code=404, detail="Fórmula no encontrada")
    
    from app.repositories.formula_polinomica import formula_polinomica_repo
    updated = formula_polinomica_repo.update(db, db_obj=formula, obj_in=obj_in)
    _audit_formula(db, presupuesto=pres, actor=current_user, event_type="polynomial_formula_updated", message="Fórmula polinómica actualizada.", payload={"changed_fields": sorted(obj_in.keys())})
    return updated

@router.get("/{presupuesto_id}/resources")
def get_formula_resources(
    presupuesto_id: int, 
    db: Session = Depends(deps.get_db),
    current_user = Depends(deps.get_current_active_user)
):
    """
    Lista todos los recursos agregados en el presupuesto con su estado de asignación actual.
    """
    _verify_module_access(db, presupuesto_id, current_user)
    try:
        return formula_polinomica_service.get_formula_resources(db, presupuesto_id)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/{presupuesto_id}/assignments", response_model=FormulaPolinomicaResponse)
def save_assignments(
    presupuesto_id: int, 
    assignments: List[dict], 
    db: Session = Depends(deps.get_db),
    current_user = Depends(deps.get_current_active_user)
):
    """
    Guarda las asignaciones manuales de recursos a monomios.
    """
    pres = _verify_module_access(db, presupuesto_id, current_user)
    try:
        current_formula = formula_polinomica_service.get_formula(db, presupuesto_id=presupuesto_id)
        formula_type = current_formula.tipo if current_formula and current_formula.tipo else "SIN_DESGLOSE"
        formula_polinomica_service.save_assignments(db, presupuesto_id, assignments)
        formula = formula_polinomica_service.regenerate_formula(db, presupuesto_id, tipo=formula_type)
        _audit_formula(db, presupuesto=pres, actor=current_user, event_type="polynomial_formula_assignments_saved", message="Asignaciones de fórmula polinómica guardadas.", payload={"assignment_count": len(assignments)})
        return formula
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/{presupuesto_id}/indices", response_model=FormulaPolinomicaResponse)
def save_indices(
    presupuesto_id: int,
    payload: dict,
    db: Session = Depends(deps.get_db),
    current_user=Depends(deps.get_current_active_user),
):
    """
    Guarda las selecciones de índices para monomios y cuadrilla tipo.
    """
    pres = _verify_module_access(db, presupuesto_id, current_user)
    try:
        formula = formula_polinomica_service.save_indices(db, presupuesto_id, payload)
        _audit_formula(db, presupuesto=pres, actor=current_user, event_type="polynomial_formula_indices_saved", message="Índices de fórmula polinómica guardados.", payload={"selection_count": len(payload)})
        return formula_polinomica_service.decorate_formula_view(db, presupuesto_id, formula)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
