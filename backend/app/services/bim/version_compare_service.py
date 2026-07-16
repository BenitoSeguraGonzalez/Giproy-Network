import json
from collections import defaultdict

from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.models.bim_element import BimElement
from app.models.bim_model import BimModel
from app.models.bim_model_version import BimModelVersion
from app.schemas.bim_version_compare import BimVersionChangeItem, BimVersionCompareResponse


def _load_elements(db: Session, *, version_id: int, project_id: int, company_id: int) -> list[BimElement]:
    version = (
        db.query(BimModelVersion)
        .join(BimModel, BimModel.id == BimModelVersion.bim_model_id)
        .filter(
            BimModelVersion.id == version_id,
            BimModel.proyecto_id == project_id,
            BimModel.empresa_id == company_id,
        )
        .first()
    )
    if version is None:
        raise HTTPException(status_code=404, detail="Version BIM no encontrada para comparar.")
    return db.query(BimElement).filter(BimElement.bim_model_version_id == version_id).order_by(BimElement.id.asc()).all()


def _canonical(value) -> str:
    return json.dumps(value or {}, sort_keys=True, separators=(",", ":"), ensure_ascii=True)


def _geometry_payload(element: BimElement) -> dict:
    metadata = element.metadata_json or {}
    return {
        "geometry_2d": metadata.get("geometry_2d"),
        "transform": metadata.get("transform"),
        "placement": metadata.get("placement"),
    }


def _semantic_signature(element: BimElement) -> tuple[str, str, str, str]:
    return tuple(
        str(value or "").strip().casefold()
        for value in (element.ifc_class, element.nombre, element.storey_name, element.classification)
    )


def _matched_change(base: BimElement, target: BimElement, strategy: str) -> BimVersionChangeItem:
    geometry_changed = _canonical(_geometry_payload(base)) != _canonical(_geometry_payload(target))
    properties_changed = _canonical(base.properties) != _canonical(target.properties)
    if geometry_changed and properties_changed:
        change_type = "geometry_and_properties"
    elif geometry_changed:
        change_type = "geometry"
    elif properties_changed:
        change_type = "properties"
    else:
        change_type = "unchanged"
    return BimVersionChangeItem(
        change_type=change_type,
        match_strategy=strategy,
        base_element_id=base.id,
        target_element_id=target.id,
        base_guid=base.global_id,
        target_guid=target.global_id,
        ifc_class=target.ifc_class or base.ifc_class,
        name=target.nombre or base.nombre,
        geometry_changed=geometry_changed,
        properties_changed=properties_changed,
    )


def compare_bim_versions(
    db: Session,
    *,
    project_id: int,
    company_id: int,
    base_version_id: int,
    target_version_id: int,
) -> BimVersionCompareResponse:
    if base_version_id == target_version_id:
        raise HTTPException(status_code=400, detail="Selecciona dos versiones BIM diferentes.")
    base_elements = _load_elements(db, version_id=base_version_id, project_id=project_id, company_id=company_id)
    target_elements = _load_elements(db, version_id=target_version_id, project_id=project_id, company_id=company_id)
    target_by_guid = {element.global_id: element for element in target_elements}
    matched_target_ids: set[int] = set()
    changes: list[BimVersionChangeItem] = []
    unmatched_base: list[BimElement] = []

    for base in base_elements:
        target = target_by_guid.get(base.global_id)
        if target is None:
            unmatched_base.append(base)
            continue
        matched_target_ids.add(target.id)
        changes.append(_matched_change(base, target, "guid"))

    unmatched_targets = [element for element in target_elements if element.id not in matched_target_ids]
    targets_by_signature: dict[tuple[str, str, str, str], list[BimElement]] = defaultdict(list)
    for target in unmatched_targets:
        targets_by_signature[_semantic_signature(target)].append(target)

    for base in unmatched_base:
        candidates = [candidate for candidate in targets_by_signature[_semantic_signature(base)] if candidate.id not in matched_target_ids]
        if len(candidates) == 1 and any(_semantic_signature(base)):
            target = candidates[0]
            matched_target_ids.add(target.id)
            changes.append(_matched_change(base, target, "semantic_fallback"))
        else:
            changes.append(BimVersionChangeItem(
                change_type="removed",
                match_strategy="unmatched",
                base_element_id=base.id,
                base_guid=base.global_id,
                ifc_class=base.ifc_class,
                name=base.nombre,
            ))

    for target in target_elements:
        if target.id not in matched_target_ids:
            changes.append(BimVersionChangeItem(
                change_type="added",
                match_strategy="unmatched",
                target_element_id=target.id,
                target_guid=target.global_id,
                ifc_class=target.ifc_class,
                name=target.nombre,
            ))

    order = {"added": 0, "removed": 1, "geometry_and_properties": 2, "geometry": 3, "properties": 4, "unchanged": 5}
    changes.sort(key=lambda item: (order[item.change_type], item.ifc_class or "", item.name or "", item.target_guid or item.base_guid or ""))
    summary = {key: 0 for key in order}
    summary["semantic_fallback"] = 0
    for item in changes:
        summary[item.change_type] += 1
        if item.match_strategy == "semantic_fallback":
            summary["semantic_fallback"] += 1
    return BimVersionCompareResponse(
        base_version_id=base_version_id,
        target_version_id=target_version_id,
        summary=summary,
        changes=changes,
    )
