from __future__ import annotations

import hashlib
import re
import xml.etree.ElementTree as ET
from datetime import datetime
from zoneinfo import ZoneInfo, ZoneInfoNotFoundError

from defusedxml import ElementTree as SafeET

from app.schemas.bim_schedule_interop import BimScheduleInterchangeDocument
from app.services.bim.schedule_interop_service import preflight_schedule_interchange


MSPDI_NAMESPACE = "http://schemas.microsoft.com/project"
MAX_MSPDI_BYTES = 25 * 1024 * 1024
MAX_MSPDI_TASKS = 100_000
DEPENDENCY_TYPE_FROM_MSPDI = {"0": "FF", "1": "FS", "2": "SS", "3": "SF"}
DEPENDENCY_TYPE_TO_MSPDI = {value: key for key, value in DEPENDENCY_TYPE_FROM_MSPDI.items()}
CONSTRAINT_FROM_MSPDI = {
    "0": "none",
    "2": "finish_no_earlier_than",
    "3": "finish_no_later_than",
    "4": "start_no_earlier_than",
    "5": "start_no_later_than",
    "6": "finish_on",
    "7": "start_on",
}
CONSTRAINT_TO_MSPDI = {value: key for key, value in CONSTRAINT_FROM_MSPDI.items()}


def _namespace(root) -> str:
    return root.tag.split("}", 1)[0].strip("{") if root.tag.startswith("{") else ""


def _qname(namespace: str, name: str) -> str:
    return f"{{{namespace}}}{name}" if namespace else name


def _text(element, namespace: str, name: str) -> str:
    child = element.find(_qname(namespace, name))
    return (child.text or "").strip() if child is not None else ""


def _nested_text(element, namespace: str, *names: str) -> str:
    current = element
    for name in names:
        current = current.find(_qname(namespace, name))
        if current is None:
            return ""
    return (current.text or "").strip()


def _parse_datetime(value: str, timezone_name: str) -> datetime | None:
    value = (value or "").strip()
    if not value:
        return None
    parsed = datetime.fromisoformat(value.replace("Z", "+00:00"))
    if parsed.tzinfo is None:
        parsed = parsed.replace(tzinfo=ZoneInfo(timezone_name))
    return parsed


def _parse_duration_hours(value: str) -> float:
    match = re.fullmatch(
        r"P(?:(?P<days>-?\d+(?:\.\d+)?)D)?(?:T(?:(?P<hours>-?\d+(?:\.\d+)?)H)?(?:(?P<minutes>-?\d+(?:\.\d+)?)M)?(?:(?P<seconds>-?\d+(?:\.\d+)?)S)?)?",
        (value or "").strip().upper(),
    )
    if not match:
        return 0.0
    return round(
        float(match.group("days") or 0) * 24
        + float(match.group("hours") or 0)
        + float(match.group("minutes") or 0) / 60
        + float(match.group("seconds") or 0) / 3600,
        6,
    )


def _duration_xml(hours: float) -> str:
    total_seconds = max(int(round(hours * 3600)), 0)
    hours_value, remainder = divmod(total_seconds, 3600)
    minutes, seconds = divmod(remainder, 60)
    return f"PT{hours_value}H{minutes}M{seconds}S"


def _float(value: str, default: float = 0.0) -> float:
    try:
        return float(value)
    except (TypeError, ValueError):
        return default


def _mspdi_day_to_iso(day_type: int) -> int:
    return 7 if day_type == 1 else day_type - 1


def _ordered_wbs_with_levels(document: BimScheduleInterchangeDocument) -> list[tuple[object, int]]:
    by_parent: dict[str | None, list[object]] = {}
    for node in document.wbs:
        by_parent.setdefault(node.parent_id, []).append(node)
    ordered: list[tuple[object, int]] = []

    def append_children(parent_id: str | None, level: int) -> None:
        for node in by_parent.get(parent_id, []):
            ordered.append((node, level))
            append_children(node.id, level + 1)

    append_children(None, 1)
    return ordered


def parse_mspdi_xml(
    xml_payload: bytes,
    *,
    source_filename: str,
    timezone_name: str,
    currency: str = "USD",
) -> dict:
    if not xml_payload:
        raise ValueError("El archivo MSPDI XML esta vacio.")
    if len(xml_payload) > MAX_MSPDI_BYTES:
        raise ValueError(f"El archivo MSPDI supera el limite de {MAX_MSPDI_BYTES} bytes.")
    try:
        ZoneInfo(timezone_name)
    except ZoneInfoNotFoundError as exc:
        raise ValueError("La zona horaria IANA indicada no existe.") from exc
    try:
        root = SafeET.fromstring(xml_payload)
    except Exception as exc:
        raise ValueError("El archivo MSPDI XML no es valido o contiene construcciones inseguras.") from exc

    namespace = _namespace(root)
    if root.tag != _qname(namespace, "Project"):
        raise ValueError("El XML no contiene una raiz Project de MSPDI.")
    tasks_parent = root.find(_qname(namespace, "Tasks"))
    if tasks_parent is None:
        raise ValueError("El MSPDI XML no contiene tareas.")
    task_nodes = tasks_parent.findall(_qname(namespace, "Task"))
    if len(task_nodes) > MAX_MSPDI_TASKS:
        raise ValueError(f"El MSPDI XML supera {MAX_MSPDI_TASKS} tareas.")

    project_name = _text(root, namespace, "Name") or _text(root, namespace, "Title") or source_filename
    project_external_id = _text(root, namespace, "GUID") or _text(root, namespace, "UID") or hashlib.sha256(xml_payload).hexdigest()[:24]
    data_date = _parse_datetime(_text(root, namespace, "StatusDate"), timezone_name)
    if data_date is None:
        data_date = _parse_datetime(_text(root, namespace, "StartDate"), timezone_name)
    if data_date is None:
        raise ValueError("El MSPDI XML no contiene StatusDate ni StartDate valida.")

    unsupported: list[str] = []
    calendars = []
    calendar_parent = root.find(_qname(namespace, "Calendars"))
    for calendar in calendar_parent.findall(_qname(namespace, "Calendar")) if calendar_parent is not None else []:
        calendar_id = _text(calendar, namespace, "UID")
        if not calendar_id:
            continue
        working_weekdays = []
        exceptions = []
        weekdays = calendar.find(_qname(namespace, "WeekDays"))
        for weekday in weekdays.findall(_qname(namespace, "WeekDay")) if weekdays is not None else []:
            day_type = int(_float(_text(weekday, namespace, "DayType")))
            day_working = _text(weekday, namespace, "DayWorking") == "1"
            if 1 <= day_type <= 7 and day_working:
                working_weekdays.append(_mspdi_day_to_iso(day_type))
            from_date = _nested_text(weekday, namespace, "TimePeriod", "FromDate")
            to_date = _nested_text(weekday, namespace, "TimePeriod", "ToDate")
            if from_date and from_date == to_date:
                exceptions.append({"date": from_date[:10], "working": day_working})
            elif from_date or to_date:
                unsupported.append(f"Calendar[{calendar_id}].ExceptionRange:{from_date}:{to_date}")
        calendars.append(
            {
                "id": calendar_id,
                "name": _text(calendar, namespace, "Name") or f"Calendar {calendar_id}",
                "timezone": timezone_name,
                "working_weekdays": sorted(set(working_weekdays)) or [1, 2, 3, 4, 5],
                "working_hours_per_day": max(_float(_text(root, namespace, "MinutesPerDay"), 480) / 60, 0.01),
                "exceptions": exceptions,
            }
        )

    wbs = []
    activities = []
    dependencies = []
    task_uid_to_activity_id: dict[str, str] = {}
    task_stack: dict[int, str] = {}
    task_payloads: list[tuple[object, str, bool]] = []
    for task in task_nodes:
        uid = _text(task, namespace, "UID")
        if not uid or uid == "0" or _text(task, namespace, "IsNull") == "1":
            continue
        summary = _text(task, namespace, "Summary") == "1"
        task_id = f"WBS-{uid}" if summary else f"TASK-{uid}"
        task_payloads.append((task, task_id, summary))
        outline_level = int(_float(_text(task, namespace, "OutlineLevel"), 1))
        parent_id = task_stack.get(outline_level - 1)
        if summary:
            wbs.append(
                {
                    "id": task_id,
                    "code": _text(task, namespace, "WBS") or _text(task, namespace, "OutlineNumber") or uid,
                    "name": _text(task, namespace, "Name") or f"WBS {uid}",
                    "parent_id": parent_id,
                }
            )
            task_stack[outline_level] = task_id
            task_stack = {level: value for level, value in task_stack.items() if level <= outline_level}
            continue

        task_uid_to_activity_id[uid] = task_id
        start = _parse_datetime(_text(task, namespace, "Start"), timezone_name)
        finish = _parse_datetime(_text(task, namespace, "Finish"), timezone_name)
        if start is None or finish is None:
            raise ValueError(f"La tarea MSPDI UID {uid} no contiene Start/Finish validos.")
        milestone = _text(task, namespace, "Milestone") == "1"
        constraint_code = _text(task, namespace, "ConstraintType") or "0"
        constraint_type = CONSTRAINT_FROM_MSPDI.get(constraint_code, "none")
        if constraint_code not in CONSTRAINT_FROM_MSPDI:
            unsupported.append(f"Task[{uid}].ConstraintType:{constraint_code}")
        activities.append(
            {
                "id": task_id,
                "code": _text(task, namespace, "WBS") or _text(task, namespace, "OutlineNumber") or _text(task, namespace, "ID") or uid,
                "name": _text(task, namespace, "Name") or f"Task {uid}",
                "activity_type": "start_milestone" if milestone else "task",
                "wbs_id": parent_id,
                "calendar_id": _text(task, namespace, "CalendarUID") or None,
                "planned_start": start,
                "planned_finish": finish,
                "actual_start": _parse_datetime(_text(task, namespace, "ActualStart"), timezone_name),
                "actual_finish": _parse_datetime(_text(task, namespace, "ActualFinish"), timezone_name),
                "percent_complete": min(max(_float(_text(task, namespace, "PercentComplete")), 0), 100),
                "duration_hours": 0 if milestone else max(_parse_duration_hours(_text(task, namespace, "Duration")), 0),
                "constraint_type": constraint_type,
                "constraint_date": _parse_datetime(_text(task, namespace, "ConstraintDate"), timezone_name),
                "custom_fields": {"mspdi_uid": uid},
            }
        )

    for task, task_id, summary in task_payloads:
        if summary:
            continue
        successor_id = task_id
        for link in task.findall(_qname(namespace, "PredecessorLink")):
            predecessor_uid = _text(link, namespace, "PredecessorUID")
            predecessor_id = task_uid_to_activity_id.get(predecessor_uid)
            if not predecessor_id:
                unsupported.append(f"Task[{successor_id}].PredecessorUID:{predecessor_uid}")
                continue
            dependency_code = _text(link, namespace, "Type") or "1"
            if dependency_code not in DEPENDENCY_TYPE_FROM_MSPDI:
                unsupported.append(f"Task[{successor_id}].DependencyType:{dependency_code}")
            dependencies.append(
                {
                    "predecessor_id": predecessor_id,
                    "successor_id": successor_id,
                    "dependency_type": DEPENDENCY_TYPE_FROM_MSPDI.get(dependency_code, "FS"),
                    "lag_hours": round(_float(_text(link, namespace, "LinkLag")) / 10 / 60, 6),
                }
            )

    resources = []
    resource_parent = root.find(_qname(namespace, "Resources"))
    resource_uid_to_id = {}
    for resource in resource_parent.findall(_qname(namespace, "Resource")) if resource_parent is not None else []:
        uid = _text(resource, namespace, "UID")
        if not uid or uid == "0" or _text(resource, namespace, "IsNull") == "1":
            continue
        resource_id = f"RESOURCE-{uid}"
        resource_uid_to_id[uid] = resource_id
        resource_type_code = _text(resource, namespace, "Type")
        resource_type = {"0": "material", "1": "labor", "2": "cost"}.get(resource_type_code, "labor")
        if resource_type_code not in {"0", "1", "2"}:
            unsupported.append(f"Resource[{uid}].Type:{resource_type_code}")
        resources.append(
            {
                "id": resource_id,
                "code": _text(resource, namespace, "Initials") or uid,
                "name": _text(resource, namespace, "Name") or f"Resource {uid}",
                "resource_type": resource_type,
                "max_units": max(_float(_text(resource, namespace, "MaxUnits"), 1), 0),
                "unit_cost": max(_float(_text(resource, namespace, "StandardRate")), 0),
            }
        )

    assignments = []
    assignment_parent = root.find(_qname(namespace, "Assignments"))
    for assignment in assignment_parent.findall(_qname(namespace, "Assignment")) if assignment_parent is not None else []:
        activity_id = task_uid_to_activity_id.get(_text(assignment, namespace, "TaskUID"))
        resource_id = resource_uid_to_id.get(_text(assignment, namespace, "ResourceUID"))
        if not activity_id or not resource_id:
            unsupported.append(
                "Assignment["
                f"{_text(assignment, namespace, 'UID')}].UnresolvedReference:"
                f"{_text(assignment, namespace, 'TaskUID')}:"
                f"{_text(assignment, namespace, 'ResourceUID')}"
            )
            continue
        assignments.append(
            {
                "activity_id": activity_id,
                "resource_id": resource_id,
                "planned_units": max(_float(_text(assignment, namespace, "Units")), 0),
                "planned_work_hours": max(_parse_duration_hours(_text(assignment, namespace, "Work")), 0),
                "planned_cost": max(_float(_text(assignment, namespace, "Cost")), 0),
                "actual_work_hours": max(_parse_duration_hours(_text(assignment, namespace, "ActualWork")), 0),
                "actual_cost": max(_float(_text(assignment, namespace, "ActualCost")), 0),
            }
        )

    for tag in ("Risks", "TimephasedData", "VBAProject", "EnterpriseExtendedAttributes"):
        if root.find(f".//{_qname(namespace, tag)}") is not None:
            unsupported.append(tag)
    if root.find(f".//{_qname(namespace, 'Baseline')}") is not None:
        unsupported.append("Baseline")
    document = BimScheduleInterchangeDocument.model_validate(
        {
            "source_format": "mspdi_xml",
            "source_filename": source_filename,
            "source_checksum_sha256": hashlib.sha256(xml_payload).hexdigest(),
            "source_application": "Microsoft Project MSPDI",
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


def export_mspdi_xml(document: BimScheduleInterchangeDocument) -> bytes:
    preflight = preflight_schedule_interchange(document)
    if not preflight["valid"]:
        raise ValueError("El contrato canonico contiene errores y no puede exportarse.")

    ET.register_namespace("", MSPDI_NAMESPACE)
    q = lambda name: f"{{{MSPDI_NAMESPACE}}}{name}"
    root = ET.Element(q("Project"))
    ET.SubElement(root, q("Name")).text = document.project_name
    ET.SubElement(root, q("GUID")).text = document.project_external_id
    ET.SubElement(root, q("StatusDate")).text = document.data_date.isoformat()
    ET.SubElement(root, q("StartDate")).text = min(item.planned_start for item in document.activities).isoformat()
    minutes_per_day = int(round((document.calendars[0].working_hours_per_day if document.calendars else 8) * 60))
    ET.SubElement(root, q("MinutesPerDay")).text = str(minutes_per_day)

    calendars_el = ET.SubElement(root, q("Calendars"))
    for calendar in document.calendars:
        calendar_el = ET.SubElement(calendars_el, q("Calendar"))
        ET.SubElement(calendar_el, q("UID")).text = calendar.id
        ET.SubElement(calendar_el, q("Name")).text = calendar.name
        ET.SubElement(calendar_el, q("IsBaseCalendar")).text = "1"
        weekdays_el = ET.SubElement(calendar_el, q("WeekDays"))
        for day_type in range(1, 8):
            iso_day = _mspdi_day_to_iso(day_type)
            weekday_el = ET.SubElement(weekdays_el, q("WeekDay"))
            ET.SubElement(weekday_el, q("DayType")).text = str(day_type)
            ET.SubElement(weekday_el, q("DayWorking")).text = "1" if iso_day in calendar.working_weekdays else "0"
        for exception in calendar.exceptions:
            weekday_el = ET.SubElement(weekdays_el, q("WeekDay"))
            ET.SubElement(weekday_el, q("DayType")).text = "0"
            ET.SubElement(weekday_el, q("DayWorking")).text = "1" if exception.working else "0"
            period_el = ET.SubElement(weekday_el, q("TimePeriod"))
            ET.SubElement(period_el, q("FromDate")).text = exception.date.isoformat()
            ET.SubElement(period_el, q("ToDate")).text = exception.date.isoformat()

    tasks_el = ET.SubElement(root, q("Tasks"))
    uid_by_id = {}
    uid = 1
    wbs_levels: dict[str, int] = {}
    for node, level in _ordered_wbs_with_levels(document):
        wbs_levels[node.id] = level
        uid_by_id[node.id] = uid
        task = ET.SubElement(tasks_el, q("Task"))
        ET.SubElement(task, q("UID")).text = str(uid)
        ET.SubElement(task, q("ID")).text = str(uid)
        ET.SubElement(task, q("Name")).text = node.name
        ET.SubElement(task, q("WBS")).text = node.code
        ET.SubElement(task, q("OutlineNumber")).text = node.code
        ET.SubElement(task, q("OutlineLevel")).text = str(level)
        ET.SubElement(task, q("Summary")).text = "1"
        uid += 1
    for activity in document.activities:
        uid_by_id[activity.id] = uid
        uid += 1
    by_successor = {}
    for dependency in document.dependencies:
        by_successor.setdefault(dependency.successor_id, []).append(dependency)
    for activity in document.activities:
        task_uid = uid_by_id[activity.id]
        task = ET.SubElement(tasks_el, q("Task"))
        ET.SubElement(task, q("UID")).text = str(task_uid)
        ET.SubElement(task, q("ID")).text = str(task_uid)
        ET.SubElement(task, q("Name")).text = activity.name
        ET.SubElement(task, q("WBS")).text = activity.code
        ET.SubElement(task, q("OutlineNumber")).text = activity.code
        ET.SubElement(task, q("OutlineLevel")).text = str(
            wbs_levels.get(activity.wbs_id, 0) + 1 if activity.wbs_id else 1
        )
        ET.SubElement(task, q("Summary")).text = "0"
        ET.SubElement(task, q("Milestone")).text = "1" if activity.activity_type.endswith("milestone") else "0"
        ET.SubElement(task, q("Start")).text = activity.planned_start.isoformat()
        ET.SubElement(task, q("Finish")).text = activity.planned_finish.isoformat()
        ET.SubElement(task, q("Duration")).text = _duration_xml(activity.duration_hours)
        ET.SubElement(task, q("PercentComplete")).text = str(round(activity.percent_complete, 4))
        if activity.calendar_id:
            ET.SubElement(task, q("CalendarUID")).text = activity.calendar_id
        if activity.constraint_type != "none":
            ET.SubElement(task, q("ConstraintType")).text = CONSTRAINT_TO_MSPDI.get(activity.constraint_type, "0")
            if activity.constraint_date:
                ET.SubElement(task, q("ConstraintDate")).text = activity.constraint_date.isoformat()
        for dependency in by_successor.get(activity.id, []):
            link = ET.SubElement(task, q("PredecessorLink"))
            ET.SubElement(link, q("PredecessorUID")).text = str(uid_by_id[dependency.predecessor_id])
            ET.SubElement(link, q("Type")).text = DEPENDENCY_TYPE_TO_MSPDI[dependency.dependency_type]
            ET.SubElement(link, q("LinkLag")).text = str(int(round(dependency.lag_hours * 60 * 10)))

    resources_el = ET.SubElement(root, q("Resources"))
    resource_uid_by_id = {}
    for resource_uid, resource in enumerate(document.resources, start=1):
        resource_uid_by_id[resource.id] = resource_uid
        node = ET.SubElement(resources_el, q("Resource"))
        ET.SubElement(node, q("UID")).text = str(resource_uid)
        ET.SubElement(node, q("ID")).text = str(resource_uid)
        ET.SubElement(node, q("Name")).text = resource.name
        ET.SubElement(node, q("Initials")).text = resource.code[:12]
        ET.SubElement(node, q("Type")).text = {"material": "0", "labor": "1", "equipment": "1", "role": "1", "cost": "2"}[resource.resource_type]
        ET.SubElement(node, q("MaxUnits")).text = str(resource.max_units or 0)
        ET.SubElement(node, q("StandardRate")).text = str(resource.unit_cost or 0)

    assignments_el = ET.SubElement(root, q("Assignments"))
    for assignment_uid, assignment in enumerate(document.assignments, start=1):
        node = ET.SubElement(assignments_el, q("Assignment"))
        ET.SubElement(node, q("UID")).text = str(assignment_uid)
        ET.SubElement(node, q("TaskUID")).text = str(uid_by_id[assignment.activity_id])
        ET.SubElement(node, q("ResourceUID")).text = str(resource_uid_by_id[assignment.resource_id])
        ET.SubElement(node, q("Units")).text = str(assignment.planned_units)
        ET.SubElement(node, q("Work")).text = _duration_xml(assignment.planned_work_hours)
        ET.SubElement(node, q("Cost")).text = str(assignment.planned_cost)
        ET.SubElement(node, q("ActualWork")).text = _duration_xml(assignment.actual_work_hours)
        ET.SubElement(node, q("ActualCost")).text = str(assignment.actual_cost)

    return ET.tostring(root, encoding="utf-8", xml_declaration=True)
