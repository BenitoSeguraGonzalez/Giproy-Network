from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.models.bim_4d import Bim4dActivitySnapshot
from app.models.bim_element import BimElement
from app.models.bim_model import BimModel
from app.models.bim_model_version import BimModelVersion
from app.models.presupuesto import Presupuesto, PresupuestoDetalle


def search_project_bim_context(
    db: Session, *, project_id: int, company_id: int, term: str,
    capabilities: set[str] | frozenset[str], limit: int = 12,
) -> dict:
    """Search only server-authorized project domains; never rely on client filtering."""
    normalized = term.strip()
    if len(normalized) < 2:
        return {"query": normalized, "items": [], "truncated": False}
    pattern = f"%{normalized}%"
    items: list[dict] = []

    if "bim.view" in capabilities:
        elements = (
            db.query(BimElement, BimModelVersion, BimModel)
            .join(BimModelVersion, BimModelVersion.id == BimElement.bim_model_version_id)
            .join(BimModel, BimModel.id == BimModelVersion.bim_model_id)
            .filter(
                BimModel.proyecto_id == project_id, BimModel.empresa_id == company_id,
                or_(BimElement.global_id.ilike(pattern), BimElement.nombre.ilike(pattern), BimElement.ifc_class.ilike(pattern)),
            ).limit(limit).all()
        )
        items.extend({
            "id": f"element-{element.id}", "entity_id": element.id, "kind": "element", "type": "Elemento",
            "label": element.nombre or element.global_id,
            "meta": f"{element.ifc_class or 'Sin clase'} · {element.global_id} · {version.version_label}",
            "workspace": "model", "global_id": element.global_id, "version_id": version.id,
        } for element, version, _ in elements)

    if "schedule.view" in capabilities or "bim.schedule.view" in capabilities:
        activities = db.query(Bim4dActivitySnapshot).filter(
            Bim4dActivitySnapshot.proyecto_id == project_id,
            Bim4dActivitySnapshot.empresa_id == company_id,
            or_(Bim4dActivitySnapshot.activity_code.ilike(pattern), Bim4dActivitySnapshot.activity_name.ilike(pattern), Bim4dActivitySnapshot.source_ref.ilike(pattern)),
        ).limit(limit).all()
        items.extend({
            "id": f"activity-{item.id}", "entity_id": item.id, "kind": "activity", "type": "Actividad",
            "label": f"{item.activity_code} · {item.activity_name}",
            "meta": f"{item.source_ref} · revisión {item.snapshot_revision}", "workspace": "planning-costs",
            "budget_line_id": item.budget_line_id,
        } for item in activities)

    if "budget.view" in capabilities:
        lines = (
            db.query(PresupuestoDetalle, Presupuesto)
            .join(Presupuesto, Presupuesto.id == PresupuestoDetalle.presupuesto_id)
            .filter(
                Presupuesto.proyecto_id == project_id, Presupuesto.empresa_id == company_id,
                or_(PresupuestoDetalle.codigo_item.ilike(pattern), PresupuestoDetalle.descripcion.ilike(pattern), PresupuestoDetalle.omniclass_codigo.ilike(pattern)),
            ).limit(limit).all()
        )
        items.extend({
            "id": f"budget-line-{line.id}", "entity_id": line.id, "kind": "budget_line", "type": "Partida",
            "label": f"{line.codigo_item or 'Sin código'} · {line.descripcion}",
            "meta": f"{line.unidad or 'Sin unidad'} · presupuesto R{budget.revision or 0}",
            "workspace": "planning-costs", "budget_id": budget.id,
        } for line, budget in lines)

    ordered = sorted(items, key=lambda item: (item["type"], item["label"].casefold(), item["id"]))
    return {"query": normalized, "items": ordered[:limit], "truncated": len(ordered) > limit}
