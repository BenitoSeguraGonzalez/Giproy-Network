import math
import hashlib
import json

from fastapi import HTTPException
from sqlalchemy.orm import Session, joinedload

from app.models.bim_federation import BimFederation, BimFederationMember, BimVersionReconciliationDecision
from app.models.bim_coordination import CoordinationLink
from app.models.bim_model import BimModel
from app.models.bim_model_version import BimModelVersion
from app.models.bim_element import BimElement
from app.schemas.bim_federation import BimFederationResponse, BimFederationSaveRequest


UNIT_TO_METERS = {"m": 1.0, "mm": 0.001, "ft": 0.3048}


def _semantic_element_key(item: BimElement) -> tuple[str, str, str, str]:
    return tuple(
        str(value or "").strip().casefold()
        for value in (item.ifc_class, item.nombre, item.storey_name, item.system_name)
    )


def build_version_reconciliation(
    db: Session, *, project_id: int, company_id: int,
    source_version_id: int, target_version_id: int,
) -> dict:
    versions = (
        db.query(BimModelVersion)
        .join(BimModel, BimModel.id == BimModelVersion.bim_model_id)
        .filter(
            BimModelVersion.id.in_([source_version_id, target_version_id]),
            BimModel.proyecto_id == project_id,
            BimModel.empresa_id == company_id,
        )
        .all()
    )
    by_id = {item.id: item for item in versions}
    if len(by_id) != 2 or source_version_id == target_version_id:
        raise HTTPException(status_code=404, detail="Las versiones de reconciliación no pertenecen al proyecto activo.")
    if by_id[source_version_id].bim_model_id != by_id[target_version_id].bim_model_id:
        raise HTTPException(status_code=409, detail="La reconciliación de GUID requiere versiones del mismo modelo.")

    source = db.query(BimElement).filter(BimElement.bim_model_version_id == source_version_id).all()
    target = db.query(BimElement).filter(BimElement.bim_model_version_id == target_version_id).all()
    source_by_guid = {item.global_id: item for item in source}
    target_by_guid = {item.global_id: item for item in target}
    retained = sorted(set(source_by_guid) & set(target_by_guid))
    removed = [item for guid, item in source_by_guid.items() if guid not in target_by_guid]
    added = [item for guid, item in target_by_guid.items() if guid not in source_by_guid]

    removed_by_key: dict[tuple[str, str, str, str], list[BimElement]] = {}
    added_by_key: dict[tuple[str, str, str, str], list[BimElement]] = {}
    for item in removed:
        removed_by_key.setdefault(_semantic_element_key(item), []).append(item)
    for item in added:
        added_by_key.setdefault(_semantic_element_key(item), []).append(item)

    candidates = []
    matched_removed = set()
    matched_added = set()
    for key in sorted(set(removed_by_key) & set(added_by_key)):
        old_items, new_items = removed_by_key[key], added_by_key[key]
        if not any(key):
            continue
        kind = "replacement"
        if len(old_items) == 1 and len(new_items) > 1:
            kind = "split"
        elif len(old_items) > 1 and len(new_items) == 1:
            kind = "merge"
        elif len(old_items) > 1 or len(new_items) > 1:
            kind = "ambiguous"
        matched_removed.update(item.id for item in old_items)
        matched_added.update(item.id for item in new_items)
        candidate = {
            "kind": kind,
            "source_element_ids": [item.id for item in old_items],
            "source_global_ids": [item.global_id for item in old_items],
            "target_element_ids": [item.id for item in new_items],
            "target_global_ids": [item.global_id for item in new_items],
            "semantic_key": {"ifc_class": key[0], "name": key[1], "storey": key[2], "system": key[3]},
            "requires_review": True,
            "automatically_applied": False,
        }
        candidate["candidate_hash"] = hashlib.sha256(json.dumps(candidate, sort_keys=True, separators=(",", ":")).encode("utf-8")).hexdigest()
        candidates.append(candidate)
    return {
        "contract_version": "giproy_bim_guid_reconciliation_v1",
        "source_version_id": source_version_id,
        "target_version_id": target_version_id,
        "retained_global_ids": retained,
        "candidates": candidates,
        "removed": [{"element_id": item.id, "global_id": item.global_id} for item in removed if item.id not in matched_removed],
        "added": [{"element_id": item.id, "global_id": item.global_id} for item in added if item.id not in matched_added],
        "summary": {
            "retained": len(retained), "candidates": len(candidates),
            "removed": sum(item.id not in matched_removed for item in removed),
            "added": sum(item.id not in matched_added for item in added),
            "review_required": len(candidates), "automatic_changes": 0,
        },
    }


def decide_version_reconciliation(db: Session, *, project_id: int, company_id: int, user_id: int, payload) -> dict:
    reconciliation = build_version_reconciliation(
        db, project_id=project_id, company_id=company_id,
        source_version_id=payload.source_version_id, target_version_id=payload.target_version_id,
    )
    candidate = next((item for item in reconciliation["candidates"] if item["candidate_hash"] == payload.candidate_hash), None)
    if not candidate:
        raise HTTPException(status_code=409, detail="La inferencia cambió; vuelva a ejecutar la reconciliación.")
    existing = db.query(BimVersionReconciliationDecision).filter(
        BimVersionReconciliationDecision.empresa_id == company_id,
        BimVersionReconciliationDecision.proyecto_id == project_id,
        BimVersionReconciliationDecision.source_version_id == payload.source_version_id,
        BimVersionReconciliationDecision.target_version_id == payload.target_version_id,
        BimVersionReconciliationDecision.candidate_hash == payload.candidate_hash,
    ).first()
    if existing:
        return {"id": existing.id, "decision": existing.decision, "affected_link_count": existing.affected_link_count, "duplicate": True}
    selected = None
    if payload.decision == "approved":
        target_guids = candidate["target_global_ids"]
        selected_guid = payload.selected_target_global_id or (target_guids[0] if len(target_guids) == 1 else None)
        if not selected_guid or selected_guid not in target_guids:
            raise HTTPException(status_code=409, detail="Seleccione explícitamente un elemento de destino para esta reconciliación.")
        selected = db.query(BimElement).filter(BimElement.bim_model_version_id == payload.target_version_id, BimElement.global_id == selected_guid).first()
        if not selected:
            raise HTTPException(status_code=409, detail="El elemento de destino ya no existe.")
    item = BimVersionReconciliationDecision(
        empresa_id=company_id, proyecto_id=project_id,
        source_version_id=payload.source_version_id, target_version_id=payload.target_version_id,
        candidate_hash=payload.candidate_hash, candidate_json=candidate,
        decision=payload.decision, selected_target_element_id=selected.id if selected else None,
        reason=payload.reason, reviewed_by=user_id,
    )
    affected = 0
    if selected:
        source_ids = set(candidate["source_element_ids"])
        links = db.query(CoordinationLink).filter(
            CoordinationLink.empresa_id == company_id,
            CoordinationLink.proyecto_id == project_id,
            CoordinationLink.bim_element_id.in_(source_ids),
            CoordinationLink.status != "retired",
        ).all()
        for link in links:
            link.bim_element_id = selected.id
            link.bim_global_id = selected.global_id
            affected += 1
    item.affected_link_count = affected
    db.add(item)
    try:
        db.commit(); db.refresh(item)
    except Exception as exc:
        db.rollback()
        raise HTTPException(status_code=409, detail="La reconciliación produciría vínculos duplicados o inconsistentes.") from exc
    return {"id": item.id, "decision": item.decision, "affected_link_count": item.affected_link_count, "duplicate": False}


def _effective_origin(member: BimFederationMember) -> tuple[float, float, float]:
    georef = member.georeference_json or {}
    transform = member.transform_json or {}
    factor = UNIT_TO_METERS.get(georef.get("units"))
    if factor is None:
        return (math.inf, math.inf, math.inf)
    origin = georef.get("origin") or (0, 0, 0)
    translation = transform.get("translation") or (0, 0, 0)
    return tuple((float(origin[index]) + float(translation[index])) * factor for index in range(3))


def _serialize(federation: BimFederation) -> BimFederationResponse:
    ordered = sorted(federation.members, key=lambda item: (item.display_order, item.id))
    reference = next((member for member in ordered if member.enabled), None)
    reference_origin = _effective_origin(reference) if reference else (0.0, 0.0, 0.0)
    reference_crs = str((reference.georeference_json or {}).get("crs", "LOCAL")).casefold() if reference else "local"
    members = []
    aligned = 0
    misaligned = 0
    invalid_units = 0
    invalid_scale = 0
    for member in ordered:
        origin = _effective_origin(member)
        distance = math.dist(reference_origin, origin)
        crs = str((member.georeference_json or {}).get("crs", "LOCAL")).casefold()
        unit_valid = (member.georeference_json or {}).get("units") in UNIT_TO_METERS
        scale = tuple(float(value) for value in ((member.transform_json or {}).get("scale") or (1, 1, 1)))
        scale_valid = all(value > 0 for value in scale) and max(scale) - min(scale) <= 1e-9
        if member.enabled and not unit_valid: invalid_units += 1
        if member.enabled and not scale_valid: invalid_scale += 1
        if not member.enabled:
            alignment_status = "disabled"
        elif not unit_valid or not scale_valid:
            alignment_status = "misaligned"
            misaligned += 1
        elif member is reference:
            alignment_status = "reference"
            aligned += 1
        elif crs == reference_crs and distance <= 0.01:
            alignment_status = "aligned"
            aligned += 1
        else:
            alignment_status = "misaligned"
            misaligned += 1
        members.append({
            "id": member.id,
            "version_id": member.bim_model_version_id,
            "model_id": member.version.bim_model.id,
            "model_name": member.version.bim_model.nombre,
            "version_label": member.version.version_label,
            "discipline": member.discipline,
            "display_order": member.display_order,
            "enabled": member.enabled,
            "transform": member.transform_json or {},
            "georeference": member.georeference_json or {},
            "alignment_status": alignment_status,
            "alignment_distance": round(distance, 6),
        })
    return BimFederationResponse(
        id=federation.id,
        project_id=federation.proyecto_id,
        company_id=federation.empresa_id,
        name=federation.nombre,
        revision=federation.revision,
        status=federation.status,
        justification=federation.justification,
        created_by=federation.created_by,
        created_at=federation.fecha_creacion,
        members=members,
        summary={
            "members": len(members), "enabled": sum(item.enabled for item in ordered),
            "aligned": aligned, "misaligned": misaligned,
            "invalid_units": invalid_units, "invalid_scale": invalid_scale,
            "measurement_ready": int(bool(members) and misaligned == 0 and invalid_units == 0 and invalid_scale == 0),
        },
    )


def get_active_federation(db: Session, *, project_id: int, company_id: int) -> BimFederationResponse | None:
    federation = (
        db.query(BimFederation)
        .options(joinedload(BimFederation.members).joinedload(BimFederationMember.version).joinedload(BimModelVersion.bim_model))
        .filter(BimFederation.proyecto_id == project_id, BimFederation.empresa_id == company_id, BimFederation.status == "active")
        .order_by(BimFederation.revision.desc())
        .first()
    )
    return _serialize(federation) if federation else None


def save_federation_revision(db: Session, *, project_id: int, company_id: int, user_id: int, payload: BimFederationSaveRequest) -> BimFederationResponse:
    version_ids = [member.version_id for member in payload.members]
    if len(version_ids) != len(set(version_ids)):
        raise HTTPException(status_code=400, detail="Una version BIM no puede repetirse en la federacion.")
    versions = (
        db.query(BimModelVersion)
        .join(BimModel, BimModel.id == BimModelVersion.bim_model_id)
        .filter(BimModelVersion.id.in_(version_ids), BimModel.proyecto_id == project_id, BimModel.empresa_id == company_id)
        .all()
    )
    if len(versions) != len(version_ids):
        raise HTTPException(status_code=404, detail="Una o mas versiones BIM no pertenecen al proyecto activo.")
    current = (
        db.query(BimFederation)
        .filter(BimFederation.proyecto_id == project_id, BimFederation.empresa_id == company_id, BimFederation.status == "active")
        .order_by(BimFederation.revision.desc())
        .first()
    )
    revision = (current.revision if current else 0) + 1
    if current:
        current.status = "superseded"
    federation = BimFederation(
        proyecto_id=project_id,
        empresa_id=company_id,
        nombre=payload.name,
        revision=revision,
        status="active",
        justification=payload.justification,
        created_by=user_id,
    )
    db.add(federation)
    db.flush()
    for member in payload.members:
        db.add(BimFederationMember(
            bim_federation_id=federation.id,
            bim_model_version_id=member.version_id,
            discipline=member.discipline,
            display_order=member.display_order,
            enabled=member.enabled,
            transform_json=member.transform.model_dump(mode="json"),
            georeference_json=member.georeference.model_dump(mode="json"),
        ))
    db.commit()
    return get_active_federation(db, project_id=project_id, company_id=company_id)
