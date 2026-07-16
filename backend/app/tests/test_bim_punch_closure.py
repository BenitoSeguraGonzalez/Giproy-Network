from datetime import datetime, timedelta, timezone
from pathlib import Path

import pytest
from fastapi import HTTPException

from app.models.bim_4d import Bim4dActivitySnapshot
from app.models.bim_4d_safety import Bim4dSafetyInspection, Bim4dSafetyPunchItem, Bim4dSafetyRisk
from app.models.bim_as_built_acceptance import BimAsBuiltAcceptance
from app.models.bim_model import BimModel
from app.models.bim_model_version import BimModelVersion
from app.models.proyecto import Proyecto
from app.models.usuario import Usuario
from app.schemas.bim_punch_closure import BimPunchClosureCreate, BimPunchClosureDecision
from app.services.bim.punch_closure_service import create_punch_closure, decide_punch_closure, list_punch_closures


def _context(db, empresa, punch_status="closed"):
    now = datetime(2026, 7, 16, tzinfo=timezone.utc)
    user = Usuario(email="punch-close@example.com", hashed_password="x", nombre_completo="Punch", empresa_id=empresa.id, rol="superadministrador")
    project = Proyecto(nombre="Punch close", empresa_id=empresa.id); db.add_all([user, project]); db.flush()
    model = BimModel(proyecto_id=project.id, empresa_id=empresa.id, nombre="As built"); db.add(model); db.flush()
    version = BimModelVersion(bim_model_id=model.id, version_label="AB-1", status="ready", is_active=True); db.add(version); db.flush()
    acceptance = BimAsBuiltAcceptance(empresa_id=empresa.id, proyecto_id=project.id, bim_model_version_id=version.id, revision="AB-1", version_label="AB-1", source_checksum_sha256="a" * 64, quality_status="passed", acceptance_criteria_json=["IFC conforme"], declaration_notes="Entrega verificada", status="accepted", submitted_by=user.id, decided_by=user.id, decided_at=now); db.add(acceptance)
    activity = Bim4dActivitySnapshot(empresa_id=empresa.id, proyecto_id=project.id, source_kind="test", source_ref="A1", snapshot_revision="R1", activity_code="A1", activity_name="Cierre", planned_start=now, planned_finish=now + timedelta(days=1), captured_by=user.id); db.add(activity); db.flush()
    risk = Bim4dSafetyRisk(empresa_id=empresa.id, proyecto_id=project.id, activity_snapshot_id=activity.id, title="Hallazgo", hazard_type="general", severity=2, likelihood=2, controls_json=["Corregir"], zone_json={"x": 0, "y": 0, "z": 0, "radius": 1}, active_start=now, active_finish=now + timedelta(days=1), status="open", created_by=user.id); db.add(risk); db.flush()
    inspection = Bim4dSafetyInspection(empresa_id=empresa.id, proyecto_id=project.id, risk_id=risk.id, inspected_at=now, result="non_compliant", checklist_json=[{"label": "Corregido", "passed": False}], note="Pendiente", inspected_by=user.id); db.add(inspection); db.flush()
    punch = Bim4dSafetyPunchItem(empresa_id=empresa.id, proyecto_id=project.id, risk_id=risk.id, inspection_id=inspection.id, title="Corregir", priority="critical", status=punch_status, created_by=user.id, closed_by=user.id if punch_status == "closed" else None, closed_at=now if punch_status == "closed" else None); db.add(punch); db.commit()
    return user, project, punch


def test_punch_closure_freezes_and_accepts_closed_ledger(db, sample_empresa):
    user, project, punch = _context(db, sample_empresa)
    closure = create_punch_closure(db, project_id=project.id, company_id=sample_empresa.id, user_id=user.id, payload=BimPunchClosureCreate(revision="PC-1", closure_criteria=["Sin hallazgos abiertos"], verification_notes="Recorrido final conforme"))
    accepted = decide_punch_closure(db, closure_id=closure["id"], project_id=project.id, company_id=sample_empresa.id, user_id=user.id, payload=BimPunchClosureDecision(decision="accepted", reason="Punch list cerrada y verificada", expected_lock_version=1))
    assert accepted["status"] == "accepted" and accepted["punch_item_ids"] == [punch.id] and accepted["critical_items"] == 1
    assert list_punch_closures(db, project_id=project.id, company_id=sample_empresa.id)[0]["status"] == "accepted"


def test_punch_closure_blocks_open_or_changed_ledger(db, sample_empresa):
    user, project, punch = _context(db, sample_empresa, punch_status="open")
    with pytest.raises(HTTPException, match="pendientes"):
        create_punch_closure(db, project_id=project.id, company_id=sample_empresa.id, user_id=user.id, payload=BimPunchClosureCreate(revision="PC-OPEN", closure_criteria=["Sin abiertos"], verification_notes="Intento con pendientes"))
    punch.status = "closed"; punch.closed_by = user.id; punch.closed_at = datetime.now(timezone.utc); db.commit()
    closure = create_punch_closure(db, project_id=project.id, company_id=sample_empresa.id, user_id=user.id, payload=BimPunchClosureCreate(revision="PC-2", closure_criteria=["Sin abiertos"], verification_notes="Lista inicialmente cerrada"))
    punch.closed_at = punch.closed_at + timedelta(minutes=1); db.commit()
    with pytest.raises(HTTPException, match="punch list cambio"):
        decide_punch_closure(db, closure_id=closure["id"], project_id=project.id, company_id=sample_empresa.id, user_id=user.id, payload=BimPunchClosureDecision(decision="accepted", reason="No debe aceptar cambios", expected_lock_version=1))


def test_punch_closure_migration_is_additive():
    source = (Path(__file__).parents[2] / "alembic" / "versions" / "de2048a1b2c3_bim_punch_closure.py").read_text(encoding="utf-8")
    assert 'down_revision = "de2047a1b2c3"' in source and 'ondelete="RESTRICT"' in source and "alter_column" not in source
