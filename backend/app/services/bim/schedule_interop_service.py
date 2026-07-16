from __future__ import annotations

import hashlib
import json
from collections import Counter, deque
from zoneinfo import ZoneInfo, ZoneInfoNotFoundError

from app.schemas.bim_schedule_interop import BimScheduleInterchangeDocument


def _issue(severity: str, code: str, path: str, message: str) -> dict[str, str]:
    return {"severity": severity, "code": code, "path": path, "message": message}


def _duplicates(values: list[str]) -> list[str]:
    return sorted(value for value, count in Counter(values).items() if count > 1)


def _canonical_checksum(document: BimScheduleInterchangeDocument) -> str:
    payload = document.model_dump(mode="json")
    serialized = json.dumps(payload, ensure_ascii=True, sort_keys=True, separators=(",", ":"))
    return hashlib.sha256(serialized.encode("utf-8")).hexdigest()


def preflight_schedule_interchange(document: BimScheduleInterchangeDocument) -> dict:
    errors: list[dict[str, str]] = []
    warnings: list[dict[str, str]] = []

    try:
        ZoneInfo(document.timezone)
    except ZoneInfoNotFoundError:
        errors.append(_issue("error", "invalid_timezone", "timezone", "La zona horaria IANA no existe."))

    collections = {
        "calendars": document.calendars,
        "wbs": document.wbs,
        "activities": document.activities,
        "resources": document.resources,
        "baselines": document.baselines,
    }
    for name, items in collections.items():
        for duplicate in _duplicates([item.id for item in items]):
            errors.append(_issue("error", "duplicate_id", name, f"ID duplicado: {duplicate}."))

    calendar_ids = {item.id for item in document.calendars}
    wbs_ids = {item.id for item in document.wbs}
    activity_ids = {item.id for item in document.activities}
    resource_ids = {item.id for item in document.resources}

    for index, calendar in enumerate(document.calendars):
        try:
            ZoneInfo(calendar.timezone)
        except ZoneInfoNotFoundError:
            errors.append(_issue("error", "invalid_timezone", f"calendars[{index}].timezone", "La zona horaria IANA no existe."))
        invalid_days = sorted(set(calendar.working_weekdays) - set(range(1, 8)))
        if invalid_days:
            errors.append(_issue("error", "invalid_working_weekday", f"calendars[{index}].working_weekdays", f"Dias fuera de ISO 1-7: {invalid_days}."))

    for index, node in enumerate(document.wbs):
        if node.parent_id and node.parent_id not in wbs_ids:
            errors.append(_issue("error", "missing_wbs_parent", f"wbs[{index}].parent_id", "El padre WBS no existe."))

    wbs_parents = {node.id: node.parent_id for node in document.wbs}
    reported_wbs_cycles: set[str] = set()
    for node_id in sorted(wbs_parents):
        visited: set[str] = set()
        current = node_id
        while current:
            if current in visited:
                if current not in reported_wbs_cycles:
                    errors.append(
                        _issue(
                            "error",
                            "wbs_cycle",
                            "wbs",
                            f"La jerarquia WBS contiene un ciclo que incluye {current}.",
                        )
                    )
                    reported_wbs_cycles.update(visited)
                break
            visited.add(current)
            current = wbs_parents.get(current)

    for index, activity in enumerate(document.activities):
        path = f"activities[{index}]"
        if activity.planned_finish < activity.planned_start:
            errors.append(_issue("error", "invalid_planned_dates", path, "planned_finish es anterior a planned_start."))
        if activity.actual_start and activity.actual_finish and activity.actual_finish < activity.actual_start:
            errors.append(_issue("error", "invalid_actual_dates", path, "actual_finish es anterior a actual_start."))
        if activity.percent_complete == 100 and not activity.actual_finish:
            warnings.append(_issue("warning", "completed_without_actual_finish", path, "La actividad esta al 100% sin fecha real de fin."))
        if activity.activity_type.endswith("milestone") and activity.duration_hours != 0:
            errors.append(_issue("error", "milestone_with_duration", path, "Un hito debe tener duracion cero."))
        if activity.wbs_id and activity.wbs_id not in wbs_ids:
            errors.append(_issue("error", "missing_wbs", f"{path}.wbs_id", "La WBS referenciada no existe."))
        if activity.calendar_id and activity.calendar_id not in calendar_ids:
            errors.append(_issue("error", "missing_calendar", f"{path}.calendar_id", "El calendario referenciado no existe."))
        if activity.constraint_type != "none" and activity.constraint_date is None:
            errors.append(_issue("error", "missing_constraint_date", f"{path}.constraint_date", "La restriccion requiere fecha."))

    edges: dict[str, set[str]] = {activity_id: set() for activity_id in activity_ids}
    indegree = {activity_id: 0 for activity_id in activity_ids}
    dependency_keys: list[str] = []
    for index, dependency in enumerate(document.dependencies):
        path = f"dependencies[{index}]"
        dependency_keys.append(
            f"{dependency.predecessor_id}|{dependency.successor_id}|{dependency.dependency_type}"
        )
        if dependency.predecessor_id not in activity_ids:
            errors.append(_issue("error", "missing_predecessor", f"{path}.predecessor_id", "La actividad predecesora no existe."))
        if dependency.successor_id not in activity_ids:
            errors.append(_issue("error", "missing_successor", f"{path}.successor_id", "La actividad sucesora no existe."))
        if dependency.predecessor_id == dependency.successor_id:
            errors.append(_issue("error", "self_dependency", path, "Una actividad no puede depender de si misma."))
        if dependency.predecessor_id in activity_ids and dependency.successor_id in activity_ids:
            if dependency.successor_id not in edges[dependency.predecessor_id]:
                edges[dependency.predecessor_id].add(dependency.successor_id)
                indegree[dependency.successor_id] += 1
    for duplicate in _duplicates(dependency_keys):
        errors.append(_issue("error", "duplicate_dependency", "dependencies", f"Relacion duplicada: {duplicate}."))

    queue = deque(sorted(activity_id for activity_id, degree in indegree.items() if degree == 0))
    visited = 0
    while queue:
        current = queue.popleft()
        visited += 1
        for successor in sorted(edges[current]):
            indegree[successor] -= 1
            if indegree[successor] == 0:
                queue.append(successor)
    if visited != len(activity_ids):
        errors.append(_issue("error", "dependency_cycle", "dependencies", "El cronograma contiene un ciclo de dependencias."))

    assignment_keys: list[str] = []
    for index, assignment in enumerate(document.assignments):
        path = f"assignments[{index}]"
        assignment_keys.append(f"{assignment.activity_id}|{assignment.resource_id}")
        if assignment.activity_id not in activity_ids:
            errors.append(_issue("error", "missing_assignment_activity", f"{path}.activity_id", "La actividad asignada no existe."))
        if assignment.resource_id not in resource_ids:
            errors.append(_issue("error", "missing_assignment_resource", f"{path}.resource_id", "El recurso asignado no existe."))
    for duplicate in _duplicates(assignment_keys):
        errors.append(_issue("error", "duplicate_assignment", "assignments", f"Asignacion duplicada: {duplicate}."))

    for index, baseline in enumerate(document.baselines):
        missing = sorted(set(baseline.activity_ids) - activity_ids)
        if missing:
            errors.append(_issue("error", "missing_baseline_activity", f"baselines[{index}].activity_ids", f"Actividades inexistentes: {missing}."))

    for field_name in sorted(set(document.unsupported_source_fields)):
        warnings.append(_issue("warning", "unsupported_source_field", "unsupported_source_fields", f"Campo no representable: {field_name}."))
    if not document.calendars:
        warnings.append(_issue("warning", "no_calendars", "calendars", "El intercambio no contiene calendarios."))
    if not document.baselines:
        warnings.append(_issue("warning", "no_baselines", "baselines", "El intercambio no contiene lineas base."))

    return {
        "valid": not errors,
        "normalized_checksum_sha256": _canonical_checksum(document),
        "counts": {
            "calendars": len(document.calendars),
            "wbs": len(document.wbs),
            "activities": len(document.activities),
            "dependencies": len(document.dependencies),
            "resources": len(document.resources),
            "assignments": len(document.assignments),
            "baselines": len(document.baselines),
            "errors": len(errors),
            "warnings": len(warnings),
        },
        "errors": errors,
        "warnings": warnings,
    }
