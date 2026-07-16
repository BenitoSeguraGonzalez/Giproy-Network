from __future__ import annotations

import hashlib
import json
import re
from pathlib import Path

from sqlalchemy import func, inspect
from sqlalchemy.orm import Session

from app.models.bim_artifact import BimArtifact
from app.models.bim_model import BimModel
from app.models.bim_model_version import BimModelVersion
from app.schemas.bim_model import BimArtifactResponse
from app.core.config import settings


ARTIFACT_CONTRACTS = {
    "source_ifc": "giproy_bim_source_ifc_v1",
    "viewer_json": "giproy_bim_viewer_artifact_v1",
    "fragments": "giproy_bim_fragments_v1",
}


def ensure_bim_artifacts_table(db: Session) -> None:
    if "bim_artifacts" not in set(inspect(db.bind).get_table_names()):
        raise RuntimeError("El esquema lifecycle de artifacts BIM no esta disponible. Ejecuta la migracion Alembic BIM.")


def _resolve_version(db: Session, *, version_id: int, project_id: int, company_id: int) -> BimModelVersion:
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
        raise ValueError("Version BIM no encontrada para el artifact y tenant indicados.")
    return version


def next_artifact_generation(db: Session, *, version_id: int, artifact_type: str) -> int:
    current = (
        db.query(func.max(BimArtifact.generation))
        .filter(BimArtifact.bim_model_version_id == version_id, BimArtifact.artifact_type == artifact_type)
        .scalar()
    )
    return int(current or 0) + 1


def get_active_artifact(db: Session, *, version_id: int, project_id: int, company_id: int, artifact_type: str) -> BimArtifact | None:
    ensure_bim_artifacts_table(db)
    return (
        db.query(BimArtifact)
        .filter(
            BimArtifact.bim_model_version_id == version_id,
            BimArtifact.proyecto_id == project_id,
            BimArtifact.empresa_id == company_id,
            BimArtifact.artifact_type == artifact_type,
            BimArtifact.status == "active",
        )
        .order_by(BimArtifact.generation.desc())
        .first()
    )


def stage_artifact_file(
    db: Session,
    *,
    version_id: int,
    project_id: int,
    company_id: int,
    artifact_type: str,
    artifact_path: str,
    contract_version: str | None = None,
    source_checksum_sha256: str | None = None,
    metadata: dict | None = None,
) -> BimArtifact:
    ensure_bim_artifacts_table(db)
    _resolve_version(db, version_id=version_id, project_id=project_id, company_id=company_id)
    if artifact_type not in ARTIFACT_CONTRACTS:
        raise ValueError("Tipo de artifact BIM no soportado.")
    resolved_contract = contract_version or ARTIFACT_CONTRACTS[artifact_type]
    path = Path(artifact_path)
    if not path.is_file():
        raise ValueError("El archivo del artifact BIM no existe.")
    content = path.read_bytes()
    checksum = hashlib.sha256(content).hexdigest()
    active = get_active_artifact(
        db,
        version_id=version_id,
        project_id=project_id,
        company_id=company_id,
        artifact_type=artifact_type,
    )
    if active and active.checksum_sha256 == checksum and active.contract_version == resolved_contract:
        return active
    if active:
        active.status = "superseded"
    artifact = BimArtifact(
        bim_model_version_id=version_id,
        proyecto_id=project_id,
        empresa_id=company_id,
        artifact_type=artifact_type,
        contract_version=resolved_contract,
        generation=next_artifact_generation(db, version_id=version_id, artifact_type=artifact_type),
        artifact_path=str(path).replace("\\", "/"),
        checksum_sha256=checksum,
        file_size_bytes=len(content),
        source_checksum_sha256=source_checksum_sha256,
        status="active",
        metadata_json=metadata or {},
    )
    db.add(artifact)
    db.flush()
    return artifact


def store_artifact_bytes(
    db: Session,
    *,
    version_id: int,
    project_id: int,
    company_id: int,
    artifact_type: str,
    content: bytes,
    source_filename: str,
    source_checksum_sha256: str | None = None,
    storage_root: Path | None = None,
) -> BimArtifact:
    ensure_bim_artifacts_table(db)
    if artifact_type not in {"viewer_json", "fragments"}:
        raise ValueError("Solo se admite registrar viewer_json o fragments derivados.")
    if not content:
        raise ValueError("El artifact BIM esta vacio.")
    checksum = hashlib.sha256(content).hexdigest()
    active = get_active_artifact(
        db,
        version_id=version_id,
        project_id=project_id,
        company_id=company_id,
        artifact_type=artifact_type,
    )
    if active and active.checksum_sha256 == checksum and active.contract_version == ARTIFACT_CONTRACTS[artifact_type]:
        return active
    generation = next_artifact_generation(db, version_id=version_id, artifact_type=artifact_type)
    safe_name = re.sub(r"[^A-Za-z0-9._-]+", "_", Path(source_filename or "artifact.bin").name)
    extension = Path(safe_name).suffix or (".json" if artifact_type == "viewer_json" else ".frag")
    target_dir = Path(storage_root or settings.BIM_LOCAL_STORAGE_DIR) / str(company_id) / str(project_id) / "artifacts"
    target_dir.mkdir(parents=True, exist_ok=True)
    target_path = target_dir / f"{artifact_type}-v{version_id}-g{generation}{extension}"
    temporary_path = target_path.with_suffix(f"{target_path.suffix}.tmp")
    temporary_path.write_bytes(content)
    temporary_path.replace(target_path)
    try:
        artifact = stage_artifact_file(
            db,
            version_id=version_id,
            project_id=project_id,
            company_id=company_id,
            artifact_type=artifact_type,
            artifact_path=str(target_path),
            source_checksum_sha256=source_checksum_sha256,
            metadata={"source_filename": safe_name},
        )
        db.commit()
        db.refresh(artifact)
        return artifact
    except Exception:
        db.rollback()
        if target_path.exists():
            target_path.unlink()
        raise


def list_artifacts(db: Session, *, version_id: int, project_id: int, company_id: int) -> list[BimArtifact]:
    ensure_bim_artifacts_table(db)
    _resolve_version(db, version_id=version_id, project_id=project_id, company_id=company_id)
    return (
        db.query(BimArtifact)
        .filter(
            BimArtifact.bim_model_version_id == version_id,
            BimArtifact.proyecto_id == project_id,
            BimArtifact.empresa_id == company_id,
        )
        .order_by(BimArtifact.artifact_type.asc(), BimArtifact.generation.desc())
        .all()
    )


def get_artifact(db: Session, *, artifact_id: int, project_id: int, company_id: int) -> BimArtifact:
    ensure_bim_artifacts_table(db)
    artifact = (
        db.query(BimArtifact)
        .filter(BimArtifact.id == artifact_id, BimArtifact.proyecto_id == project_id, BimArtifact.empresa_id == company_id)
        .first()
    )
    if artifact is None:
        raise ValueError("Artifact BIM no encontrado para este proyecto y empresa.")
    return artifact


def validate_artifact(db: Session, artifact: BimArtifact) -> BimArtifact:
    path = Path(artifact.artifact_path)
    if not path.is_file() or hashlib.sha256(path.read_bytes()).hexdigest() != artifact.checksum_sha256:
        artifact.status = "corrupt"
    elif artifact.contract_version != ARTIFACT_CONTRACTS.get(artifact.artifact_type):
        artifact.status = "incompatible"
    elif artifact.artifact_type == "viewer_json":
        try:
            payload = json.loads(path.read_text(encoding="utf-8"))
            compatible = payload.get("artifact_type") == "giproy_bim_viewer_artifact" and payload.get("artifact_version") == 1
        except (OSError, UnicodeError, json.JSONDecodeError):
            compatible = False
        artifact.status = "active" if compatible else "incompatible"
    db.commit()
    db.refresh(artifact)
    return artifact


def rollback_artifact(db: Session, *, artifact_id: int, project_id: int, company_id: int) -> BimArtifact:
    ensure_bim_artifacts_table(db)
    current = (
        db.query(BimArtifact)
        .filter(BimArtifact.id == artifact_id, BimArtifact.proyecto_id == project_id, BimArtifact.empresa_id == company_id)
        .first()
    )
    if current is None or current.status not in {"active", "corrupt", "incompatible"}:
        raise ValueError("Artifact BIM actual no disponible para rollback.")
    previous = (
        db.query(BimArtifact)
        .filter(
            BimArtifact.bim_model_version_id == current.bim_model_version_id,
            BimArtifact.artifact_type == current.artifact_type,
            BimArtifact.generation < current.generation,
            BimArtifact.status == "superseded",
        )
        .order_by(BimArtifact.generation.desc())
        .first()
    )
    if previous is None:
        raise ValueError("No existe una generacion anterior compatible para rollback.")
    validated = validate_artifact(db, previous)
    if validated.status != "active":
        raise ValueError("La generacion anterior no supera la validacion de integridad/contrato.")
    current.status = "rolled_back"
    previous.status = "active"
    db.commit()
    db.refresh(previous)
    return previous


def serialize_artifact(artifact: BimArtifact) -> BimArtifactResponse:
    return BimArtifactResponse.model_validate(artifact, from_attributes=True)
