import csv
import hashlib
import io
import xml.etree.ElementTree as ET
from dataclasses import dataclass
from datetime import datetime, timezone

from fastapi import HTTPException
from sqlalchemy.orm import Session, joinedload

from app.models.bim_element import BimElement
from app.models.bim_ids import BimIdsFinding, BimIdsProfile, BimIdsValidation
from app.models.bim_model import BimModel
from app.models.bim_model_version import BimModelVersion
from app.schemas.bim_ids import BimIdsProfileImportRequest, BimIdsValidationResponse


@dataclass(frozen=True)
class ParsedRequirement:
    requirement_id: str
    specification_name: str
    applicable_ifc_class: str | None
    kind: str
    property_set: str | None
    property_name: str | None
    expected_value: str | None
    severity: str


def _local_name(tag: str) -> str:
    return tag.rsplit("}", 1)[-1]


def _simple_value(node) -> str | None:
    if node is None:
        return None
    for child in node.iter():
        if _local_name(child.tag) in {"simpleValue", "xs:enumeration", "enumeration"}:
            value = child.get("value") or child.text
            if value and value.strip():
                return value.strip()
    return None


def parse_ids(xml_content: str) -> tuple[str, list[ParsedRequirement]]:
    try:
        root = ET.fromstring(xml_content)
    except ET.ParseError as exc:
        raise HTTPException(status_code=400, detail=f"IDS XML invalido: {exc}") from exc
    version = root.get("version") or root.get("idsVersion") or "1.0"
    requirements = []
    specifications = [node for node in root.iter() if _local_name(node.tag) == "specification"]
    if not specifications:
        raise HTTPException(status_code=400, detail="El perfil IDS no contiene specifications.")
    for spec_index, specification in enumerate(specifications, start=1):
        spec_name = specification.get("name") or f"Specification {spec_index}"
        severity = (specification.get("severity") or "error").lower()
        applicability = next((node for node in specification if _local_name(node.tag) == "applicability"), None)
        applicable_entity = next((node for node in applicability or [] if _local_name(node.tag) == "entity"), None)
        applicable_ifc_class = _simple_value(applicable_entity)
        requirement_container = next((node for node in specification if _local_name(node.tag) == "requirements"), None)
        for req_index, requirement in enumerate(requirement_container or [], start=1):
            kind = _local_name(requirement.tag)
            property_set = _simple_value(next((node for node in requirement if _local_name(node.tag) == "propertySet"), None))
            property_name = _simple_value(next((node for node in requirement if _local_name(node.tag) == "baseName"), None))
            expected_value = _simple_value(next((node for node in requirement if _local_name(node.tag) == "value"), None))
            if kind not in {"property", "entity"}:
                continue
            requirements.append(ParsedRequirement(
                requirement_id=requirement.get("id") or f"spec-{spec_index}-req-{req_index}",
                specification_name=spec_name,
                applicable_ifc_class=applicable_ifc_class,
                kind=kind,
                property_set=property_set,
                property_name=property_name,
                expected_value=expected_value,
                severity=severity if severity in {"error", "warning", "info"} else "error",
            ))
    if not requirements:
        raise HTTPException(status_code=400, detail="El perfil IDS no contiene requirements compatibles.")
    return version, requirements


def _property_value(element: BimElement, requirement: ParsedRequirement):
    properties = element.properties or {}
    if requirement.property_set and isinstance(properties.get(requirement.property_set), dict):
        return properties[requirement.property_set].get(requirement.property_name)
    return properties.get(requirement.property_name)


def import_ids_profile(db: Session, *, project_id: int, company_id: int, user_id: int, payload: BimIdsProfileImportRequest):
    ids_version, requirements = parse_ids(payload.xml_content)
    profile = BimIdsProfile(
        proyecto_id=project_id,
        empresa_id=company_id,
        name=payload.name,
        source_filename=payload.source_filename,
        ids_version=ids_version,
        checksum_sha256=hashlib.sha256(payload.xml_content.encode("utf-8")).hexdigest(),
        xml_content=payload.xml_content,
        created_by=user_id,
    )
    db.add(profile)
    db.commit()
    db.refresh(profile)
    return profile, len({item.specification_name for item in requirements})


def list_ids_profiles(db: Session, *, project_id: int, company_id: int):
    return db.query(BimIdsProfile).filter(BimIdsProfile.proyecto_id == project_id, BimIdsProfile.empresa_id == company_id).order_by(BimIdsProfile.id.desc()).all()


def _resolve_profile_and_version(db, *, profile_id, version_id, project_id, company_id):
    profile = db.query(BimIdsProfile).filter(BimIdsProfile.id == profile_id, BimIdsProfile.proyecto_id == project_id, BimIdsProfile.empresa_id == company_id).first()
    version = db.query(BimModelVersion).join(BimModel).filter(BimModelVersion.id == version_id, BimModel.proyecto_id == project_id, BimModel.empresa_id == company_id).first()
    if not profile or not version:
        raise HTTPException(status_code=404, detail="Perfil IDS o version BIM fuera del proyecto activo.")
    return profile, version


def run_ids_validation(db: Session, *, profile_id: int, version_id: int, project_id: int, company_id: int, user_id: int) -> BimIdsValidationResponse:
    profile, _ = _resolve_profile_and_version(db, profile_id=profile_id, version_id=version_id, project_id=project_id, company_id=company_id)
    _, requirements = parse_ids(profile.xml_content)
    elements = db.query(BimElement).filter(BimElement.bim_model_version_id == version_id).order_by(BimElement.id).all()
    validation = BimIdsValidation(bim_ids_profile_id=profile.id, bim_model_version_id=version_id, proyecto_id=project_id, empresa_id=company_id, status="completed", summary_json={}, created_by=user_id)
    db.add(validation)
    db.flush()
    counts = {"passed": 0, "failed": 0, "exempted": 0, "requirements": len(requirements), "elements": len(elements)}
    for requirement in requirements:
        applicable = [element for element in elements if not requirement.applicable_ifc_class or str(element.ifc_class or "").casefold() == requirement.applicable_ifc_class.casefold()]
        if not applicable:
            db.add(BimIdsFinding(bim_ids_validation_id=validation.id, requirement_id=requirement.requirement_id, specification_name=requirement.specification_name, global_id=None, severity=requirement.severity, status="failed", message="Ningun elemento cumple la aplicabilidad IDS."))
            counts["failed"] += 1
            continue
        for element in applicable:
            if requirement.kind == "entity":
                actual = str(element.ifc_class or "")
                passed = not requirement.expected_value or actual.casefold() == requirement.expected_value.casefold()
                message = f"Entidad {actual or 'sin clase'}; esperado {requirement.expected_value or requirement.applicable_ifc_class}."
            else:
                actual = _property_value(element, requirement)
                passed = actual is not None and (requirement.expected_value is None or str(actual).casefold() == requirement.expected_value.casefold())
                message = f"{requirement.property_set or 'Pset'}.{requirement.property_name}: {actual if actual is not None else 'ausente'}"
            status = "passed" if passed else "failed"
            counts[status] += 1
            db.add(BimIdsFinding(bim_ids_validation_id=validation.id, requirement_id=requirement.requirement_id, specification_name=requirement.specification_name, global_id=element.global_id, severity=requirement.severity, status=status, message=message))
    validation.summary_json = counts
    db.commit()
    return get_ids_validation(db, validation_id=validation.id, project_id=project_id, company_id=company_id)


def get_ids_validation(db: Session, *, validation_id: int, project_id: int, company_id: int) -> BimIdsValidationResponse:
    validation = db.query(BimIdsValidation).options(joinedload(BimIdsValidation.findings)).filter(BimIdsValidation.id == validation_id, BimIdsValidation.proyecto_id == project_id, BimIdsValidation.empresa_id == company_id).first()
    if not validation:
        raise HTTPException(status_code=404, detail="Validacion IDS no encontrada.")
    return BimIdsValidationResponse(id=validation.id, profile_id=validation.bim_ids_profile_id, version_id=validation.bim_model_version_id, status=validation.status, summary=validation.summary_json or {}, created_at=validation.fecha_creacion, findings=[{"id": item.id, "requirement_id": item.requirement_id, "specification_name": item.specification_name, "global_id": item.global_id, "severity": item.severity, "status": item.status, "message": item.message, "exception_reason": item.exception_reason, "exception_by": item.exception_by, "exception_at": item.exception_at} for item in sorted(validation.findings, key=lambda finding: finding.id)])


def exempt_ids_finding(db: Session, *, finding_id: int, project_id: int, company_id: int, user_id: int, reason: str) -> BimIdsValidationResponse:
    finding = db.query(BimIdsFinding).join(BimIdsValidation).filter(BimIdsFinding.id == finding_id, BimIdsValidation.proyecto_id == project_id, BimIdsValidation.empresa_id == company_id).first()
    if not finding or finding.status != "failed":
        raise HTTPException(status_code=404, detail="Hallazgo IDS fallido no encontrado.")
    finding.status = "exempted"
    finding.exception_reason = reason
    finding.exception_by = user_id
    finding.exception_at = datetime.now(timezone.utc)
    validation = finding.validation
    summary = dict(validation.summary_json or {})
    summary["failed"] = max(0, summary.get("failed", 0) - 1)
    summary["exempted"] = summary.get("exempted", 0) + 1
    validation.summary_json = summary
    db.commit()
    return get_ids_validation(db, validation_id=validation.id, project_id=project_id, company_id=company_id)


def export_ids_validation_csv(validation: BimIdsValidationResponse) -> str:
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["requirement_id", "specification", "global_id", "severity", "status", "message", "exception_reason"])
    for finding in validation.findings:
        writer.writerow([finding.requirement_id, finding.specification_name, finding.global_id or "", finding.severity, finding.status, finding.message, finding.exception_reason or ""])
    return output.getvalue()
