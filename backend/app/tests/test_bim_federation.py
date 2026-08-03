import pytest
from fastapi import HTTPException

from app.models.bim_federation import BimFederation, BimVersionReconciliationDecision
from app.models.bim_coordination import CoordinationLink, ProjectCoordinationSet
from app.models.bim_model import BimModel
from app.models.bim_model_version import BimModelVersion
from app.models.bim_element import BimElement
from app.models.proyecto import Proyecto
from app.models.usuario import Usuario
from app.schemas.bim_federation import BimFederationSaveRequest, BimReconciliationDecisionRequest
from app.services.bim.federation_service import build_version_reconciliation, decide_version_reconciliation, get_active_federation, save_federation_revision


def _member(version_id, discipline, *, origin=(0, 0, 0), translation=(0, 0, 0), scale=(1, 1, 1), enabled=True):
    return {
        "version_id": version_id,
        "discipline": discipline,
        "enabled": enabled,
        "transform": {"translation": translation, "rotation_degrees": (0, 0, 0), "scale": scale},
        "georeference": {"crs": "EPSG:9377", "origin": origin, "units": "m"},
    }


def _version(db, project, discipline):
    model = BimModel(proyecto_id=project.id, empresa_id=project.empresa_id, nombre=discipline, disciplina=discipline)
    db.add(model)
    db.flush()
    version = BimModelVersion(bim_model_id=model.id, version_label="P01", status="ready_for_review")
    db.add(version)
    db.flush()
    return version


def _user(db, company_id):
    user = Usuario(
        email="coordinador.bim@example.com",
        hashed_password="test",
        nombre_completo="Coordinador BIM",
        rol="usuario",
        empresa_id=company_id,
    )
    db.add(user)
    db.flush()
    return user


def test_federation_revisions_pin_multidiscipline_versions_and_report_alignment(db, sample_empresa):
    project = Proyecto(nombre="Federacion PCERT", empresa_id=sample_empresa.id)
    db.add(project)
    db.flush()
    architecture = _version(db, project, "Arquitectura")
    structure = _version(db, project, "Estructura")
    mep = _version(db, project, "MEP")
    sample_user = _user(db, sample_empresa.id)
    db.commit()

    first = save_federation_revision(
        db,
        project_id=project.id,
        company_id=sample_empresa.id,
        user_id=sample_user.id,
        payload=BimFederationSaveRequest(
            name="Coordinacion P01",
            justification="Federacion inicial del modelo coordinado.",
            members=[
                _member(architecture.id, "Arquitectura"),
                _member(structure.id, "Estructura", origin=(0.005, 0, 0)),
                _member(mep.id, "MEP", origin=(25, 0, 0)),
            ],
        ),
    )
    assert first.revision == 1
    assert first.summary == {"members": 3, "enabled": 3, "aligned": 2, "misaligned": 1, "invalid_units": 0, "invalid_scale": 0, "measurement_ready": 0}
    assert [member.alignment_status for member in first.members] == ["reference", "aligned", "misaligned"]

    second_payload = BimFederationSaveRequest(
        name="Coordinacion P01",
        justification="Se desactiva MEP mientras se corrige su origen.",
        members=[
            _member(architecture.id, "Arquitectura"),
            _member(structure.id, "Estructura", origin=(0.005, 0, 0)),
            _member(mep.id, "MEP", origin=(25, 0, 0), enabled=False),
        ],
    )
    second = save_federation_revision(db, project_id=project.id, company_id=sample_empresa.id, user_id=sample_user.id, payload=second_payload)
    assert second.revision == 2
    assert second.summary == {"members": 3, "enabled": 2, "aligned": 2, "misaligned": 0, "invalid_units": 0, "invalid_scale": 0, "measurement_ready": 1}
    assert get_active_federation(db, project_id=project.id, company_id=sample_empresa.id).id == second.id
    assert db.query(BimFederation).filter(BimFederation.id == first.id).one().status == "superseded"


def test_federation_rejects_cross_tenant_version(db, sample_empresa):
    project = Proyecto(nombre="Proyecto federado", empresa_id=sample_empresa.id)
    other = Proyecto(nombre="Proyecto externo", empresa_id=sample_empresa.id)
    db.add_all([project, other])
    db.flush()
    version = _version(db, other, "Arquitectura")
    sample_user = _user(db, sample_empresa.id)
    db.commit()

    with pytest.raises(HTTPException) as exc_info:
        save_federation_revision(
            db,
            project_id=project.id,
            company_id=sample_empresa.id,
            user_id=sample_user.id,
            payload=BimFederationSaveRequest(
                name="No permitida",
                justification="Debe fallar por alcance de proyecto.",
                members=[_member(version.id, "Arquitectura")],
            ),
        )
    assert exc_info.value.status_code == 404


def test_federation_marks_non_uniform_scale_as_not_measurement_ready(db, sample_empresa):
    project = Proyecto(nombre="Scale review", empresa_id=sample_empresa.id)
    db.add(project); db.flush()
    version = _version(db, project, "Architecture")
    sample_user = _user(db, sample_empresa.id); db.commit()
    result = save_federation_revision(
        db, project_id=project.id, company_id=sample_empresa.id, user_id=sample_user.id,
        payload=BimFederationSaveRequest(name="Scale", justification="Review scale", members=[_member(version.id, "Architecture", scale=(1, 1, 1.2))]),
    )
    assert result.summary["invalid_scale"] == 1
    assert result.summary["measurement_ready"] == 0
    assert result.members[0].alignment_status == "misaligned"


def test_version_reconciliation_detects_retained_split_merge_added_and_removed_without_applying(db, sample_empresa):
    project = Proyecto(nombre="GUID reconciliation", empresa_id=sample_empresa.id)
    model = BimModel(proyecto_id=None, empresa_id=sample_empresa.id, nombre="Architecture", disciplina="Architecture")
    db.add(project); db.flush(); model.proyecto_id = project.id; db.add(model); db.flush()
    source = BimModelVersion(bim_model_id=model.id, version_label="P01", status="ready")
    target = BimModelVersion(bim_model_id=model.id, version_label="P02", status="ready")
    db.add_all([source, target]); db.flush()
    db.add_all([
        BimElement(bim_model_version_id=source.id, global_id="KEEP", ifc_class="IfcWall", nombre="Keep", storey_name="L1"),
        BimElement(bim_model_version_id=target.id, global_id="KEEP", ifc_class="IfcWall", nombre="Keep", storey_name="L1"),
        BimElement(bim_model_version_id=source.id, global_id="SPLIT-OLD", ifc_class="IfcWall", nombre="Partition", storey_name="L1"),
        BimElement(bim_model_version_id=target.id, global_id="SPLIT-A", ifc_class="IfcWall", nombre="Partition", storey_name="L1"),
        BimElement(bim_model_version_id=target.id, global_id="SPLIT-B", ifc_class="IfcWall", nombre="Partition", storey_name="L1"),
        BimElement(bim_model_version_id=source.id, global_id="MERGE-A", ifc_class="IfcDuct", nombre="Main", storey_name="L2"),
        BimElement(bim_model_version_id=source.id, global_id="MERGE-B", ifc_class="IfcDuct", nombre="Main", storey_name="L2"),
        BimElement(bim_model_version_id=target.id, global_id="MERGE-NEW", ifc_class="IfcDuct", nombre="Main", storey_name="L2"),
        BimElement(bim_model_version_id=source.id, global_id="REMOVED", ifc_class="IfcWindow", nombre="Removed", storey_name="L1"),
        BimElement(bim_model_version_id=target.id, global_id="ADDED", ifc_class="IfcDoor", nombre="Added", storey_name="L1"),
    ])
    db.commit()

    result = build_version_reconciliation(
        db, project_id=project.id, company_id=sample_empresa.id,
        source_version_id=source.id, target_version_id=target.id,
    )

    assert result["retained_global_ids"] == ["KEEP"]
    assert {item["kind"] for item in result["candidates"]} == {"split", "merge"}
    assert all(item["requires_review"] and not item["automatically_applied"] for item in result["candidates"])
    assert result["removed"][0]["global_id"] == "REMOVED"
    assert result["added"][0]["global_id"] == "ADDED"
    assert result["summary"] == {"retained": 1, "candidates": 2, "removed": 1, "added": 1, "review_required": 2, "automatic_changes": 0}


def _reconciliation_case(db, company):
    project = Proyecto(nombre="Decision GUID", empresa_id=company.id, codigo_root="decision-guid", revision=0)
    db.add(project); db.flush()
    model = BimModel(proyecto_id=project.id, empresa_id=company.id, nombre="Architecture", disciplina="Architecture")
    db.add(model); db.flush()
    source = BimModelVersion(bim_model_id=model.id, version_label="P01", status="ready")
    target = BimModelVersion(bim_model_id=model.id, version_label="P02", status="ready")
    db.add_all([source, target]); db.flush()
    old = BimElement(bim_model_version_id=source.id, global_id="OLD", ifc_class="IfcWall", nombre="Partition", storey_name="L1")
    new_a = BimElement(bim_model_version_id=target.id, global_id="NEW-A", ifc_class="IfcWall", nombre="Partition", storey_name="L1")
    new_b = BimElement(bim_model_version_id=target.id, global_id="NEW-B", ifc_class="IfcWall", nombre="Partition", storey_name="L1")
    db.add_all([old, new_a, new_b]); db.flush()
    user = _user(db, company.id)
    coordination_set = ProjectCoordinationSet(
        empresa_id=company.id, proyecto_id=project.id, proyecto_codigo_root="decision-guid",
        proyecto_revision=0, revision=1,
    )
    db.add(coordination_set); db.flush()
    link = CoordinationLink(
        empresa_id=company.id, proyecto_id=project.id, coordination_set_id=coordination_set.id,
        bim_element_id=old.id, bim_global_id=old.global_id, allocation_key="primary",
    )
    db.add(link); db.commit()
    return project, source, target, old, new_a, new_b, user, link


def test_reconciliation_hash_is_deterministic_and_split_requires_explicit_target(db, sample_empresa):
    project, source, target, _, _, _, user, _ = _reconciliation_case(db, sample_empresa)
    first = build_version_reconciliation(db, project_id=project.id, company_id=sample_empresa.id, source_version_id=source.id, target_version_id=target.id)
    second = build_version_reconciliation(db, project_id=project.id, company_id=sample_empresa.id, source_version_id=source.id, target_version_id=target.id)
    assert first["candidates"][0]["candidate_hash"] == second["candidates"][0]["candidate_hash"]
    payload = BimReconciliationDecisionRequest(
        source_version_id=source.id, target_version_id=target.id,
        candidate_hash=first["candidates"][0]["candidate_hash"], decision="approved", reason="Revisión técnica",
    )
    with pytest.raises(HTTPException) as exc_info:
        decide_version_reconciliation(db, project_id=project.id, company_id=sample_empresa.id, user_id=user.id, payload=payload)
    assert exc_info.value.status_code == 409


def test_approved_reconciliation_persists_propagates_and_is_idempotent(db, sample_empresa):
    project, source, target, _, new_a, _, user, link = _reconciliation_case(db, sample_empresa)
    candidate = build_version_reconciliation(db, project_id=project.id, company_id=sample_empresa.id, source_version_id=source.id, target_version_id=target.id)["candidates"][0]
    payload = BimReconciliationDecisionRequest(
        source_version_id=source.id, target_version_id=target.id, candidate_hash=candidate["candidate_hash"],
        decision="approved", selected_target_global_id=new_a.global_id, reason="Destino verificado",
    )
    result = decide_version_reconciliation(db, project_id=project.id, company_id=sample_empresa.id, user_id=user.id, payload=payload)
    db.refresh(link)
    assert result == {"id": result["id"], "decision": "approved", "affected_link_count": 1, "duplicate": False}
    assert (link.bim_element_id, link.bim_global_id) == (new_a.id, new_a.global_id)
    assert db.query(BimVersionReconciliationDecision).count() == 1
    duplicate = decide_version_reconciliation(db, project_id=project.id, company_id=sample_empresa.id, user_id=user.id, payload=payload)
    assert duplicate["duplicate"] is True
    assert db.query(BimVersionReconciliationDecision).count() == 1


def test_rejected_reconciliation_does_not_change_links_and_stale_hash_is_rejected(db, sample_empresa):
    project, source, target, old, _, _, user, link = _reconciliation_case(db, sample_empresa)
    candidate = build_version_reconciliation(db, project_id=project.id, company_id=sample_empresa.id, source_version_id=source.id, target_version_id=target.id)["candidates"][0]
    stale = BimReconciliationDecisionRequest(
        source_version_id=source.id, target_version_id=target.id, candidate_hash="0" * 64,
        decision="rejected", reason="Hash obsoleto",
    )
    with pytest.raises(HTTPException) as exc_info:
        decide_version_reconciliation(db, project_id=project.id, company_id=sample_empresa.id, user_id=user.id, payload=stale)
    assert exc_info.value.status_code == 409
    payload = stale.model_copy(update={"candidate_hash": candidate["candidate_hash"]})
    result = decide_version_reconciliation(db, project_id=project.id, company_id=sample_empresa.id, user_id=user.id, payload=payload)
    db.refresh(link)
    assert result["decision"] == "rejected"
    assert result["affected_link_count"] == 0
    assert (link.bim_element_id, link.bim_global_id) == (old.id, old.global_id)
