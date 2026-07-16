from app.models.usuario import Usuario
from app.schemas.bim_rollout import BimRolloutPlanRequest
from app.services.bim.rollout_service import (
    get_rollout_plan,
    rehearse_rollout_rollback,
    save_rollout_plan,
)


def _payload(checklist):
    return BimRolloutPlanRequest(
        stage="pilot",
        status="ready",
        checklist=checklist,
        support_owner="BIM operations",
        exit_criteria="Pilot exits only after every mandatory gate remains green.",
        rollback_procedure="Disable the BIM allowlist and preserve Classic routing unchanged.",
    )


def _user(db, company_id):
    user = Usuario(
        email="rollout@example.com",
        hashed_password="x",
        nombre_completo="BIM Rollout Owner",
        empresa_id=company_id,
        rol="superadministrador",
    )
    db.add(user)
    db.commit()
    return user


def test_bim_rollout_requires_all_gates_and_a_rehearsed_rollback(db, sample_empresa):
    sample_user = _user(db, sample_empresa.id)
    checks = {
        "gate_a": True,
        "gate_b": True,
        "gate_c": True,
        "security": True,
        "performance": True,
        "observability": True,
        "support": True,
        "rollback": False,
    }
    saved = save_rollout_plan(
        db,
        company_id=sample_empresa.id,
        user_id=sample_user.id,
        payload=_payload(checks),
    )
    assert saved["ready_for_activation"] is False

    rehearsed = rehearse_rollout_rollback(
        db,
        company_id=sample_empresa.id,
        user_id=sample_user.id,
    )
    assert rehearsed["checklist"]["rollback"] is True
    assert rehearsed["rollback_rehearsed_by"] == sample_user.id
    assert rehearsed["ready_for_activation"] is True


def test_bim_rollout_is_company_scoped(db, sample_empresa):
    sample_user = _user(db, sample_empresa.id)
    save_rollout_plan(
        db,
        company_id=sample_empresa.id,
        user_id=sample_user.id,
        payload=_payload({}),
    )
    assert get_rollout_plan(db, company_id=sample_empresa.id) is not None
    assert get_rollout_plan(db, company_id=sample_empresa.id + 999) is None
