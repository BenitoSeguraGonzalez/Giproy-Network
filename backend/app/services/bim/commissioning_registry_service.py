from datetime import datetime, timezone

from fastapi import HTTPException

from app.models.bim_commissioning import BimCommissioningAsset, BimCommissioningSystem, BimCommissioningTest
from app.models.bim_element import BimElement
from app.models.bim_model import BimModel
from app.models.bim_model_version import BimModelVersion


def _serialize_system(value, asset_count=0):
    return {"id": value.id, "system_code": value.system_code, "name": value.name, "discipline": value.discipline, "description": value.description, "status": value.status, "asset_count": asset_count, "decision_reason": value.decision_reason, "lock_version": value.lock_version, "accepted_by": value.accepted_by, "accepted_at": value.accepted_at, "created_by": value.created_by, "created_at": value.created_at}


def _serialize_asset(value):
    return {"id": value.id, "system_id": value.system_id, "version_id": value.bim_model_version_id, "element_id": value.bim_element_id, "asset_tag": value.asset_tag, "name": value.name, "asset_type": value.asset_type, "global_id": value.global_id, "source_system_name": value.source_system_name, "manufacturer": value.manufacturer, "model_reference": value.model_reference, "serial_number": value.serial_number, "status": value.status, "decision_reason": value.decision_reason, "lock_version": value.lock_version, "decided_by": value.decided_by, "decided_at": value.decided_at, "created_by": value.created_by, "created_at": value.created_at}


def _serialize_test(value):
    return {"id": value.id, "asset_id": value.asset_id, "protocol_code": value.protocol_code, "attempt": value.attempt, "protocol_name": value.protocol_name, "checklist": value.checklist_json, "results": value.results_json, "outcome": value.outcome, "evidence_reference": value.evidence_reference, "status": value.status, "decision_reason": value.decision_reason, "lock_version": value.lock_version, "submitted_by": value.submitted_by, "decided_by": value.decided_by, "submitted_at": value.submitted_at, "decided_at": value.decided_at}


def get_commissioning_registry(db, *, project_id, company_id):
    systems = db.query(BimCommissioningSystem).filter(BimCommissioningSystem.proyecto_id == project_id, BimCommissioningSystem.empresa_id == company_id).order_by(BimCommissioningSystem.system_code).all()
    assets = db.query(BimCommissioningAsset).filter(BimCommissioningAsset.proyecto_id == project_id, BimCommissioningAsset.empresa_id == company_id).order_by(BimCommissioningAsset.asset_tag).all()
    tests = db.query(BimCommissioningTest).filter(BimCommissioningTest.proyecto_id == project_id, BimCommissioningTest.empresa_id == company_id).order_by(BimCommissioningTest.submitted_at.desc(), BimCommissioningTest.id.desc()).all()
    counts = {}
    for asset in assets:
        counts[asset.system_id] = counts.get(asset.system_id, 0) + 1
    return {"project_id": project_id, "company_id": company_id, "systems": [_serialize_system(value, counts.get(value.id, 0)) for value in systems], "assets": [_serialize_asset(value) for value in assets], "tests": [_serialize_test(value) for value in tests]}


def create_commissioning_system(db, *, project_id, company_id, user_id, payload):
    code = payload.system_code.strip().upper()
    if db.query(BimCommissioningSystem.id).filter(BimCommissioningSystem.proyecto_id == project_id, BimCommissioningSystem.empresa_id == company_id, BimCommissioningSystem.system_code == code).first():
        raise HTTPException(status_code=409, detail="El codigo de sistema de commissioning ya existe.")
    value = BimCommissioningSystem(empresa_id=company_id, proyecto_id=project_id, system_code=code, name=payload.name.strip(), discipline=payload.discipline.strip() if payload.discipline else None, description=payload.description.strip() if payload.description else None, created_by=user_id)
    db.add(value); db.commit(); db.refresh(value)
    return _serialize_system(value)


def create_commissioning_asset(db, *, project_id, company_id, user_id, payload):
    system = db.query(BimCommissioningSystem).filter(BimCommissioningSystem.id == payload.system_id, BimCommissioningSystem.proyecto_id == project_id, BimCommissioningSystem.empresa_id == company_id, BimCommissioningSystem.status.in_(("registered", "commissioning"))).first()
    if not system:
        raise HTTPException(status_code=404, detail="Sistema de commissioning fuera del proyecto activo.")
    element = db.query(BimElement).join(BimModelVersion, BimModelVersion.id == BimElement.bim_model_version_id).join(BimModel, BimModel.id == BimModelVersion.bim_model_id).filter(BimElement.id == payload.element_id, BimElement.bim_model_version_id == payload.version_id, BimModelVersion.status == "ready", BimModel.proyecto_id == project_id, BimModel.empresa_id == company_id).first()
    if not element:
        raise HTTPException(status_code=404, detail="Elemento BIM listo fuera del proyecto o version activa.")
    tag = payload.asset_tag.strip().upper()
    if db.query(BimCommissioningAsset.id).filter(BimCommissioningAsset.proyecto_id == project_id, BimCommissioningAsset.empresa_id == company_id, BimCommissioningAsset.asset_tag == tag).first():
        raise HTTPException(status_code=409, detail="El tag de activo de commissioning ya existe.")
    value = BimCommissioningAsset(empresa_id=company_id, proyecto_id=project_id, system_id=system.id, bim_model_version_id=payload.version_id, bim_element_id=element.id, asset_tag=tag, name=payload.name.strip(), asset_type=payload.asset_type.strip(), global_id=element.global_id, source_system_name=element.system_name, manufacturer=payload.manufacturer.strip() if payload.manufacturer else None, model_reference=payload.model_reference.strip() if payload.model_reference else None, serial_number=payload.serial_number.strip() if payload.serial_number else None, created_by=user_id)
    db.add(value); db.commit(); db.refresh(value)
    return _serialize_asset(value)


def create_commissioning_test(db, *, project_id, company_id, user_id, payload):
    asset = db.query(BimCommissioningAsset).filter(BimCommissioningAsset.id == payload.asset_id, BimCommissioningAsset.proyecto_id == project_id, BimCommissioningAsset.empresa_id == company_id).with_for_update().first()
    if not asset:
        raise HTTPException(status_code=404, detail="Activo de commissioning fuera del proyecto activo.")
    if asset.status in ("accepted", "retired"):
        raise HTTPException(status_code=409, detail="El activo aceptado o retirado no admite nuevas pruebas.")
    code = payload.protocol_code.strip().upper()
    previous = db.query(BimCommissioningTest).filter(BimCommissioningTest.asset_id == asset.id, BimCommissioningTest.protocol_code == code).order_by(BimCommissioningTest.attempt.desc()).with_for_update().first()
    if previous and previous.status != "rejected":
        raise HTTPException(status_code=409, detail="El protocolo vigente debe rechazarse antes de crear otro intento.")
    attempt = (previous.attempt + 1) if previous else 1
    checklist = [item.strip() for item in payload.checklist if item.strip()]
    if not checklist:
        raise HTTPException(status_code=422, detail="El protocolo requiere una lista de comprobacion verificable.")
    value = BimCommissioningTest(empresa_id=company_id, proyecto_id=project_id, asset_id=asset.id, protocol_code=code, attempt=attempt, protocol_name=payload.protocol_name.strip(), checklist_json=checklist, results_json=payload.results, outcome=payload.outcome, evidence_reference=payload.evidence_reference.strip() if payload.evidence_reference else None, submitted_by=user_id)
    asset.status = "testing"
    asset.lock_version += 1
    system = db.query(BimCommissioningSystem).filter(BimCommissioningSystem.id == asset.system_id).with_for_update().first()
    if system.status == "registered":
        system.status = "commissioning"; system.lock_version += 1
    db.add(value); db.commit(); db.refresh(value)
    return _serialize_test(value)


def decide_commissioning_test(db, *, test_id, project_id, company_id, user_id, payload):
    value = db.query(BimCommissioningTest).filter(BimCommissioningTest.id == test_id, BimCommissioningTest.proyecto_id == project_id, BimCommissioningTest.empresa_id == company_id).with_for_update().first()
    if not value:
        raise HTTPException(status_code=404, detail="Prueba de commissioning fuera del proyecto activo.")
    if value.status != "submitted" or value.lock_version != payload.expected_lock_version:
        raise HTTPException(status_code=409, detail="La prueba cambio o ya fue decidida.")
    if payload.decision == "accepted" and value.outcome != "passed":
        raise HTTPException(status_code=409, detail="Una prueba con resultado fallido no puede aceptarse.")
    value.status = payload.decision; value.decision_reason = payload.reason.strip(); value.decided_by = user_id; value.decided_at = datetime.now(timezone.utc); value.lock_version += 1
    asset = db.query(BimCommissioningAsset).filter(BimCommissioningAsset.id == value.asset_id).with_for_update().first()
    asset.status = "testing" if payload.decision == "accepted" else "rejected"
    asset.decision_reason = None if payload.decision == "accepted" else payload.reason.strip()
    asset.lock_version += 1
    db.commit(); db.refresh(value)
    return _serialize_test(value)


def decide_commissioning_asset(db, *, asset_id, project_id, company_id, user_id, payload):
    asset = db.query(BimCommissioningAsset).filter(BimCommissioningAsset.id == asset_id, BimCommissioningAsset.proyecto_id == project_id, BimCommissioningAsset.empresa_id == company_id).with_for_update().first()
    if not asset:
        raise HTTPException(status_code=404, detail="Activo de commissioning fuera del proyecto activo.")
    if asset.status not in ("testing", "rejected") or asset.lock_version != payload.expected_lock_version:
        raise HTTPException(status_code=409, detail="El activo cambio o no admite esta decision.")
    tests = db.query(BimCommissioningTest).filter(BimCommissioningTest.asset_id == asset.id).order_by(BimCommissioningTest.protocol_code, BimCommissioningTest.attempt.desc()).with_for_update().all()
    latest_tests = {}
    for test in tests:
        latest_tests.setdefault(test.protocol_code, test)
    if payload.decision == "accepted" and (not latest_tests or any(test.status != "accepted" or test.outcome != "passed" for test in latest_tests.values())):
        raise HTTPException(status_code=409, detail="Todos los protocolos del activo deben estar aprobados y superados.")
    asset.status = payload.decision; asset.decision_reason = payload.reason.strip(); asset.decided_by = user_id; asset.decided_at = datetime.now(timezone.utc); asset.lock_version += 1
    db.commit(); db.refresh(asset)
    return _serialize_asset(asset)


def accept_commissioning_system(db, *, system_id, project_id, company_id, user_id, payload):
    system = db.query(BimCommissioningSystem).filter(BimCommissioningSystem.id == system_id, BimCommissioningSystem.proyecto_id == project_id, BimCommissioningSystem.empresa_id == company_id).with_for_update().first()
    if not system:
        raise HTTPException(status_code=404, detail="Sistema de commissioning fuera del proyecto activo.")
    if system.status != "commissioning" or system.lock_version != payload.expected_lock_version:
        raise HTTPException(status_code=409, detail="El sistema cambio o no admite aceptacion.")
    assets = db.query(BimCommissioningAsset).filter(BimCommissioningAsset.system_id == system.id).with_for_update().all()
    if not assets or any(asset.status != "accepted" for asset in assets):
        raise HTTPException(status_code=409, detail="Todos los activos del sistema deben estar aceptados.")
    system.status = "accepted"; system.decision_reason = payload.reason.strip(); system.accepted_by = user_id; system.accepted_at = datetime.now(timezone.utc); system.lock_version += 1
    db.commit(); db.refresh(system)
    return _serialize_system(system, len(assets))
