from __future__ import annotations

import hashlib
import json
from datetime import datetime, timezone

from sqlalchemy.exc import IntegrityError

from app.models.bim_element import BimElement
from app.models.bim_model import BimModel
from app.models.bim_model_version import BimModelVersion
from app.models.bim_qto import BimQtoSnapshot
from app.services.bim.quantity_proposal_service import extract_quantity_candidates


def _material(element: BimElement) -> str:
    properties = element.properties or {}
    for key, value in properties.items():
        if "material" in key.casefold() and isinstance(value, (str, int, float)):
            text = str(value).strip()
            if text:
                return text
    metadata = element.metadata_json or {}
    return str(metadata.get("material") or "Sin material")


def _element_dimensions(element: BimElement) -> dict[str, str]:
    return {
        "ifc_class": element.ifc_class or "IFCUNKNOWN",
        "storey": element.storey_name or "Sin planta",
        "material": _material(element),
        "classification": element.classification or "Sin clasificacion",
    }


def _mapping_for(dimensions: dict[str, str], mappings: list[dict]) -> dict | None:
    matches = []
    for index, mapping in enumerate(mappings):
        selectors = {
            key: value
            for key, value in mapping.items()
            if key in dimensions and value
        }
        if selectors and all(dimensions[key] == value for key, value in selectors.items()):
            matches.append((len(selectors), -index, mapping))
    return max(matches, default=(0, 0, None))[2]


def _checksum(payload: dict) -> str:
    serialized = json.dumps(payload, ensure_ascii=True, sort_keys=True, separators=(",", ":"))
    return hashlib.sha256(serialized.encode("utf-8")).hexdigest()


def _serialize(snapshot: BimQtoSnapshot) -> dict:
    return {
        "id": snapshot.id,
        "project_id": snapshot.proyecto_id,
        "company_id": snapshot.empresa_id,
        "version_id": snapshot.bim_model_version_id,
        "revision": snapshot.revision,
        "group_by": list(snapshot.grouping_json or []),
        "quantity_names": list(snapshot.quantity_names_json or []),
        "mappings": list(snapshot.mappings_json or []),
        "rows": list(snapshot.rows_json or []),
        "totals": list(snapshot.totals_json or []),
        "coverage": dict(snapshot.coverage_json or {}),
        "checksum_sha256": snapshot.checksum_sha256,
        "status": snapshot.status,
        "decision_reason": snapshot.decision_reason,
        "lock_version": snapshot.lock_version,
        "created_by": snapshot.created_by,
        "decided_by": snapshot.decided_by,
        "created_at": snapshot.created_at,
        "decided_at": snapshot.decided_at,
    }


def create_qto_snapshot(db, *, project_id: int, company_id: int, user_id: int, payload) -> dict:
    version = db.query(BimModelVersion).join(BimModel).filter(
        BimModelVersion.id == payload.version_id,
        BimModel.proyecto_id == project_id,
        BimModel.empresa_id == company_id,
    ).first()
    if not version:
        raise ValueError("Version BIM fuera del proyecto activo.")
    group_by = list(dict.fromkeys(payload.group_by))
    if not group_by:
        raise ValueError("QTO requiere al menos una dimension de agrupacion.")
    elements = db.query(BimElement).filter(
        BimElement.bim_model_version_id == version.id
    ).order_by(BimElement.global_id.asc()).all()
    if not elements:
        raise ValueError("La version BIM no contiene elementos para QTO.")
    existing = db.query(BimQtoSnapshot.id).filter(
        BimQtoSnapshot.empresa_id == company_id,
        BimQtoSnapshot.proyecto_id == project_id,
        BimQtoSnapshot.bim_model_version_id == version.id,
        BimQtoSnapshot.revision == payload.revision,
    ).first()
    if existing:
        raise ValueError("La revision QTO ya existe para esta version BIM.")
    requested_names = set(payload.quantity_names)
    mappings = [item.model_dump(exclude_none=True) for item in payload.mappings]
    aggregates: dict[tuple, dict] = {}
    elements_with_quantities: set[int] = set()
    mapped_elements: set[int] = set()
    for element in elements:
        dimensions = _element_dimensions(element)
        mapping = _mapping_for(dimensions, mappings)
        candidates = [
            item
            for item in extract_quantity_candidates(element)
            if not requested_names or item["quantity_name"] in requested_names
        ]
        if candidates:
            elements_with_quantities.add(element.id)
        if mapping and candidates:
            mapped_elements.add(element.id)
        for candidate in candidates:
            group_values = tuple(dimensions[key] for key in group_by)
            key = (
                group_values,
                candidate["quantity_name"],
                candidate["presented_unit"],
                (mapping or {}).get("wbs_code"),
                (mapping or {}).get("cost_code"),
            )
            row = aggregates.setdefault(
                key,
                {
                    "group": {name: dimensions[name] for name in group_by},
                    "quantity_name": candidate["quantity_name"],
                    "unit": candidate["presented_unit"],
                    "value": 0.0,
                    "element_count": 0,
                    "global_ids": [],
                    "source_kinds": [],
                    "wbs_code": (mapping or {}).get("wbs_code"),
                    "cost_code": (mapping or {}).get("cost_code"),
                },
            )
            row["value"] += float(candidate["presented_value"])
            row["element_count"] += 1
            row["global_ids"].append(element.global_id)
            row["source_kinds"].append(candidate["source_kind"])
    rows = []
    for row in aggregates.values():
        row["value"] = round(row["value"], payload.rounding_digits)
        row["global_ids"] = sorted(set(row["global_ids"]))
        row["source_kinds"] = sorted(set(row["source_kinds"]))
        rows.append(row)
    rows.sort(
        key=lambda item: (
            tuple(item["group"].get(name, "") for name in group_by),
            item["quantity_name"],
            item["unit"],
            item["wbs_code"] or "",
            item["cost_code"] or "",
        )
    )
    totals_map: dict[tuple[str, str], float] = {}
    for row in rows:
        total_key = (row["quantity_name"], row["unit"])
        totals_map[total_key] = totals_map.get(total_key, 0.0) + row["value"]
    totals = [
        {"quantity_name": name, "unit": unit, "value": round(value, payload.rounding_digits)}
        for (name, unit), value in sorted(totals_map.items())
    ]
    coverage = {
        "total_elements": len(elements),
        "elements_with_quantities": len(elements_with_quantities),
        "elements_without_quantities": len(elements) - len(elements_with_quantities),
        "mapped_elements": len(mapped_elements),
        "unmapped_elements_with_quantities": len(elements_with_quantities - mapped_elements),
        "quantity_coverage_percent": round(len(elements_with_quantities) / len(elements) * 100, 2),
        "mapping_coverage_percent": round(len(mapped_elements) / max(len(elements_with_quantities), 1) * 100, 2),
    }
    canonical = {
        "contract_version": "giproy_bim_qto_snapshot_v1",
        "project_id": project_id,
        "company_id": company_id,
        "version_id": version.id,
        "revision": payload.revision,
        "group_by": group_by,
        "quantity_names": sorted(requested_names),
        "mappings": mappings,
        "rows": rows,
        "totals": totals,
        "coverage": coverage,
    }
    snapshot = BimQtoSnapshot(
        empresa_id=company_id,
        proyecto_id=project_id,
        bim_model_version_id=version.id,
        revision=payload.revision,
        grouping_json=group_by,
        quantity_names_json=sorted(requested_names),
        mappings_json=mappings,
        rows_json=rows,
        totals_json=totals,
        coverage_json=coverage,
        checksum_sha256=_checksum(canonical),
        created_by=user_id,
    )
    db.add(snapshot)
    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise ValueError("La revision QTO ya existe para esta version BIM.") from exc
    db.refresh(snapshot)
    return _serialize(snapshot)


def list_qto_snapshots(db, *, project_id: int, company_id: int, version_id: int | None = None) -> list[dict]:
    query = db.query(BimQtoSnapshot).filter(
        BimQtoSnapshot.empresa_id == company_id,
        BimQtoSnapshot.proyecto_id == project_id,
    )
    if version_id:
        query = query.filter(BimQtoSnapshot.bim_model_version_id == version_id)
    return [_serialize(item) for item in query.order_by(BimQtoSnapshot.created_at.desc(), BimQtoSnapshot.id.desc()).all()]


def decide_qto_snapshot(
    db,
    *,
    snapshot_id: int,
    project_id: int,
    company_id: int,
    user_id: int,
    decision: str,
    reason: str,
    expected_lock_version: int,
) -> dict:
    snapshot = db.query(BimQtoSnapshot).filter(
        BimQtoSnapshot.id == snapshot_id,
        BimQtoSnapshot.empresa_id == company_id,
        BimQtoSnapshot.proyecto_id == project_id,
    ).with_for_update().first()
    if not snapshot:
        raise ValueError("Snapshot QTO fuera del proyecto activo.")
    if snapshot.status != "draft":
        raise ValueError("Solo una revision QTO en borrador puede decidirse.")
    if snapshot.lock_version != expected_lock_version:
        raise ValueError("La revision QTO cambio; recargue antes de decidir.")
    if decision == "approved":
        coverage = snapshot.coverage_json or {}
        if not snapshot.rows_json:
            raise ValueError("No se puede aprobar un QTO sin filas cuantificadas.")
        if float(coverage.get("mapping_coverage_percent") or 0) < 100:
            raise ValueError("La aprobacion exige cobertura WBS/coste del 100%.")
        active = db.query(BimQtoSnapshot).filter(
            BimQtoSnapshot.empresa_id == company_id,
            BimQtoSnapshot.proyecto_id == project_id,
            BimQtoSnapshot.bim_model_version_id == snapshot.bim_model_version_id,
            BimQtoSnapshot.status == "approved",
            BimQtoSnapshot.id != snapshot.id,
        ).with_for_update().all()
        for item in active:
            item.status = "superseded"
            item.lock_version += 1
    snapshot.status = decision
    snapshot.decision_reason = reason.strip()
    snapshot.decided_by = user_id
    snapshot.decided_at = datetime.now(timezone.utc)
    snapshot.lock_version += 1
    db.commit()
    db.refresh(snapshot)
    return _serialize(snapshot)


def get_qto_5d_package(db, *, snapshot_id: int, project_id: int, company_id: int) -> dict:
    snapshot = db.query(BimQtoSnapshot).filter(
        BimQtoSnapshot.id == snapshot_id,
        BimQtoSnapshot.empresa_id == company_id,
        BimQtoSnapshot.proyecto_id == project_id,
    ).first()
    if not snapshot or snapshot.status != "approved":
        raise ValueError("Paquete 5D disponible solo para un QTO aprobado.")
    return {
        "snapshot_id": snapshot.id,
        "project_id": snapshot.proyecto_id,
        "company_id": snapshot.empresa_id,
        "version_id": snapshot.bim_model_version_id,
        "revision": snapshot.revision,
        "qto_checksum_sha256": snapshot.checksum_sha256,
        "rows": list(snapshot.rows_json or []),
        "totals": list(snapshot.totals_json or []),
        "coverage": dict(snapshot.coverage_json or {}),
        "approved_by": snapshot.decided_by,
        "approved_at": snapshot.decided_at,
    }
