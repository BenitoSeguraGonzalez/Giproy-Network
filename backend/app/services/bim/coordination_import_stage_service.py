from __future__ import annotations

import base64
import hashlib
import json
from datetime import datetime, timezone
from pathlib import Path

from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.models.bim_coordination import CoordinationImportStage, ProjectCoordinationSet
from app.models.proyecto import Proyecto
from app.models.usuario import Usuario


FORMAT_EXTENSIONS = {
    "ifc": {".ifc"}, "bcf": {".bcf", ".bcfzip"}, "mspdi": {".xml"},
    "p6_xml": {".xml"}, "p6_xer": {".xer"}, "xlsx": {".xlsx"},
    "json": {".json"}, "connector": {".json"},
}
DOMAIN_FORMATS = {
    "bim": {"ifc", "bcf", "json"}, "schedule": {"mspdi", "p6_xml", "p6_xer", "json"},
    "budget": {"xlsx", "json"}, "connector": {"connector", "json"},
}
MAX_STAGE_BYTES = 25 * 1024 * 1024


def _decode(payload) -> bytes:
    try:
        content = base64.b64decode(payload.content_base64, validate=True)
    except Exception as exc:
        raise HTTPException(status_code=400, detail="El contenido staging no es Base64 valido.") from exc
    if not content or len(content) > MAX_STAGE_BYTES:
        raise HTTPException(status_code=413 if content else 400, detail="Tamano de staging invalido (maximo 25 MiB).")
    return content


def _validate_signature(source_format: str, content: bytes) -> list[str]:
    prefix = content[:4096]
    text = prefix.decode("utf-8", errors="ignore").lstrip("\ufeff\r\n\t ")
    errors = []
    if source_format == "ifc" and not text.startswith("ISO-10303-21"):
        errors.append("ifc_signature_missing")
    elif source_format in {"bcf", "xlsx"} and not content.startswith(b"PK"):
        errors.append("zip_signature_missing")
    elif source_format == "mspdi" and not (text.startswith("<") and "Project" in text):
        errors.append("mspdi_project_missing")
    elif source_format == "p6_xml" and not text.startswith("<"):
        errors.append("p6_xml_signature_missing")
    elif source_format == "p6_xer" and "ERMHDR" not in text:
        errors.append("p6_xer_header_missing")
    elif source_format in {"json", "connector"}:
        try: json.loads(content.decode("utf-8"))
        except Exception: errors.append("json_invalid")
    return errors


def create_preflight(db: Session, *, project_id: int, company_id: int, user_id: int, payload) -> dict:
    project = db.query(Proyecto).filter(Proyecto.id == project_id, Proyecto.empresa_id == company_id).first()
    user = db.query(Usuario).filter(Usuario.id == user_id, Usuario.empresa_id == company_id).first()
    if not project or not user:
        raise HTTPException(status_code=404, detail="Proyecto o usuario fuera de la empresa activa.")
    source_format = payload.source_format.strip().lower()
    source_domain = payload.source_domain.strip().lower()
    if source_format not in FORMAT_EXTENSIONS or source_format not in DOMAIN_FORMATS.get(source_domain, set()):
        raise HTTPException(status_code=400, detail="Combinacion de dominio y formato no admitida.")
    if Path(payload.filename).suffix.lower() not in FORMAT_EXTENSIONS[source_format]:
        raise HTTPException(status_code=400, detail="La extension no coincide con el formato declarado.")
    if payload.coordination_set_id and not db.query(ProjectCoordinationSet).filter(
        ProjectCoordinationSet.id == payload.coordination_set_id,
        ProjectCoordinationSet.proyecto_id == project_id,
        ProjectCoordinationSet.empresa_id == company_id,
    ).first():
        raise HTTPException(status_code=400, detail="Conjunto de coordinacion fuera del proyecto.")
    content = _decode(payload)
    checksum = hashlib.sha256(content).hexdigest()
    existing = db.query(CoordinationImportStage).filter(
        CoordinationImportStage.empresa_id == company_id,
        CoordinationImportStage.proyecto_id == project_id,
        CoordinationImportStage.source_format == source_format,
        CoordinationImportStage.checksum_sha256 == checksum,
    ).first()
    if existing:
        result = serialize(existing); result["duplicate"] = True; return result
    errors = _validate_signature(source_format, content)
    item = CoordinationImportStage(
        empresa_id=company_id, proyecto_id=project_id,
        coordination_set_id=payload.coordination_set_id,
        source_domain=source_domain, source_format=source_format,
        filename=Path(payload.filename).name, checksum_sha256=checksum,
        byte_size=len(content), status="preflight_failed" if errors else "preflight_ready",
        manifest_json={"writes_to_domains": 0, "extension": Path(payload.filename).suffix.lower()},
        errors_json=errors, created_by=user_id,
    )
    db.add(item); db.commit(); db.refresh(item)
    result = serialize(item); result["duplicate"] = False; return result


def confirm_preflight(db: Session, *, stage_id: int, project_id: int, company_id: int, user_id: int, payload) -> dict:
    if not db.query(Usuario).filter(Usuario.id == user_id, Usuario.empresa_id == company_id).first():
        raise HTTPException(status_code=404, detail="Usuario fuera de la empresa activa.")
    item = db.query(CoordinationImportStage).filter(
        CoordinationImportStage.id == stage_id,
        CoordinationImportStage.proyecto_id == project_id,
        CoordinationImportStage.empresa_id == company_id,
    ).first()
    if not item:
        raise HTTPException(status_code=404, detail="Staging no encontrado.")
    if item.status == "confirmed" and item.checksum_sha256 == payload.expected_checksum_sha256.lower():
        result = serialize(item); result["duplicate_confirmation"] = True; return result
    if item.status != "preflight_ready" or item.errors_json:
        raise HTTPException(status_code=409, detail="Solo un preflight valido puede confirmarse.")
    if item.checksum_sha256 != payload.expected_checksum_sha256.lower():
        raise HTTPException(status_code=409, detail="El contenido cambio desde el preflight.")
    item.status = "confirmed"; item.confirmed_by = user_id; item.confirmed_at = datetime.now(timezone.utc)
    manifest = dict(item.manifest_json or {}); manifest["confirmation_reason"] = payload.reason; manifest["writes_to_domains"] = 0
    item.manifest_json = manifest
    db.commit(); db.refresh(item)
    result = serialize(item); result["duplicate_confirmation"] = False; return result


def claim_confirmed_stage(
    db: Session,
    *,
    stage_id: int,
    project_id: int,
    company_id: int,
    user_id: int,
    source_domain: str,
    source_format: str,
    content: bytes,
    operation_key: str,
) -> dict:
    """Claim one confirmed payload before a domain importer is allowed to write.

    A completed operation returns its stored result, making client retries safe.
    A stage cannot be claimed with different bytes, scope, format or operation.
    """
    if not db.query(Usuario).filter(Usuario.id == user_id, Usuario.empresa_id == company_id).first():
        raise HTTPException(status_code=404, detail="Usuario fuera de la empresa activa.")
    checksum = hashlib.sha256(content).hexdigest()
    item = db.query(CoordinationImportStage).filter(
        CoordinationImportStage.id == stage_id,
        CoordinationImportStage.proyecto_id == project_id,
        CoordinationImportStage.empresa_id == company_id,
    ).with_for_update().first()
    if not item:
        raise HTTPException(status_code=404, detail="Staging no encontrado.")
    if item.source_domain != source_domain or item.source_format != source_format:
        raise HTTPException(status_code=409, detail="El staging no corresponde al dominio y formato del importador.")
    if item.checksum_sha256 != checksum or item.byte_size != len(content):
        raise HTTPException(status_code=409, detail="El contenido no coincide con el staging confirmado.")
    manifest = dict(item.manifest_json or {})
    previous_key = manifest.get("operation_key")
    if item.status == "consumed":
        if previous_key != operation_key:
            raise HTTPException(status_code=409, detail="El staging ya fue consumido por otra operacion.")
        return {"duplicate_consumption": True, "result": manifest.get("result"), "stage": serialize(item)}
    if item.status == "consuming":
        raise HTTPException(status_code=409, detail="El staging ya esta siendo consumido.")
    if item.status != "confirmed":
        raise HTTPException(status_code=409, detail="Solo un staging confirmado puede consumirse.")
    if previous_key and previous_key != operation_key:
        raise HTTPException(status_code=409, detail="El staging esta reservado para otra operacion.")
    item.status = "consuming"
    manifest.update({
        "operation_key": operation_key,
        "claimed_by": user_id,
        "claimed_at": datetime.now(timezone.utc).isoformat(),
        "writes_to_domains": 0,
    })
    item.manifest_json = manifest
    db.commit(); db.refresh(item)
    return {"duplicate_consumption": False, "result": None, "stage": serialize(item)}


def claim_confirmed_stage_reference(
    db: Session,
    *,
    stage_id: int,
    project_id: int,
    company_id: int,
    user_id: int,
    source_domain: str,
    source_format: str,
    expected_checksum_sha256: str,
    expected_filename: str,
    operation_key: str,
) -> dict:
    """Claim a confirmed stage when parsing already produced a canonical document."""
    if not db.query(Usuario).filter(Usuario.id == user_id, Usuario.empresa_id == company_id).first():
        raise HTTPException(status_code=404, detail="Usuario fuera de la empresa activa.")
    item = db.query(CoordinationImportStage).filter(
        CoordinationImportStage.id == stage_id,
        CoordinationImportStage.proyecto_id == project_id,
        CoordinationImportStage.empresa_id == company_id,
    ).with_for_update().first()
    if not item:
        raise HTTPException(status_code=404, detail="Staging no encontrado.")
    if item.source_domain != source_domain or item.source_format != source_format:
        raise HTTPException(status_code=409, detail="El staging no corresponde al importador solicitado.")
    if item.checksum_sha256 != expected_checksum_sha256.lower() or item.filename != Path(expected_filename).name:
        raise HTTPException(status_code=409, detail="El documento canonico no corresponde al archivo confirmado.")
    manifest = dict(item.manifest_json or {})
    previous_key = manifest.get("operation_key")
    if item.status == "consumed" and previous_key == operation_key:
        return {"duplicate_consumption": True, "result": manifest.get("result"), "stage": serialize(item)}
    if item.status != "confirmed":
        raise HTTPException(status_code=409, detail="Solo un staging confirmado puede consumirse.")
    if previous_key and previous_key != operation_key:
        raise HTTPException(status_code=409, detail="El staging esta reservado para otra operacion.")
    item.status = "consuming"
    manifest.update({"operation_key": operation_key, "claimed_by": user_id, "claimed_at": datetime.now(timezone.utc).isoformat(), "writes_to_domains": 0})
    item.manifest_json = manifest
    db.commit(); db.refresh(item)
    return {"duplicate_consumption": False, "result": None, "stage": serialize(item)}


def complete_stage_consumption(db: Session, *, stage_id: int, operation_key: str, result: dict) -> dict:
    item = db.query(CoordinationImportStage).filter(CoordinationImportStage.id == stage_id).with_for_update().first()
    if not item:
        raise HTTPException(status_code=404, detail="Staging no encontrado.")
    manifest = dict(item.manifest_json or {})
    if manifest.get("operation_key") != operation_key:
        raise HTTPException(status_code=409, detail="La operacion no posee el staging.")
    if item.status == "consumed":
        return serialize(item)
    if item.status != "consuming":
        raise HTTPException(status_code=409, detail="El staging no esta en consumo.")
    manifest.update({
        "result": result,
        "consumed_at": datetime.now(timezone.utc).isoformat(),
        "writes_to_domains": 1,
    })
    item.manifest_json = manifest
    item.status = "consumed"
    db.commit(); db.refresh(item)
    return serialize(item)


def release_failed_stage_consumption(db: Session, *, stage_id: int, operation_key: str, error_code: str) -> dict:
    item = db.query(CoordinationImportStage).filter(CoordinationImportStage.id == stage_id).with_for_update().first()
    if not item:
        raise HTTPException(status_code=404, detail="Staging no encontrado.")
    manifest = dict(item.manifest_json or {})
    if manifest.get("operation_key") != operation_key or item.status != "consuming":
        raise HTTPException(status_code=409, detail="La operacion no puede liberar este staging.")
    manifest.update({
        "last_failure": {"code": error_code, "at": datetime.now(timezone.utc).isoformat()},
        "writes_to_domains": 0,
    })
    item.manifest_json = manifest
    item.status = "confirmed"
    db.commit(); db.refresh(item)
    return serialize(item)


def serialize(item: CoordinationImportStage) -> dict:
    return {
        "id": item.id, "project_id": item.proyecto_id,
        "coordination_set_id": item.coordination_set_id,
        "source_domain": item.source_domain, "source_format": item.source_format,
        "filename": item.filename, "checksum_sha256": item.checksum_sha256,
        "byte_size": item.byte_size, "status": item.status,
        "manifest": item.manifest_json or {}, "errors": item.errors_json or [],
    }
