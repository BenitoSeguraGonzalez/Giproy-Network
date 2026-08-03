from datetime import datetime, timezone

from fastapi import HTTPException

from app.models.bim_4d import (
    Bim4dActivitySnapshot,
    Bim4dBaseline,
    Bim4dBaselineActivity,
    Bim4dDependencySnapshot,
    Bim4dLinkProposal,
    Bim4dProgressSnapshot,
)
from app.models.bim_element import BimElement
from app.models.bim_model import BimModel
from app.models.bim_model_version import BimModelVersion
from app.models.presupuesto import Presupuesto, PresupuestoDetalle


def _utc(value):
    if value is None:
        return None
    if value.tzinfo is None:
        return value.replace(tzinfo=timezone.utc)
    return value.astimezone(timezone.utc)


def _serialize_activity(activity):
    return {
        "id": activity.id,
        "project_id": activity.proyecto_id,
        "company_id": activity.empresa_id,
        "source_kind": activity.source_kind,
        "source_ref": activity.source_ref,
        "budget_line_id": activity.budget_line_id,
        "snapshot_revision": activity.snapshot_revision,
        "activity_code": activity.activity_code,
        "activity_name": activity.activity_name,
        "planned_start": activity.planned_start,
        "planned_finish": activity.planned_finish,
        "captured_by": activity.captured_by,
        "captured_at": activity.captured_at,
    }


def _get_element(db, *, element_id, project_id, company_id):
    element = (
        db.query(BimElement)
        .join(BimModelVersion)
        .join(BimModel)
        .filter(
            BimElement.id == element_id,
            BimModel.proyecto_id == project_id,
            BimModel.empresa_id == company_id,
        )
        .first()
    )
    if not element:
        raise HTTPException(status_code=404, detail="Elemento BIM fuera del proyecto activo.")
    return element


def build_gantt(db, *, baseline_id, project_id, company_id):
    baseline = db.query(Bim4dBaseline).filter(Bim4dBaseline.id == baseline_id, Bim4dBaseline.proyecto_id == project_id, Bim4dBaseline.empresa_id == company_id).first()
    if not baseline:
        raise HTTPException(status_code=404, detail="Linea base BIM 4D fuera del proyecto activo.")
    baseline_rows = db.query(Bim4dBaselineActivity).filter(Bim4dBaselineActivity.baseline_id == baseline.id).all()
    activity_ids = [row.activity_snapshot_id for row in baseline_rows]
    activities = db.query(Bim4dActivitySnapshot).filter(Bim4dActivitySnapshot.id.in_(activity_ids)).all()
    by_id = {activity.id: activity for activity in activities}
    dependencies = db.query(Bim4dDependencySnapshot).filter(Bim4dDependencySnapshot.baseline_id == baseline.id).all()
    successors = {activity_id: [] for activity_id in activity_ids}; indegree = {activity_id: 0 for activity_id in activity_ids}
    for dependency in dependencies:
        successors[dependency.predecessor_activity_id].append(dependency.successor_activity_id)
        indegree[dependency.successor_activity_id] += 1
    queue = sorted(activity_id for activity_id, count in indegree.items() if count == 0); order = []
    while queue:
        activity_id = queue.pop(0); order.append(activity_id)
        for successor_id in successors[activity_id]:
            indegree[successor_id] -= 1
            if indegree[successor_id] == 0: queue.append(successor_id); queue.sort()
    if len(order) != len(activity_ids):
        raise HTTPException(status_code=409, detail="La linea base contiene un ciclo de dependencias.")
    duration = {activity.id: max(1.0, (activity.planned_finish - activity.planned_start).total_seconds() / 86400 + 1) for activity in activities}
    distance = {activity_id: duration[activity_id] for activity_id in activity_ids}; parent = {}
    for activity_id in order:
        for successor_id in successors[activity_id]:
            candidate = distance[activity_id] + duration[successor_id]
            if candidate > distance[successor_id]: distance[successor_id] = candidate; parent[successor_id] = activity_id
    end_id = max(order, key=lambda activity_id: distance[activity_id]); critical_path = []
    while end_id is not None:
        critical_path.append(end_id); end_id = parent.get(end_id)
    critical_path.reverse(); critical_set = set(critical_path)
    approved_links = db.query(Bim4dLinkProposal, BimElement).join(BimElement, BimElement.id == Bim4dLinkProposal.bim_element_id).filter(Bim4dLinkProposal.proyecto_id == project_id, Bim4dLinkProposal.empresa_id == company_id, Bim4dLinkProposal.status == "approved", Bim4dLinkProposal.activity_snapshot_id.in_(activity_ids)).all()
    guids = {}
    for link, element in approved_links: guids.setdefault(link.activity_snapshot_id, set()).add(element.global_id)
    serialized = [{"id": activity.id, "source_ref": activity.source_ref, "budget_line_id": activity.budget_line_id, "code": activity.activity_code, "name": activity.activity_name, "planned_start": activity.planned_start, "planned_finish": activity.planned_finish, "duration_days": round(duration[activity.id], 2), "critical": activity.id in critical_set, "global_ids": sorted(guids.get(activity.id, set()))} for activity in sorted(activities, key=lambda value: (value.planned_start, value.activity_code))]
    return {"project_id": project_id, "company_id": company_id, "baseline_id": baseline.id, "range_start": min(activity.planned_start for activity in activities), "range_finish": max(activity.planned_finish for activity in activities), "critical_path_activity_ids": critical_path, "activities": serialized, "dependencies": [{"predecessor_activity_id": item.predecessor_activity_id, "successor_activity_id": item.successor_activity_id, "dependency_type": item.dependency_type, "lag_days": item.lag_days} for item in dependencies]}


def create_activity_snapshot(db, *, project_id, company_id, user_id, payload):
    if payload.budget_line_id:
        budget_line = (
            db.query(PresupuestoDetalle)
            .join(Presupuesto, Presupuesto.id == PresupuestoDetalle.presupuesto_id)
            .filter(
                PresupuestoDetalle.id == payload.budget_line_id,
                Presupuesto.proyecto_id == project_id,
                Presupuesto.empresa_id == company_id,
            )
            .first()
        )
        if not budget_line:
            raise HTTPException(status_code=400, detail="La partida de la actividad 4D queda fuera del proyecto activo.")
    duplicate = db.query(Bim4dActivitySnapshot).filter(
        Bim4dActivitySnapshot.empresa_id == company_id,
        Bim4dActivitySnapshot.proyecto_id == project_id,
        Bim4dActivitySnapshot.source_kind == payload.source_kind,
        Bim4dActivitySnapshot.source_ref == payload.source_ref,
        Bim4dActivitySnapshot.snapshot_revision == payload.snapshot_revision,
    ).first()
    if duplicate:
        raise HTTPException(status_code=409, detail="El snapshot 4D ya fue registrado.")
    activity = Bim4dActivitySnapshot(
        empresa_id=company_id,
        proyecto_id=project_id,
        captured_by=user_id,
        **payload.model_dump(),
    )
    db.add(activity)
    db.commit()
    db.refresh(activity)
    return _serialize_activity(activity)


def list_activity_snapshots(db, *, project_id, company_id):
    activities = db.query(Bim4dActivitySnapshot).filter(
        Bim4dActivitySnapshot.empresa_id == company_id,
        Bim4dActivitySnapshot.proyecto_id == project_id,
    ).order_by(Bim4dActivitySnapshot.planned_start, Bim4dActivitySnapshot.activity_code).all()
    return [_serialize_activity(activity) for activity in activities]


def _serialize_proposal(proposal, element, activity):
    return {
        "id": proposal.id,
        "project_id": proposal.proyecto_id,
        "company_id": proposal.empresa_id,
        "version_id": proposal.bim_model_version_id,
        "element_id": proposal.bim_element_id,
        "global_id": element.global_id,
        "activity": _serialize_activity(activity),
        "link_type": proposal.link_type,
        "status": proposal.status,
        "proposal_reason": proposal.proposal_reason,
        "decision_reason": proposal.decision_reason,
        "created_by": proposal.created_by,
        "decided_by": proposal.decided_by,
        "created_at": proposal.created_at,
        "decided_at": proposal.decided_at,
    }


def create_link_proposal(db, *, project_id, company_id, user_id, payload):
    element = _get_element(db, element_id=payload.element_id, project_id=project_id, company_id=company_id)
    activity = db.query(Bim4dActivitySnapshot).filter(
        Bim4dActivitySnapshot.id == payload.activity_snapshot_id,
        Bim4dActivitySnapshot.proyecto_id == project_id,
        Bim4dActivitySnapshot.empresa_id == company_id,
    ).first()
    if not activity:
        raise HTTPException(status_code=404, detail="Actividad 4D fuera del proyecto activo.")
    existing = db.query(Bim4dLinkProposal).filter(
        Bim4dLinkProposal.empresa_id == company_id,
        Bim4dLinkProposal.proyecto_id == project_id,
        Bim4dLinkProposal.bim_element_id == element.id,
        Bim4dLinkProposal.activity_snapshot_id == activity.id,
        Bim4dLinkProposal.link_type == payload.link_type,
        Bim4dLinkProposal.status.in_(["pending", "approved"]),
    ).first()
    if existing:
        raise HTTPException(status_code=409, detail="Ya existe un vínculo 4D vigente para esta actividad y elemento.")
    proposal = Bim4dLinkProposal(
        empresa_id=company_id,
        proyecto_id=project_id,
        bim_model_version_id=element.bim_model_version_id,
        bim_element_id=element.id,
        activity_snapshot_id=activity.id,
        link_type=payload.link_type,
        proposal_reason=payload.proposal_reason,
        created_by=user_id,
    )
    db.add(proposal)
    db.commit()
    db.refresh(proposal)
    return _serialize_proposal(proposal, element, activity)


def list_link_proposals(db, *, project_id, company_id, element_id=None):
    query = db.query(Bim4dLinkProposal).filter(
        Bim4dLinkProposal.empresa_id == company_id,
        Bim4dLinkProposal.proyecto_id == project_id,
    )
    if element_id:
        query = query.filter(Bim4dLinkProposal.bim_element_id == element_id)
    proposals = query.order_by(Bim4dLinkProposal.created_at.desc()).all()
    result = []
    for proposal in proposals:
        element = db.query(BimElement).filter(BimElement.id == proposal.bim_element_id).one()
        activity = db.query(Bim4dActivitySnapshot).filter(Bim4dActivitySnapshot.id == proposal.activity_snapshot_id).one()
        result.append(_serialize_proposal(proposal, element, activity))
    return result


def decide_link_proposal(db, *, proposal_id, project_id, company_id, user_id, decision, reason):
    proposal = db.query(Bim4dLinkProposal).filter(
        Bim4dLinkProposal.id == proposal_id,
        Bim4dLinkProposal.proyecto_id == project_id,
        Bim4dLinkProposal.empresa_id == company_id,
        Bim4dLinkProposal.status == "pending",
    ).first()
    if not proposal:
        raise HTTPException(status_code=404, detail="Propuesta 4D pendiente no encontrada.")
    proposal.status = decision
    proposal.decision_reason = reason
    proposal.decided_by = user_id
    proposal.decided_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(proposal)
    element = db.query(BimElement).filter(BimElement.id == proposal.bim_element_id).one()
    activity = db.query(Bim4dActivitySnapshot).filter(Bim4dActivitySnapshot.id == proposal.activity_snapshot_id).one()
    return _serialize_proposal(proposal, element, activity)


def create_progress_snapshot(db, *, project_id, company_id, user_id, payload):
    activity = db.query(Bim4dActivitySnapshot).filter(
        Bim4dActivitySnapshot.id == payload.activity_snapshot_id,
        Bim4dActivitySnapshot.proyecto_id == project_id,
        Bim4dActivitySnapshot.empresa_id == company_id,
    ).first()
    if not activity:
        raise HTTPException(status_code=404, detail="Actividad 4D fuera del proyecto activo.")
    latest = db.query(Bim4dProgressSnapshot).filter(
        Bim4dProgressSnapshot.activity_snapshot_id == activity.id,
        Bim4dProgressSnapshot.empresa_id == company_id,
        Bim4dProgressSnapshot.proyecto_id == project_id,
    ).order_by(Bim4dProgressSnapshot.reported_at.desc()).first()
    if latest and _utc(payload.reported_at) <= _utc(latest.reported_at):
        raise HTTPException(status_code=409, detail="El progreso 4D debe ser posterior al último reporte.")
    progress = Bim4dProgressSnapshot(
        empresa_id=company_id,
        proyecto_id=project_id,
        reported_by=user_id,
        **payload.model_dump(),
    )
    db.add(progress)
    db.commit()
    db.refresh(progress)
    return {
        "id": progress.id, "project_id": project_id, "company_id": company_id,
        "activity_snapshot_id": progress.activity_snapshot_id,
        "progress_percent": progress.progress_percent, "actual_start": progress.actual_start,
        "actual_finish": progress.actual_finish, "note": progress.note,
        "reported_at": progress.reported_at, "reported_by": progress.reported_by,
        "created_at": progress.created_at,
    }


def _timeline_state(activity, progress, cutoff, link_type):
    cutoff = _utc(cutoff)
    planned_start = _utc(activity.planned_start)
    planned_finish = _utc(activity.planned_finish)
    percent = float(progress.progress_percent) if progress else 0.0
    if percent >= 100:
        state = "completed"
    elif cutoff < planned_start:
        state = "not_started"
    elif cutoff <= planned_finish:
        state = "in_progress"
    else:
        state = "delayed"
    if link_type == "demolition" and state == "completed":
        return "demolished", percent, False, 0.0, "#71717a"
    profiles = {
        "not_started": (False, 0.0, "#71717a"),
        "in_progress": (True, 1.0, "#F39200"),
        "completed": (True, 1.0, "#15803d"),
        "delayed": (True, 1.0, "#be123c"),
    }
    visible, opacity, color = profiles[state]
    return state, percent, visible, opacity, color


def build_timeline(db, *, project_id, company_id, cutoff):
    proposals = db.query(Bim4dLinkProposal).filter(
        Bim4dLinkProposal.proyecto_id == project_id,
        Bim4dLinkProposal.empresa_id == company_id,
        Bim4dLinkProposal.status == "approved",
    ).all()
    items = []
    starts = []
    finishes = []
    for proposal in proposals:
        activity = db.query(Bim4dActivitySnapshot).filter(Bim4dActivitySnapshot.id == proposal.activity_snapshot_id).one()
        element = db.query(BimElement).filter(BimElement.id == proposal.bim_element_id).one()
        progress = db.query(Bim4dProgressSnapshot).filter(
            Bim4dProgressSnapshot.activity_snapshot_id == activity.id,
            Bim4dProgressSnapshot.reported_at <= cutoff,
        ).order_by(Bim4dProgressSnapshot.reported_at.desc()).first()
        state, percent, visible, opacity, color = _timeline_state(activity, progress, cutoff, proposal.link_type)
        starts.append(activity.planned_start); finishes.append(activity.planned_finish)
        items.append({
            "global_id": element.global_id, "element_id": element.id,
            "version_id": element.bim_model_version_id,
            "activity_snapshot_id": activity.id, "activity_code": activity.activity_code,
            "activity_name": activity.activity_name, "link_type": proposal.link_type,
            "state": state, "progress_percent": percent, "visible": visible,
            "opacity": opacity, "color": color,
        })
    counts = {}
    for item in items:
        counts[item["state"]] = counts.get(item["state"], 0) + 1
    return {
        "project_id": project_id, "company_id": company_id, "cutoff": cutoff,
        "range_start": min(starts) if starts else None,
        "range_finish": max(finishes) if finishes else None,
        "counts": counts, "items": items,
    }


def _baseline_activities(db, baseline_id):
    links = db.query(Bim4dBaselineActivity).filter(
        Bim4dBaselineActivity.baseline_id == baseline_id,
    ).all()
    activity_ids = [link.activity_snapshot_id for link in links]
    if not activity_ids:
        return []
    activities = db.query(Bim4dActivitySnapshot).filter(
        Bim4dActivitySnapshot.id.in_(activity_ids),
    ).all()
    by_id = {activity.id: activity for activity in activities}
    return [by_id[activity_id] for activity_id in activity_ids if activity_id in by_id]


def _serialize_baseline(db, baseline):
    activities = _baseline_activities(db, baseline.id)
    dependencies = db.query(Bim4dDependencySnapshot).filter(
        Bim4dDependencySnapshot.baseline_id == baseline.id,
    ).order_by(Bim4dDependencySnapshot.id).all()
    return {
        "id": baseline.id,
        "project_id": baseline.proyecto_id,
        "company_id": baseline.empresa_id,
        "name": baseline.name,
        "revision": baseline.revision,
        "methodology": baseline.methodology,
        "activities": [_serialize_activity(activity) for activity in activities],
        "dependencies": [
            {
                "predecessor_activity_id": dependency.predecessor_activity_id,
                "successor_activity_id": dependency.successor_activity_id,
                "dependency_type": dependency.dependency_type,
                "lag_days": dependency.lag_days,
            }
            for dependency in dependencies
        ],
        "created_by": baseline.created_by,
        "created_at": baseline.created_at,
    }


def create_baseline(db, *, project_id, company_id, user_id, payload):
    unique_ids = list(dict.fromkeys(payload.activity_snapshot_ids))
    activities = db.query(Bim4dActivitySnapshot).filter(
        Bim4dActivitySnapshot.id.in_(unique_ids),
        Bim4dActivitySnapshot.proyecto_id == project_id,
        Bim4dActivitySnapshot.empresa_id == company_id,
    ).all()
    if len(activities) != len(unique_ids):
        raise HTTPException(status_code=404, detail="La linea base contiene actividades fuera del proyecto activo.")
    allowed_ids = set(unique_ids)
    dependency_keys = set()
    for dependency in payload.dependencies:
        if dependency.predecessor_activity_id not in allowed_ids or dependency.successor_activity_id not in allowed_ids:
            raise HTTPException(status_code=400, detail="Toda dependencia debe usar actividades de la linea base.")
        key = (dependency.predecessor_activity_id, dependency.successor_activity_id, dependency.dependency_type)
        if key in dependency_keys:
            raise HTTPException(status_code=409, detail="La linea base contiene una dependencia duplicada.")
        dependency_keys.add(key)
    duplicate = db.query(Bim4dBaseline).filter(
        Bim4dBaseline.empresa_id == company_id,
        Bim4dBaseline.proyecto_id == project_id,
        Bim4dBaseline.revision == payload.revision,
    ).first()
    if duplicate:
        raise HTTPException(status_code=409, detail="La revision de linea base ya existe.")
    baseline = Bim4dBaseline(
        empresa_id=company_id,
        proyecto_id=project_id,
        name=payload.name,
        revision=payload.revision,
        methodology="linear_planned_progress",
        created_by=user_id,
    )
    db.add(baseline)
    db.flush()
    db.add_all([
        Bim4dBaselineActivity(baseline_id=baseline.id, activity_snapshot_id=activity_id)
        for activity_id in unique_ids
    ])
    db.add_all([
        Bim4dDependencySnapshot(baseline_id=baseline.id, **dependency.model_dump())
        for dependency in payload.dependencies
    ])
    db.commit()
    db.refresh(baseline)
    return _serialize_baseline(db, baseline)


def list_baselines(db, *, project_id, company_id):
    baselines = db.query(Bim4dBaseline).filter(
        Bim4dBaseline.proyecto_id == project_id,
        Bim4dBaseline.empresa_id == company_id,
    ).order_by(Bim4dBaseline.created_at.desc(), Bim4dBaseline.id.desc()).all()
    return [_serialize_baseline(db, baseline) for baseline in baselines]


def _planned_progress(activity, cutoff):
    start = _utc(activity.planned_start)
    finish = _utc(activity.planned_finish)
    cutoff = _utc(cutoff)
    if cutoff <= start:
        return 0.0
    if cutoff >= finish:
        return 100.0
    duration = max((finish - start).total_seconds(), 1)
    return round(((cutoff - start).total_seconds() / duration) * 100, 2)


def build_plan_actual_deviation(db, *, baseline_id, project_id, company_id, cutoff):
    baseline = db.query(Bim4dBaseline).filter(
        Bim4dBaseline.id == baseline_id,
        Bim4dBaseline.proyecto_id == project_id,
        Bim4dBaseline.empresa_id == company_id,
    ).first()
    if not baseline:
        raise HTTPException(status_code=404, detail="Linea base 4D fuera del proyecto activo.")
    items = []
    for activity in _baseline_activities(db, baseline.id):
        progress = db.query(Bim4dProgressSnapshot).filter(
            Bim4dProgressSnapshot.activity_snapshot_id == activity.id,
            Bim4dProgressSnapshot.proyecto_id == project_id,
            Bim4dProgressSnapshot.empresa_id == company_id,
            Bim4dProgressSnapshot.reported_at <= cutoff,
        ).order_by(Bim4dProgressSnapshot.reported_at.desc()).first()
        planned = _planned_progress(activity, cutoff)
        actual = round(float(progress.progress_percent), 2) if progress else 0.0
        variance = round(actual - planned, 2)
        if progress and progress.actual_finish:
            schedule_variance = round((_utc(progress.actual_finish) - _utc(activity.planned_finish)).total_seconds() / 86400, 2)
        elif _utc(cutoff) > _utc(activity.planned_finish) and actual < 100:
            schedule_variance = round((_utc(cutoff) - _utc(activity.planned_finish)).total_seconds() / 86400, 2)
        else:
            schedule_variance = 0.0
        status = "ahead" if variance > 5 else "behind" if variance < -5 else "on_track"
        proposals = db.query(Bim4dLinkProposal).filter(
            Bim4dLinkProposal.activity_snapshot_id == activity.id,
            Bim4dLinkProposal.proyecto_id == project_id,
            Bim4dLinkProposal.empresa_id == company_id,
            Bim4dLinkProposal.status == "approved",
        ).all()
        viewpoints_by_version = {}
        for proposal in proposals:
            element = db.query(BimElement).filter(BimElement.id == proposal.bim_element_id).first()
            if element:
                viewpoints_by_version.setdefault(proposal.bim_model_version_id, []).append(element.global_id)
        items.append({
            "activity_snapshot_id": activity.id,
            "activity_code": activity.activity_code,
            "activity_name": activity.activity_name,
            "planned_progress_percent": planned,
            "actual_progress_percent": actual,
            "progress_variance_percent": variance,
            "schedule_variance_days": schedule_variance,
            "status": status,
            "viewpoints": [
                {"source_version_id": version_id, "selected_guids": list(dict.fromkeys(guids))}
                for version_id, guids in viewpoints_by_version.items()
            ],
        })
    counts = {status: sum(1 for item in items if item["status"] == status) for status in ("ahead", "on_track", "behind")}
    return {
        "project_id": project_id,
        "company_id": company_id,
        "baseline_id": baseline.id,
        "cutoff": cutoff,
        "methodology": baseline.methodology,
        "counts": counts,
        "items": items,
    }
