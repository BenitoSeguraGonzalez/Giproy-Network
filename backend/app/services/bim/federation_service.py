import math

from fastapi import HTTPException
from sqlalchemy.orm import Session, joinedload

from app.models.bim_federation import BimFederation, BimFederationMember
from app.models.bim_model import BimModel
from app.models.bim_model_version import BimModelVersion
from app.schemas.bim_federation import BimFederationResponse, BimFederationSaveRequest


UNIT_TO_METERS = {"m": 1.0, "mm": 0.001, "ft": 0.3048}


def _effective_origin(member: BimFederationMember) -> tuple[float, float, float]:
    georef = member.georeference_json or {}
    transform = member.transform_json or {}
    factor = UNIT_TO_METERS.get(georef.get("units"), 1.0)
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
    for member in ordered:
        origin = _effective_origin(member)
        distance = math.dist(reference_origin, origin)
        crs = str((member.georeference_json or {}).get("crs", "LOCAL")).casefold()
        if not member.enabled:
            alignment_status = "disabled"
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
        summary={"members": len(members), "enabled": sum(item.enabled for item in ordered), "aligned": aligned, "misaligned": misaligned},
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
