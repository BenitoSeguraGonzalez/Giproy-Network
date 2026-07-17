from datetime import date
from pathlib import Path

import pytest
from fastapi import HTTPException

from app.models.bim_handover_dossier import BimHandoverDossier
from app.models.proyecto import Proyecto
from app.models.usuario import Usuario
from app.schemas.bim_operations_transition import BimOperationsTransitionCreate, BimOperationsTransitionDecision
from app.services.bim.operations_transition_service import create_operations_transition, decide_operations_transition, list_operations_transitions


def _context(db, empresa, accepted=True):
    user = Usuario(email="operations@example.com", hashed_password="x", nombre_completo="Operations", empresa_id=empresa.id, rol="superadministrador")
    project = Proyecto(nombre="Operations twin", empresa_id=empresa.id); db.add_all([user, project]); db.flush()
    manifest = {"commissioning_systems": [{"id": 10, "code": "HVAC-01", "lock_version": 2}], "commissioning_assets": [{"id": 20, "tag": "P-001", "global_id": "GUID-1", "lock_version": 3}]}
    dossier = BimHandoverDossier(empresa_id=empresa.id, proyecto_id=project.id, as_built_acceptance_id=1, punch_closure_id=1, revision="HD-1", manifest_json=manifest, manifest_checksum_sha256="d" * 64, system_ids_json=[10], asset_ids_json=[20], cde_revision_ids_json=[30], total_systems=1, total_assets=1, total_documents=1, assembly_notes="Dossier", status="accepted" if accepted else "submitted", submitted_by=user.id); db.add(dossier); db.commit()
    return user, project, dossier


def test_operations_transition_freezes_accepted_handover_baseline(db, sample_empresa):
    user, project, dossier = _context(db, sample_empresa)
    value = create_operations_transition(db, project_id=project.id, company_id=sample_empresa.id, user_id=user.id, payload=BimOperationsTransitionCreate(revision="OM-1", operating_organization="Facility Team", responsible_role="Asset Manager", effective_date=date(2026, 8, 1), readiness_criteria=["Dossier aceptado", "Activos identificados"], transition_notes="Baseline operativo verificado"))
    assert value["handover_dossier_id"] == dossier.id and value["total_assets"] == value["total_systems"] == 1
    assert value["asset_baseline"]["schema"] == "giproy_bim_operations_baseline_v1" and len(value["baseline_checksum_sha256"]) == 64
    accepted = decide_operations_transition(db, transition_id=value["id"], project_id=project.id, company_id=sample_empresa.id, user_id=user.id, payload=BimOperationsTransitionDecision(decision="accepted", reason="Baseline operativo completo y conforme", expected_lock_version=1))
    assert accepted["status"] == "accepted" and accepted["lock_version"] == 2
    assert list_operations_transitions(db, project_id=project.id, company_id=sample_empresa.id)[0]["id"] == value["id"]


def test_operations_transition_requires_accepted_dossier(db, sample_empresa):
    user, project, _ = _context(db, sample_empresa, accepted=False)
    with pytest.raises(HTTPException, match="dossier digital aceptado"):
        create_operations_transition(db, project_id=project.id, company_id=sample_empresa.id, user_id=user.id, payload=BimOperationsTransitionCreate(revision="OM-X", operating_organization="Facility Team", responsible_role="Asset Manager", effective_date=date(2026, 8, 1), readiness_criteria=["Conforme"], transition_notes="No debe transferirse"))


def test_operations_transition_rejects_changed_handover(db, sample_empresa):
    user, project, dossier = _context(db, sample_empresa)
    value = create_operations_transition(db, project_id=project.id, company_id=sample_empresa.id, user_id=user.id, payload=BimOperationsTransitionCreate(revision="OM-CHANGE", operating_organization="Facility Team", responsible_role="Asset Manager", effective_date=date(2026, 8, 1), readiness_criteria=["Conforme"], transition_notes="Baseline inicialmente conforme"))
    dossier.manifest_checksum_sha256 = "f" * 64
    db.commit()
    with pytest.raises(HTTPException, match="dossier o baseline operativo cambió"):
        decide_operations_transition(db, transition_id=value["id"], project_id=project.id, company_id=sample_empresa.id, user_id=user.id, payload=BimOperationsTransitionDecision(decision="accepted", reason="No debe activar cambios", expected_lock_version=1))


def test_operations_transition_migration_is_additive():
    source = (Path(__file__).parents[2] / "alembic" / "versions" / "de2051a1b2c3_bim_operations_transition.py").read_text(encoding="utf-8")
    assert 'down_revision = "de2050a1b2c3"' in source and 'ondelete="RESTRICT"' in source and "alter_column" not in source
    activation = (Path(__file__).parents[2] / "alembic" / "versions" / "de2052a1b2c3_bim_operations_activation.py").read_text(encoding="utf-8")
    assert 'down_revision = "de2051a1b2c3"' in activation and "postgresql_where" in activation and "alter_column" not in activation
