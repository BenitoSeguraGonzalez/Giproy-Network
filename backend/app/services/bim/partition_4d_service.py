import hashlib
import json
import math

from fastapi import HTTPException

from app.models.bim_4d_partition import Bim4dPartitionArtifact, Bim4dPartitionCsgArtifact, Bim4dPartitionSpec
from app.models.bim_element import BimElement
from app.models.bim_model import BimModel
from app.models.bim_model_version import BimModelVersion


def _element(db, *, element_id, project_id, company_id):
    element = db.query(BimElement).join(BimModelVersion).join(BimModel).filter(BimElement.id == element_id, BimModel.proyecto_id == project_id, BimModel.empresa_id == company_id).first()
    if not element:
        raise HTTPException(status_code=404, detail="Elemento fuera del proyecto BIM activo.")
    return element


def _bounds(element):
    geometry = (element.metadata_json or {}).get("geometry_2d") or {}
    width = max(0.01, float(geometry.get("width") or 1))
    depth = max(0.01, float(geometry.get("height") or 1))
    raw_height = (element.properties or {}).get("Height") or (element.properties or {}).get("Altura")
    try:
        height = float(raw_height)
    except (TypeError, ValueError):
        try:
            height = float(str(raw_height).strip().split()[0])
        except (TypeError, ValueError):
            height = min(width, depth, 3)
    height = max(0.01, height)
    return {"width": width, "height": height, "depth": depth}


def _serialize(spec, element):
    return {"id": spec.id, "project_id": spec.proyecto_id, "company_id": spec.empresa_id, "version_id": spec.bim_model_version_id, "element_id": spec.bim_element_id, "global_id": element.global_id, "revision": spec.revision, "axis": spec.axis, "segment_count": spec.segment_count, "gap_ratio": spec.gap_ratio, "status": spec.status, "materialized": spec.status == "materialized", "preview_bounds": _bounds(element), "created_by": spec.created_by, "created_at": spec.created_at}


def _artifact_payload(spec, element):
    bounds = _bounds(element)
    dimensions = {"x": bounds["width"], "y": bounds["height"], "z": bounds["depth"]}
    axis_length = dimensions[spec.axis]
    occupied_length = axis_length * (1 - spec.gap_ratio)
    segment_length = occupied_length / spec.segment_count
    gap_length = axis_length * spec.gap_ratio / (spec.segment_count - 1)
    cursor = -axis_length / 2
    segments = []
    for index in range(spec.segment_count):
        minimum = {key: -value / 2 for key, value in dimensions.items()}
        maximum = {key: value / 2 for key, value in dimensions.items()}
        minimum[spec.axis] = cursor
        maximum[spec.axis] = cursor + segment_length
        lengths = {key: maximum[key] - minimum[key] for key in dimensions}
        volume = lengths["x"] * lengths["y"] * lengths["z"]
        surface = 2 * (lengths["x"] * lengths["y"] + lengths["x"] * lengths["z"] + lengths["y"] * lengths["z"])
        segments.append({"index": index + 1, "source_global_id": element.global_id, "min": minimum, "max": maximum, "volume": volume, "surface_area": surface})
        cursor += segment_length + gap_length
    return {
        "contract_version": "giproy_bim_4d_partition_artifact_v1",
        "partition_spec_id": spec.id,
        "source_global_id": element.global_id,
        "geometry_method": "bounding_box_v1",
        "exact_ifc_csg": False,
        "segments": segments,
        "total_volume": sum(item["volume"] for item in segments),
        "total_surface_area": sum(item["surface_area"] for item in segments),
    }


def _serialize_artifact(artifact, element):
    payload = dict(artifact.geometry_json)
    payload.update({"id": artifact.id, "project_id": artifact.proyecto_id, "company_id": artifact.empresa_id, "version_id": artifact.bim_model_version_id, "element_id": artifact.bim_element_id, "source_global_id": element.global_id, "checksum_sha256": artifact.checksum_sha256, "total_volume": artifact.total_volume, "total_surface_area": artifact.total_surface_area, "created_by": artifact.created_by, "created_at": artifact.created_at})
    return payload


def create_partition_spec(db, *, project_id, company_id, user_id, payload):
    element = _element(db, element_id=payload.element_id, project_id=project_id, company_id=company_id)
    duplicate = db.query(Bim4dPartitionSpec).filter(Bim4dPartitionSpec.bim_element_id == element.id, Bim4dPartitionSpec.revision == payload.revision).first()
    if duplicate:
        raise HTTPException(status_code=409, detail="La revision de particion ya existe para el elemento.")
    spec = Bim4dPartitionSpec(empresa_id=company_id, proyecto_id=project_id, bim_model_version_id=element.bim_model_version_id, bim_element_id=element.id, created_by=user_id, status="preview", **payload.model_dump(exclude={"element_id"}))
    db.add(spec); db.commit(); db.refresh(spec)
    return _serialize(spec, element)


def list_partition_specs(db, *, project_id, company_id, element_id=None):
    query = db.query(Bim4dPartitionSpec, BimElement).join(BimElement, BimElement.id == Bim4dPartitionSpec.bim_element_id).filter(Bim4dPartitionSpec.proyecto_id == project_id, Bim4dPartitionSpec.empresa_id == company_id)
    if element_id: query = query.filter(Bim4dPartitionSpec.bim_element_id == element_id)
    return [_serialize(spec, element) for spec, element in query.order_by(Bim4dPartitionSpec.created_at.desc()).all()]


def delete_partition_spec(db, *, spec_id, project_id, company_id):
    spec = db.query(Bim4dPartitionSpec).filter(Bim4dPartitionSpec.id == spec_id, Bim4dPartitionSpec.proyecto_id == project_id, Bim4dPartitionSpec.empresa_id == company_id).first()
    if not spec: raise HTTPException(status_code=404, detail="Particion BIM fuera del proyecto activo.")
    db.delete(spec); db.commit()


def materialize_partition(db, *, spec_id, project_id, company_id, user_id):
    row = db.query(Bim4dPartitionSpec, BimElement).join(BimElement, BimElement.id == Bim4dPartitionSpec.bim_element_id).filter(Bim4dPartitionSpec.id == spec_id, Bim4dPartitionSpec.proyecto_id == project_id, Bim4dPartitionSpec.empresa_id == company_id).first()
    if not row:
        raise HTTPException(status_code=404, detail="Particion BIM fuera del proyecto activo.")
    spec, element = row
    existing = db.query(Bim4dPartitionArtifact).filter(Bim4dPartitionArtifact.partition_spec_id == spec.id).first()
    if existing:
        return _serialize_artifact(existing, element)
    payload = _artifact_payload(spec, element)
    canonical = json.dumps(payload, sort_keys=True, separators=(",", ":")).encode("utf-8")
    artifact = Bim4dPartitionArtifact(empresa_id=company_id, proyecto_id=project_id, bim_model_version_id=spec.bim_model_version_id, bim_element_id=spec.bim_element_id, partition_spec_id=spec.id, contract_version=payload["contract_version"], geometry_method=payload["geometry_method"], checksum_sha256=hashlib.sha256(canonical).hexdigest(), geometry_json=payload, total_volume=payload["total_volume"], total_surface_area=payload["total_surface_area"], created_by=user_id)
    spec.status = "materialized"
    db.add(artifact); db.commit(); db.refresh(artifact)
    return _serialize_artifact(artifact, element)


def get_partition_artifact(db, *, spec_id, project_id, company_id):
    row = db.query(Bim4dPartitionArtifact, BimElement).join(BimElement, BimElement.id == Bim4dPartitionArtifact.bim_element_id).filter(Bim4dPartitionArtifact.partition_spec_id == spec_id, Bim4dPartitionArtifact.proyecto_id == project_id, Bim4dPartitionArtifact.empresa_id == company_id).first()
    if not row:
        raise HTTPException(status_code=404, detail="La particion BIM aun no esta materializada.")
    return _serialize_artifact(*row)


def _partition_spec_row(db, *, spec_id, project_id, company_id):
    row = db.query(Bim4dPartitionSpec, BimElement).join(BimElement, BimElement.id == Bim4dPartitionSpec.bim_element_id).filter(Bim4dPartitionSpec.id == spec_id, Bim4dPartitionSpec.proyecto_id == project_id, Bim4dPartitionSpec.empresa_id == company_id).first()
    if not row:
        raise HTTPException(status_code=404, detail="Particion BIM fuera del proyecto activo.")
    return row


def _mesh_volume(mesh, *, label):
    positions = mesh["positions"]
    indices = mesh["indices"]
    normals = mesh.get("normals") or []
    if len(positions) % 3 or len(indices) % 3:
        raise HTTPException(status_code=422, detail=f"{label}: posiciones e indices deben formar vertices y triangulos completos.")
    if normals and len(normals) != len(positions):
        raise HTTPException(status_code=422, detail=f"{label}: normals debe coincidir con positions.")
    if not all(math.isfinite(value) for value in positions + normals):
        raise HTTPException(status_code=422, detail=f"{label}: la malla contiene coordenadas no finitas.")
    vertex_count = len(positions) // 3
    if any(index < 0 or index >= vertex_count for index in indices):
        raise HTTPException(status_code=422, detail=f"{label}: indice fuera del rango de vertices.")
    triangle_count = len(indices) // 3
    if mesh["triangle_count"] != triangle_count:
        raise HTTPException(status_code=422, detail=f"{label}: triangle_count no coincide con indices.")
    signed_volume = 0.0
    for offset in range(0, len(indices), 3):
        points = []
        for index in indices[offset:offset + 3]:
            base = index * 3
            points.append(positions[base:base + 3])
        a, b, c = points
        cross_x = b[1] * c[2] - b[2] * c[1]
        cross_y = b[2] * c[0] - b[0] * c[2]
        cross_z = b[0] * c[1] - b[1] * c[0]
        signed_volume += (a[0] * cross_x + a[1] * cross_y + a[2] * cross_z) / 6
    calculated = abs(signed_volume)
    tolerance = max(0.000001, calculated * 0.00001)
    if calculated <= 0 or abs(calculated - mesh["volume"]) > tolerance:
        raise HTTPException(status_code=422, detail=f"{label}: volumen declarado no coincide con la geometria.")
    mesh["volume"] = calculated
    return calculated


def _serialize_csg_artifact(artifact, element):
    payload = dict(artifact.geometry_json)
    payload.update({"id": artifact.id, "partition_spec_id": artifact.partition_spec_id, "project_id": artifact.proyecto_id, "company_id": artifact.empresa_id, "version_id": artifact.bim_model_version_id, "element_id": artifact.bim_element_id, "source_global_id": element.global_id, "checksum_sha256": artifact.checksum_sha256, "partition_volume": artifact.partition_volume, "conservation_delta": artifact.conservation_delta, "created_by": artifact.created_by, "created_at": artifact.created_at})
    return payload


def create_partition_csg_artifact(db, *, spec_id, project_id, company_id, user_id, payload):
    spec, element = _partition_spec_row(db, spec_id=spec_id, project_id=project_id, company_id=company_id)
    if payload.source_global_id != element.global_id:
        raise HTTPException(status_code=422, detail="El GlobalId fuente no coincide con el elemento de la particion.")
    duplicate = db.query(Bim4dPartitionCsgArtifact).filter(Bim4dPartitionCsgArtifact.partition_spec_id == spec.id, Bim4dPartitionCsgArtifact.artifact_revision == payload.artifact_revision).first()
    if duplicate:
        raise HTTPException(status_code=409, detail="La revision del artefacto CSG ya existe.")
    geometry = payload.model_dump()
    if len(geometry["segments"]) != spec.segment_count:
        raise HTTPException(status_code=422, detail="El numero de segmentos CSG no coincide con la especificacion.")
    indexes = [segment["index"] for segment in geometry["segments"]]
    if sorted(indexes) != list(range(1, spec.segment_count + 1)):
        raise HTTPException(status_code=422, detail="Los indices de segmentos CSG deben ser consecutivos y unicos.")
    source_volume = _mesh_volume(geometry["source_mesh"], label="source_mesh")
    partition_volume = sum(_mesh_volume(segment["mesh"], label=f"segmento {segment['index']}") for segment in geometry["segments"])
    conservation_delta = abs(source_volume - partition_volume)
    tolerance = max(0.00001, source_volume * 0.00001)
    if conservation_delta > tolerance or abs(conservation_delta - geometry["conservation_delta"]) > tolerance:
        raise HTTPException(status_code=422, detail="La conservacion volumetrica CSG no es valida.")
    geometry["conservation_delta"] = conservation_delta
    canonical = json.dumps(geometry, sort_keys=True, separators=(",", ":")).encode("utf-8")
    artifact = Bim4dPartitionCsgArtifact(empresa_id=company_id, proyecto_id=project_id, bim_model_version_id=spec.bim_model_version_id, bim_element_id=spec.bim_element_id, partition_spec_id=spec.id, artifact_revision=geometry["artifact_revision"], contract_version=geometry["contract_version"], geometry_method=geometry["geometry_method"], checksum_sha256=hashlib.sha256(canonical).hexdigest(), geometry_json=geometry, source_volume=source_volume, partition_volume=partition_volume, conservation_delta=conservation_delta, created_by=user_id)
    db.add(artifact); db.commit(); db.refresh(artifact)
    return _serialize_csg_artifact(artifact, element)


def list_partition_csg_artifacts(db, *, spec_id, project_id, company_id):
    _partition_spec_row(db, spec_id=spec_id, project_id=project_id, company_id=company_id)
    rows = db.query(Bim4dPartitionCsgArtifact, BimElement).join(BimElement, BimElement.id == Bim4dPartitionCsgArtifact.bim_element_id).filter(Bim4dPartitionCsgArtifact.partition_spec_id == spec_id, Bim4dPartitionCsgArtifact.proyecto_id == project_id, Bim4dPartitionCsgArtifact.empresa_id == company_id).order_by(Bim4dPartitionCsgArtifact.created_at.desc(), Bim4dPartitionCsgArtifact.id.desc()).all()
    return [_serialize_csg_artifact(artifact, element) for artifact, element in rows]
