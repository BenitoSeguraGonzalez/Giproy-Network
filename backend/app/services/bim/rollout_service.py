from datetime import datetime, timezone

from fastapi import HTTPException

from app.models.bim_rollout import BimRolloutPlan


REQUIRED_CHECKS = {
    "gate_a", "gate_b", "gate_c", "security", "performance",
    "observability", "support", "rollback",
}


def _serialize(plan):
    checks = plan.checklist_json or {}
    ready = REQUIRED_CHECKS.issubset(checks) and all(checks.get(key) is True for key in REQUIRED_CHECKS)
    ready = ready and plan.rollback_rehearsed_at is not None
    return {
        "id": plan.id, "company_id": plan.empresa_id, "stage": plan.stage,
        "status": plan.status, "checklist": checks, "support_owner": plan.support_owner,
        "exit_criteria": plan.exit_criteria, "rollback_procedure": plan.rollback_procedure,
        "rollback_rehearsed_at": plan.rollback_rehearsed_at,
        "rollback_rehearsed_by": plan.rollback_rehearsed_by,
        "updated_by": plan.updated_by, "ready_for_activation": ready,
    }


def get_rollout_plan(db, *, company_id):
    plan = db.query(BimRolloutPlan).filter(BimRolloutPlan.empresa_id == company_id).first()
    return _serialize(plan) if plan else None


def save_rollout_plan(db, *, company_id, user_id, payload):
    plan = db.query(BimRolloutPlan).filter(BimRolloutPlan.empresa_id == company_id).first()
    if not plan:
        plan = BimRolloutPlan(empresa_id=company_id)
        db.add(plan)
    values = payload.model_dump()
    plan.stage = values["stage"]
    plan.status = values["status"]
    plan.checklist_json = values["checklist"]
    plan.support_owner = values["support_owner"]
    plan.exit_criteria = values["exit_criteria"]
    plan.rollback_procedure = values["rollback_procedure"]
    plan.updated_by = user_id
    db.commit()
    db.refresh(plan)
    return _serialize(plan)


def rehearse_rollout_rollback(db, *, company_id, user_id):
    plan = db.query(BimRolloutPlan).filter(BimRolloutPlan.empresa_id == company_id).first()
    if not plan:
        raise HTTPException(status_code=404, detail="Plan de rollout BIM no encontrado.")
    plan.rollback_rehearsed_at = datetime.now(timezone.utc)
    plan.rollback_rehearsed_by = user_id
    checklist = dict(plan.checklist_json or {})
    checklist["rollback"] = True
    plan.checklist_json = checklist
    db.commit()
    db.refresh(plan)
    return _serialize(plan)
