import json
import hashlib
from collections import Counter, defaultdict
from pathlib import Path
from typing import Any

from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.bim_element import BimElement
from app.models.bim_model import BimModel
from app.models.bim_model_version import BimModelVersion
from app.models.bim_storey import BimStorey
from app.schemas.bim_model import BimViewerArtifactResponse
from app.services.bim.artifact_registry import (
    get_active_artifact,
    next_artifact_generation,
    stage_artifact_file,
)


def generate_viewer_artifact(
    db: Session,
    *,
    project_id: int,
    company_id: int,
    version_id: int,
    storage_root: Path | None = None,
) -> BimViewerArtifactResponse:
    version = (
        db.query(BimModelVersion)
        .join(BimModel)
        .filter(
            BimModelVersion.id == version_id,
            BimModel.proyecto_id == project_id,
            BimModel.empresa_id == company_id,
        )
        .first()
    )
    if version is None:
        raise ValueError("Version BIM no encontrada para este proyecto.")

    storeys = (
        db.query(BimStorey)
        .filter(BimStorey.bim_model_version_id == version.id)
        .order_by(BimStorey.orden.asc(), BimStorey.id.asc())
        .all()
    )
    elements = (
        db.query(BimElement)
        .filter(BimElement.bim_model_version_id == version.id)
        .order_by(BimElement.id.asc())
        .all()
    )
    if not elements:
        raise ValueError("La version BIM no contiene elementos para optimizar.")

    artifact_payload = _build_viewer_artifact_payload(version=version, storeys=storeys, elements=elements)
    artifact_bytes = json.dumps(artifact_payload, ensure_ascii=False, sort_keys=True).encode("utf-8")
    artifact_checksum = hashlib.sha256(artifact_bytes).hexdigest()
    active_artifact = get_active_artifact(
        db,
        version_id=version.id,
        project_id=project_id,
        company_id=company_id,
        artifact_type="viewer_json",
    )
    if active_artifact and active_artifact.checksum_sha256 == artifact_checksum:
        return _viewer_artifact_response(active_artifact, artifact_payload)
    source_artifact = get_active_artifact(
        db,
        version_id=version.id,
        project_id=project_id,
        company_id=company_id,
        artifact_type="source_ifc",
    )

    generation = next_artifact_generation(db, version_id=version.id, artifact_type="viewer_json")
    artifact_path = _write_viewer_artifact(
        artifact_bytes,
        company_id=company_id,
        project_id=project_id,
        version_id=version.id,
        generation=generation,
        storage_root=storage_root,
    )
    artifact = stage_artifact_file(
        db,
        version_id=version.id,
        project_id=project_id,
        company_id=company_id,
        artifact_type="viewer_json",
        artifact_path=artifact_path,
        source_checksum_sha256=(source_artifact.checksum_sha256 if source_artifact else None),
        metadata={"element_count": len(elements), "storey_count": len(storeys)},
    )

    marker = f"viewer_artifact_path={artifact_path}"
    notes = (version.notes or "").strip()
    if marker not in notes:
        version.notes = "\n".join(line for line in [notes, marker] if line)
    db.commit()
    db.refresh(artifact)

    return _viewer_artifact_response(artifact, artifact_payload)


def _viewer_artifact_response(artifact, payload: dict[str, Any]) -> BimViewerArtifactResponse:
    property_keys = set(payload["indexes"]["properties"].keys())
    return BimViewerArtifactResponse(
        artifact_id=artifact.id,
        version_id=artifact.bim_model_version_id,
        artifact_path=artifact.artifact_path,
        artifact_type=artifact.artifact_type,
        contract_version=artifact.contract_version,
        generation=artifact.generation,
        checksum_sha256=artifact.checksum_sha256,
        file_size_bytes=artifact.file_size_bytes,
        status=artifact.status,
        element_count=payload["summary"]["element_count"],
        storey_count=payload["summary"]["storey_count"],
        ifc_class_count=len(payload["indexes"]["ifc_classes"]),
        property_key_count=len(property_keys),
    )


def _build_viewer_artifact_payload(
    *,
    version: BimModelVersion,
    storeys: list[BimStorey],
    elements: list[BimElement],
) -> dict[str, Any]:
    ifc_class_counts = Counter((element.ifc_class or "IFCUNKNOWN") for element in elements)
    elements_by_storey: dict[str, list[int]] = defaultdict(list)
    elements_by_class: dict[str, list[int]] = defaultdict(list)
    properties_index: dict[str, list[int]] = defaultdict(list)
    optimized_elements = []

    for index, element in enumerate(elements):
        properties = element.properties or {}
        storey_name = element.storey_name or "Sin nivel"
        ifc_class = element.ifc_class or "IFCUNKNOWN"
        viewer_id = index + 1
        elements_by_storey[storey_name].append(viewer_id)
        elements_by_class[ifc_class].append(viewer_id)
        for key in properties.keys():
            properties_index[str(key)].append(viewer_id)
        optimized_elements.append(
            {
                "viewer_id": viewer_id,
                "bim_element_id": element.id,
                "global_id": element.global_id,
                "ifc_class": ifc_class,
                "name": element.nombre,
                "storey_name": element.storey_name,
                "bounds_2d": _extract_bounds_2d(element.metadata_json or {}, fallback_index=index),
                "property_count": len(properties),
            }
        )

    return {
        "artifact_type": "giproy_bim_viewer_artifact",
        "artifact_version": 1,
        "source_version_id": version.id,
        "source_filename": version.source_filename,
        "source_artifact_path": version.artifact_path,
        "summary": {
            "element_count": len(elements),
            "storey_count": len(storeys),
            "ifc_class_count": len(ifc_class_counts),
        },
        "storeys": [
            {"id": storey.id, "name": storey.nombre, "code": storey.codigo, "order": storey.orden}
            for storey in storeys
        ],
        "elements": optimized_elements,
        "indexes": {
            "storeys": dict(sorted(elements_by_storey.items())),
            "ifc_classes": dict(sorted(elements_by_class.items())),
            "properties": dict(sorted(properties_index.items())),
            "ifc_class_counts": dict(sorted(ifc_class_counts.items())),
        },
    }


def _write_viewer_artifact(
    content: bytes,
    *,
    company_id: int,
    project_id: int,
    version_id: int,
    generation: int,
    storage_root: Path | None,
) -> str:
    root = Path(storage_root or settings.BIM_LOCAL_STORAGE_DIR)
    target_dir = root / str(company_id) / str(project_id) / "artifacts"
    target_dir.mkdir(parents=True, exist_ok=True)
    suffix = "" if generation == 1 else f"-g{generation}"
    target_path = target_dir / f"viewer-artifact-v{version_id}{suffix}.json"
    temporary_path = target_path.with_suffix(".json.tmp")
    temporary_path.write_bytes(content)
    temporary_path.replace(target_path)
    return str(target_path).replace("\\", "/")


def _extract_bounds_2d(metadata: dict[str, Any], *, fallback_index: int) -> dict[str, float]:
    geometry = metadata.get("geometry_2d") if isinstance(metadata, dict) else None
    if isinstance(geometry, dict) and all(isinstance(geometry.get(key), (int, float)) for key in ("x", "y", "width", "height")):
        x = float(geometry["x"])
        y = float(geometry["y"])
        width = float(geometry["width"])
        height = float(geometry["height"])
        return {"min_x": x, "min_y": y, "max_x": x + width, "max_y": y + height}

    column = fallback_index % 12
    row = fallback_index // 12
    x = float(column * 8)
    y = float(row * 8)
    return {"min_x": x, "min_y": y, "max_x": x + 6.0, "max_y": y + 6.0}
