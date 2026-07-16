from datetime import date, datetime, timedelta, timezone

import pytest

from app.models.empresa_licencia import EmpresaLicencia
from app.models.licencia import Licencia
from app.models.license_event import LicenseEvent
from app.models.saas_conecta import SaasConectaSlot
from app.models.usuario import Usuario
from app.services.saas_conecta import ConectaPolicyError, saas_conecta_service


def _create_license_assignment(db, empresa_id: int, *, conecta_base_slots: int) -> Licencia:
    licencia = Licencia(
        nombre=f"Conecta Test {empresa_id}-{conecta_base_slots}",
        codigo=f"CONTEST_{empresa_id}_{conecta_base_slots}",
        descripcion="Licencia focal para pruebas Conecta.",
        plan_kind="estandar",
        limites={
            "usuarios": 5,
            "administradores": 1,
            "usuarios_normales": 4,
            "modulos_permitidos": ["apus", "presupuestos"],
            "conecta_base_slots": conecta_base_slots,
            "excel_exports": True,
        },
        activo=True,
    )
    db.add(licencia)
    db.flush()
    db.add(
        EmpresaLicencia(
            empresa_id=empresa_id,
            licencia_id=licencia.id,
            starts_at=date.today() - timedelta(days=1),
            ends_at=date.today() + timedelta(days=30),
            status="active",
            activa=True,
        )
    )
    db.commit()
    return licencia


def _create_user(db, empresa_id: int, email: str, rol: str = "usuario") -> Usuario:
    user = Usuario(
        email=email,
        hashed_password="x",
        nombre_completo=email.split("@")[0],
        rol=rol,
        empresa_id=empresa_id,
        activo=True,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def test_conecta_limits_resolve_base_slots_and_usage(db, sample_empresa):
    _create_license_assignment(db, sample_empresa.id, conecta_base_slots=2)
    owner = _create_user(db, sample_empresa.id, "owner@giproy.test")

    slot = saas_conecta_service.assign_slot(
        db,
        empresa_id=sample_empresa.id,
        owner_user_id=owner.id,
        invited_email="externo@giproy.test",
        actor_user_id=owner.id,
    )
    db.commit()

    limits = saas_conecta_service.resolve_company_conecta_limits(db, sample_empresa.id)

    assert slot.source_right_code == "LICENSE_CONECTA_BASE"
    assert limits["total_slots"] == 2
    assert limits["used_slots"] == 1
    assert limits["available_slots"] == 1


def test_assign_slot_rejects_when_company_has_no_conecta_right(db, sample_empresa):
    _create_license_assignment(db, sample_empresa.id, conecta_base_slots=0)
    owner = _create_user(db, sample_empresa.id, "owner-no-slots@giproy.test")

    with pytest.raises(ConectaPolicyError) as exc:
        saas_conecta_service.assign_slot(
            db,
            empresa_id=sample_empresa.id,
            owner_user_id=owner.id,
            invited_email="externo@giproy.test",
            actor_user_id=owner.id,
        )

    assert exc.value.code == "no_conecta_slots"


def test_assign_slot_rejects_when_slots_are_exhausted(db, sample_empresa):
    _create_license_assignment(db, sample_empresa.id, conecta_base_slots=1)
    owner = _create_user(db, sample_empresa.id, "owner-exhausted@giproy.test")

    saas_conecta_service.assign_slot(
        db,
        empresa_id=sample_empresa.id,
        owner_user_id=owner.id,
        invited_email="uno@giproy.test",
        actor_user_id=owner.id,
    )

    with pytest.raises(ConectaPolicyError) as exc:
        saas_conecta_service.assign_slot(
            db,
            empresa_id=sample_empresa.id,
            owner_user_id=owner.id,
            invited_email="dos@giproy.test",
            actor_user_id=owner.id,
        )

    assert exc.value.code == "conecta_slots_exhausted"


def test_release_slot_respects_30_day_lock_and_superadmin_force(db, sample_empresa):
    _create_license_assignment(db, sample_empresa.id, conecta_base_slots=1)
    owner = _create_user(db, sample_empresa.id, "owner-lock@giproy.test")
    superadmin = _create_user(db, sample_empresa.id, "superadmin-lock@giproy.test", rol="superadministrador")
    assigned_at = datetime(2026, 6, 1, tzinfo=timezone.utc)

    slot = saas_conecta_service.assign_slot(
        db,
        empresa_id=sample_empresa.id,
        owner_user_id=owner.id,
        invited_email="bloqueado@giproy.test",
        actor_user_id=owner.id,
        assigned_at=assigned_at,
    )

    with pytest.raises(ConectaPolicyError) as exc:
        saas_conecta_service.release_slot(
            db,
            slot_id=slot.id,
            empresa_id=sample_empresa.id,
            actor_user_id=owner.id,
            released_at=assigned_at + timedelta(days=10),
        )
    assert exc.value.code == "conecta_reassignment_locked"

    with pytest.raises(ConectaPolicyError) as exc:
        saas_conecta_service.release_slot(
            db,
            slot_id=slot.id,
            empresa_id=sample_empresa.id,
            actor_user_id=owner.id,
            actor_is_superadmin=False,
            force=True,
            reason="Prueba sin superadmin.",
            released_at=assigned_at + timedelta(days=10),
        )
    assert exc.value.code == "conecta_force_requires_superadmin"

    released = saas_conecta_service.release_slot(
        db,
        slot_id=slot.id,
        empresa_id=sample_empresa.id,
        actor_user_id=superadmin.id,
        actor_is_superadmin=True,
        force=True,
        reason="Correccion comercial aprobada.",
        released_at=assigned_at + timedelta(days=10),
    )
    db.commit()

    assert released.status == "released"
    assert released.forced_by_user_id == superadmin.id
    assert released.audit_reason == "Correccion comercial aprobada."


def test_conecta_assignment_audits_without_project_scope(db, sample_empresa):
    _create_license_assignment(db, sample_empresa.id, conecta_base_slots=1)
    owner = _create_user(db, sample_empresa.id, "owner-audit@giproy.test")

    slot = saas_conecta_service.assign_slot(
        db,
        empresa_id=sample_empresa.id,
        owner_user_id=owner.id,
        invited_email="auditado@giproy.test",
        actor_user_id=owner.id,
    )
    db.commit()

    persisted_slot = db.query(SaasConectaSlot).filter(SaasConectaSlot.id == slot.id).first()
    event = (
        db.query(LicenseEvent)
        .filter(
            LicenseEvent.empresa_id == sample_empresa.id,
            LicenseEvent.event_type == "saas_conecta_slot_assigned",
        )
        .one()
    )

    assert persisted_slot is not None
    assert event.payload["slot_id"] == slot.id
    assert "proyecto_id" not in event.payload
    assert "edt_id" not in event.payload
    assert "presupuesto_id" not in event.payload
