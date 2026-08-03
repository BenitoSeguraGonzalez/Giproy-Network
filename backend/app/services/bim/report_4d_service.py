import csv
import io
import json
import hashlib
from datetime import datetime, timezone

from fastapi import HTTPException

from app.services.bim.field_4d_service import list_field_reports
from app.services.bim.planning_4d_service import analyze_space_time_conflicts
from app.services.bim.productivity_4d_service import list_productivity_proposals
from app.services.bim.resource_4d_service import build_histogram
from app.services.bim.schedule_4d_service import build_gantt, build_plan_actual_deviation
from app.models.bim_coordination import ProjectCoordinationSet


def build_report(db, *, report_type, project_id, company_id, baseline_id=None, resource_id=None, cutoff=None, official_output=False):
    official_reference = db.query(ProjectCoordinationSet).filter(
        ProjectCoordinationSet.proyecto_id == project_id,
        ProjectCoordinationSet.empresa_id == company_id,
        ProjectCoordinationSet.official.is_(True),
        ProjectCoordinationSet.active.is_(True),
    ).order_by(ProjectCoordinationSet.revision.desc()).first()
    if official_output and not official_reference:
        raise HTTPException(status_code=409, detail="No existe una referencia coordinada oficial vigente. Genere una salida preliminar o apruebe primero la referencia.")
    if official_output and baseline_id and official_reference.baseline_id != baseline_id:
        raise HTTPException(status_code=409, detail="La línea base solicitada no pertenece a la referencia coordinada oficial vigente.")
    if report_type == "gantt":
        if not baseline_id: raise HTTPException(status_code=422, detail="baseline_id es obligatorio para el informe Gantt.")
        source = build_gantt(db, baseline_id=baseline_id, project_id=project_id, company_id=company_id); rows = source["activities"]
    elif report_type == "plan_actual":
        if not baseline_id or not cutoff: raise HTTPException(status_code=422, detail="baseline_id y cutoff son obligatorios para plan-real.")
        source = build_plan_actual_deviation(db, baseline_id=baseline_id, project_id=project_id, company_id=company_id, cutoff=cutoff); rows = source["items"]
    elif report_type == "resources":
        if not resource_id: raise HTTPException(status_code=422, detail="resource_id es obligatorio para el informe de recursos.")
        source = build_histogram(db, resource_id=resource_id, project_id=project_id, company_id=company_id); rows = source["points"]
    elif report_type == "conflicts":
        source = analyze_space_time_conflicts(db, project_id=project_id, company_id=company_id); rows = source["conflicts"]
    elif report_type == "productivity":
        rows = list_productivity_proposals(db, project_id=project_id, company_id=company_id); source = {"count": len(rows)}
    elif report_type == "field":
        rows = list_field_reports(db, project_id=project_id, company_id=company_id); source = {"count": len(rows)}
    else:
        raise HTTPException(status_code=422, detail="Tipo de informe BIM 4D no soportado.")
    reference_status = "official" if official_output else "preliminary"
    coordination_reference = ({
        "id": official_reference.id, "revision": official_reference.revision,
        "coordination_status": official_reference.coordination_status,
        "baseline_id": official_reference.baseline_id,
        "budget_id": official_reference.presupuesto_id,
        "budget_revision": official_reference.presupuesto_revision,
        "bim_version_ids": list(official_reference.bim_version_ids_json or []),
    } if official_reference else None)
    reproducible_payload = {
        "contract_version": "giproy_bim_4d_report_v2", "report_type": report_type,
        "project_id": project_id, "company_id": company_id,
        "reference_status": reference_status, "coordination_reference": coordination_reference,
        "parameters": {"baseline_id": baseline_id, "resource_id": resource_id, "cutoff": cutoff},
        "summary": {key: value for key, value in source.items() if key not in {"activities", "items", "points", "conflicts"}},
        "rows": rows,
    }
    snapshot_sha256 = hashlib.sha256(json.dumps(reproducible_payload, sort_keys=True, separators=(",", ":"), default=str).encode("utf-8")).hexdigest()
    return {
        **reproducible_payload, "generated_at": datetime.now(timezone.utc),
        "snapshot_sha256": snapshot_sha256,
        "watermark": "OFICIAL" if official_output else "PRELIMINAR - NO USAR COMO SALIDA CONTRACTUAL",
    }


def report_csv(report):
    output = io.StringIO(newline="")
    rows = report["rows"]
    fieldnames = sorted({key for row in rows for key in row}) if rows else ["report_type", "message"]
    writer = csv.DictWriter(output, fieldnames=fieldnames); writer.writeheader()
    if rows:
        for row in rows: writer.writerow({key: json.dumps(value, ensure_ascii=False, default=str) if isinstance(value, (list, dict)) else value for key, value in row.items()})
    else: writer.writerow({"report_type": report["report_type"], "message": "Sin datos"})
    return output.getvalue()
