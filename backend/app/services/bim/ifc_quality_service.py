from __future__ import annotations

import hashlib
import re
from dataclasses import dataclass
from pathlib import Path

from sqlalchemy import inspect
from sqlalchemy.orm import Session

from app.models.bim_ifc_quality_report import BimIfcQualityReport
from app.models.bim_model import BimModel
from app.models.bim_model_version import BimModelVersion
from app.schemas.bim_model import BimIfcQualityReportResponse


IFC_QUALITY_CONTRACT = "giproy_bim_ifc_quality_v1"
SUPPORTED_SCHEMAS = {"IFC2X3", "IFC4", "IFC4X3_ADD2"}
SCHEMA_PATTERN = re.compile(r"FILE_SCHEMA\s*\(\s*\(\s*['\"]([^'\"]+)", re.IGNORECASE)
ENTITY_PATTERN = re.compile(r"#(\d+)\s*=\s*(IFC[A-Z0-9_]+)\s*\(\s*'([^']*)'", re.IGNORECASE)
PHYSICAL_CLASSES = {
    "IFCWALL", "IFCWALLSTANDARDCASE", "IFCSLAB", "IFCBEAM", "IFCCOLUMN", "IFCDOOR",
    "IFCWINDOW", "IFCROOF", "IFCSTAIR", "IFCFOOTING", "IFCPILE", "IFCMEMBER",
    "IFCPLATE", "IFCCURTAINWALL", "IFCSPACE", "IFCFURNISHINGELEMENT", "IFCDUCTSEGMENT",
    "IFCPIPESEGMENT", "IFCAIRTERMINAL", "IFCFLOWTERMINAL", "IFCDISTRIBUTIONELEMENT",
}


@dataclass(frozen=True)
class IfcQualityAnalysis:
    contract_version: str
    source_checksum_sha256: str
    schema_identifier: str | None
    step_status: str
    schema_status: str
    semantic_status: str
    overall_status: str
    error_count: int
    warning_count: int
    findings: list[dict]
    summary: dict


def analyze_ifc_quality(ifc_text: str, *, source_checksum_sha256: str | None = None) -> IfcQualityAnalysis:
    text = ifc_text or ""
    upper = text.upper()
    findings: list[dict] = []

    def add(domain: str, severity: str, code: str, message: str, entity_ref: str | None = None) -> None:
        finding = {"domain": domain, "severity": severity, "code": code, "message": message}
        if entity_ref:
            finding["entity_ref"] = entity_ref
        findings.append(finding)

    if not upper.lstrip().startswith("ISO-10303-21;"):
        add("step", "error", "step.header_missing", "Falta la cabecera ISO-10303-21.")
    if "HEADER;" not in upper or "ENDSEC;" not in upper:
        add("step", "error", "step.header_section_invalid", "La seccion HEADER no esta completa.")
    if "DATA;" not in upper:
        add("step", "error", "step.data_section_missing", "Falta la seccion DATA del archivo STEP.")
    if "END-ISO-10303-21;" not in upper:
        add("step", "error", "step.footer_missing", "Falta el cierre ISO-10303-21.")

    schema_match = SCHEMA_PATTERN.search(text)
    schema_identifier = schema_match.group(1).upper() if schema_match else None
    if not schema_identifier:
        add("schema", "error", "schema.identifier_missing", "No se encontro FILE_SCHEMA en el HEADER IFC.")
        schema_status = "unknown"
    elif schema_identifier not in SUPPORTED_SCHEMAS:
        add(
            "schema",
            "warning",
            "schema.partially_supported",
            f"El schema {schema_identifier} no pertenece al baseline IFC2X3/IFC4/IFC4X3_ADD2 validado por GiProy.",
        )
        schema_status = "partially_supported"
    else:
        schema_status = "supported"

    entities = ENTITY_PATTERN.findall(text)
    entity_classes = [entity_class.upper() for _, entity_class, _ in entities]
    global_ids: dict[str, list[str]] = {}
    for entity_id, _, global_id in entities:
        if global_id and global_id != "$":
            global_ids.setdefault(global_id, []).append(entity_id)
    for global_id, entity_ids in sorted(global_ids.items()):
        if len(entity_ids) > 1:
            add(
                "semantic",
                "warning",
                "semantic.duplicate_global_id",
                f"GlobalId duplicado en {len(entity_ids)} entidades.",
                entity_ref=global_id,
            )
    if "IFCPROJECT" not in entity_classes:
        add("semantic", "warning", "semantic.project_missing", "No se encontro una entidad IFCPROJECT.")
    if not {"IFCSITE", "IFCBUILDING", "IFCBUILDINGSTOREY"}.intersection(entity_classes):
        add("semantic", "warning", "semantic.spatial_structure_missing", "No se encontro estructura espacial base.")
    physical_count = sum(1 for entity_class in entity_classes if entity_class in PHYSICAL_CLASSES)
    if physical_count == 0:
        add("semantic", "warning", "semantic.physical_elements_missing", "No se detectaron elementos fisicos soportados.")

    error_count = sum(finding["severity"] == "error" for finding in findings)
    warning_count = sum(finding["severity"] == "warning" for finding in findings)
    step_status = "invalid" if any(f["domain"] == "step" and f["severity"] == "error" for f in findings) else "valid"
    semantic_status = "warnings" if any(f["domain"] == "semantic" for f in findings) else "passed"
    overall_status = "failed" if error_count else "warnings" if warning_count else "passed"
    checksum = source_checksum_sha256 or hashlib.sha256(text.encode("utf-8")).hexdigest()
    summary = {
        "entity_count": len(entities),
        "physical_element_count": physical_count,
        "distinct_ifc_classes": len(set(entity_classes)),
        "duplicate_global_id_count": sum(len(ids) > 1 for ids in global_ids.values()),
        "certification_claimed": False,
    }
    return IfcQualityAnalysis(
        contract_version=IFC_QUALITY_CONTRACT,
        source_checksum_sha256=checksum,
        schema_identifier=schema_identifier,
        step_status=step_status,
        schema_status=schema_status,
        semantic_status=semantic_status,
        overall_status=overall_status,
        error_count=error_count,
        warning_count=warning_count,
        findings=findings,
        summary=summary,
    )


def ensure_ifc_quality_report_table(db: Session) -> None:
    if "bim_ifc_quality_reports" not in set(inspect(db.bind).get_table_names()):
        raise RuntimeError("El esquema de calidad IFC no esta disponible. Ejecuta la migracion Alembic BIM.")


def stage_ifc_quality_report(
    db: Session,
    *,
    version_id: int,
    project_id: int,
    company_id: int,
    analysis: IfcQualityAnalysis,
) -> BimIfcQualityReport:
    ensure_ifc_quality_report_table(db)
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
        raise ValueError("Version BIM no encontrada para el reporte IFC y tenant indicados.")
    report = db.query(BimIfcQualityReport).filter(BimIfcQualityReport.bim_model_version_id == version_id).first()
    if report is None:
        report = BimIfcQualityReport(
            bim_model_version_id=version_id,
            proyecto_id=project_id,
            empresa_id=company_id,
        )
        db.add(report)
    report.contract_version = analysis.contract_version
    report.source_checksum_sha256 = analysis.source_checksum_sha256
    report.schema_identifier = analysis.schema_identifier
    report.step_status = analysis.step_status
    report.schema_status = analysis.schema_status
    report.semantic_status = analysis.semantic_status
    report.overall_status = analysis.overall_status
    report.error_count = analysis.error_count
    report.warning_count = analysis.warning_count
    report.findings = analysis.findings
    report.summary_json = analysis.summary
    db.flush()
    return report


def generate_ifc_quality_report(
    db: Session,
    *,
    version_id: int,
    project_id: int,
    company_id: int,
) -> BimIfcQualityReport:
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
    if version is None or not version.artifact_path:
        raise ValueError("La version BIM no tiene un IFC fuente disponible para analizar.")
    source_bytes = Path(version.artifact_path).read_bytes()
    try:
        ifc_text = source_bytes.decode("utf-8")
    except UnicodeDecodeError:
        ifc_text = source_bytes.decode("latin-1")
    analysis = analyze_ifc_quality(
        ifc_text,
        source_checksum_sha256=hashlib.sha256(source_bytes).hexdigest(),
    )
    report = stage_ifc_quality_report(
        db,
        version_id=version_id,
        project_id=project_id,
        company_id=company_id,
        analysis=analysis,
    )
    db.commit()
    db.refresh(report)
    return report


def get_ifc_quality_report(db: Session, *, version_id: int, project_id: int, company_id: int) -> BimIfcQualityReport:
    ensure_ifc_quality_report_table(db)
    report = (
        db.query(BimIfcQualityReport)
        .filter(
            BimIfcQualityReport.bim_model_version_id == version_id,
            BimIfcQualityReport.proyecto_id == project_id,
            BimIfcQualityReport.empresa_id == company_id,
        )
        .first()
    )
    if report is None:
        raise ValueError("Reporte de calidad IFC no encontrado para esta version.")
    return report


def serialize_ifc_quality_report(report: BimIfcQualityReport) -> BimIfcQualityReportResponse:
    return BimIfcQualityReportResponse.model_validate(report, from_attributes=True)
