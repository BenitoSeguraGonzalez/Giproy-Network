from datetime import datetime, timezone

import pytest
from fastapi import HTTPException

from app.models.bim_element import BimElement
from app.models.bim_model import BimModel
from app.models.bim_model_version import BimModelVersion
from app.models.proyecto import Proyecto
from app.models.usuario import Usuario
from app.schemas.bim_4d import Bim4dActivitySnapshotCreate, Bim4dBaselineCreate, Bim4dDependencyCreate, Bim4dLinkProposalCreate, Bim4dProgressSnapshotCreate
from app.services.bim.schedule_4d_service import (
    create_activity_snapshot,
    create_link_proposal,
    decide_link_proposal,
    list_activity_snapshots,
    build_timeline,
    create_progress_snapshot,
    build_plan_actual_deviation,
    create_baseline,
    list_baselines,
    build_gantt,
)
from app.services.bim.report_4d_service import build_report, report_csv


def _context(db, empresa):
    user = Usuario(email="4d@example.com", hashed_password="x", nombre_completo="4D Coordinator", empresa_id=empresa.id, rol="superadministrador")
    project = Proyecto(nombre="4D Project", empresa_id=empresa.id)
    db.add_all([user, project]); db.flush()
    model = BimModel(proyecto_id=project.id, empresa_id=empresa.id, nombre="4D Model")
    db.add(model); db.flush()
    version = BimModelVersion(bim_model_id=model.id, version_label="v1", status="published", is_active=True)
    db.add(version); db.flush()
    element = BimElement(bim_model_version_id=version.id, global_id="GUID-4D-001", ifc_class="IfcWall", nombre="Wall")
    db.add(element); db.commit()
    return user, project, element


def _activity_payload():
    return Bim4dActivitySnapshotCreate(
        source_ref="classic-task-42",
        snapshot_revision="baseline-1",
        activity_code="A-042",
        activity_name="Construir muros nivel 1",
        planned_start=datetime(2026, 8, 3, tzinfo=timezone.utc),
        planned_finish=datetime(2026, 8, 7, tzinfo=timezone.utc),
    )


def test_4d_snapshot_link_decision_and_duplicate_guard(db, sample_empresa):
    user, project, element = _context(db, sample_empresa)
    activity = create_activity_snapshot(db, project_id=project.id, company_id=sample_empresa.id, user_id=user.id, payload=_activity_payload())
    assert list_activity_snapshots(db, project_id=project.id, company_id=sample_empresa.id)[0]["activity_code"] == "A-042"
    proposal = create_link_proposal(db, project_id=project.id, company_id=sample_empresa.id, user_id=user.id, payload=Bim4dLinkProposalCreate(element_id=element.id, activity_snapshot_id=activity["id"], proposal_reason="Secuencia constructiva verificada"))
    assert proposal["global_id"] == "GUID-4D-001" and proposal["status"] == "pending"
    with pytest.raises(HTTPException) as duplicate:
        create_link_proposal(db, project_id=project.id, company_id=sample_empresa.id, user_id=user.id, payload=Bim4dLinkProposalCreate(element_id=element.id, activity_snapshot_id=activity["id"], proposal_reason="Intento duplicado controlado"))
    assert duplicate.value.status_code == 409
    decided = decide_link_proposal(db, proposal_id=proposal["id"], project_id=project.id, company_id=sample_empresa.id, user_id=user.id, decision="approved", reason="Aprobado por coordinación")
    assert decided["status"] == "approved" and decided["decided_by"] == user.id


def test_4d_rejects_cross_tenant_element(db, sample_empresa):
    user, project, element = _context(db, sample_empresa)
    activity = create_activity_snapshot(db, project_id=project.id, company_id=sample_empresa.id, user_id=user.id, payload=_activity_payload())
    with pytest.raises(HTTPException) as cross:
        create_link_proposal(db, project_id=project.id, company_id=sample_empresa.id + 999, user_id=user.id, payload=Bim4dLinkProposalCreate(element_id=element.id, activity_snapshot_id=activity["id"], proposal_reason="No debe cruzar tenant"))
    assert cross.value.status_code == 404


def test_4d_timeline_uses_cutoff_and_progress_evidence(db, sample_empresa):
    user, project, element = _context(db, sample_empresa)
    activity = create_activity_snapshot(db, project_id=project.id, company_id=sample_empresa.id, user_id=user.id, payload=_activity_payload())
    proposal = create_link_proposal(db, project_id=project.id, company_id=sample_empresa.id, user_id=user.id, payload=Bim4dLinkProposalCreate(element_id=element.id, activity_snapshot_id=activity["id"], proposal_reason="Secuencia temporal validada"))
    decide_link_proposal(db, proposal_id=proposal["id"], project_id=project.id, company_id=sample_empresa.id, user_id=user.id, decision="approved", reason="Aprobado para timeline")

    future = build_timeline(db, project_id=project.id, company_id=sample_empresa.id, cutoff=datetime(2026, 8, 1, tzinfo=timezone.utc))
    active = build_timeline(db, project_id=project.id, company_id=sample_empresa.id, cutoff=datetime(2026, 8, 5, tzinfo=timezone.utc))
    delayed = build_timeline(db, project_id=project.id, company_id=sample_empresa.id, cutoff=datetime(2026, 8, 10, tzinfo=timezone.utc))
    assert future["items"][0]["state"] == "not_started" and future["items"][0]["visible"] is False
    assert active["items"][0]["state"] == "in_progress"
    assert delayed["items"][0]["state"] == "delayed"

    progress = create_progress_snapshot(db, project_id=project.id, company_id=sample_empresa.id, user_id=user.id, payload=Bim4dProgressSnapshotCreate(activity_snapshot_id=activity["id"], progress_percent=100, actual_start=datetime(2026, 8, 3, tzinfo=timezone.utc), actual_finish=datetime(2026, 8, 8, tzinfo=timezone.utc), reported_at=datetime(2026, 8, 8, 18, tzinfo=timezone.utc)))
    completed = build_timeline(db, project_id=project.id, company_id=sample_empresa.id, cutoff=datetime(2026, 8, 10, tzinfo=timezone.utc))
    assert completed["items"][0]["state"] == "completed" and completed["items"][0]["progress_percent"] == 100
    with pytest.raises(HTTPException) as stale:
        create_progress_snapshot(db, project_id=project.id, company_id=sample_empresa.id, user_id=user.id, payload=Bim4dProgressSnapshotCreate(activity_snapshot_id=activity["id"], progress_percent=80, reported_at=progress["reported_at"]))
    assert stale.value.status_code == 409


def test_4d_baseline_deviation_dependency_and_viewpoint(db, sample_empresa):
    user, project, element = _context(db, sample_empresa)
    first = create_activity_snapshot(db, project_id=project.id, company_id=sample_empresa.id, user_id=user.id, payload=_activity_payload())
    second_payload = Bim4dActivitySnapshotCreate(
        source_ref="classic-task-43",
        snapshot_revision="baseline-1",
        activity_code="A-043",
        activity_name="Inspeccionar muros nivel 1",
        planned_start=datetime(2026, 8, 8, tzinfo=timezone.utc),
        planned_finish=datetime(2026, 8, 9, tzinfo=timezone.utc),
    )
    second = create_activity_snapshot(db, project_id=project.id, company_id=sample_empresa.id, user_id=user.id, payload=second_payload)
    proposal = create_link_proposal(db, project_id=project.id, company_id=sample_empresa.id, user_id=user.id, payload=Bim4dLinkProposalCreate(element_id=element.id, activity_snapshot_id=first["id"], proposal_reason="Viewpoint plan-real verificable"))
    decide_link_proposal(db, proposal_id=proposal["id"], project_id=project.id, company_id=sample_empresa.id, user_id=user.id, decision="approved", reason="Aprobado para baseline")
    baseline = create_baseline(
        db,
        project_id=project.id,
        company_id=sample_empresa.id,
        user_id=user.id,
        payload=Bim4dBaselineCreate(
            name="Baseline contractual",
            revision="BL-001",
            activity_snapshot_ids=[first["id"], second["id"]],
            dependencies=[Bim4dDependencyCreate(predecessor_activity_id=first["id"], successor_activity_id=second["id"], dependency_type="FS", lag_days=1)],
        ),
    )
    assert baseline["revision"] == "BL-001" and len(baseline["dependencies"]) == 1
    assert list_baselines(db, project_id=project.id, company_id=sample_empresa.id)[0]["id"] == baseline["id"]
    create_progress_snapshot(db, project_id=project.id, company_id=sample_empresa.id, user_id=user.id, payload=Bim4dProgressSnapshotCreate(activity_snapshot_id=first["id"], progress_percent=25, actual_start=datetime(2026, 8, 4, tzinfo=timezone.utc), reported_at=datetime(2026, 8, 5, tzinfo=timezone.utc)))
    deviation = build_plan_actual_deviation(db, baseline_id=baseline["id"], project_id=project.id, company_id=sample_empresa.id, cutoff=datetime(2026, 8, 5, tzinfo=timezone.utc))
    first_item = next(item for item in deviation["items"] if item["activity_snapshot_id"] == first["id"])
    assert first_item["status"] == "behind"
    assert first_item["viewpoints"][0]["selected_guids"] == ["GUID-4D-001"]
    with pytest.raises(HTTPException) as duplicate:
        create_baseline(db, project_id=project.id, company_id=sample_empresa.id, user_id=user.id, payload=Bim4dBaselineCreate(name="Duplicada", revision="BL-001", activity_snapshot_ids=[first["id"]]))
    assert duplicate.value.status_code == 409

    gantt = build_gantt(db, baseline_id=baseline["id"], project_id=project.id, company_id=sample_empresa.id)
    assert gantt["critical_path_activity_ids"] == [first["id"], second["id"]]
    assert gantt["activities"][0]["global_ids"] == ["GUID-4D-001"]
    assert all(activity["critical"] for activity in gantt["activities"])
    report = build_report(db, report_type="gantt", project_id=project.id, company_id=sample_empresa.id, baseline_id=baseline["id"])
    exported = report_csv(report)
    assert report["contract_version"] == "giproy_bim_4d_report_v1"
    assert "critical" in exported and "A-042" in exported
