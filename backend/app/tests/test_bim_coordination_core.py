from types import SimpleNamespace
from datetime import datetime, timezone
import pytest
from fastapi import HTTPException
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.core.database import Base
from app.models.empresa import Empresa
from app.models.bim_element import BimElement
from app.models.bim_model import BimModel
from app.models.bim_model_version import BimModelVersion
from app.models.bim_4d import Bim4dActivitySnapshot
from app.models.omniclass import OmniClassMaestro
from app.models.bim_coordination import CoordinationConflict, CoordinationLink
from app.models.proyecto import Proyecto
from app.models.presupuesto import Presupuesto
from app.models.presupuesto import PresupuestoDetalle
from app.models.edt import EdtNode
from app.models.cronograma_trabajo import CronogramaTrabajo
from app.models.usuario import Usuario
from app.services.bim.coordination_service import (
    build_coverage,
    classification_summary,
    create_coordination_set,
    create_link,
    create_proposal,
    decide_proposal,
    apply_proposal,
    recover_proposal,
    reconcile_link_identity,
    make_coordination_set_official,
    ingest_classification_candidates,
    upsert_classification_resolution,
)


def _scope(db, company):
    project = Proyecto(nombre="Coordinacion", codigo="COORD-001", codigo_root="COORD-001", revision=0, empresa_id=company.id)
    user = Usuario(email="coord-core@example.com", hashed_password="x", nombre_completo="Coord", empresa_id=company.id, rol="usuario")
    db.add_all([project, user]); db.commit(); db.refresh(project); db.refresh(user)
    return project, user


def test_coordination_set_allows_missing_domains_and_quantified_many_to_many_links(db, sample_empresa):
    project, user = _scope(db, sample_empresa)
    coordination = create_coordination_set(
        db, project_id=project.id, company_id=sample_empresa.id, user_id=user.id,
        payload=SimpleNamespace(presupuesto_id=None, presupuesto_revision=None, cronograma_trabajo_id=None, baseline_id=None, bim_version_ids=[]),
    )
    assert coordination["coordination_status"] == "incomplete"

    for key, value in (("first", 60), ("second", 50)):
        create_link(
            db, coordination_set_id=coordination["id"], project_id=project.id, company_id=sample_empresa.id, user_id=user.id,
            payload=SimpleNamespace(
                budget_line_id=None, apu_id=None, activity_ref="ACT-1", activity_snapshot_id=None,
                bim_element_id=None, bim_global_id="GUID-1", allocation_key=key,
                allocation_type="percentage", allocation_value=value, unit=None,
                additive=True, source="manual", notes=None,
            ),
        )
    coverage = build_coverage(db, coordination_set_id=coordination["id"], project_id=project.id, company_id=sample_empresa.id)
    assert coverage["overallocated_count"] == 2
    assert coverage["coordination_status"] == "conflict"
    conflicts = db.query(CoordinationConflict).filter(CoordinationConflict.coordination_set_id == coordination["id"]).all()
    assert len(conflicts) == 2
    assert {item.severity for item in conflicts} == {"error"}


def test_coordination_sets_support_every_operational_domain_combination_and_tenant_scope(db, sample_empresa):
    project, user = _scope(db, sample_empresa)
    budget = Presupuesto(descripcion="Reference budget", proyecto_id=project.id, empresa_id=sample_empresa.id, revision=3)
    db.add(budget); db.commit(); db.refresh(budget)
    schedule = CronogramaTrabajo(empresa_id=sample_empresa.id, proyecto_id=project.id, presupuesto_id=budget.id, schedule_data={})
    model = BimModel(proyecto_id=project.id, empresa_id=sample_empresa.id, nombre="Reference BIM")
    db.add_all([schedule, model]); db.commit(); db.refresh(schedule); db.refresh(model)
    version = BimModelVersion(bim_model_id=model.id, version_label="v1", status="ready", is_active=True)
    db.add(version); db.commit(); db.refresh(version)

    combinations = [
        (budget.id, None, []),
        (budget.id, schedule.id, []),
        (None, None, [version.id]),
        (budget.id, None, [version.id]),
        (None, schedule.id, [version.id]),
        (budget.id, schedule.id, [version.id]),
    ]
    created = []
    for budget_id, schedule_id, version_ids in combinations:
        created.append(create_coordination_set(
            db, project_id=project.id, company_id=sample_empresa.id, user_id=user.id,
            payload=SimpleNamespace(
                presupuesto_id=budget_id, presupuesto_revision=3 if budget_id else None,
                cronograma_trabajo_id=schedule_id, baseline_id=None, bim_version_ids=version_ids,
            ),
        ))

    assert [item["revision"] for item in created] == [1, 2, 3, 4, 5, 6]
    assert all(item["coordination_status"] in {"incomplete", "outdated"} for item in created)
    with pytest.raises(HTTPException) as outside_tenant:
        build_coverage(
            db, coordination_set_id=created[-1]["id"], project_id=project.id,
            company_id=sample_empresa.id + 999,
        )
    assert outside_tenant.value.status_code == 404


def test_coordination_set_freezes_real_budget_revision_and_schedule_pair(db, sample_empresa):
    project, user = _scope(db, sample_empresa)
    first = Presupuesto(descripcion="Budget A", proyecto_id=project.id, empresa_id=sample_empresa.id, revision=2)
    second = Presupuesto(descripcion="Budget B", proyecto_id=project.id, empresa_id=sample_empresa.id, revision=1)
    db.add_all([first, second]); db.flush()
    schedule = CronogramaTrabajo(empresa_id=sample_empresa.id, proyecto_id=project.id, presupuesto_id=second.id, schedule_data={})
    db.add(schedule); db.commit()
    with pytest.raises(HTTPException) as stale_revision:
        create_coordination_set(db, project_id=project.id, company_id=sample_empresa.id, user_id=user.id, payload=SimpleNamespace(presupuesto_id=first.id, presupuesto_revision=1, cronograma_trabajo_id=None, baseline_id=None, bim_version_ids=[]))
    assert stale_revision.value.status_code == 409
    with pytest.raises(HTTPException) as mismatched_schedule:
        create_coordination_set(db, project_id=project.id, company_id=sample_empresa.id, user_id=user.id, payload=SimpleNamespace(presupuesto_id=first.id, presupuesto_revision=2, cronograma_trabajo_id=schedule.id, baseline_id=None, bim_version_ids=[]))
    assert mismatched_schedule.value.status_code == 409


def test_officialization_rejects_project_or_budget_revision_drift(db, sample_empresa):
    project, user = _scope(db, sample_empresa)
    budget = Presupuesto(descripcion="Frozen", proyecto_id=project.id, empresa_id=sample_empresa.id, revision=0)
    db.add(budget); db.commit()
    coordination = create_coordination_set(db, project_id=project.id, company_id=sample_empresa.id, user_id=user.id, payload=SimpleNamespace(presupuesto_id=budget.id, presupuesto_revision=0, cronograma_trabajo_id=None, baseline_id=None, bim_version_ids=[]))
    budget.revision = 1; db.commit()
    with pytest.raises(HTTPException) as budget_drift:
        make_coordination_set_official(db, coordination_set_id=coordination["id"], project_id=project.id, company_id=sample_empresa.id, user_id=user.id, expected_revision=coordination["revision"], reason="stale")
    assert budget_drift.value.status_code == 409
    budget.revision = 0; project.revision = 1; db.commit()
    with pytest.raises(HTTPException) as project_drift:
        make_coordination_set_official(db, coordination_set_id=coordination["id"], project_id=project.id, company_id=sample_empresa.id, user_id=user.id, expected_revision=coordination["revision"], reason="stale")
    assert project_drift.value.status_code == 409


def test_link_tolerance_units_and_semantic_duplicate_protection(db, sample_empresa):
    project, user = _scope(db, sample_empresa)
    coordination = create_coordination_set(
        db, project_id=project.id, company_id=sample_empresa.id, user_id=user.id,
        payload=SimpleNamespace(presupuesto_id=None, presupuesto_revision=None, cronograma_trabajo_id=None, baseline_id=None, bim_version_ids=[]),
    )
    common = dict(
        budget_line_id=None, apu_id=None, activity_ref="ACT-TOL", activity_snapshot_id=None,
        bim_element_id=None, bim_global_id="GUID-TOL", unit=None, additive=True,
        source="manual", notes=None,
    )
    for key, value in (("p1", "33.3333333"), ("p2", "66.6666667")):
        create_link(db, coordination_set_id=coordination["id"], project_id=project.id, company_id=sample_empresa.id, user_id=user.id, payload=SimpleNamespace(**common, allocation_key=key, allocation_type="percentage", allocation_value=value))
    coverage = build_coverage(db, coordination_set_id=coordination["id"], project_id=project.id, company_id=sample_empresa.id)
    assert coverage["coordination_status"] == "coordinated"
    assert coverage["overallocated_count"] == 0

    quantity_payload = SimpleNamespace(**{**common, "activity_ref": "ACT-QTY", "bim_global_id": "GUID-QTY", "allocation_key": "q1", "allocation_type": "quantity", "allocation_value": "12.5", "unit": "m²"})
    quantity = create_link(db, coordination_set_id=coordination["id"], project_id=project.id, company_id=sample_empresa.id, user_id=user.id, payload=quantity_payload)
    assert quantity["unit"] == "m2"
    with pytest.raises(HTTPException) as duplicate:
        create_link(db, coordination_set_id=coordination["id"], project_id=project.id, company_id=sample_empresa.id, user_id=user.id, payload=quantity_payload)
    assert duplicate.value.status_code == 409


def test_quantity_coverage_normalizes_compatible_units_and_blocks_mixed_dimensions(db, sample_empresa):
    project, user = _scope(db, sample_empresa)
    coordination = create_coordination_set(db, project_id=project.id, company_id=sample_empresa.id, user_id=user.id, payload=SimpleNamespace(presupuesto_id=None, presupuesto_revision=None, cronograma_trabajo_id=None, baseline_id=None, bim_version_ids=[]))
    common = dict(budget_line_id=None, apu_id=None, activity_ref="ACT-DIM", activity_snapshot_id=None, bim_element_id=None, bim_global_id="GUID-DIM", allocation_type="quantity", additive=True, source="manual", notes=None)
    create_link(db, coordination_set_id=coordination["id"], project_id=project.id, company_id=sample_empresa.id, user_id=user.id, payload=SimpleNamespace(**common, allocation_key="metric", allocation_value=1, unit="m"))
    create_link(db, coordination_set_id=coordination["id"], project_id=project.id, company_id=sample_empresa.id, user_id=user.id, payload=SimpleNamespace(**common, allocation_key="imperial", allocation_value=1, unit="ft"))
    compatible = build_coverage(db, coordination_set_id=coordination["id"], project_id=project.id, company_id=sample_empresa.id)
    length_groups = [item for item in compatible["groups"] if item.get("dimension") == "length"]
    assert compatible["unit_conflict_count"] == 0
    assert length_groups and all(abs(item["allocation_quantity_base"] - 1.3048) < 1e-9 for item in length_groups)

    create_link(db, coordination_set_id=coordination["id"], project_id=project.id, company_id=sample_empresa.id, user_id=user.id, payload=SimpleNamespace(**common, allocation_key="area", allocation_value=2, unit="m2"))
    incompatible = build_coverage(db, coordination_set_id=coordination["id"], project_id=project.id, company_id=sample_empresa.id)
    assert incompatible["unit_conflict_count"] == 2
    assert incompatible["coordination_status"] == "conflict"
    with pytest.raises(HTTPException) as blocked:
        make_coordination_set_official(db, coordination_set_id=coordination["id"], project_id=project.id, company_id=sample_empresa.id, user_id=user.id, expected_revision=coordination["revision"], reason="mixed dimensions")
    assert blocked.value.status_code == 409


def test_non_additive_links_are_visible_but_never_double_count_coverage(db, sample_empresa):
    project, user = _scope(db, sample_empresa)
    coordination = create_coordination_set(
        db, project_id=project.id, company_id=sample_empresa.id, user_id=user.id,
        payload=SimpleNamespace(presupuesto_id=None, presupuesto_revision=None, cronograma_trabajo_id=None, baseline_id=None, bim_version_ids=[]),
    )
    common = dict(
        budget_line_id=None, apu_id=None, activity_ref="ACT-NON-ADDITIVE", activity_snapshot_id=None,
        bim_element_id=None, bim_global_id="GUID-NON-ADDITIVE", allocation_type="percentage",
        unit=None, source="manual", notes=None,
    )
    create_link(db, coordination_set_id=coordination["id"], project_id=project.id, company_id=sample_empresa.id, user_id=user.id, payload=SimpleNamespace(**common, allocation_key="primary", allocation_value=100, additive=True))
    create_link(db, coordination_set_id=coordination["id"], project_id=project.id, company_id=sample_empresa.id, user_id=user.id, payload=SimpleNamespace(**common, allocation_key="reference", allocation_value=100, additive=False))

    coverage = build_coverage(db, coordination_set_id=coordination["id"], project_id=project.id, company_id=sample_empresa.id)

    assert coverage["link_count"] == 2
    assert coverage["additive_link_count"] == 1
    assert coverage["overallocated_count"] == 0
    assert coverage["coordination_status"] == "coordinated"


def test_official_reference_allows_missing_bim_but_blocks_overallocation(db, sample_empresa):
    project, user = _scope(db, sample_empresa)
    model = BimModel(proyecto_id=project.id, empresa_id=sample_empresa.id, nombre="Reference")
    db.add(model); db.commit(); db.refresh(model)
    version = BimModelVersion(bim_model_id=model.id, version_label="v1", status="ready", is_active=True)
    db.add(version); db.commit(); db.refresh(version)
    partial = create_coordination_set(
        db, project_id=project.id, company_id=sample_empresa.id, user_id=user.id,
        payload=SimpleNamespace(presupuesto_id=None, presupuesto_revision=None, cronograma_trabajo_id=None, baseline_id=None, bim_version_ids=[version.id]),
    )
    official = make_coordination_set_official(
        db, coordination_set_id=partial["id"], project_id=project.id,
        company_id=sample_empresa.id, user_id=user.id,
        expected_revision=partial["revision"], reason="Approved partial reference",
    )
    assert official["official"] is True
    assert official["coordination_status"] == "incomplete"

    conflicted = create_coordination_set(
        db, project_id=project.id, company_id=sample_empresa.id, user_id=user.id,
        payload=SimpleNamespace(presupuesto_id=None, presupuesto_revision=None, cronograma_trabajo_id=None, baseline_id=None, bim_version_ids=[version.id]),
    )
    for key, value in (("a", 60), ("b", 50)):
        create_link(
            db, coordination_set_id=conflicted["id"], project_id=project.id,
            company_id=sample_empresa.id, user_id=user.id,
            payload=SimpleNamespace(
                budget_line_id=None, apu_id=None, activity_ref="ACT-OFFICIAL",
                activity_snapshot_id=None, bim_element_id=None, bim_global_id="GUID-OFFICIAL",
                allocation_key=key, allocation_type="percentage", allocation_value=value,
                unit=None, additive=True, source="manual", notes=None,
            ),
        )
    with pytest.raises(HTTPException) as blocked:
        make_coordination_set_official(
            db, coordination_set_id=conflicted["id"], project_id=project.id,
            company_id=sample_empresa.id, user_id=user.id,
            expected_revision=conflicted["revision"], reason="Must fail",
        )
    assert blocked.value.status_code == 409


def test_official_bim_quantities_require_verified_federation(db, sample_empresa):
    project, user = _scope(db, sample_empresa)
    model = BimModel(proyecto_id=project.id, empresa_id=sample_empresa.id, nombre="Quantity model")
    db.add(model); db.commit(); db.refresh(model)
    version = BimModelVersion(bim_model_id=model.id, version_label="v1", status="ready", is_active=True)
    db.add(version); db.commit(); db.refresh(version)
    coordination = create_coordination_set(db, project_id=project.id, company_id=sample_empresa.id, user_id=user.id, payload=SimpleNamespace(presupuesto_id=None, presupuesto_revision=None, cronograma_trabajo_id=None, baseline_id=None, bim_version_ids=[version.id]))
    create_link(db, coordination_set_id=coordination["id"], project_id=project.id, company_id=sample_empresa.id, user_id=user.id, payload=SimpleNamespace(budget_line_id=None, apu_id=None, activity_ref="ACT-Q", activity_snapshot_id=None, bim_element_id=None, bim_global_id="GUID-Q", allocation_key="quantity", allocation_type="quantity", allocation_value=12, unit="m3", additive=True, source="manual", notes=None))
    with pytest.raises(HTTPException) as blocked:
        make_coordination_set_official(db, coordination_set_id=coordination["id"], project_id=project.id, company_id=sample_empresa.id, user_id=user.id, expected_revision=coordination["revision"], reason="Quantity approval")
    assert blocked.value.status_code == 409
    assert "federacion activa" in blocked.value.detail


def test_official_reference_rejects_unversioned_activity_and_element_refs(db, sample_empresa):
    project, user = _scope(db, sample_empresa)
    model = BimModel(proyecto_id=project.id, empresa_id=sample_empresa.id, nombre="Identity model")
    db.add(model); db.commit(); db.refresh(model)
    version = BimModelVersion(bim_model_id=model.id, version_label="v1", status="ready", is_active=True)
    db.add(version); db.commit(); db.refresh(version)
    coordination = create_coordination_set(
        db, project_id=project.id, company_id=sample_empresa.id, user_id=user.id,
        payload=SimpleNamespace(presupuesto_id=None, presupuesto_revision=None, cronograma_trabajo_id=None, baseline_id=None, bim_version_ids=[version.id]),
    )
    link = create_link(
        db, coordination_set_id=coordination["id"], project_id=project.id,
        company_id=sample_empresa.id, user_id=user.id,
        payload=SimpleNamespace(
            budget_line_id=None, apu_id=None, activity_ref="ACT-LEGACY", activity_snapshot_id=None,
            bim_element_id=None, bim_global_id="GUID-LEGACY", allocation_key="primary",
            allocation_type="percentage", allocation_value=100, unit=None, additive=True,
            source="legacy", notes=None,
        ),
    )
    assert link["identity_status"] == "draft_reference"
    assert link["ambiguous_references"] == ["activity_ref", "bim_global_id"]

    with pytest.raises(HTTPException) as blocked:
        make_coordination_set_official(
            db, coordination_set_id=coordination["id"], project_id=project.id,
            company_id=sample_empresa.id, user_id=user.id,
            expected_revision=coordination["revision"], reason="Must use canonical identities",
        )
    assert blocked.value.status_code == 409
    assert "identidad versionada" in blocked.value.detail


def test_historical_references_require_exact_canonical_identity_reconciliation(db, sample_empresa):
    project, user = _scope(db, sample_empresa)
    model = BimModel(proyecto_id=project.id, empresa_id=sample_empresa.id, nombre="Reconciliation model")
    db.add(model); db.flush()
    version = BimModelVersion(bim_model_id=model.id, version_label="v1", status="ready")
    db.add(version); db.flush()
    element = BimElement(bim_model_version_id=version.id, global_id="GUID-HIST", nombre="Muro")
    activity = Bim4dActivitySnapshot(
        empresa_id=sample_empresa.id, proyecto_id=project.id, source_ref="ACT-HIST",
        snapshot_revision="R1", activity_code="A1", activity_name="Muro",
        planned_start=datetime(2026, 1, 1, tzinfo=timezone.utc), planned_finish=datetime(2026, 1, 2, tzinfo=timezone.utc),
    )
    db.add_all([element, activity]); db.commit()
    coordination = create_coordination_set(db, project_id=project.id, company_id=sample_empresa.id, user_id=user.id, payload=SimpleNamespace(presupuesto_id=None, presupuesto_revision=None, cronograma_trabajo_id=None, baseline_id=None, bim_version_ids=[version.id]))
    link = create_link(db, coordination_set_id=coordination["id"], project_id=project.id, company_id=sample_empresa.id, user_id=user.id, payload=SimpleNamespace(budget_line_id=None, apu_id=None, activity_ref="ACT-HIST", activity_snapshot_id=None, bim_element_id=None, bim_global_id="GUID-HIST", allocation_key="primary", allocation_type="percentage", allocation_value=100, unit=None, additive=True, source="legacy", notes=None))
    with pytest.raises(HTTPException) as incomplete:
        reconcile_link_identity(db, link_id=link["id"], coordination_set_id=coordination["id"], project_id=project.id, company_id=sample_empresa.id, activity_snapshot_id=activity.id, bim_element_id=None)
    assert incomplete.value.status_code == 409
    reconciled = reconcile_link_identity(db, link_id=link["id"], coordination_set_id=coordination["id"], project_id=project.id, company_id=sample_empresa.id, activity_snapshot_id=activity.id, bim_element_id=element.id)
    assert reconciled["identity_status"] == "canonical"
    assert reconciled["ambiguous_references"] == []


def test_coordination_proposal_requires_explicit_review_and_approval(db, sample_empresa):
    project, user = _scope(db, sample_empresa)
    coordination = create_coordination_set(
        db, project_id=project.id, company_id=sample_empresa.id, user_id=user.id,
        payload=SimpleNamespace(presupuesto_id=None, presupuesto_revision=None, cronograma_trabajo_id=None, baseline_id=None, bim_version_ids=[]),
    )
    proposal = create_proposal(
        db, coordination_set_id=coordination["id"], project_id=project.id, company_id=sample_empresa.id, user_id=user.id,
        payload=SimpleNamespace(proposal_type="quantity_change", source_domain="bim", target_domain="budget", diff={"from": 10, "to": 12}, impact={"cost": 20}, reason="QTO"),
    )
    assert proposal["status"] == "pending_review"
    decided = decide_proposal(
        db, proposal_id=proposal["id"], coordination_set_id=coordination["id"], project_id=project.id,
        company_id=sample_empresa.id, user_id=user.id, decision="approve", reason="Revisado",
    )
    assert decided["status"] == "approved"
    assert decided["correlation_id"] == proposal["correlation_id"]


def test_approved_proposal_applies_atomically_and_recovers_original_link(db, sample_empresa):
    project, user = _scope(db, sample_empresa)
    coordination = create_coordination_set(
        db, project_id=project.id, company_id=sample_empresa.id, user_id=user.id,
        payload=SimpleNamespace(presupuesto_id=None, presupuesto_revision=None, cronograma_trabajo_id=None, baseline_id=None, bim_version_ids=[]),
    )
    link = create_link(
        db, coordination_set_id=coordination["id"], project_id=project.id, company_id=sample_empresa.id, user_id=user.id,
        payload=SimpleNamespace(
            budget_line_id=None, apu_id=None, activity_ref="ACT-APPLY", activity_snapshot_id=None,
            bim_element_id=None, bim_global_id="GUID-APPLY", allocation_key="primary",
            allocation_type="percentage", allocation_value=40, unit=None, additive=True,
            source="manual", notes="original",
        ),
    )
    proposal = create_proposal(
        db, coordination_set_id=coordination["id"], project_id=project.id, company_id=sample_empresa.id, user_id=user.id,
        payload=SimpleNamespace(
            proposal_type="link_reallocation", source_domain="schedule", target_domain="bim",
            diff={"link_updates": [{"link_id": link["id"], "allocation_value": 75, "status": "active", "notes": "applied"}]},
            impact={"affected_links": 1}, reason="Coordinate",
        ),
    )
    approved = decide_proposal(
        db, proposal_id=proposal["id"], coordination_set_id=coordination["id"], project_id=project.id,
        company_id=sample_empresa.id, user_id=user.id, decision="approve", reason="Approved",
    )
    applied = apply_proposal(
        db, proposal_id=proposal["id"], coordination_set_id=coordination["id"], project_id=project.id,
        company_id=sample_empresa.id, user_id=user.id, expected_version=approved["version"], reason="Apply",
    )
    changed = db.query(CoordinationLink).filter(CoordinationLink.id == link["id"]).one()
    assert applied["status"] == "applied"
    assert float(changed.allocation_value) == 75
    assert changed.status == "active"
    repeated = apply_proposal(
        db, proposal_id=proposal["id"], coordination_set_id=coordination["id"], project_id=project.id,
        company_id=sample_empresa.id, user_id=user.id, expected_version=approved["version"], reason="Retry",
    )
    assert repeated["version"] == applied["version"]

    recovered = recover_proposal(
        db, proposal_id=proposal["id"], coordination_set_id=coordination["id"], project_id=project.id,
        company_id=sample_empresa.id, user_id=user.id, expected_version=applied["version"], reason="Rollback",
    )
    db.refresh(changed)
    assert recovered["status"] == "recovered"
    assert float(changed.allocation_value) == 40
    assert changed.status == "draft"
    assert changed.notes == "original"
    repeated_recovery = recover_proposal(
        db, proposal_id=proposal["id"], coordination_set_id=coordination["id"], project_id=project.id,
        company_id=sample_empresa.id, user_id=user.id, expected_version=applied["version"], reason="Retry rollback",
    )
    assert repeated_recovery["version"] == recovered["version"]


def test_tri_domain_proposal_applies_and_recovers_budget_gantt_and_bim(db, sample_empresa):
    project, user = _scope(db, sample_empresa)
    edt = EdtNode(proyecto_id=project.id, empresa_id=sample_empresa.id, codigo="1", nombre="Obra")
    budget = Presupuesto(descripcion="5D", proyecto_id=project.id, empresa_id=sample_empresa.id, revision=0)
    db.add_all([edt, budget]); db.flush()
    line = PresupuestoDetalle(presupuesto_id=budget.id, edt_id=edt.id, descripcion="Muro", coordination_metadata_json={"coordination_status": "draft"})
    schedule = CronogramaTrabajo(empresa_id=sample_empresa.id, proyecto_id=project.id, presupuesto_id=budget.id, schedule_data={"ACT-1": {"name": "Muro", "coordination": {"coordination_status": "draft"}}})
    model = BimModel(proyecto_id=project.id, empresa_id=sample_empresa.id, nombre="BIM")
    db.add_all([line, schedule, model]); db.flush()
    version = BimModelVersion(bim_model_id=model.id, version_label="v1", status="ready", is_active=True)
    db.add(version); db.flush()
    element = BimElement(bim_model_version_id=version.id, global_id="TRI-1", metadata_json={"coordination": {"coordination_status": "draft"}})
    db.add(element); db.commit()
    coordination = create_coordination_set(
        db, project_id=project.id, company_id=sample_empresa.id, user_id=user.id,
        payload=SimpleNamespace(presupuesto_id=budget.id, presupuesto_revision=0, cronograma_trabajo_id=schedule.id, baseline_id=None, bim_version_ids=[version.id]),
    )
    operations = [
        {"domain": "budget", "entity_id": line.id, "patch": {"coordination_status": "coordinated", "activity_ref": "ACT-1", "bim_element_ids": [element.id]}},
        {"domain": "schedule", "schedule_id": schedule.id, "activity_ref": "ACT-1", "patch": {"coordination_status": "coordinated", "budget_line_id": line.id, "bim_element_ids": [element.id]}},
        {"domain": "bim", "entity_id": element.id, "patch": {"coordination_status": "coordinated", "budget_line_id": line.id, "activity_ref": "ACT-1"}},
    ]
    proposal = create_proposal(
        db, coordination_set_id=coordination["id"], project_id=project.id, company_id=sample_empresa.id, user_id=user.id,
        payload=SimpleNamespace(proposal_type="tri_domain_sync", source_domain="budget", target_domain="bim", diff={"domain_operations": operations}, impact={"domains": 3}, reason="Sync"),
    )
    approved = decide_proposal(db, proposal_id=proposal["id"], coordination_set_id=coordination["id"], project_id=project.id, company_id=sample_empresa.id, user_id=user.id, decision="approve", reason="Reviewed")
    applied = apply_proposal(db, proposal_id=proposal["id"], coordination_set_id=coordination["id"], project_id=project.id, company_id=sample_empresa.id, user_id=user.id, expected_version=approved["version"], reason="Apply all")

    db.refresh(line); db.refresh(schedule); db.refresh(element)
    assert applied["status"] == "applied"
    assert line.coordination_metadata_json["coordination_status"] == "coordinated"
    assert schedule.schedule_data["ACT-1"]["coordination"]["budget_line_id"] == line.id
    assert element.metadata_json["coordination"]["activity_ref"] == "ACT-1"

    recovered = recover_proposal(db, proposal_id=proposal["id"], coordination_set_id=coordination["id"], project_id=project.id, company_id=sample_empresa.id, user_id=user.id, expected_version=applied["version"], reason="Restore all")
    db.refresh(line); db.refresh(schedule); db.refresh(element)
    assert recovered["status"] == "recovered"
    assert line.coordination_metadata_json == {"coordination_status": "draft"}
    assert schedule.schedule_data["ACT-1"]["coordination"] == {"coordination_status": "draft"}
    assert element.metadata_json["coordination"] == {"coordination_status": "draft"}


def test_tri_domain_validation_failure_never_partially_changes_earlier_domains(db, sample_empresa):
    project, user = _scope(db, sample_empresa)
    edt = EdtNode(proyecto_id=project.id, empresa_id=sample_empresa.id, codigo="1", nombre="Obra")
    budget = Presupuesto(descripcion="5D failure", proyecto_id=project.id, empresa_id=sample_empresa.id, revision=0)
    db.add_all([edt, budget]); db.flush()
    line = PresupuestoDetalle(presupuesto_id=budget.id, edt_id=edt.id, descripcion="Muro", coordination_metadata_json={"coordination_status": "draft"})
    schedule = CronogramaTrabajo(empresa_id=sample_empresa.id, proyecto_id=project.id, presupuesto_id=budget.id, schedule_data={"ACT-1": {"coordination": {"coordination_status": "draft"}}})
    db.add_all([line, schedule]); db.commit()
    coordination = create_coordination_set(db, project_id=project.id, company_id=sample_empresa.id, user_id=user.id, payload=SimpleNamespace(presupuesto_id=budget.id, presupuesto_revision=0, cronograma_trabajo_id=schedule.id, baseline_id=None, bim_version_ids=[]))
    proposal = create_proposal(
        db, coordination_set_id=coordination["id"], project_id=project.id, company_id=sample_empresa.id, user_id=user.id,
        payload=SimpleNamespace(
            proposal_type="tri_domain_failure", source_domain="budget", target_domain="bim",
            diff={"domain_operations": [
                {"domain": "budget", "entity_id": line.id, "patch": {"coordination_status": "coordinated"}},
                {"domain": "schedule", "schedule_id": schedule.id, "activity_ref": "ACT-1", "patch": {"coordination_status": "coordinated"}},
                {"domain": "bim", "entity_id": 999999, "patch": {"coordination_status": "coordinated"}},
            ]}, impact={}, reason="Induced late failure",
        ),
    )
    approved = decide_proposal(db, proposal_id=proposal["id"], coordination_set_id=coordination["id"], project_id=project.id, company_id=sample_empresa.id, user_id=user.id, decision="approve", reason="Test")
    with pytest.raises(HTTPException) as failure:
        apply_proposal(db, proposal_id=proposal["id"], coordination_set_id=coordination["id"], project_id=project.id, company_id=sample_empresa.id, user_id=user.id, expected_version=approved["version"], reason="Must fail")
    assert failure.value.status_code == 400
    db.refresh(line); db.refresh(schedule)
    assert line.coordination_metadata_json == {"coordination_status": "draft"}
    assert schedule.schedule_data["ACT-1"]["coordination"] == {"coordination_status": "draft"}


def test_tri_domain_commit_failure_rolls_back_every_domain_and_retries(monkeypatch):
    engine = create_engine("sqlite://")
    Base.metadata.create_all(engine)
    isolated = sessionmaker(bind=engine)()
    try:
        company = Empresa(nombre="Tri failure", ruc="8888888888888", proy_prefijo="TRI", proy_periodo="2026", proy_secuencial=1, proy_secuencial_size=3)
        isolated.add(company); isolated.commit(); isolated.refresh(company)
        project, user = _scope(isolated, company)
        edt = EdtNode(proyecto_id=project.id, empresa_id=company.id, codigo="1", nombre="Obra")
        budget = Presupuesto(descripcion="5D", proyecto_id=project.id, empresa_id=company.id, revision=0)
        isolated.add_all([edt, budget]); isolated.flush()
        line = PresupuestoDetalle(presupuesto_id=budget.id, edt_id=edt.id, descripcion="Muro", coordination_metadata_json={"coordination_status": "draft"})
        schedule = CronogramaTrabajo(empresa_id=company.id, proyecto_id=project.id, presupuesto_id=budget.id, schedule_data={"ACT": {"coordination": {"coordination_status": "draft"}}})
        model = BimModel(proyecto_id=project.id, empresa_id=company.id, nombre="BIM")
        isolated.add_all([line, schedule, model]); isolated.flush()
        version = BimModelVersion(bim_model_id=model.id, version_label="v1", status="ready", is_active=True)
        isolated.add(version); isolated.flush()
        element = BimElement(bim_model_version_id=version.id, global_id="TRI-F", metadata_json={"coordination": {"coordination_status": "draft"}})
        isolated.add(element); isolated.commit()
        coordination = create_coordination_set(isolated, project_id=project.id, company_id=company.id, user_id=user.id, payload=SimpleNamespace(presupuesto_id=budget.id, presupuesto_revision=0, cronograma_trabajo_id=schedule.id, baseline_id=None, bim_version_ids=[version.id]))
        proposal = create_proposal(isolated, coordination_set_id=coordination["id"], project_id=project.id, company_id=company.id, user_id=user.id, payload=SimpleNamespace(proposal_type="tri_failure", source_domain="budget", target_domain="bim", diff={"domain_operations": [
            {"domain": "budget", "entity_id": line.id, "patch": {"coordination_status": "coordinated"}},
            {"domain": "schedule", "schedule_id": schedule.id, "activity_ref": "ACT", "patch": {"coordination_status": "coordinated"}},
            {"domain": "bim", "entity_id": element.id, "patch": {"coordination_status": "coordinated"}},
        ]}, impact={}, reason="failure"))
        approved = decide_proposal(isolated, proposal_id=proposal["id"], coordination_set_id=coordination["id"], project_id=project.id, company_id=company.id, user_id=user.id, decision="approve", reason="test")
        original_commit = isolated.commit
        calls = {"count": 0}
        def fail_once():
            calls["count"] += 1
            if calls["count"] == 1: raise RuntimeError("induced tri commit failure")
            return original_commit()
        monkeypatch.setattr(isolated, "commit", fail_once)
        with pytest.raises(HTTPException) as failed:
            apply_proposal(isolated, proposal_id=proposal["id"], coordination_set_id=coordination["id"], project_id=project.id, company_id=company.id, user_id=user.id, expected_version=approved["version"], reason="first")
        assert failed.value.status_code == 503
        assert isolated.get(PresupuestoDetalle, line.id).coordination_metadata_json["coordination_status"] == "draft"
        assert isolated.get(CronogramaTrabajo, schedule.id).schedule_data["ACT"]["coordination"]["coordination_status"] == "draft"
        assert isolated.get(BimElement, element.id).metadata_json["coordination"]["coordination_status"] == "draft"
        retried = apply_proposal(isolated, proposal_id=proposal["id"], coordination_set_id=coordination["id"], project_id=project.id, company_id=company.id, user_id=user.id, expected_version=approved["version"], reason="retry")
        assert retried["status"] == "applied"
    finally:
        isolated.close(); Base.metadata.drop_all(engine); engine.dispose()


def test_apply_commit_failure_keeps_link_unchanged_and_is_retryable(monkeypatch):
    engine = create_engine("sqlite://")
    Base.metadata.create_all(engine)
    isolated = sessionmaker(bind=engine)()
    try:
        company = Empresa(nombre="Failure Company", ruc="9999999999999", proy_prefijo="FAIL", proy_periodo="2026", proy_secuencial=1, proy_secuencial_size=3)
        isolated.add(company); isolated.commit(); isolated.refresh(company)
        project, user = _scope(isolated, company)
        coordination = create_coordination_set(isolated, project_id=project.id, company_id=company.id, user_id=user.id, payload=SimpleNamespace(presupuesto_id=None, presupuesto_revision=None, cronograma_trabajo_id=None, baseline_id=None, bim_version_ids=[]))
        link = create_link(isolated, coordination_set_id=coordination["id"], project_id=project.id, company_id=company.id, user_id=user.id, payload=SimpleNamespace(budget_line_id=None, apu_id=None, activity_ref="ACT-FAIL", activity_snapshot_id=None, bim_element_id=None, bim_global_id="GUID-FAIL", allocation_key="primary", allocation_type="percentage", allocation_value=25, unit=None, additive=True, source="manual", notes="stable"))
        proposal = create_proposal(isolated, coordination_set_id=coordination["id"], project_id=project.id, company_id=company.id, user_id=user.id, payload=SimpleNamespace(proposal_type="failure_test", source_domain="schedule", target_domain="bim", diff={"link_updates": [{"link_id": link["id"], "allocation_value": 80}]}, impact={}, reason="test"))
        approved = decide_proposal(isolated, proposal_id=proposal["id"], coordination_set_id=coordination["id"], project_id=project.id, company_id=company.id, user_id=user.id, decision="approve", reason="approved")

        original_commit = isolated.commit
        calls = {"count": 0}
        def fail_once():
            calls["count"] += 1
            if calls["count"] == 1:
                raise RuntimeError("induced commit failure")
            return original_commit()
        monkeypatch.setattr(isolated, "commit", fail_once)
        with pytest.raises(HTTPException) as failed:
            apply_proposal(isolated, proposal_id=proposal["id"], coordination_set_id=coordination["id"], project_id=project.id, company_id=company.id, user_id=user.id, expected_version=approved["version"], reason="first")
        assert failed.value.status_code == 503
        stable = isolated.query(CoordinationLink).filter(CoordinationLink.id == link["id"]).one()
        assert float(stable.allocation_value) == 25

        retried = apply_proposal(isolated, proposal_id=proposal["id"], coordination_set_id=coordination["id"], project_id=project.id, company_id=company.id, user_id=user.id, expected_version=approved["version"], reason="retry")
        assert retried["status"] == "applied"
        assert float(isolated.query(CoordinationLink).filter(CoordinationLink.id == link["id"]).one().allocation_value) == 80
    finally:
        isolated.close(); Base.metadata.drop_all(engine); engine.dispose()


def test_omniclass_source_is_preserved_but_disabled_until_tenant_enables_it(db, sample_empresa):
    project, user = _scope(db, sample_empresa)
    model = BimModel(proyecto_id=project.id, empresa_id=sample_empresa.id, nombre="Arquitectura")
    db.add(model); db.commit(); db.refresh(model)
    version = BimModelVersion(bim_model_id=model.id, version_label="v1", status="ready", is_active=True)
    db.add(version); db.commit(); db.refresh(version)
    element = BimElement(bim_model_version_id=version.id, global_id="GUID-OMNI", nombre="Muro")
    master = OmniClassMaestro(tabla="21", codigo="21-01", titulo="Element", nivel=1)
    db.add_all([element, master]); db.commit(); db.refresh(element); db.refresh(master)

    payload = SimpleNamespace(
        bim_element_id=element.id, bim_model_version_id=version.id, system="OmniClass", edition="2012",
        table_code="21", source_code="21-01", source_title="Element", omniclass_id=master.id,
        resolution_status="resolved", confidence=0.95, source="ifc",
    )
    disabled = upsert_classification_resolution(db, project_id=project.id, company_id=sample_empresa.id, user_id=user.id, payload=payload)
    assert disabled["source_code"] == "21-01"
    assert disabled["omniclass_id"] is None
    assert disabled["resolution_status"] == "disabled"
    assert classification_summary(db, project_id=project.id, company_id=sample_empresa.id)["warning_required"] is True

    sample_empresa.use_omniclass = True; db.commit()
    enabled = upsert_classification_resolution(db, project_id=project.id, company_id=sample_empresa.id, user_id=user.id, payload=payload)
    assert enabled["omniclass_id"] == master.id
    assert enabled["resolution_status"] == "resolved"

    invalid = SimpleNamespace(**{**payload.__dict__, "table_code": "99"})
    with pytest.raises(HTTPException) as mismatch:
        upsert_classification_resolution(db, project_id=project.id, company_id=sample_empresa.id, user_id=user.id, payload=invalid)
    assert mismatch.value.status_code == 409


def test_ifc_classification_ingestion_preserves_source_and_only_suggests_master(db, sample_empresa):
    project, user = _scope(db, sample_empresa)
    model = BimModel(proyecto_id=project.id, empresa_id=sample_empresa.id, nombre="Classified")
    db.add(model); db.commit(); db.refresh(model)
    version = BimModelVersion(bim_model_id=model.id, version_label="v1", status="ready", is_active=True)
    db.add(version); db.commit(); db.refresh(version)
    exact = BimElement(bim_model_version_id=version.id, global_id="CLASS-1", classification="OmniClass: 23-10 10 11", properties={})
    unresolved = BimElement(bim_model_version_id=version.id, global_id="CLASS-2", classification=None, properties={"Pset": {"ClassificationReference": "23-UNKNOWN"}})
    master = OmniClassMaestro(tabla="23", codigo="23-10 10 11", titulo="Wall", nivel=3)
    db.add_all([exact, unresolved, master]); db.commit()

    sample_empresa.use_omniclass = True; db.commit()
    result = ingest_classification_candidates(db, project_id=project.id, company_id=sample_empresa.id, version_id=version.id)
    assert result == {"version_id": version.id, "created": 2, "updated": 0, "suggested": 1, "unresolved": 1, "disabled": 0, "automatic_links_created": 0, "automatic_approvals": 0}
    assert classification_summary(db, project_id=project.id, company_id=sample_empresa.id)["status"] == "partial"

    repeated = ingest_classification_candidates(db, project_id=project.id, company_id=sample_empresa.id, version_id=version.id)
    assert repeated["created"] == 0 and repeated["updated"] == 2
    assert repeated["automatic_links_created"] == 0
