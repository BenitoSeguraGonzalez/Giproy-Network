from __future__ import annotations

import hashlib
import xml.etree.ElementTree as ET
from datetime import datetime
from zoneinfo import ZoneInfo, ZoneInfoNotFoundError

from defusedxml import ElementTree as SafeET

from app.schemas.bim_schedule_interop import BimScheduleInterchangeDocument
from app.services.bim.schedule_interop_service import preflight_schedule_interchange


P6_NAMESPACE = "http://xmlns.oracle.com/Primavera/P6/V24.12/API/BusinessObjects"
MAX_P6_XML_BYTES = 50 * 1024 * 1024
MAX_P6_ACTIVITIES = 200_000
P6_ACTIVITY_TYPES = {
    "Task Dependent": "task",
    "Resource Dependent": "task",
    "Start Milestone": "start_milestone",
    "Finish Milestone": "finish_milestone",
    "Level of Effort": "level_of_effort",
}
P6_ACTIVITY_TYPES_EXPORT = {
    "task": "Task Dependent",
    "start_milestone": "Start Milestone",
    "finish_milestone": "Finish Milestone",
    "level_of_effort": "Level of Effort",
}
P6_RELATIONSHIP_TYPES = {
    "Finish to Start": "FS",
    "Start to Start": "SS",
    "Finish to Finish": "FF",
    "Start to Finish": "SF",
}
P6_RELATIONSHIP_TYPES_EXPORT = {value: key for key, value in P6_RELATIONSHIP_TYPES.items()}
P6_CONSTRAINTS = {
    "Start On": "start_on",
    "Start On or After": "start_no_earlier_than",
    "Start On or Before": "start_no_later_than",
    "Finish On": "finish_on",
    "Finish On or After": "finish_no_earlier_than",
    "Finish On or Before": "finish_no_later_than",
    "Mandatory Start": "mandatory_start",
    "Mandatory Finish": "mandatory_finish",
}
P6_CONSTRAINTS_EXPORT = {value: key for key, value in P6_CONSTRAINTS.items()}
P6_RESOURCE_TYPES = {"Labor": "labor", "Nonlabor": "equipment", "Material": "material"}
P6_RESOURCE_TYPES_EXPORT = {"labor": "Labor", "equipment": "Nonlabor", "material": "Material", "role": "Labor", "cost": "Material"}


def _local_name(tag: str) -> str:
    return tag.split("}", 1)[-1]


def _children(parent, name: str) -> list:
    return [child for child in list(parent) if _local_name(child.tag) == name]


def _descendants(parent, name: str) -> list:
    return [child for child in parent.iter() if _local_name(child.tag) == name]


def _text(parent, name: str) -> str:
    children = _children(parent, name)
    return (children[0].text or "").strip() if children else ""


def _float(value: str, default: float = 0.0) -> float:
    try:
        return float(value)
    except (TypeError, ValueError):
        return default


def _datetime(value: str, timezone_name: str) -> datetime | None:
    value = (value or "").strip()
    if not value:
        return None
    parsed = datetime.fromisoformat(value.replace("Z", "+00:00"))
    if parsed.tzinfo is None:
        parsed = parsed.replace(tzinfo=ZoneInfo(timezone_name))
    return parsed


def _add(parent, q, name: str, value) -> None:
    if value is not None:
        ET.SubElement(parent, q(name)).text = str(value)


def parse_p6_xml(
    xml_payload: bytes,
    *,
    source_filename: str,
    timezone_name: str,
    currency: str = "USD",
) -> dict:
    if not xml_payload:
        raise ValueError("El archivo P6 XML esta vacio.")
    if len(xml_payload) > MAX_P6_XML_BYTES:
        raise ValueError(f"El archivo P6 XML supera el limite de {MAX_P6_XML_BYTES} bytes.")
    try:
        ZoneInfo(timezone_name)
    except ZoneInfoNotFoundError as exc:
        raise ValueError("La zona horaria IANA indicada no existe.") from exc
    try:
        root = SafeET.fromstring(xml_payload)
    except Exception as exc:
        raise ValueError("El archivo P6 XML no es valido o contiene construcciones inseguras.") from exc
    if _local_name(root.tag) != "APIBusinessObjects":
        raise ValueError("El XML no contiene una raiz APIBusinessObjects de Primavera P6.")

    projects = _children(root, "Project")
    if len(projects) != 1:
        raise ValueError("El preview P6 XML requiere exactamente un proyecto por archivo.")
    project = projects[0]
    project_object_id = _text(project, "ObjectId")
    project_external_id = _text(project, "Id") or project_object_id
    project_name = _text(project, "Name") or source_filename
    data_date = _datetime(_text(project, "DataDate"), timezone_name)
    if data_date is None:
        raise ValueError("El proyecto P6 no contiene DataDate valida.")

    unsupported: list[str] = []
    calendars = []
    for calendar in _children(root, "Calendar"):
        object_id = _text(calendar, "ObjectId")
        if not object_id:
            continue
        weekdays = []
        for day in _descendants(calendar, "DayOfWeek"):
            day_name = (day.text or "").strip().lower()
            iso_day = {
                "monday": 1, "tuesday": 2, "wednesday": 3,
                "thursday": 4, "friday": 5, "saturday": 6, "sunday": 7,
            }.get(day_name)
            if iso_day:
                weekdays.append(iso_day)
        exceptions = []
        for exception in _descendants(calendar, "HolidayOrException"):
            value = _text(exception, "Date")
            if value:
                exceptions.append(
                    {
                        "date": value[:10],
                        "working": bool(_descendants(exception, "WorkTime")),
                    }
                )
        calendars.append(
            {
                "id": f"P6-CAL-{object_id}",
                "name": _text(calendar, "Name") or f"Calendar {object_id}",
                "timezone": timezone_name,
                "working_weekdays": sorted(set(weekdays)) or [1, 2, 3, 4, 5],
                "working_hours_per_day": max(_float(_text(calendar, "HoursPerDay"), 8), 0.01),
                "exceptions": exceptions,
            }
        )

    wbs_nodes = _children(root, "WBS")
    wbs_object_ids = {_text(node, "ObjectId") for node in wbs_nodes}
    wbs = []
    for node in wbs_nodes:
        object_id = _text(node, "ObjectId")
        if not object_id:
            continue
        parent_object_id = _text(node, "ParentObjectId")
        wbs.append(
            {
                "id": f"P6-WBS-{object_id}",
                "code": _text(node, "Code") or object_id,
                "name": _text(node, "Name") or f"WBS {object_id}",
                "parent_id": f"P6-WBS-{parent_object_id}" if parent_object_id in wbs_object_ids else None,
            }
        )

    activity_nodes = _children(root, "Activity")
    if len(activity_nodes) > MAX_P6_ACTIVITIES:
        raise ValueError(f"El P6 XML supera {MAX_P6_ACTIVITIES} actividades.")
    activity_object_ids = {_text(node, "ObjectId") for node in activity_nodes}
    activities = []
    for activity in activity_nodes:
        object_id = _text(activity, "ObjectId")
        if not object_id:
            continue
        start = _datetime(_text(activity, "PlannedStartDate") or _text(activity, "StartDate"), timezone_name)
        finish = _datetime(_text(activity, "PlannedFinishDate") or _text(activity, "FinishDate"), timezone_name)
        if start is None or finish is None:
            raise ValueError(f"La actividad P6 ObjectId {object_id} no contiene fechas plan validas.")
        activity_type_source = _text(activity, "Type") or "Task Dependent"
        if activity_type_source not in P6_ACTIVITY_TYPES:
            unsupported.append(f"Activity[{object_id}].Type:{activity_type_source}")
        constraint_source = _text(activity, "PrimaryConstraintType") or _text(activity, "ConstraintType")
        if constraint_source and constraint_source not in P6_CONSTRAINTS:
            unsupported.append(f"Activity[{object_id}].Constraint:{constraint_source}")
        activity_type = P6_ACTIVITY_TYPES.get(activity_type_source, "task")
        activities.append(
            {
                "id": f"P6-ACT-{object_id}",
                "code": _text(activity, "Id") or object_id,
                "name": _text(activity, "Name") or f"Activity {object_id}",
                "activity_type": activity_type,
                "wbs_id": f"P6-WBS-{_text(activity, 'WBSObjectId')}" if _text(activity, "WBSObjectId") else None,
                "calendar_id": f"P6-CAL-{_text(activity, 'CalendarObjectId')}" if _text(activity, "CalendarObjectId") else None,
                "planned_start": start,
                "planned_finish": finish,
                "actual_start": _datetime(_text(activity, "ActualStartDate"), timezone_name),
                "actual_finish": _datetime(_text(activity, "ActualFinishDate"), timezone_name),
                "percent_complete": min(max(_float(_text(activity, "PercentComplete")), 0), 100),
                "duration_hours": 0 if activity_type.endswith("milestone") else max(_float(_text(activity, "PlannedDuration")), 0),
                "constraint_type": P6_CONSTRAINTS.get(constraint_source, "none"),
                "constraint_date": _datetime(_text(activity, "PrimaryConstraintDate") or _text(activity, "ConstraintDate"), timezone_name),
                "custom_fields": {"p6_object_id": object_id},
            }
        )

    dependencies = []
    for relationship in _children(root, "Relationship"):
        predecessor = _text(relationship, "PredecessorActivityObjectId")
        successor = _text(relationship, "SuccessorActivityObjectId")
        if predecessor not in activity_object_ids or successor not in activity_object_ids:
            unsupported.append(f"Relationship[{_text(relationship, 'ObjectId')}].UnresolvedReference:{predecessor}:{successor}")
            continue
        relationship_type = _text(relationship, "Type") or "Finish to Start"
        if relationship_type not in P6_RELATIONSHIP_TYPES:
            unsupported.append(f"Relationship[{_text(relationship, 'ObjectId')}].Type:{relationship_type}")
        dependencies.append(
            {
                "predecessor_id": f"P6-ACT-{predecessor}",
                "successor_id": f"P6-ACT-{successor}",
                "dependency_type": P6_RELATIONSHIP_TYPES.get(relationship_type, "FS"),
                "lag_hours": _float(_text(relationship, "Lag")),
            }
        )

    resources = []
    resource_object_ids: set[str] = set()
    for resource in _children(root, "Resource"):
        object_id = _text(resource, "ObjectId")
        if not object_id:
            continue
        resource_object_ids.add(object_id)
        source_type = _text(resource, "ResourceType") or "Labor"
        if source_type not in P6_RESOURCE_TYPES:
            unsupported.append(f"Resource[{object_id}].Type:{source_type}")
        resources.append(
            {
                "id": f"P6-RES-{object_id}",
                "code": _text(resource, "Id") or object_id,
                "name": _text(resource, "Name") or f"Resource {object_id}",
                "resource_type": P6_RESOURCE_TYPES.get(source_type, "labor"),
                "max_units": max(_float(_text(resource, "MaxUnitsPerTime"), 1), 0),
                "unit_cost": max(_float(_text(resource, "PricePerUnit")), 0),
            }
        )

    assignments = []
    for assignment in _children(root, "ResourceAssignment"):
        activity_object_id = _text(assignment, "ActivityObjectId")
        resource_object_id = _text(assignment, "ResourceObjectId")
        if activity_object_id not in activity_object_ids or resource_object_id not in resource_object_ids:
            unsupported.append(f"ResourceAssignment[{_text(assignment, 'ObjectId')}].UnresolvedReference:{activity_object_id}:{resource_object_id}")
            continue
        assignments.append(
            {
                "activity_id": f"P6-ACT-{activity_object_id}",
                "resource_id": f"P6-RES-{resource_object_id}",
                "planned_units": max(_float(_text(assignment, "PlannedUnits")), 0),
                "planned_work_hours": max(_float(_text(assignment, "PlannedDuration")), 0),
                "planned_cost": max(_float(_text(assignment, "PlannedCost")), 0),
                "actual_work_hours": max(_float(_text(assignment, "ActualUnits")), 0),
                "actual_cost": max(_float(_text(assignment, "ActualCost")), 0),
            }
        )

    for tag in ("BaselineProject", "Risk", "UDFValue", "ActivityExpense", "ActivityStep"):
        if _descendants(root, tag):
            unsupported.append(tag)
    document = BimScheduleInterchangeDocument.model_validate(
        {
            "source_format": "p6_xml",
            "source_filename": source_filename,
            "source_checksum_sha256": hashlib.sha256(xml_payload).hexdigest(),
            "source_application": "Oracle Primavera P6 PMXML",
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


def export_p6_xml(document: BimScheduleInterchangeDocument) -> bytes:
    preflight = preflight_schedule_interchange(document)
    if not preflight["valid"]:
        raise ValueError("El contrato canonico contiene errores y no puede exportarse.")
    ET.register_namespace("", P6_NAMESPACE)
    q = lambda name: f"{{{P6_NAMESPACE}}}{name}"
    root = ET.Element(q("APIBusinessObjects"))

    project = ET.SubElement(root, q("Project"))
    _add(project, q, "ObjectId", 1)
    _add(project, q, "Id", document.project_external_id)
    _add(project, q, "Name", document.project_name)
    _add(project, q, "DataDate", document.data_date.isoformat())
    _add(project, q, "PlannedStartDate", min(item.planned_start for item in document.activities).isoformat())

    calendar_object_ids = {item.id: index for index, item in enumerate(document.calendars, start=100)}
    for calendar in document.calendars:
        node = ET.SubElement(root, q("Calendar"))
        _add(node, q, "ObjectId", calendar_object_ids[calendar.id])
        _add(node, q, "Name", calendar.name)
        _add(node, q, "Type", "Project")
        _add(node, q, "HoursPerDay", calendar.working_hours_per_day)
        standard_week = ET.SubElement(node, q("StandardWorkWeek"))
        for day_name, iso_day in (("Monday", 1), ("Tuesday", 2), ("Wednesday", 3), ("Thursday", 4), ("Friday", 5), ("Saturday", 6), ("Sunday", 7)):
            if iso_day in calendar.working_weekdays:
                hours = ET.SubElement(standard_week, q("StandardWorkHours"))
                _add(hours, q, "DayOfWeek", day_name)
        if calendar.exceptions:
            exceptions = ET.SubElement(node, q("HolidayOrExceptions"))
            for exception in calendar.exceptions:
                item = ET.SubElement(exceptions, q("HolidayOrException"))
                _add(item, q, "Date", exception.date.isoformat())
                if exception.working:
                    work_time = ET.SubElement(item, q("WorkTime"))
                    _add(work_time, q, "Start", "08:00:00")
                    _add(work_time, q, "Finish", "17:00:00")

    wbs_object_ids = {item.id: index for index, item in enumerate(document.wbs, start=1000)}
    for item in document.wbs:
        node = ET.SubElement(root, q("WBS"))
        _add(node, q, "ObjectId", wbs_object_ids[item.id])
        _add(node, q, "ProjectObjectId", 1)
        _add(node, q, "ParentObjectId", wbs_object_ids.get(item.parent_id))
        _add(node, q, "Code", item.code)
        _add(node, q, "Name", item.name)

    activity_object_ids = {item.id: index for index, item in enumerate(document.activities, start=10_000)}
    for item in document.activities:
        node = ET.SubElement(root, q("Activity"))
        _add(node, q, "ObjectId", activity_object_ids[item.id])
        _add(node, q, "ProjectObjectId", 1)
        _add(node, q, "WBSObjectId", wbs_object_ids.get(item.wbs_id))
        _add(node, q, "CalendarObjectId", calendar_object_ids.get(item.calendar_id))
        _add(node, q, "Id", item.code)
        _add(node, q, "Name", item.name)
        _add(node, q, "Type", P6_ACTIVITY_TYPES_EXPORT[item.activity_type])
        _add(node, q, "PlannedStartDate", item.planned_start.isoformat())
        _add(node, q, "PlannedFinishDate", item.planned_finish.isoformat())
        _add(node, q, "ActualStartDate", item.actual_start.isoformat() if item.actual_start else None)
        _add(node, q, "ActualFinishDate", item.actual_finish.isoformat() if item.actual_finish else None)
        _add(node, q, "PercentComplete", item.percent_complete)
        _add(node, q, "PlannedDuration", item.duration_hours)
        if item.constraint_type != "none":
            _add(node, q, "PrimaryConstraintType", P6_CONSTRAINTS_EXPORT[item.constraint_type])
            _add(node, q, "PrimaryConstraintDate", item.constraint_date.isoformat() if item.constraint_date else None)

    for object_id, item in enumerate(document.dependencies, start=20_000):
        node = ET.SubElement(root, q("Relationship"))
        _add(node, q, "ObjectId", object_id)
        _add(node, q, "ProjectObjectId", 1)
        _add(node, q, "PredecessorActivityObjectId", activity_object_ids[item.predecessor_id])
        _add(node, q, "SuccessorActivityObjectId", activity_object_ids[item.successor_id])
        _add(node, q, "Type", P6_RELATIONSHIP_TYPES_EXPORT[item.dependency_type])
        _add(node, q, "Lag", item.lag_hours)

    resource_object_ids = {item.id: index for index, item in enumerate(document.resources, start=30_000)}
    for item in document.resources:
        node = ET.SubElement(root, q("Resource"))
        _add(node, q, "ObjectId", resource_object_ids[item.id])
        _add(node, q, "Id", item.code)
        _add(node, q, "Name", item.name)
        _add(node, q, "ResourceType", P6_RESOURCE_TYPES_EXPORT[item.resource_type])
        _add(node, q, "MaxUnitsPerTime", item.max_units)
        _add(node, q, "PricePerUnit", item.unit_cost)

    for object_id, item in enumerate(document.assignments, start=40_000):
        node = ET.SubElement(root, q("ResourceAssignment"))
        _add(node, q, "ObjectId", object_id)
        _add(node, q, "ProjectObjectId", 1)
        _add(node, q, "ActivityObjectId", activity_object_ids[item.activity_id])
        _add(node, q, "ResourceObjectId", resource_object_ids[item.resource_id])
        _add(node, q, "PlannedUnits", item.planned_units)
        _add(node, q, "PlannedDuration", item.planned_work_hours)
        _add(node, q, "PlannedCost", item.planned_cost)
        _add(node, q, "ActualUnits", item.actual_work_hours)
        _add(node, q, "ActualCost", item.actual_cost)

    return ET.tostring(root, encoding="utf-8", xml_declaration=True)
