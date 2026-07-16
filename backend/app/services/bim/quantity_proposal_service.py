from datetime import datetime, timezone
from fastapi import HTTPException
from app.models.bim_element import BimElement
from app.models.bim_model import BimModel
from app.models.bim_model_version import BimModelVersion
from app.models.bim_quantity_proposal import BimQuantityProposal


def _unit(name):
    value = name.casefold()
    if "volume" in value: return "m3"
    if "area" in value: return "m2"
    if any(token in value for token in ("length", "height", "width")): return "m"
    return "unit"


def extract_quantity_candidates(element):
    candidates = []
    for key, value in (element.properties or {}).items():
        try: numeric = float(value)
        except (TypeError, ValueError): continue
        if key.startswith("Quantity."): source = "ifc_element_quantity"
        elif key.startswith("Pset_Quantity."): source = "project_property_profile"
        else: continue
        unit = _unit(key)
        candidates.append({"quantity_name": key, "source_kind": source, "original_value": numeric, "original_unit": unit, "presented_value": round(numeric, 3), "presented_unit": unit, "conversion_factor": 1.0, "rounding_digits": 3, "normalization_rule": "identity_si"})
    metadata = element.metadata_json or {}
    geometry = metadata.get("geometry_2d") or {}
    if not candidates and all(key in geometry for key in ("width", "height")):
        value = float(geometry["width"]) * float(geometry["height"])
        candidates.append({"quantity_name": "Geometry.EstimatedArea", "source_kind": "giproy_geometry_estimate", "original_value": value, "original_unit": "m2", "presented_value": round(value, 3), "presented_unit": "m2", "conversion_factor": 1.0, "rounding_digits": 3, "normalization_rule": "rectangle_area_estimate"})
    order = {"ifc_element_quantity": 0, "project_property_profile": 1, "giproy_geometry_estimate": 2}
    candidates.sort(key=lambda item: (order[item["source_kind"]], item["quantity_name"]))
    return candidates


def quantity_candidates(db, *, element_id, project_id, company_id):
    element = db.query(BimElement).join(BimModelVersion).join(BimModel).filter(BimElement.id == element_id, BimModel.proyecto_id == project_id, BimModel.empresa_id == company_id).first()
    if not element: raise HTTPException(status_code=404, detail="Elemento BIM fuera del proyecto activo.")
    candidates = extract_quantity_candidates(element)
    return element, candidates


def _serialize(proposal, element):
    candidate = {key: getattr(proposal, key) for key in ("quantity_name", "source_kind", "original_value", "original_unit", "presented_value", "presented_unit", "conversion_factor", "rounding_digits", "normalization_rule")}
    return {"id": proposal.id, "project_id": proposal.proyecto_id, "company_id": proposal.empresa_id, "version_id": proposal.bim_model_version_id, "element_id": proposal.bim_element_id, "global_id": element.global_id, "target_type": proposal.target_type, "target_id": proposal.target_id, "candidate": candidate, "status": proposal.status, "decision_reason": proposal.decision_reason, "created_by": proposal.created_by, "decided_by": proposal.decided_by, "created_at": proposal.fecha_creacion, "decided_at": proposal.fecha_decision}


def create_proposal(db, *, project_id, company_id, user_id, payload):
    element, candidates = quantity_candidates(db, element_id=payload.element_id, project_id=project_id, company_id=company_id)
    candidate = next((item for item in candidates if item == payload.candidate.model_dump()), None)
    if not candidate: raise HTTPException(status_code=409, detail="La cantidad propuesta ya no coincide con la version BIM.")
    proposal = BimQuantityProposal(proyecto_id=project_id, empresa_id=company_id, bim_model_version_id=element.bim_model_version_id, bim_element_id=element.id, target_type=payload.target_type, target_id=payload.target_id, created_by=user_id, **candidate)
    db.add(proposal); db.commit(); db.refresh(proposal)
    return _serialize(proposal, element)


def decide_proposal(db, *, proposal_id, project_id, company_id, user_id, decision, reason):
    proposal = db.query(BimQuantityProposal).filter(BimQuantityProposal.id == proposal_id, BimQuantityProposal.proyecto_id == project_id, BimQuantityProposal.empresa_id == company_id).first()
    if not proposal or proposal.status != "pending": raise HTTPException(status_code=404, detail="Propuesta BIM pendiente no encontrada.")
    proposal.status = decision; proposal.decision_reason = reason; proposal.decided_by = user_id; proposal.fecha_decision = datetime.now(timezone.utc); db.commit()
    element = db.query(BimElement).filter(BimElement.id == proposal.bim_element_id).one()
    return _serialize(proposal, element)
