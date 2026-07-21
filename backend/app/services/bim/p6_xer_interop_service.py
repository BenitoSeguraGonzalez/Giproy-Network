from __future__ import annotations

import csv
import hashlib
import io
from datetime import datetime
from zoneinfo import ZoneInfo, ZoneInfoNotFoundError

from app.schemas.bim_schedule_interop import BimScheduleInterchangeDocument
from app.services.bim.schedule_interop_service import preflight_schedule_interchange


MAX_P6_XER_BYTES = 50 * 1024 * 1024
MAX_P6_XER_ROWS = 500_000
MAX_P6_XER_FIELD_BYTES = 1 * 1024 * 1024

XER_ACTIVITY_TYPES = {
    "TT_Task": "task",
    "TT_Rsrc": "task",
    "TT_StartMile": "start_milestone",
    "TT_FinMile": "finish_milestone",
    "TT_LOE": "level_of_effort",
}
XER_ACTIVITY_TYPES_EXPORT = {
    "task": "TT_Task",
    "start_milestone": "TT_StartMile",
    "finish_milestone": "TT_FinMile",
    "level_of_effort": "TT_LOE",
}
XER_RELATIONSHIP_TYPES = {"PR_FS": "FS", "PR_SS": "SS", "PR_FF": "FF", "PR_SF": "SF"}
XER_RELATIONSHIP_TYPES_EXPORT = {value: key for key, value in XER_RELATIONSHIP_TYPES.items()}
XER_CONSTRAINTS = {
    "CS_SO": "start_on",
    "CS_SNET": "start_no_earlier_than",
    "CS_SNLT": "start_no_later_than",
    "CS_FO": "finish_on",
    "CS_FNET": "finish_no_earlier_than",
    "CS_FNLT": "finish_no_later_than",
    "CS_MSO": "mandatory_start",
    "CS_MEO": "mandatory_finish",
}
XER_CONSTRAINTS_EXPORT = {value: key for key, value in XER_CONSTRAINTS.items()}
XER_RESOURCE_TYPES = {"RT_Labor": "labor", "RT_Equip": "equipment", "RT_Mat": "material"}
XER_RESOURCE_TYPES_EXPORT = {
    "labor": "RT_Labor",
    "equipment": "RT_Equip",
    "material": "RT_Mat",
    "role": "RT_Labor",
    "cost": "RT_Mat",
}

SUPPORTED_FIELDS = {
    "PROJECT": {"proj_id", "proj_short_name", "last_recalc_date", "plan_start_date", "scd_end_date", "clndr_id"},
    "CALENDAR": {"clndr_id", "clndr_name", "day_hr_cnt", "week_hr_cnt", "proj_id", "clndr_data"},
    "PROJWBS": {"wbs_id", "parent_wbs_id", "proj_id", "proj_node_flag", "seq_num", "wbs_short_name", "wbs_name"},
    "TASK": {
        "task_id", "proj_id", "wbs_id", "clndr_id", "task_code", "task_name", "task_type",
        "status_code", "target_start_date", "target_end_date", "act_start_date", "act_end_date",
        "phys_complete_pct", "target_drtn_hr_cnt", "cstr_type", "cstr_date",
    },
    "TASKPRED": {"task_pred_id", "task_id", "pred_task_id", "proj_id", "pred_proj_id", "pred_type", "lag_hr_cnt"},
    "RSRC": {"rsrc_id", "rsrc_short_name", "rsrc_name", "rsrc_type"},
    "RSRCRATE": {"rsrc_rate_id", "rsrc_id", "max_qty_per_hr", "cost_per_qty", "start_date"},
    "TASKRSRC": {
        "taskrsrc_id", "task_id", "proj_id", "rsrc_id", "target_qty_per_hr", "target_qty",
        "target_cost", "act_reg_qty", "act_reg_cost",
    },
}


def _float(value: str | None, default: float = 0.0) -> float:
    try:
        return float(value or "")
    except (TypeError, ValueError):
        return default


def _datetime(value: str | None, timezone_name: str) -> datetime | None:
    raw = (value or "").strip()
    if not raw:
        return None
    try:
        parsed = datetime.fromisoformat(raw.replace("Z", "+00:00"))
    except ValueError as exc:
        raise ValueError(f"Fecha XER no valida: {raw}.") from exc
    if parsed.tzinfo is None:
        parsed = parsed.replace(tzinfo=ZoneInfo(timezone_name))
    return parsed


def _decode(payload: bytes) -> str:
    try:
        return payload.decode("utf-8-sig")
    except UnicodeDecodeError:
        return payload.decode("cp1252")


def _parse_tables(payload: bytes) -> tuple[list[str], dict[str, list[dict[str, str]]]]:
    text = _decode(payload)
    if "\x00" in text:
        raise ValueError("El archivo P6 XER contiene bytes nulos no permitidos.")
    old_limit = csv.field_size_limit()
    csv.field_size_limit(MAX_P6_XER_FIELD_BYTES)
    try:
        rows = list(csv.reader(io.StringIO(text), delimiter="\t"))
    except csv.Error as exc:
        raise ValueError("El archivo P6 XER no tiene una estructura tabular valida.") from exc
    finally:
        csv.field_size_limit(old_limit)
    if not rows or not rows[0] or rows[0][0] != "ERMHDR":
        raise ValueError("El archivo no contiene una cabecera ERMHDR de Primavera P6 XER.")
    if len(rows) > MAX_P6_XER_ROWS:
        raise ValueError(f"El P6 XER supera {MAX_P6_XER_ROWS} filas.")

    tables: dict[str, list[dict[str, str]]] = {}
    current_table: str | None = None
    fields: list[str] | None = None
    ended = False
    for row in rows[1:]:
        if not row or not row[0]:
            continue
        marker = row[0]
        if marker == "%E":
            ended = True
            break
        if marker == "%T":
            if len(row) != 2 or not row[1]:
                raise ValueError("El archivo P6 XER contiene un marcador %T invalido.")
            current_table = row[1].upper()
            if current_table in tables:
                raise ValueError(f"La tabla XER {current_table} esta repetida.")
            tables[current_table] = []
            fields = None
            continue
        if marker == "%F":
            if current_table is None or len(row) < 2:
                raise ValueError("El archivo P6 XER contiene un marcador %F fuera de tabla.")
            fields = row[1:]
            if len(fields) != len(set(fields)) or any(not field for field in fields):
                raise ValueError(f"La tabla XER {current_table} contiene campos invalidos o repetidos.")
            continue
        if marker == "%R":
            if current_table is None or fields is None:
                raise ValueError("El archivo P6 XER contiene un registro %R sin tabla o campos.")
            values = row[1:]
            if len(values) > len(fields):
                raise ValueError(f"Un registro XER de {current_table} contiene mas valores que campos.")
            values.extend([""] * (len(fields) - len(values)))
            tables[current_table].append(dict(zip(fields, values)))
            continue
        raise ValueError(f"Marcador XER no reconocido: {marker}.")
    if not ended:
        raise ValueError("El archivo P6 XER no contiene el marcador final %E.")
    return rows[0], tables


def _ignored_fields(tables: dict[str, list[dict[str, str]]]) -> list[str]:
    unsupported: set[str] = set()
    for table_name, rows in tables.items():
        supported = SUPPORTED_FIELDS.get(table_name)
        if supported is None:
            if rows:
                unsupported.add(f"Table:{table_name}")
            continue
        for row in rows:
            unsupported.update(
                f"{table_name}.{field}"
                for field, value in row.items()
                if field not in supported and value.strip()
            )
    return sorted(unsupported)


def parse_p6_xer(
    xer_payload: bytes,
    *,
    source_filename: str,
    timezone_name: str,
    currency: str = "USD",
) -> dict:
    if not xer_payload:
        raise ValueError("El archivo P6 XER esta vacio.")
    if len(xer_payload) > MAX_P6_XER_BYTES:
        raise ValueError(f"El archivo P6 XER supera el limite de {MAX_P6_XER_BYTES} bytes.")
    try:
        ZoneInfo(timezone_name)
    except ZoneInfoNotFoundError as exc:
        raise ValueError("La zona horaria IANA indicada no existe.") from exc

    header, tables = _parse_tables(xer_payload)
    projects = tables.get("PROJECT", [])
    if len(projects) != 1:
        raise ValueError("El preview P6 XER requiere exactamente un proyecto por archivo.")
    project = projects[0]
    project_id = project.get("proj_id", "").strip()
    project_external_id = project.get("proj_short_name", "").strip() or project_id
    if not project_id or not project_external_id:
        raise ValueError("El proyecto P6 XER no contiene proj_id y proj_short_name validos.")
    data_date = _datetime(project.get("last_recalc_date"), timezone_name)
    if data_date is None:
        raise ValueError("El proyecto P6 XER no contiene last_recalc_date valida.")

    unsupported = _ignored_fields(tables)
    calendar_rows = [row for row in tables.get("CALENDAR", []) if not row.get("proj_id") or row.get("proj_id") == project_id]
    calendars = []
    for row in calendar_rows:
        object_id = row.get("clndr_id", "").strip()
        if not object_id:
            continue
        if row.get("clndr_data", "").strip():
            unsupported.append(f"CALENDAR[{object_id}].clndr_data")
        calendars.append(
            {
                "id": f"P6-XER-CAL-{object_id}",
                "name": row.get("clndr_name", "").strip() or f"Calendar {object_id}",
                "timezone": timezone_name,
                "working_weekdays": [1, 2, 3, 4, 5],
                "working_hours_per_day": max(_float(row.get("day_hr_cnt"), 8), 0.01),
                "exceptions": [],
            }
        )

    wbs_rows = [row for row in tables.get("PROJWBS", []) if row.get("proj_id") == project_id]
    root_rows = [row for row in wbs_rows if row.get("proj_node_flag", "").upper() == "Y"]
    root_id = root_rows[0].get("wbs_id") if root_rows else None
    project_name = (
        (root_rows[0].get("wbs_name", "").strip() if root_rows else "")
        or project_external_id
    )
    canonical_wbs_rows = [row for row in wbs_rows if row.get("wbs_id") != root_id]
    wbs_source_ids = {row.get("wbs_id", "") for row in canonical_wbs_rows}
    wbs = []
    for row in canonical_wbs_rows:
        object_id = row.get("wbs_id", "").strip()
        if not object_id:
            continue
        parent_id = row.get("parent_wbs_id", "").strip()
        wbs.append(
            {
                "id": f"P6-XER-WBS-{object_id}",
                "code": row.get("wbs_short_name", "").strip() or object_id,
                "name": row.get("wbs_name", "").strip() or f"WBS {object_id}",
                "parent_id": f"P6-XER-WBS-{parent_id}" if parent_id in wbs_source_ids else None,
            }
        )

    task_rows = [row for row in tables.get("TASK", []) if row.get("proj_id") == project_id]
    if len(task_rows) > 200_000:
        raise ValueError("El P6 XER supera 200000 actividades.")
    task_ids = {row.get("task_id", "") for row in task_rows if row.get("task_id")}
    activities = []
    for row in task_rows:
        object_id = row.get("task_id", "").strip()
        if not object_id:
            continue
        start = _datetime(row.get("target_start_date"), timezone_name)
        finish = _datetime(row.get("target_end_date"), timezone_name)
        if start is None or finish is None:
            raise ValueError(f"La actividad P6 XER task_id {object_id} no contiene fechas plan validas.")
        source_type = row.get("task_type", "") or "TT_Task"
        if source_type not in XER_ACTIVITY_TYPES:
            unsupported.append(f"TASK[{object_id}].task_type:{source_type}")
        source_constraint = row.get("cstr_type", "")
        if source_constraint and source_constraint not in XER_CONSTRAINTS:
            unsupported.append(f"TASK[{object_id}].cstr_type:{source_constraint}")
        activity_type = XER_ACTIVITY_TYPES.get(source_type, "task")
        wbs_id = row.get("wbs_id", "").strip()
        calendar_id = row.get("clndr_id", "").strip()
        activities.append(
            {
                "id": f"P6-XER-ACT-{object_id}",
                "code": row.get("task_code", "").strip() or object_id,
                "name": row.get("task_name", "").strip() or f"Activity {object_id}",
                "activity_type": activity_type,
                "wbs_id": f"P6-XER-WBS-{wbs_id}" if wbs_id else None,
                "calendar_id": f"P6-XER-CAL-{calendar_id}" if calendar_id else None,
                "planned_start": start,
                "planned_finish": finish,
                "actual_start": _datetime(row.get("act_start_date"), timezone_name),
                "actual_finish": _datetime(row.get("act_end_date"), timezone_name),
                "percent_complete": min(max(_float(row.get("phys_complete_pct")), 0), 100),
                "duration_hours": 0 if activity_type.endswith("milestone") else max(_float(row.get("target_drtn_hr_cnt")), 0),
                "constraint_type": XER_CONSTRAINTS.get(source_constraint, "none"),
                "constraint_date": _datetime(row.get("cstr_date"), timezone_name),
                "custom_fields": {"p6_xer_task_id": object_id, "p6_xer_status_code": row.get("status_code", "")},
            }
        )
    if not activities:
        raise ValueError("El proyecto P6 XER no contiene actividades importables.")

    dependencies = []
    for row in tables.get("TASKPRED", []):
        predecessor = row.get("pred_task_id", "").strip()
        successor = row.get("task_id", "").strip()
        predecessor_project = row.get("pred_proj_id", "").strip()
        successor_project = row.get("proj_id", "").strip()
        if (
            predecessor_project and predecessor_project != project_id
        ) or (
            successor_project and successor_project != project_id
        ):
            unsupported.append(
                f"TASKPRED[{row.get('task_pred_id', '')}].ExternalProject:{predecessor_project}:{successor_project}"
            )
            continue
        if predecessor not in task_ids or successor not in task_ids:
            unsupported.append(f"TASKPRED[{row.get('task_pred_id', '')}].UnresolvedReference:{predecessor}:{successor}")
            continue
        source_type = row.get("pred_type", "") or "PR_FS"
        if source_type not in XER_RELATIONSHIP_TYPES:
            unsupported.append(f"TASKPRED[{row.get('task_pred_id', '')}].pred_type:{source_type}")
        dependencies.append(
            {
                "predecessor_id": f"P6-XER-ACT-{predecessor}",
                "successor_id": f"P6-XER-ACT-{successor}",
                "dependency_type": XER_RELATIONSHIP_TYPES.get(source_type, "FS"),
                "lag_hours": _float(row.get("lag_hr_cnt")),
            }
        )

    assignment_rows = [row for row in tables.get("TASKRSRC", []) if row.get("task_id") in task_ids]
    assigned_resource_ids = {row.get("rsrc_id", "") for row in assignment_rows if row.get("rsrc_id")}
    rate_by_resource = {}
    for row in tables.get("RSRCRATE", []):
        resource_id = row.get("rsrc_id", "").strip()
        if resource_id and resource_id not in rate_by_resource:
            rate_by_resource[resource_id] = row
    resources = []
    resource_ids: set[str] = set()
    for row in tables.get("RSRC", []):
        object_id = row.get("rsrc_id", "").strip()
        if not object_id or object_id not in assigned_resource_ids:
            continue
        resource_ids.add(object_id)
        source_type = row.get("rsrc_type", "") or "RT_Labor"
        if source_type not in XER_RESOURCE_TYPES:
            unsupported.append(f"RSRC[{object_id}].rsrc_type:{source_type}")
        rate = rate_by_resource.get(object_id, {})
        resources.append(
            {
                "id": f"P6-XER-RES-{object_id}",
                "code": row.get("rsrc_short_name", "").strip() or object_id,
                "name": row.get("rsrc_name", "").strip() or f"Resource {object_id}",
                "resource_type": XER_RESOURCE_TYPES.get(source_type, "labor"),
                "max_units": max(_float(rate.get("max_qty_per_hr"), 1), 0),
                "unit_cost": max(_float(rate.get("cost_per_qty")), 0),
            }
        )
    assignments = []
    for row in assignment_rows:
        activity_id = row.get("task_id", "").strip()
        resource_id = row.get("rsrc_id", "").strip()
        if resource_id not in resource_ids:
            unsupported.append(f"TASKRSRC[{row.get('taskrsrc_id', '')}].UnresolvedResource:{resource_id}")
            continue
        assignments.append(
            {
                "activity_id": f"P6-XER-ACT-{activity_id}",
                "resource_id": f"P6-XER-RES-{resource_id}",
                "planned_units": max(_float(row.get("target_qty_per_hr")), 0),
                "planned_work_hours": max(_float(row.get("target_qty")), 0),
                "planned_cost": max(_float(row.get("target_cost")), 0),
                "actual_work_hours": max(_float(row.get("act_reg_qty")), 0),
                "actual_cost": max(_float(row.get("act_reg_cost")), 0),
            }
        )

    document = BimScheduleInterchangeDocument.model_validate(
        {
            "source_format": "p6_xer",
            "source_filename": source_filename,
            "source_checksum_sha256": hashlib.sha256(xer_payload).hexdigest(),
            "source_application": f"Oracle Primavera P6 XER {header[1] if len(header) > 1 else ''}".strip(),
            "project_external_id": project_external_id,
            "project_name": project_name,
            "timezone": timezone_name,
            "currency": currency,
            "data_date": data_date,
            "calendars": calendars,
            "wbs": wbs,
            "activities": activities,
            "dependencies": dependencies,
            "resources": resources,
            "assignments": assignments,
            "baselines": [],
            "unsupported_source_fields": sorted(set(unsupported)),
        }
    )
    return {"document": document, "preflight": preflight_schedule_interchange(document)}


def _xer_datetime(value: datetime | None, timezone_name: str) -> str:
    if value is None:
        return ""
    return value.astimezone(ZoneInfo(timezone_name)).strftime("%Y-%m-%d %H:%M")


def _safe_value(value) -> str:
    text = "" if value is None else str(value)
    if any(marker in text for marker in ("\t", "\r", "\n")):
        raise ValueError("XER no admite tabuladores ni saltos de linea en los valores exportados.")
    return text


def export_p6_xer(document: BimScheduleInterchangeDocument) -> bytes:
    preflight = preflight_schedule_interchange(document)
    if not preflight["valid"]:
        raise ValueError("El contrato canonico contiene errores y no puede exportarse.")

    output = io.StringIO(newline="")
    writer = csv.writer(output, delimiter="\t", lineterminator="\r\n", quoting=csv.QUOTE_MINIMAL)
    writer.writerow(["ERMHDR", "24.12", datetime.now(ZoneInfo(document.timezone)).strftime("%Y-%m-%d"), "Project", "GiProy", "GiProy BIM", document.currency])

    def table(name: str, fields: list[str], records: list[dict]) -> None:
        writer.writerow(["%T", name])
        writer.writerow(["%F", *fields])
        for record in records:
            writer.writerow(["%R", *[_safe_value(record.get(field)) for field in fields]])

    project_id = "1"
    calendar_ids = {item.id: str(index) for index, item in enumerate(document.calendars, start=100)}
    root_wbs_id = "1000"
    wbs_ids = {item.id: str(index) for index, item in enumerate(document.wbs, start=1001)}
    task_ids = {item.id: str(index) for index, item in enumerate(document.activities, start=10_000)}
    resource_ids = {item.id: str(index) for index, item in enumerate(document.resources, start=30_000)}
    default_calendar_id = next(iter(calendar_ids.values()), "")

    table(
        "PROJECT",
        ["proj_id", "proj_short_name", "last_recalc_date", "plan_start_date", "scd_end_date", "clndr_id"],
        [{
            "proj_id": project_id,
            "proj_short_name": document.project_external_id,
            "last_recalc_date": _xer_datetime(document.data_date, document.timezone),
            "plan_start_date": _xer_datetime(min(item.planned_start for item in document.activities), document.timezone),
            "scd_end_date": _xer_datetime(max(item.planned_finish for item in document.activities), document.timezone),
            "clndr_id": default_calendar_id,
        }],
    )
    table(
        "CALENDAR",
        ["clndr_id", "clndr_name", "day_hr_cnt", "week_hr_cnt", "proj_id", "clndr_data"],
        [{
            "clndr_id": calendar_ids[item.id],
            "clndr_name": item.name,
            "day_hr_cnt": item.working_hours_per_day,
            "week_hr_cnt": item.working_hours_per_day * len(item.working_weekdays),
            "proj_id": project_id,
            "clndr_data": "",
        } for item in document.calendars],
    )
    wbs_records = [{
        "wbs_id": root_wbs_id,
        "parent_wbs_id": "",
        "proj_id": project_id,
        "proj_node_flag": "Y",
        "seq_num": 0,
        "wbs_short_name": document.project_external_id,
        "wbs_name": document.project_name,
    }]
    wbs_records.extend({
        "wbs_id": wbs_ids[item.id],
        "parent_wbs_id": wbs_ids.get(item.parent_id, root_wbs_id),
        "proj_id": project_id,
        "proj_node_flag": "N",
        "seq_num": index,
        "wbs_short_name": item.code,
        "wbs_name": item.name,
    } for index, item in enumerate(document.wbs, start=1))
    table("PROJWBS", ["wbs_id", "parent_wbs_id", "proj_id", "proj_node_flag", "seq_num", "wbs_short_name", "wbs_name"], wbs_records)

    table(
        "TASK",
        ["task_id", "proj_id", "wbs_id", "clndr_id", "task_code", "task_name", "task_type", "status_code", "target_start_date", "target_end_date", "act_start_date", "act_end_date", "phys_complete_pct", "target_drtn_hr_cnt", "cstr_type", "cstr_date"],
        [{
            "task_id": task_ids[item.id],
            "proj_id": project_id,
            "wbs_id": wbs_ids.get(item.wbs_id, root_wbs_id),
            "clndr_id": calendar_ids.get(item.calendar_id, default_calendar_id),
            "task_code": item.code,
            "task_name": item.name,
            "task_type": XER_ACTIVITY_TYPES_EXPORT[item.activity_type],
            "status_code": "TK_Complete" if item.percent_complete == 100 else ("TK_Active" if item.actual_start else "TK_NotStart"),
            "target_start_date": _xer_datetime(item.planned_start, document.timezone),
            "target_end_date": _xer_datetime(item.planned_finish, document.timezone),
            "act_start_date": _xer_datetime(item.actual_start, document.timezone),
            "act_end_date": _xer_datetime(item.actual_finish, document.timezone),
            "phys_complete_pct": item.percent_complete,
            "target_drtn_hr_cnt": item.duration_hours,
            "cstr_type": XER_CONSTRAINTS_EXPORT.get(item.constraint_type, ""),
            "cstr_date": _xer_datetime(item.constraint_date, document.timezone),
        } for item in document.activities],
    )
    table(
        "TASKPRED",
        ["task_pred_id", "task_id", "pred_task_id", "proj_id", "pred_proj_id", "pred_type", "lag_hr_cnt"],
        [{
            "task_pred_id": index,
            "task_id": task_ids[item.successor_id],
            "pred_task_id": task_ids[item.predecessor_id],
            "proj_id": project_id,
            "pred_proj_id": project_id,
            "pred_type": XER_RELATIONSHIP_TYPES_EXPORT[item.dependency_type],
            "lag_hr_cnt": item.lag_hours,
        } for index, item in enumerate(document.dependencies, start=20_000)],
    )
    table(
        "RSRC",
        ["rsrc_id", "rsrc_short_name", "rsrc_name", "rsrc_type"],
        [{
            "rsrc_id": resource_ids[item.id],
            "rsrc_short_name": item.code,
            "rsrc_name": item.name,
            "rsrc_type": XER_RESOURCE_TYPES_EXPORT[item.resource_type],
        } for item in document.resources],
    )
    table(
        "RSRCRATE",
        ["rsrc_rate_id", "rsrc_id", "max_qty_per_hr", "cost_per_qty", "start_date"],
        [{
            "rsrc_rate_id": index,
            "rsrc_id": resource_ids[item.id],
            "max_qty_per_hr": item.max_units,
            "cost_per_qty": item.unit_cost,
            "start_date": _xer_datetime(document.data_date, document.timezone),
        } for index, item in enumerate(document.resources, start=35_000)],
    )
    table(
        "TASKRSRC",
        ["taskrsrc_id", "task_id", "proj_id", "rsrc_id", "target_qty_per_hr", "target_qty", "target_cost", "act_reg_qty", "act_reg_cost"],
        [{
            "taskrsrc_id": index,
            "task_id": task_ids[item.activity_id],
            "proj_id": project_id,
            "rsrc_id": resource_ids[item.resource_id],
            "target_qty_per_hr": item.planned_units,
            "target_qty": item.planned_work_hours,
            "target_cost": item.planned_cost,
            "act_reg_qty": item.actual_work_hours,
            "act_reg_cost": item.actual_cost,
        } for index, item in enumerate(document.assignments, start=40_000)],
    )
    writer.writerow(["%E"])
    return output.getvalue().encode("utf-8")
