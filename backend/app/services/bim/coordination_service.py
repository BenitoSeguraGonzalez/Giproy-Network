from __future__ import annotations

from collections import defaultdict
from datetime import datetime, timezone
from decimal import Decimal
from uuid import uuid4
import re
import math

from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.models.apu import APU
from app.models.bim_4d import Bim4dActivitySnapshot, Bim4dBaseline
from app.models.bim_coordination import (
    BimClassificationResolution,
    CoordinationConflict,
    CoordinationLink,
    CoordinationProposal,
    ProjectCoordinationSet,
)
from app.models.bim_element import BimElement
from app.models.bim_model_version import BimModelVersion
from app.models.bim_model import BimModel
from app.models.bim_federation import BimFederation, BimFederationMember
from app.models.cronograma_trabajo import CronogramaTrabajo
from app.models.empresa import Empresa
from app.models.omniclass import OmniClassMaestro
from app.models.presupuesto import Presupuesto, PresupuestoDetalle
from app.models.proyecto import Proyecto


PROCESS_TRANSITIONS = {
    "draft": {"pending_review"},
    "pending_review": {"approved", "rejected"},
    "approved": {"applying"},
    "applying": {"applied", "failed_recovery_required"},
    "applied": {"recovering"},
    "failed_recovery_required": {"recovering"},
    "recovering": {"recovered", "failed_recovery_required"},
}

COVERAGE_TOLERANCE = Decimal("0.0001")
UNIT_ALIASES = {
    "m": "m", "meter": "m", "metre": "m", "metro": "m",
    "m2": "m2", "m²": "m2", "sqm": "m2",
    "m3": "m3", "m³": "m3", "cbm": "m3",
    "kg": "kg", "kilogram": "kg", "t": "t", "ton": "t",
    "ft": "ft", "foot": "ft", "ft2": "ft2", "ft²": "ft2", "sqft": "ft2",
    "ft3": "ft3", "ft³": "ft3", "cuft": "ft3", "ea": "ea", "u": "ea", "unit": "ea",
}
UNIT_DIMENSIONS = {
    "m": ("length", Decimal("1")), "ft": ("length", Decimal("0.3048")),
    "m2": ("area", Decimal("1")), "ft2": ("area", Decimal("0.09290304")),
    "m3": ("volume", Decimal("1")), "ft3": ("volume", Decimal("0.028316846592")),
    "kg": ("mass", Decimal("1")), "t": ("mass", Decimal("1000")),
    "ea": ("count", Decimal("1")),
}


def _normalized_unit(value: str | None) -> str | None:
    if value is None:
        return None
    normalized = UNIT_ALIASES.get(str(value).strip().lower())
    if not normalized:
        raise HTTPException(status_code=400, detail="Unidad de asignacion no admitida.")
    return normalized


def _link_identity(payload, resolved_global_id: str | None) -> tuple:
    return (
        payload.budget_line_id, payload.apu_id,
        payload.activity_ref or None, payload.activity_snapshot_id,
        payload.bim_element_id, resolved_global_id or None,
        payload.allocation_key,
    )


def _project(db: Session, *, project_id: int, company_id: int) -> Proyecto:
    item = db.query(Proyecto).filter(Proyecto.id == project_id, Proyecto.empresa_id == company_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Proyecto fuera de la empresa activa.")
    return item


def _coordination_set(db: Session, *, coordination_set_id: int, project_id: int, company_id: int) -> ProjectCoordinationSet:
    item = db.query(ProjectCoordinationSet).filter(
        ProjectCoordinationSet.id == coordination_set_id,
        ProjectCoordinationSet.proyecto_id == project_id,
        ProjectCoordinationSet.empresa_id == company_id,
    ).first()
    if not item:
        raise HTTPException(status_code=404, detail="Conjunto de coordinacion no encontrado.")
    return item


def serialize_set(item: ProjectCoordinationSet) -> dict:
    return {
        "id": item.id,
        "proyecto_id": item.proyecto_id,
        "proyecto_codigo_root": item.proyecto_codigo_root,
        "proyecto_revision": item.proyecto_revision,
        "revision": item.revision,
        "presupuesto_id": item.presupuesto_id,
        "presupuesto_revision": item.presupuesto_revision,
        "cronograma_trabajo_id": item.cronograma_trabajo_id,
        "baseline_id": item.baseline_id,
        "bim_version_ids": list(item.bim_version_ids_json or []),
        "process_status": item.process_status,
        "coordination_status": item.coordination_status,
        "omniclass_status": item.omniclass_status,
        "official": item.official,
        "active": item.active,
    }


def list_coordination_sets(db: Session, *, project_id: int, company_id: int) -> list[dict]:
    _project(db, project_id=project_id, company_id=company_id)
    rows = db.query(ProjectCoordinationSet).filter(
        ProjectCoordinationSet.proyecto_id == project_id,
        ProjectCoordinationSet.empresa_id == company_id,
    ).order_by(ProjectCoordinationSet.revision.desc()).all()
    return [serialize_set(item) for item in rows]


def create_coordination_set(db: Session, *, project_id: int, company_id: int, user_id: int, payload) -> dict:
    project = _project(db, project_id=project_id, company_id=company_id)
    budget = None
    if payload.presupuesto_id is not None:
        budget = db.query(Presupuesto).filter(Presupuesto.id == payload.presupuesto_id, Presupuesto.proyecto_id == project_id).first()
        if not budget:
            raise HTTPException(status_code=400, detail="Presupuesto fuera del proyecto coordinado.")
        if payload.presupuesto_revision is None or int(payload.presupuesto_revision) != int(budget.revision or 0):
            raise HTTPException(status_code=409, detail="La revision declarada no coincide con el presupuesto seleccionado.")
    if payload.cronograma_trabajo_id is not None:
        schedule = db.query(CronogramaTrabajo).filter(CronogramaTrabajo.id == payload.cronograma_trabajo_id, CronogramaTrabajo.proyecto_id == project_id).first()
        if not schedule:
            raise HTTPException(status_code=400, detail="Cronograma fuera del proyecto coordinado.")
        if budget is not None and schedule.presupuesto_id != budget.id:
            raise HTTPException(status_code=409, detail="El cronograma no corresponde al presupuesto fijado.")
    if payload.baseline_id is not None:
        baseline = db.query(Bim4dBaseline).filter(Bim4dBaseline.id == payload.baseline_id, Bim4dBaseline.proyecto_id == project_id).first()
        if not baseline:
            raise HTTPException(status_code=400, detail="Baseline fuera del proyecto coordinado.")
    version_ids = sorted({int(value) for value in payload.bim_version_ids})
    if version_ids:
        valid_count = db.query(BimModelVersion).join(BimModel, BimModel.id == BimModelVersion.bim_model_id).filter(
            BimModelVersion.id.in_(version_ids),
            BimModel.proyecto_id == project_id,
            BimModel.empresa_id == company_id,
        ).count()
        if valid_count != len(version_ids):
            raise HTTPException(status_code=400, detail="Una o mas versiones BIM no pertenecen al proyecto.")

    last = db.query(ProjectCoordinationSet).filter(
        ProjectCoordinationSet.proyecto_id == project_id,
        ProjectCoordinationSet.empresa_id == company_id,
    ).order_by(ProjectCoordinationSet.revision.desc()).first()
    company = db.query(Empresa).filter(Empresa.id == company_id).first()
    present_domains = sum(bool(value) for value in (payload.presupuesto_id, payload.cronograma_trabajo_id, version_ids))
    item = ProjectCoordinationSet(
        empresa_id=company_id,
        proyecto_id=project_id,
        proyecto_codigo_root=project.codigo_root or project.codigo,
        proyecto_revision=int(project.revision or 0),
        revision=(last.revision + 1) if last else 1,
        presupuesto_id=payload.presupuesto_id,
        presupuesto_revision=payload.presupuesto_revision,
        cronograma_trabajo_id=payload.cronograma_trabajo_id,
        baseline_id=payload.baseline_id,
        bim_version_ids_json=version_ids,
        process_status="draft",
        coordination_status="incomplete" if present_domains < 3 else "outdated",
        omniclass_status="unresolved" if company and company.use_omniclass and version_ids else "disabled",
        created_by=user_id,
    )
    db.add(item); db.commit(); db.refresh(item)
    return serialize_set(item)


def make_coordination_set_official(
    db: Session, *, coordination_set_id: int, project_id: int, company_id: int,
    user_id: int, expected_revision: int, reason: str,
) -> dict:
    item = _coordination_set(
        db, coordination_set_id=coordination_set_id,
        project_id=project_id, company_id=company_id,
    )
    if item.revision != expected_revision:
        raise HTTPException(status_code=409, detail="El conjunto cambio desde la ultima lectura.")
    project = _project(db, project_id=project_id, company_id=company_id)
    if int(project.revision or 0) != int(item.proyecto_revision or 0):
        raise HTTPException(status_code=409, detail="La revision del proyecto cambio; cree un nuevo conjunto coordinado.")
    if item.presupuesto_id is not None:
        budget = db.query(Presupuesto).filter(Presupuesto.id == item.presupuesto_id, Presupuesto.proyecto_id == project_id, Presupuesto.empresa_id == company_id).first()
        if not budget or int(budget.revision or 0) != int(item.presupuesto_revision or 0):
            raise HTTPException(status_code=409, detail="La revision del presupuesto cambio; cree un nuevo conjunto coordinado.")
    coverage = build_coverage(
        db, coordination_set_id=coordination_set_id,
        project_id=project_id, company_id=company_id,
    )
    if coverage["overallocated_count"] or coverage.get("unit_conflict_count"):
        raise HTTPException(
            status_code=409,
            detail="No puede oficializarse un conjunto con sobreasignacion o unidades dimensionalmente incompatibles.",
        )
    quantity_links = db.query(CoordinationLink).filter(
        CoordinationLink.coordination_set_id == item.id,
        CoordinationLink.status != "retired",
        CoordinationLink.allocation_type == "quantity",
    ).count()
    if quantity_links and item.bim_version_ids_json:
        federation = db.query(BimFederation).filter(
            BimFederation.proyecto_id == project_id,
            BimFederation.empresa_id == company_id,
            BimFederation.status == "active",
        ).order_by(BimFederation.revision.desc()).first()
        if not federation:
            raise HTTPException(status_code=409, detail="Las cantidades BIM requieren una federacion activa con unidades y escala verificadas.")
        members = db.query(BimFederationMember).filter(BimFederationMember.bim_federation_id == federation.id, BimFederationMember.enabled.is_(True)).all()
        member_versions = {member.bim_model_version_id for member in members}
        missing_versions = set(item.bim_version_ids_json or []) - member_versions
        invalid_measurement = False
        reference_origin = None; reference_crs = None
        for member in members:
            georef = member.georeference_json or {}; transform = member.transform_json or {}
            units = georef.get("units")
            scale = tuple(float(value) for value in (transform.get("scale") or (1, 1, 1)))
            if units not in {"m", "mm", "ft"} or max(scale) - min(scale) > 1e-9:
                invalid_measurement = True; break
            factor = {"m": 1.0, "mm": 0.001, "ft": 0.3048}[units]
            origin = georef.get("origin") or (0, 0, 0); translation = transform.get("translation") or (0, 0, 0)
            effective = tuple((float(origin[index]) + float(translation[index])) * factor for index in range(3))
            crs = str(georef.get("crs", "LOCAL")).casefold()
            if reference_origin is None: reference_origin, reference_crs = effective, crs
            elif crs != reference_crs or math.dist(reference_origin, effective) > 0.01: invalid_measurement = True; break
        if missing_versions or invalid_measurement or not members:
            raise HTTPException(status_code=409, detail="La federacion no permite medicion oficial: revise versiones, CRS, origen, unidades y escala uniforme.")
    ambiguous_links = db.query(CoordinationLink).filter(
        CoordinationLink.coordination_set_id == item.id,
        CoordinationLink.status != "retired",
        (
            (CoordinationLink.activity_ref.isnot(None) & CoordinationLink.activity_snapshot_id.is_(None))
            | (CoordinationLink.bim_global_id.isnot(None) & CoordinationLink.bim_element_id.is_(None))
        ),
    ).count()
    if ambiguous_links:
        raise HTTPException(
            status_code=409,
            detail=(
                "La referencia no puede oficializarse: existen vínculos con referencias "
                "de actividad o elemento sin identidad versionada canónica."
            ),
        )
    present_domains = sum(bool(value) for value in (
        item.presupuesto_id, item.cronograma_trabajo_id, item.bim_version_ids_json,
    ))
    if not present_domains:
        raise HTTPException(status_code=409, detail="El conjunto no contiene ningun dominio coordinable.")
    db.query(ProjectCoordinationSet).filter(
        ProjectCoordinationSet.proyecto_id == project_id,
        ProjectCoordinationSet.empresa_id == company_id,
        ProjectCoordinationSet.id != item.id,
        ProjectCoordinationSet.official.is_(True),
    ).update({ProjectCoordinationSet.official: False, ProjectCoordinationSet.active: False})
    item.official = True
    item.active = True
    item.process_status = "approved"
    item.approved_by = user_id
    item.approved_at = datetime.now(timezone.utc)
    # Coverage below 100% is visible and permitted; it never masquerades as fully coordinated.
    item.coordination_status = coverage["coordination_status"]
    db.query(CoordinationLink).filter(
        CoordinationLink.coordination_set_id == item.id,
        CoordinationLink.status == "draft",
    ).update({CoordinationLink.status: "active"})
    db.commit(); db.refresh(item)
    result = serialize_set(item)
    result["official_reason"] = reason
    return result


def create_link(db: Session, *, coordination_set_id: int, project_id: int, company_id: int, user_id: int, payload) -> dict:
    coordination = _coordination_set(db, coordination_set_id=coordination_set_id, project_id=project_id, company_id=company_id)
    domain_refs = [payload.budget_line_id or payload.apu_id, payload.activity_ref or payload.activity_snapshot_id, payload.bim_element_id or payload.bim_global_id]
    if sum(bool(value) for value in domain_refs) < 2:
        raise HTTPException(status_code=400, detail="Un vinculo coordinado debe relacionar al menos dos dominios.")
    if payload.allocation_type not in {"percentage", "quantity"}:
        raise HTTPException(status_code=400, detail="Tipo de asignacion invalido.")
    allocation = Decimal(payload.allocation_value)
    if allocation <= 0 or (payload.allocation_type == "percentage" and allocation > Decimal("100")):
        raise HTTPException(status_code=400, detail="Asignacion fuera de rango.")
    if payload.budget_line_id and not db.query(PresupuestoDetalle).filter(PresupuestoDetalle.id == payload.budget_line_id, PresupuestoDetalle.presupuesto_id == coordination.presupuesto_id).first():
        raise HTTPException(status_code=400, detail="Linea presupuestaria fuera del conjunto.")
    if payload.apu_id and not db.query(APU).filter(APU.id == payload.apu_id, APU.empresa_id == company_id).first():
        raise HTTPException(status_code=400, detail="APU fuera de la empresa coordinada.")
    if payload.activity_snapshot_id and not db.query(Bim4dActivitySnapshot).filter(Bim4dActivitySnapshot.id == payload.activity_snapshot_id, Bim4dActivitySnapshot.proyecto_id == project_id).first():
        raise HTTPException(status_code=400, detail="Actividad fuera del proyecto.")
    element = None
    if payload.bim_element_id:
        element = db.query(BimElement).join(BimModelVersion, BimModelVersion.id == BimElement.bim_model_version_id).join(BimModel, BimModel.id == BimModelVersion.bim_model_id).filter(
            BimElement.id == payload.bim_element_id,
            BimModel.proyecto_id == project_id,
            BimModel.empresa_id == company_id,
        ).first()
        if not element:
            raise HTTPException(status_code=400, detail="Elemento BIM inexistente.")
    unit = _normalized_unit(payload.unit)
    if payload.allocation_type == "quantity" and unit is None:
        raise HTTPException(status_code=400, detail="Una asignacion por cantidad requiere unidad explicita.")
    resolved_global_id = payload.bim_global_id or (element.global_id if element else None)
    identity = _link_identity(payload, resolved_global_id)
    for existing in db.query(CoordinationLink).filter(
        CoordinationLink.coordination_set_id == coordination_set_id,
        CoordinationLink.status != "retired",
    ).all():
        existing_identity = (
            existing.budget_line_id, existing.apu_id,
            existing.activity_ref or None, existing.activity_snapshot_id,
            existing.bim_element_id, existing.bim_global_id or None,
            existing.allocation_key,
        )
        if existing_identity == identity:
            raise HTTPException(status_code=409, detail="El vinculo coordinado ya existe.")
    item = CoordinationLink(
        empresa_id=company_id,
        proyecto_id=project_id,
        coordination_set_id=coordination_set_id,
        budget_line_id=payload.budget_line_id,
        apu_id=payload.apu_id,
        activity_ref=payload.activity_ref,
        activity_snapshot_id=payload.activity_snapshot_id,
        bim_element_id=payload.bim_element_id,
        bim_global_id=resolved_global_id,
        allocation_key=payload.allocation_key,
        allocation_type=payload.allocation_type,
        allocation_value=allocation,
        unit=unit,
        additive=payload.additive,
        source=payload.source,
        status="draft",
        valid_from_revision=coordination.revision,
        notes=payload.notes,
        created_by=user_id,
    )
    db.add(item); db.commit(); db.refresh(item)
    return serialize_link(item)


def serialize_link(item: CoordinationLink) -> dict:
    ambiguous_references = []
    if item.activity_ref and not item.activity_snapshot_id:
        ambiguous_references.append("activity_ref")
    if item.bim_global_id and not item.bim_element_id:
        ambiguous_references.append("bim_global_id")
    return {
        "id": item.id, "coordination_set_id": item.coordination_set_id,
        "budget_line_id": item.budget_line_id, "apu_id": item.apu_id,
        "activity_ref": item.activity_ref, "activity_snapshot_id": item.activity_snapshot_id,
        "bim_element_id": item.bim_element_id, "bim_global_id": item.bim_global_id,
        "allocation_key": item.allocation_key, "allocation_type": item.allocation_type,
        "allocation_value": float(item.allocation_value), "unit": item.unit,
        "additive": item.additive, "source": item.source, "status": item.status,
        "identity_status": "canonical" if not ambiguous_references else "draft_reference",
        "ambiguous_references": ambiguous_references,
    }


def reconcile_link_identity(
    db: Session, *, link_id: int, coordination_set_id: int, project_id: int,
    company_id: int, activity_snapshot_id: int | None, bim_element_id: int | None,
) -> dict:
    _coordination_set(db, coordination_set_id=coordination_set_id, project_id=project_id, company_id=company_id)
    link = db.query(CoordinationLink).filter(
        CoordinationLink.id == link_id,
        CoordinationLink.coordination_set_id == coordination_set_id,
        CoordinationLink.proyecto_id == project_id,
        CoordinationLink.empresa_id == company_id,
    ).first()
    if not link:
        raise HTTPException(status_code=404, detail="Vínculo coordinado no encontrado.")
    if link.activity_ref and not link.activity_snapshot_id:
        snapshot = db.query(Bim4dActivitySnapshot).filter(
            Bim4dActivitySnapshot.id == activity_snapshot_id,
            Bim4dActivitySnapshot.proyecto_id == project_id,
            Bim4dActivitySnapshot.empresa_id == company_id,
        ).first()
        if not snapshot or snapshot.source_ref != link.activity_ref:
            raise HTTPException(status_code=409, detail="La actividad canónica no coincide con la referencia histórica.")
        link.activity_snapshot_id = snapshot.id
        if not link.budget_line_id and snapshot.budget_line_id:
            link.budget_line_id = snapshot.budget_line_id
    if link.bim_global_id and not link.bim_element_id:
        element = db.query(BimElement).join(BimModelVersion).join(BimModel).filter(
            BimElement.id == bim_element_id,
            BimElement.global_id == link.bim_global_id,
            BimModel.proyecto_id == project_id,
            BimModel.empresa_id == company_id,
        ).first()
        if not element:
            raise HTTPException(status_code=409, detail="El elemento canónico no coincide con el GlobalId histórico.")
        link.bim_element_id = element.id
    result = serialize_link(link)
    if result["identity_status"] != "canonical":
        db.rollback()
        raise HTTPException(status_code=409, detail="Debe resolver todas las referencias históricas del vínculo.")
    try:
        db.commit(); db.refresh(link)
    except Exception as exc:
        db.rollback()
        raise HTTPException(status_code=409, detail="La identidad canónica produciría un vínculo duplicado.") from exc
    return serialize_link(link)


def list_links(db: Session, *, coordination_set_id: int, project_id: int, company_id: int) -> list[dict]:
    _coordination_set(db, coordination_set_id=coordination_set_id, project_id=project_id, company_id=company_id)
    return [serialize_link(item) for item in db.query(CoordinationLink).filter(CoordinationLink.coordination_set_id == coordination_set_id).order_by(CoordinationLink.id).all()]


def build_coverage(db: Session, *, coordination_set_id: int, project_id: int, company_id: int) -> dict:
    coordination = _coordination_set(db, coordination_set_id=coordination_set_id, project_id=project_id, company_id=company_id)
    links = db.query(CoordinationLink).filter(CoordinationLink.coordination_set_id == coordination_set_id, CoordinationLink.status != "retired").all()
    totals: dict[tuple[str, str], Decimal] = defaultdict(Decimal)
    quantity_totals: dict[tuple[str, str, str], Decimal] = defaultdict(Decimal)
    quantity_units: dict[tuple[str, str, str], set[str]] = defaultdict(set)
    quantity_dimensions: dict[tuple[str, str], set[str]] = defaultdict(set)
    for item in links:
        if not item.additive:
            continue
        keys = []
        if item.budget_line_id: keys.append(("budget_line", str(item.budget_line_id)))
        if item.activity_snapshot_id or item.activity_ref: keys.append(("activity", str(item.activity_snapshot_id or item.activity_ref)))
        if item.bim_element_id or item.bim_global_id: keys.append(("bim_element", str(item.bim_element_id or item.bim_global_id)))
        for key in keys:
            if item.allocation_type == "percentage":
                totals[key] += Decimal(item.allocation_value)
            elif item.allocation_type == "quantity":
                dimension, factor = UNIT_DIMENSIONS.get(item.unit or "", ("unknown", Decimal("1")))
                quantity_totals[(key[0], key[1], dimension)] += Decimal(item.allocation_value) * factor
                quantity_units[(key[0], key[1], dimension)].add(item.unit or "unknown")
                quantity_dimensions[key].add(dimension)
    groups = []
    for (kind, ref), total in sorted(totals.items()):
        delta = total - Decimal("100")
        state = "coordinated" if abs(delta) <= COVERAGE_TOLERANCE else ("overallocated" if delta > COVERAGE_TOLERANCE else "incomplete")
        groups.append({"kind": kind, "ref": ref, "allocation_percent": float(total), "status": state, "tolerance": float(COVERAGE_TOLERANCE)})
    for (kind, ref, dimension), total in sorted(quantity_totals.items()):
        groups.append({"kind": kind, "ref": ref, "allocation_quantity_base": float(total), "dimension": dimension, "source_units": sorted(quantity_units[(kind, ref, dimension)]), "status": "quantified"})
    for (kind, ref), dimensions in sorted(quantity_dimensions.items()):
        if len(dimensions) > 1:
            groups.append({"kind": kind, "ref": ref, "dimensions": sorted(dimensions), "status": "incompatible_units"})
    incomplete = sum(item["status"] == "incomplete" for item in groups)
    overallocated = sum(item["status"] == "overallocated" for item in groups)
    coordinated_count = sum(item["status"] == "coordinated" for item in groups)
    quantified_count = sum(item["status"] == "quantified" for item in groups)
    unit_conflict_count = sum(item["status"] == "incompatible_units" for item in groups)
    status = "conflict" if overallocated or unit_conflict_count else ("incomplete" if incomplete or quantified_count or not groups else "coordinated")
    coordination.coordination_status = status
    db.query(CoordinationConflict).filter(
        CoordinationConflict.coordination_set_id == coordination_set_id,
        CoordinationConflict.conflict_type == "allocation_coverage",
        CoordinationConflict.status == "open",
    ).delete(synchronize_session=False)
    for group in groups:
        if group["status"] not in {"incomplete", "overallocated", "incompatible_units"}:
            continue
        db.add(CoordinationConflict(
            empresa_id=company_id,
            proyecto_id=project_id,
            coordination_set_id=coordination_set_id,
            conflict_type="allocation_coverage",
            severity="error" if group["status"] in {"overallocated", "incompatible_units"} else "warning",
            status="open",
            entity_refs_json=[{"kind": group["kind"], "ref": group["ref"]}],
            detail_json={"allocation_percent": group.get("allocation_percent"), "coverage_status": group["status"], "dimensions": group.get("dimensions")},
        ))
    db.commit()
    return {
        "link_count": len(links),
        "additive_link_count": sum(item.additive for item in links),
        "incomplete_count": incomplete,
        "overallocated_count": overallocated,
        "coordinated_count": coordinated_count,
        "quantified_count": quantified_count,
        "unit_conflict_count": unit_conflict_count,
        "coordination_status": status,
        "groups": groups,
    }


def create_proposal(db: Session, *, coordination_set_id: int, project_id: int, company_id: int, user_id: int, payload) -> dict:
    _coordination_set(db, coordination_set_id=coordination_set_id, project_id=project_id, company_id=company_id)
    if payload.source_domain == payload.target_domain:
        raise HTTPException(status_code=400, detail="Una propuesta coordinada debe cruzar dominios.")
    item = CoordinationProposal(
        empresa_id=company_id, proyecto_id=project_id, coordination_set_id=coordination_set_id,
        proposal_type=payload.proposal_type, status="pending_review",
        source_domain=payload.source_domain, target_domain=payload.target_domain,
        diff_json=payload.diff, impact_json=payload.impact, reason=payload.reason,
        correlation_id=str(uuid4()), proposed_by=user_id,
    )
    db.add(item); db.commit(); db.refresh(item)
    return serialize_proposal(item)


def serialize_proposal(item: CoordinationProposal) -> dict:
    return {
        "id": item.id, "coordination_set_id": item.coordination_set_id,
        "proposal_type": item.proposal_type, "status": item.status,
        "source_domain": item.source_domain, "target_domain": item.target_domain,
        "diff": item.diff_json or {}, "impact": item.impact_json or {},
        "reason": item.reason, "correlation_id": item.correlation_id,
        "version": item.version,
    }


def list_proposals(db: Session, *, coordination_set_id: int, project_id: int, company_id: int) -> list[dict]:
    _coordination_set(db, coordination_set_id=coordination_set_id, project_id=project_id, company_id=company_id)
    rows = db.query(CoordinationProposal).filter(
        CoordinationProposal.coordination_set_id == coordination_set_id,
        CoordinationProposal.proyecto_id == project_id,
        CoordinationProposal.empresa_id == company_id,
    ).order_by(CoordinationProposal.fecha_creacion.desc(), CoordinationProposal.id.desc()).all()
    return [serialize_proposal(item) for item in rows]


def decide_proposal(db: Session, *, proposal_id: int, coordination_set_id: int, project_id: int, company_id: int, user_id: int, decision: str, reason: str | None) -> dict:
    _coordination_set(db, coordination_set_id=coordination_set_id, project_id=project_id, company_id=company_id)
    item = db.query(CoordinationProposal).filter(CoordinationProposal.id == proposal_id, CoordinationProposal.coordination_set_id == coordination_set_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Propuesta no encontrada.")
    target = {"approve": "approved", "reject": "rejected"}.get(decision)
    if not target or target not in PROCESS_TRANSITIONS.get(item.status, set()):
        raise HTTPException(status_code=409, detail="Transicion de propuesta invalida.")
    item.status = target; item.decided_by = user_id; item.decision_reason = reason; item.decided_at = datetime.now(timezone.utc); item.version += 1
    db.commit(); db.refresh(item)
    return serialize_proposal(item)


def _proposal(db: Session, *, proposal_id: int, coordination_set_id: int, project_id: int, company_id: int) -> CoordinationProposal:
    _coordination_set(db, coordination_set_id=coordination_set_id, project_id=project_id, company_id=company_id)
    item = db.query(CoordinationProposal).filter(
        CoordinationProposal.id == proposal_id,
        CoordinationProposal.coordination_set_id == coordination_set_id,
        CoordinationProposal.proyecto_id == project_id,
        CoordinationProposal.empresa_id == company_id,
    ).first()
    if not item:
        raise HTTPException(status_code=404, detail="Propuesta no encontrada.")
    return item


COORDINATION_PATCH_KEYS = {
    "coordination_status", "coordination_set_id", "link_ids", "activity_ref",
    "budget_line_id", "bim_element_ids", "note",
}


def _validated_coordination_patch(value) -> dict:
    if not isinstance(value, dict) or not value:
        raise HTTPException(status_code=400, detail="Cada operacion de dominio requiere un patch coordinado.")
    unknown = set(value) - COORDINATION_PATCH_KEYS
    if unknown:
        raise HTTPException(status_code=400, detail=f"Campos coordinados no permitidos: {', '.join(sorted(unknown))}.")
    if len(str(value)) > 8000:
        raise HTTPException(status_code=413, detail="El metadato coordinado excede el limite permitido.")
    return dict(value)


def _prepare_domain_operations(db: Session, *, operations: list, coordination_set_id: int, project_id: int, company_id: int) -> list[dict]:
    prepared = []
    for operation in operations:
        if not isinstance(operation, dict):
            raise HTTPException(status_code=400, detail="Operacion de dominio invalida.")
        domain = str(operation.get("domain") or "").strip().lower()
        patch = _validated_coordination_patch(operation.get("patch"))
        patch["coordination_set_id"] = coordination_set_id
        if domain == "budget":
            entity_id = int(operation.get("entity_id") or 0)
            entity = db.query(PresupuestoDetalle).join(Presupuesto, Presupuesto.id == PresupuestoDetalle.presupuesto_id).filter(
                PresupuestoDetalle.id == entity_id,
                Presupuesto.proyecto_id == project_id,
                Presupuesto.empresa_id == company_id,
            ).first()
            if not entity:
                raise HTTPException(status_code=400, detail=f"Partida fuera del proyecto: {entity_id}.")
            before = entity.coordination_metadata_json
        elif domain == "schedule":
            schedule_id = int(operation.get("schedule_id") or 0)
            activity_ref = str(operation.get("activity_ref") or "").strip()
            entity = db.query(CronogramaTrabajo).filter(
                CronogramaTrabajo.id == schedule_id,
                CronogramaTrabajo.proyecto_id == project_id,
                CronogramaTrabajo.empresa_id == company_id,
            ).first()
            if not entity or not activity_ref or activity_ref not in (entity.schedule_data or {}):
                raise HTTPException(status_code=400, detail=f"Actividad Gantt fuera del proyecto: {activity_ref or schedule_id}.")
            before = dict(((entity.schedule_data or {}).get(activity_ref) or {}).get("coordination") or {}) or None
            entity_id = schedule_id
        elif domain == "bim":
            entity_id = int(operation.get("entity_id") or 0)
            entity = db.query(BimElement).join(BimModelVersion, BimModelVersion.id == BimElement.bim_model_version_id).join(BimModel, BimModel.id == BimModelVersion.bim_model_id).filter(
                BimElement.id == entity_id,
                BimModel.proyecto_id == project_id,
                BimModel.empresa_id == company_id,
            ).first()
            if not entity:
                raise HTTPException(status_code=400, detail=f"Elemento BIM fuera del proyecto: {entity_id}.")
            before = dict((entity.metadata_json or {}).get("coordination") or {}) or None
        else:
            raise HTTPException(status_code=400, detail=f"Dominio coordinado no admitido: {domain}.")
        prepared.append({"domain": domain, "entity": entity, "entity_id": entity_id, "activity_ref": operation.get("activity_ref"), "patch": patch, "before": before})
    return prepared


def _write_domain_operations(prepared: list[dict]) -> list[dict]:
    recovery = []
    for item in prepared:
        domain, entity, patch = item["domain"], item["entity"], item["patch"]
        if domain == "budget":
            entity.coordination_metadata_json = patch
        elif domain == "schedule":
            schedule_data = dict(entity.schedule_data or {})
            activity = dict(schedule_data[item["activity_ref"]] or {})
            activity["coordination"] = patch
            schedule_data[item["activity_ref"]] = activity
            entity.schedule_data = schedule_data
        else:
            metadata = dict(entity.metadata_json or {})
            metadata["coordination"] = patch
            entity.metadata_json = metadata
        recovery.append({"domain": domain, "entity_id": item["entity_id"], "activity_ref": item.get("activity_ref"), "before": item["before"]})
    return recovery


def _restore_domain_operations(db: Session, *, recovery: list[dict], project_id: int, company_id: int) -> None:
    for item in recovery:
        domain, before = item["domain"], item.get("before")
        if domain == "budget":
            entity = db.query(PresupuestoDetalle).join(Presupuesto, Presupuesto.id == PresupuestoDetalle.presupuesto_id).filter(PresupuestoDetalle.id == item["entity_id"], Presupuesto.proyecto_id == project_id, Presupuesto.empresa_id == company_id).first()
            if not entity: raise HTTPException(status_code=409, detail="No se puede recuperar: falta la partida original.")
            entity.coordination_metadata_json = before
        elif domain == "schedule":
            entity = db.query(CronogramaTrabajo).filter(CronogramaTrabajo.id == item["entity_id"], CronogramaTrabajo.proyecto_id == project_id, CronogramaTrabajo.empresa_id == company_id).first()
            if not entity or item.get("activity_ref") not in (entity.schedule_data or {}): raise HTTPException(status_code=409, detail="No se puede recuperar: falta la actividad original.")
            data = dict(entity.schedule_data or {}); activity = dict(data[item["activity_ref"]] or {})
            if before is None: activity.pop("coordination", None)
            else: activity["coordination"] = before
            data[item["activity_ref"]] = activity; entity.schedule_data = data
        else:
            entity = db.query(BimElement).join(BimModelVersion, BimModelVersion.id == BimElement.bim_model_version_id).join(BimModel, BimModel.id == BimModelVersion.bim_model_id).filter(BimElement.id == item["entity_id"], BimModel.proyecto_id == project_id, BimModel.empresa_id == company_id).first()
            if not entity: raise HTTPException(status_code=409, detail="No se puede recuperar: falta el elemento BIM original.")
            metadata = dict(entity.metadata_json or {})
            if before is None: metadata.pop("coordination", None)
            else: metadata["coordination"] = before
            entity.metadata_json = metadata


def apply_proposal(db: Session, *, proposal_id: int, coordination_set_id: int, project_id: int, company_id: int, user_id: int, expected_version: int, reason: str | None = None) -> dict:
    item = _proposal(db, proposal_id=proposal_id, coordination_set_id=coordination_set_id, project_id=project_id, company_id=company_id)
    if item.status == "applied" and expected_version in {item.version, item.version - 1}:
        return serialize_proposal(item)
    if item.version != expected_version:
        raise HTTPException(status_code=409, detail="La propuesta cambio desde la ultima lectura.")
    if item.status != "approved":
        raise HTTPException(status_code=409, detail="Solo una propuesta aprobada puede aplicarse.")
    updates = list((item.diff_json or {}).get("link_updates") or [])
    domain_operations = list((item.diff_json or {}).get("domain_operations") or [])
    if not updates and not domain_operations:
        raise HTTPException(status_code=400, detail="La propuesta no contiene cambios coordinados aplicables.")
    links = {}
    for update in updates:
        link_id = int(update.get("link_id") or 0)
        link = db.query(CoordinationLink).filter(
            CoordinationLink.id == link_id,
            CoordinationLink.coordination_set_id == coordination_set_id,
        ).first()
        if not link:
            raise HTTPException(status_code=400, detail=f"Vinculo coordinado inexistente: {link_id}.")
        if "allocation_value" in update:
            value = Decimal(str(update["allocation_value"]))
            if value <= 0 or (link.allocation_type == "percentage" and value > Decimal("100")):
                raise HTTPException(status_code=400, detail=f"Asignacion fuera de rango para vinculo {link_id}.")
        links[link_id] = link
    prepared_domains = _prepare_domain_operations(
        db,
        operations=domain_operations,
        coordination_set_id=coordination_set_id,
        project_id=project_id,
        company_id=company_id,
    )
    recovery = []
    item.status = "applying"
    for update in updates:
        link = links[int(update["link_id"])]
        recovery.append({"link_id": link.id, "allocation_value": str(link.allocation_value), "status": link.status, "notes": link.notes})
        if "allocation_value" in update: link.allocation_value = Decimal(str(update["allocation_value"]))
        if "status" in update: link.status = str(update["status"])
        if "notes" in update: link.notes = update["notes"]
    domain_recovery = _write_domain_operations(prepared_domains)
    impact = dict(item.impact_json or {})
    impact["recovery_link_updates"] = recovery
    impact["recovery_domain_operations"] = domain_recovery
    impact["applied_domains"] = sorted({item["domain"] for item in prepared_domains})
    impact["applied_by"] = user_id
    impact["apply_reason"] = reason
    item.impact_json = impact
    item.status = "applied"
    item.applied_at = datetime.now(timezone.utc)
    item.version += 1
    try:
        db.commit(); db.refresh(item)
    except Exception as exc:
        db.rollback()
        raise HTTPException(status_code=503, detail="La aplicacion no se confirmo; ningun cambio coordinado fue consolidado y puede reintentarse.") from exc
    return serialize_proposal(item)


def recover_proposal(db: Session, *, proposal_id: int, coordination_set_id: int, project_id: int, company_id: int, user_id: int, expected_version: int, reason: str | None = None) -> dict:
    item = _proposal(db, proposal_id=proposal_id, coordination_set_id=coordination_set_id, project_id=project_id, company_id=company_id)
    if item.status == "recovered" and expected_version in {item.version, item.version - 1}:
        return serialize_proposal(item)
    if item.version != expected_version:
        raise HTTPException(status_code=409, detail="La propuesta cambio desde la ultima lectura.")
    if item.status not in {"applied", "failed_recovery_required"}:
        raise HTTPException(status_code=409, detail="La propuesta no esta en un estado recuperable.")
    recovery = list((item.impact_json or {}).get("recovery_link_updates") or [])
    domain_recovery = list((item.impact_json or {}).get("recovery_domain_operations") or [])
    if not recovery and not domain_recovery:
        raise HTTPException(status_code=409, detail="La propuesta no dispone de instantanea de recuperacion.")
    links = {}
    for update in recovery:
        link = db.query(CoordinationLink).filter(
            CoordinationLink.id == int(update["link_id"]),
            CoordinationLink.coordination_set_id == coordination_set_id,
        ).first()
        if not link:
            raise HTTPException(status_code=409, detail="No se puede recuperar: falta un vinculo original.")
        links[link.id] = link
    item.status = "recovering"
    for update in recovery:
        link = links[int(update["link_id"])]
        link.allocation_value = Decimal(str(update["allocation_value"]))
        link.status = update["status"]
        link.notes = update.get("notes")
    _restore_domain_operations(
        db,
        recovery=domain_recovery,
        project_id=project_id,
        company_id=company_id,
    )
    impact = dict(item.impact_json or {})
    impact["recovered_by"] = user_id
    impact["recovery_reason"] = reason
    item.impact_json = impact
    item.status = "recovered"
    item.version += 1
    try:
        db.commit(); db.refresh(item)
    except Exception as exc:
        db.rollback()
        raise HTTPException(status_code=503, detail="La recuperacion no se confirmo; la referencia anterior permanece vigente y puede reintentarse.") from exc
    return serialize_proposal(item)


def upsert_classification_resolution(db: Session, *, project_id: int, company_id: int, user_id: int, payload) -> dict:
    company = db.query(Empresa).filter(Empresa.id == company_id).first()
    element = db.query(BimElement).join(BimModelVersion, BimModelVersion.id == BimElement.bim_model_version_id).join(BimModel, BimModel.id == BimModelVersion.bim_model_id).filter(
        BimElement.id == payload.bim_element_id,
        BimElement.bim_model_version_id == payload.bim_model_version_id,
        BimModel.proyecto_id == project_id,
        BimModel.empresa_id == company_id,
    ).first()
    if not company or not element:
        raise HTTPException(status_code=404, detail="Elemento o empresa no encontrados.")
    master = None
    if payload.omniclass_id is not None:
        master = db.query(OmniClassMaestro).filter(OmniClassMaestro.id == payload.omniclass_id).first()
        if not master:
            raise HTTPException(status_code=400, detail="Referencia OmniClass inexistente.")
        if payload.table_code and str(master.tabla).strip() != str(payload.table_code).strip():
            raise HTTPException(status_code=409, detail="La tabla OmniClass propuesta no coincide con el maestro seleccionado.")
        if payload.source_code and str(master.codigo).strip() != str(payload.source_code).strip():
            raise HTTPException(status_code=409, detail="El codigo OmniClass de origen no coincide con el maestro seleccionado.")
    item = db.query(BimClassificationResolution).filter(
        BimClassificationResolution.bim_element_id == payload.bim_element_id,
        BimClassificationResolution.bim_model_version_id == payload.bim_model_version_id,
        BimClassificationResolution.system == payload.system,
        BimClassificationResolution.edition == payload.edition,
    ).first()
    if not item:
        item = BimClassificationResolution(
            empresa_id=company_id, proyecto_id=project_id,
            bim_element_id=payload.bim_element_id, bim_model_version_id=payload.bim_model_version_id,
            system=payload.system, edition=payload.edition,
        ); db.add(item)
    item.table_code = payload.table_code; item.source_code = payload.source_code; item.source_title = payload.source_title
    item.source = payload.source; item.confidence = payload.confidence
    if not company.use_omniclass:
        item.omniclass_id = None; item.resolution_status = "disabled"
    else:
        item.omniclass_id = payload.omniclass_id
        item.resolution_status = "resolved" if master and payload.resolution_status in {"resolved", "approved"} else payload.resolution_status
        if payload.resolution_status == "approved":
            item.approved_by = user_id; item.approved_at = datetime.now(timezone.utc)
    db.commit(); db.refresh(item)
    return {
        "id": item.id, "bim_element_id": item.bim_element_id, "bim_model_version_id": item.bim_model_version_id,
        "system": item.system, "edition": item.edition, "table_code": item.table_code,
        "source_code": item.source_code, "source_title": item.source_title,
        "omniclass_id": item.omniclass_id, "resolution_status": item.resolution_status,
        "confidence": float(item.confidence) if item.confidence is not None else None, "source": item.source,
    }


def classification_summary(db: Session, *, project_id: int, company_id: int) -> dict:
    company = db.query(Empresa).filter(Empresa.id == company_id).first()
    rows = db.query(BimClassificationResolution).filter(
        BimClassificationResolution.proyecto_id == project_id,
        BimClassificationResolution.empresa_id == company_id,
    ).all()
    counts = defaultdict(int)
    for item in rows: counts[item.resolution_status] += 1
    if not company or not company.use_omniclass:
        status = "disabled"
    elif counts["conflict"]:
        status = "conflict"
    elif rows and counts["resolved"] + counts["approved"] == len(rows):
        status = "coordinated"
    elif rows:
        status = "partial"
    else:
        status = "unresolved"
    return {"status": status, "total": len(rows), "counts": dict(counts), "warning_required": status != "coordinated"}


def _classification_values(element: BimElement) -> list[tuple[str, str]]:
    values = []
    if element.classification:
        values.append(("classification", str(element.classification).strip()))
    def visit(value, path="properties"):
        if isinstance(value, dict):
            for key, nested in value.items():
                key_path = f"{path}.{key}"
                if any(token in str(key).lower() for token in ("classif", "omniclass", "classificationreference")) and isinstance(nested, (str, int, float)):
                    values.append((key_path, str(nested).strip()))
                else: visit(nested, key_path)
        elif isinstance(value, list):
            for index, nested in enumerate(value): visit(nested, f"{path}[{index}]")
    visit(element.properties or {})
    seen = set(); result = []
    for source, value in values:
        if value and (source, value) not in seen:
            seen.add((source, value)); result.append((source, value))
    return result


def _candidate_code(raw: str) -> tuple[str | None, str]:
    cleaned = re.sub(r"^\s*omniclass\s*[:#-]?\s*", "", raw, flags=re.IGNORECASE).strip()
    table = cleaned[:2] if re.match(r"^(21|22|23|34)(?:\D|$)", cleaned) else None
    return table, cleaned


def ingest_classification_candidates(db: Session, *, project_id: int, company_id: int, version_id: int) -> dict:
    company = db.query(Empresa).filter(Empresa.id == company_id).first()
    version = db.query(BimModelVersion).join(BimModel, BimModel.id == BimModelVersion.bim_model_id).filter(
        BimModelVersion.id == version_id,
        BimModel.proyecto_id == project_id,
        BimModel.empresa_id == company_id,
    ).first()
    if not company or not version:
        raise HTTPException(status_code=404, detail="Version BIM fuera del proyecto coordinado.")
    created = updated = unresolved = suggested = disabled = 0
    for element in db.query(BimElement).filter(BimElement.bim_model_version_id == version_id).all():
        candidates = _classification_values(element)
        if not candidates:
            continue
        source_path, raw = candidates[0]
        table_code, code = _candidate_code(raw)
        master = db.query(OmniClassMaestro).filter(OmniClassMaestro.codigo == code).first()
        item = db.query(BimClassificationResolution).filter(
            BimClassificationResolution.bim_element_id == element.id,
            BimClassificationResolution.bim_model_version_id == version_id,
            BimClassificationResolution.system == "OmniClass",
            BimClassificationResolution.edition == "source",
        ).first()
        if item: updated += 1
        else:
            item = BimClassificationResolution(
                empresa_id=company_id, proyecto_id=project_id,
                bim_element_id=element.id, bim_model_version_id=version_id,
                system="OmniClass", edition="source",
            ); db.add(item); created += 1
        item.table_code = table_code
        item.source_code = code
        item.source_title = raw
        item.source = f"ifc:{source_path}"[:40]
        item.approved_by = None; item.approved_at = None
        if not company.use_omniclass:
            item.omniclass_id = None; item.resolution_status = "disabled"; item.confidence = None; disabled += 1
        elif master and (not table_code or str(master.tabla).strip() == table_code):
            item.omniclass_id = master.id; item.resolution_status = "suggested"; item.confidence = Decimal("1.0000"); suggested += 1
        else:
            item.omniclass_id = None; item.resolution_status = "unresolved"; item.confidence = None; unresolved += 1
    db.commit()
    return {
        "version_id": version_id, "created": created, "updated": updated,
        "suggested": suggested, "unresolved": unresolved, "disabled": disabled,
        "automatic_links_created": 0, "automatic_approvals": 0,
    }
