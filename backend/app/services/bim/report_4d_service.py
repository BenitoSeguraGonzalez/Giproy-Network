import csv
import io
import json
from datetime import datetime, timezone

from fastapi import HTTPException

from app.services.bim.field_4d_service import list_field_reports
from app.services.bim.planning_4d_service import analyze_space_time_conflicts
from app.services.bim.productivity_4d_service import list_productivity_proposals
from app.services.bim.resource_4d_service import build_histogram
from app.services.bim.schedule_4d_service import build_gantt, build_plan_actual_deviation


def build_report(db, *, report_type, project_id, company_id, baseline_id=None, resource_id=None, cutoff=None):
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
    return {"contract_version": "giproy_bim_4d_report_v1", "report_type": report_type, "project_id": project_id, "company_id": company_id, "generated_at": datetime.now(timezone.utc), "summary": {key: value for key, value in source.items() if key not in {"activities", "items", "points", "conflicts"}}, "rows": rows}


def report_csv(report):
    output = io.StringIO(newline="")
    rows = report["rows"]
    fieldnames = sorted({key for row in rows for key in row}) if rows else ["report_type", "message"]
    writer = csv.DictWriter(output, fieldnames=fieldnames); writer.writeheader()
    if rows:
        for row in rows: writer.writerow({key: json.dumps(value, ensure_ascii=False, default=str) if isinstance(value, (list, dict)) else value for key, value in row.items()})
    else: writer.writerow({"report_type": report["report_type"], "message": "Sin datos"})
    return output.getvalue()
