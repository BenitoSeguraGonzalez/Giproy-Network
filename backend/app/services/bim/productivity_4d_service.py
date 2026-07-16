from datetime import datetime, timezone

from fastapi import HTTPException

from app.models.bim_4d import Bim4dActivitySnapshot
from app.models.bim_4d_productivity import Bim4dProductivityProposal
from app.models.bim_element import BimElement
from app.services.bim.quantity_proposal_service import quantity_candidates


def _serialize(proposal, element):
    candidate = {
        "quantity_name": proposal.quantity_name,
        "source_kind": proposal.quantity_source_kind,
        "original_value": proposal.original_value,
        "original_unit": proposal.original_unit,
        "presented_value": proposal.quantity_value,
        "presented_unit": proposal.quantity_unit,
        "conversion_factor": proposal.conversion_factor,
        "rounding_digits": proposal.rounding_digits,
        "normalization_rule": proposal.normalization_rule,
    }
    return {
        "id": proposal.id, "project_id": proposal.proyecto_id, "company_id": proposal.empresa_id,
        "version_id": proposal.bim_model_version_id, "element_id": proposal.bim_element_id,
        "global_id": element.global_id, "activity_snapshot_id": proposal.activity_snapshot_id,
        "target_type": proposal.target_type, "target_id": proposal.target_id,
        "candidate": candidate, "productivity_value": proposal.productivity_value,
        "crew_size": proposal.crew_size, "resource_code": proposal.resource_code,
        "resource_name": proposal.resource_name, "calculated_duration_days": proposal.calculated_duration_days,
        "formula": proposal.formula, "status": proposal.status,
        "decision_reason": proposal.decision_reason, "created_by": proposal.created_by,
        "decided_by": proposal.decided_by, "created_at": proposal.created_at,
        "decided_at": proposal.decided_at,
    }


def create_productivity_proposal(db, *, project_id, company_id, user_id, payload):
    element, candidates = quantity_candidates(db, element_id=payload.element_id, project_id=project_id, company_id=company_id)
    candidate = next((item for item in candidates if item == payload.candidate.model_dump()), None)
    if not candidate:
        raise HTTPException(status_code=409, detail="La cantidad ya no coincide con la version BIM.")
    activity = db.query(Bim4dActivitySnapshot).filter(
        Bim4dActivitySnapshot.id == payload.activity_snapshot_id,
        Bim4dActivitySnapshot.proyecto_id == project_id,
        Bim4dActivitySnapshot.empresa_id == company_id,
    ).first()
    if not activity:
        raise HTTPException(status_code=404, detail="Actividad 4D fuera del proyecto activo.")
    duration = round(candidate["presented_value"] / (payload.productivity_value * payload.crew_size), 3)
    proposal = Bim4dProductivityProposal(
        empresa_id=company_id, proyecto_id=project_id,
        bim_model_version_id=element.bim_model_version_id, bim_element_id=element.id,
        activity_snapshot_id=activity.id, target_type=payload.target_type, target_id=payload.target_id,
        quantity_name=candidate["quantity_name"], original_value=candidate["original_value"],
        original_unit=candidate["original_unit"], quantity_value=candidate["presented_value"],
        quantity_unit=candidate["presented_unit"], quantity_source_kind=candidate["source_kind"],
        conversion_factor=candidate["conversion_factor"], rounding_digits=candidate["rounding_digits"],
        normalization_rule=candidate["normalization_rule"],
        productivity_value=payload.productivity_value, crew_size=payload.crew_size,
        calculated_duration_days=duration, resource_code=payload.resource_code,
        resource_name=payload.resource_name, formula="quantity / (productivity_per_crew_day * crew_size)",
        created_by=user_id,
    )
    db.add(proposal); db.commit(); db.refresh(proposal)
    return _serialize(proposal, element)


def list_productivity_proposals(db, *, project_id, company_id, element_id=None):
    query = db.query(Bim4dProductivityProposal).filter(
        Bim4dProductivityProposal.proyecto_id == project_id,
        Bim4dProductivityProposal.empresa_id == company_id,
    )
    if element_id:
        query = query.filter(Bim4dProductivityProposal.bim_element_id == element_id)
    proposals = query.order_by(Bim4dProductivityProposal.created_at.desc()).all()
    return [_serialize(item, db.query(BimElement).filter(BimElement.id == item.bim_element_id).one()) for item in proposals]


def decide_productivity_proposal(db, *, proposal_id, project_id, company_id, user_id, decision, reason):
    proposal = db.query(Bim4dProductivityProposal).filter(
        Bim4dProductivityProposal.id == proposal_id,
        Bim4dProductivityProposal.proyecto_id == project_id,
        Bim4dProductivityProposal.empresa_id == company_id,
        Bim4dProductivityProposal.status == "pending",
    ).first()
    if not proposal:
        raise HTTPException(status_code=404, detail="Propuesta 4D/5D pendiente no encontrada.")
    proposal.status = decision; proposal.decision_reason = reason; proposal.decided_by = user_id
    proposal.decided_at = datetime.now(timezone.utc); db.commit(); db.refresh(proposal)
    element = db.query(BimElement).filter(BimElement.id == proposal.bim_element_id).one()
    return _serialize(proposal, element)
