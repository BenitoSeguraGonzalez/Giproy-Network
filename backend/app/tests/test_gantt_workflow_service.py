from datetime import datetime, timedelta, timezone
from types import SimpleNamespace

import pytest

from app.models.cronograma_gantt_control import CronogramaGanttDraft, CronogramaGanttEditLock
from app.services.gantt_workflow import GanttWorkflowError, gantt_workflow_service


def _cronograma_stub() -> SimpleNamespace:
    return SimpleNamespace(
        id=77,
        empresa_id=3,
        proyecto_id=7,
        presupuesto_id=13,
    )


def test_get_or_create_active_draft_keeps_single_pending_draft(db):
    cronograma = _cronograma_stub()
    first = gantt_workflow_service.get_or_create_active_draft(
        db,
        cronograma=cronograma,
        user_id=10,
        base_snapshot={"source": "base_funcional_activa"},
        now=datetime(2026, 6, 26, tzinfo=timezone.utc),
    )
    second = gantt_workflow_service.get_or_create_active_draft(
        db,
        cronograma=cronograma,
        user_id=11,
        base_snapshot={"source": "otra"},
        now=datetime(2026, 6, 26, 1, tzinfo=timezone.utc),
    )

    assert first.id == second.id
    assert second.base_snapshot == {"source": "base_funcional_activa", "work_origin": "gantt"}
    assert db.query(CronogramaGanttDraft).count() == 1


def test_get_or_create_active_draft_persists_and_enforces_work_origin(db):
    cronograma = _cronograma_stub()
    draft = gantt_workflow_service.get_or_create_active_draft(
        db,
        cronograma=cronograma,
        user_id=10,
        base_snapshot={"source": "base_funcional_activa"},
        work_origin="valorados",
        now=datetime(2026, 6, 26, tzinfo=timezone.utc),
    )

    assert draft.base_snapshot["source"] == "base_funcional_activa"
    assert draft.base_snapshot["work_origin"] == "valorados"
    assert draft.audit_log[0]["work_origin"] == "valorados"

    with pytest.raises(GanttWorkflowError) as exc:
        gantt_workflow_service.get_or_create_active_draft(
            db,
            cronograma=cronograma,
            user_id=11,
            work_origin="gantt",
            now=datetime(2026, 6, 26, 1, tzinfo=timezone.utc),
        )

    assert exc.value.code == "cronograma_work_origin_conflict"


def test_save_editor_intention_uses_version_and_persists_only_draft_layer(db):
    draft = gantt_workflow_service.get_or_create_active_draft(
        db,
        cronograma=_cronograma_stub(),
        user_id=10,
        now=datetime(2026, 6, 26, tzinfo=timezone.utc),
    )

    gantt_workflow_service.save_editor_intention(
        db,
        draft=draft,
        intention={
            "type": "cambiar_cantidad_apu_con_anidados",
            "linea_presupuesto_id": 69,
            "apu_id": 794,
            "cantidad_objetivo": "16.5800",
            "trabajo_permanece_fijo": True,
        },
        user_id=10,
        expected_version=1,
        preview_snapshot={"linea": 69, "precio_operativo_preview": "100.65"},
        now=datetime(2026, 6, 26, 2, tzinfo=timezone.utc),
    )

    assert draft.version == 2
    assert draft.intentions[0]["status"] == "pending"
    assert draft.intentions[0]["apu_id"] == 794
    assert draft.preview_snapshot["precio_operativo_preview"] == "100.65"

    with pytest.raises(GanttWorkflowError) as exc:
        gantt_workflow_service.save_editor_intention(
            db,
            draft=draft,
            intention={"type": "cambiar_cantidad_recurso"},
            user_id=10,
            expected_version=1,
        )

    assert exc.value.code == "gantt_draft_version_conflict"


def test_save_editor_intention_rejects_mixed_work_origin(db):
    draft = gantt_workflow_service.get_or_create_active_draft(
        db,
        cronograma=_cronograma_stub(),
        user_id=10,
        work_origin="gantt",
        now=datetime(2026, 6, 26, tzinfo=timezone.utc),
    )

    with pytest.raises(GanttWorkflowError) as exc:
        gantt_workflow_service.save_editor_intention(
            db,
            draft=draft,
            intention={"type": "valorado_simple", "linea_presupuesto_id": 69, "work_origin": "valorados"},
            user_id=10,
            expected_version=1,
        )

    assert exc.value.code == "cronograma_work_origin_conflict"
    assert draft.intentions == []


def test_invalidate_related_intentions_only_marks_matching_scope(db):
    draft = gantt_workflow_service.get_or_create_active_draft(
        db,
        cronograma=_cronograma_stub(),
        user_id=10,
        now=datetime(2026, 6, 26, tzinfo=timezone.utc),
    )
    draft.intentions = [
        {"type": "cambiar_cantidad", "linea_presupuesto_id": 69, "apu_id": 794, "status": "pending"},
        {"type": "cambiar_cantidad", "linea_presupuesto_id": 70, "apu_id": 800, "status": "pending"},
    ]
    db.flush()

    gantt_workflow_service.invalidate_related_intentions(
        db,
        draft=draft,
        affected_scope={"apu_id": 794},
        reason="presupuesto_modificado",
        user_id=22,
        now=datetime(2026, 6, 26, 3, tzinfo=timezone.utc),
    )

    assert draft.intentions[0]["status"] == "invalidated"
    assert draft.intentions[0]["invalidated_reason"] == "presupuesto_modificado"
    assert draft.intentions[1]["status"] == "pending"
    assert len(draft.invalidations) == 1


def test_invalidate_related_intentions_matches_affected_line_ids(db):
    draft = gantt_workflow_service.get_or_create_active_draft(
        db,
        cronograma=_cronograma_stub(),
        user_id=10,
        now=datetime(2026, 6, 26, tzinfo=timezone.utc),
    )
    draft.intentions = [
        {
            "type": "resource_editor",
            "linea_presupuesto_id": 69,
            "affected_line_ids": [69, 71],
            "status": "pending",
        },
        {
            "type": "resource_editor",
            "linea_presupuesto_id": 70,
            "affected_line_ids": [70],
            "status": "pending",
        },
    ]
    db.flush()

    gantt_workflow_service.invalidate_related_intentions(
        db,
        draft=draft,
        affected_scope={"linea_presupuesto_id": 71},
        reason="presupuesto_linea_actualizada",
        user_id=22,
        now=datetime(2026, 6, 26, 3, 30, tzinfo=timezone.utc),
    )

    assert draft.intentions[0]["status"] == "invalidated"
    assert draft.intentions[1]["status"] == "pending"


def test_apply_preflight_blocks_invalidated_draft_until_resolved(db):
    draft = gantt_workflow_service.get_or_create_active_draft(
        db,
        cronograma=_cronograma_stub(),
        user_id=10,
        now=datetime(2026, 6, 26, tzinfo=timezone.utc),
    )
    draft.intentions = [
        {"type": "cambiar_cantidad", "linea_presupuesto_id": 69, "status": "pending"},
        {"type": "cambiar_rendimiento", "linea_presupuesto_id": 70, "status": "invalidated"},
    ]
    db.flush()

    preflight = gantt_workflow_service.build_apply_preflight(draft)

    assert preflight["ok"] is False
    assert preflight["work_origin"] == "gantt"
    assert preflight["pending_count"] == 1
    assert preflight["invalidated_count"] == 1
    assert preflight["issues"][0]["code"] == "gantt_draft_has_invalidated_intentions"

    with pytest.raises(GanttWorkflowError) as exc:
        gantt_workflow_service.mark_draft_applied(
            db,
            draft=draft,
            user_id=10,
            expected_version=1,
        )

    assert exc.value.code == "gantt_draft_has_invalidated_intentions"
    assert draft.status == "draft"


def test_cancel_active_drafts_for_project_cancels_pending_work_with_audit(db):
    draft = gantt_workflow_service.get_or_create_active_draft(
        db,
        cronograma=_cronograma_stub(),
        user_id=10,
        now=datetime(2026, 6, 26, tzinfo=timezone.utc),
    )
    draft.intentions = [
        {"type": "resource_editor", "linea_presupuesto_id": 69, "status": "pending"},
    ]
    db.flush()

    cancelled_count = gantt_workflow_service.cancel_active_drafts_for_project(
        db,
        proyecto_id=7,
        empresa_id=3,
        reason="project_state_changed:Planificación->En Ejecución",
        user_id=22,
        now=datetime(2026, 6, 27, tzinfo=timezone.utc),
    )

    assert cancelled_count == 1
    assert draft.status == "cancelled"
    assert draft.cancelled_by_id == 22
    assert draft.cancellation_reason == "project_state_changed:Planificación->En Ejecución"
    assert draft.intentions[0]["status"] == "cancelled"
    assert draft.audit_log[-1]["event"] == "draft_cancelled_by_project_state_change"


def test_discard_invalidated_intentions_keeps_compatible_pending_preview(db):
    draft = gantt_workflow_service.get_or_create_active_draft(
        db,
        cronograma=_cronograma_stub(),
        user_id=10,
        now=datetime(2026, 6, 26, tzinfo=timezone.utc),
    )
    draft.intentions = [
        {"type": "resource_editor", "linea_presupuesto_id": 69, "affected_line_ids": [69, 71], "status": "invalidated"},
        {"type": "resource_editor", "linea_presupuesto_id": 70, "affected_line_ids": [70], "status": "pending"},
    ]
    draft.preview_snapshot = {
        "line_payload_map": {
            "69": {"duration": 1},
            "70": {"duration": 2},
            "71": {"duration": 3},
        }
    }
    db.flush()

    updated = gantt_workflow_service.discard_invalidated_intentions(
        db,
        draft=draft,
        user_id=10,
        expected_version=1,
        now=datetime(2026, 6, 26, 4, tzinfo=timezone.utc),
    )

    assert updated.version == 2
    assert len(updated.intentions) == 1
    assert updated.intentions[0]["linea_presupuesto_id"] == 70
    assert set(updated.preview_snapshot["line_payload_map"].keys()) == {"70"}
    assert updated.audit_log[-1]["event"] == "invalidated_intentions_discarded"


def test_prepare_invalidated_intentions_for_adjustment_removes_stale_derived_preview(db):
    draft = gantt_workflow_service.get_or_create_active_draft(
        db,
        cronograma=_cronograma_stub(),
        user_id=10,
        now=datetime(2026, 6, 26, tzinfo=timezone.utc),
    )
    draft.intentions = [
        {
            "type": "resource_editor",
            "linea_presupuesto_id": 69,
            "affected_line_ids": [69, 71],
            "status": "invalidated",
            "resource_drafts": {"h:concretera": {"cantidad": 0.62}},
            "operational_snapshot": {"precio_total": 100.65, "trabajo": 0.372},
        },
        {"type": "resource_editor", "linea_presupuesto_id": 70, "affected_line_ids": [70], "status": "pending"},
    ]
    draft.preview_snapshot = {
        "line_payload_map": {
            "69": {"duration": 1},
            "70": {"duration": 2},
            "71": {"duration": 3},
        }
    }
    db.flush()

    updated = gantt_workflow_service.prepare_invalidated_intentions_for_adjustment(
        db,
        draft=draft,
        user_id=10,
        expected_version=1,
        now=datetime(2026, 6, 26, 4, 30, tzinfo=timezone.utc),
    )

    assert updated.version == 2
    assert updated.intentions[0]["status"] == "adjustment_required"
    assert updated.intentions[0]["requires_editor_reaccept"] is True
    assert "operational_snapshot" not in updated.intentions[0]
    assert updated.intentions[0]["resource_drafts"] == {"h:concretera": {"cantidad": 0.62}}
    assert set(updated.preview_snapshot["line_payload_map"].keys()) == {"70"}
    assert updated.audit_log[-1]["event"] == "invalidated_intentions_prepared_for_adjustment"

    preflight = gantt_workflow_service.build_apply_preflight(updated)
    assert preflight["ok"] is False
    assert preflight["pending_count"] == 1
    assert preflight["adjustment_required_count"] == 1
    assert preflight["issues"][0]["code"] == "gantt_draft_has_adjustment_required_intentions"


def test_save_editor_intention_replaces_adjustment_required_for_same_line_only(db):
    draft = gantt_workflow_service.get_or_create_active_draft(
        db,
        cronograma=_cronograma_stub(),
        user_id=10,
        now=datetime(2026, 6, 26, tzinfo=timezone.utc),
    )
    draft.intentions = [
        {"type": "resource_editor", "linea_presupuesto_id": 69, "affected_line_ids": [69], "status": "adjustment_required"},
        {"type": "resource_editor", "linea_presupuesto_id": 70, "affected_line_ids": [70], "status": "pending"},
    ]
    draft.preview_snapshot = {"line_payload_map": {"70": {"duration": 2}}}
    db.flush()

    updated = gantt_workflow_service.save_editor_intention(
        db,
        draft=draft,
        intention={"type": "resource_editor", "linea_presupuesto_id": 69, "affected_line_ids": [69]},
        user_id=10,
        expected_version=1,
        preview_snapshot={"line_payload_map": {"69": {"duration": 4}, "70": {"duration": 2}}},
        now=datetime(2026, 6, 26, 4, 45, tzinfo=timezone.utc),
    )

    assert updated.version == 2
    assert [intention["linea_presupuesto_id"] for intention in updated.intentions] == [70, 69]
    assert [intention["status"] for intention in updated.intentions] == ["pending", "pending"]
    assert updated.audit_log[-1]["replaced_stale_intentions"] == 1


def test_mark_draft_applied_closes_active_draft_after_global_confirmation(db):
    draft = gantt_workflow_service.get_or_create_active_draft(
        db,
        cronograma=_cronograma_stub(),
        user_id=10,
        now=datetime(2026, 6, 26, tzinfo=timezone.utc),
    )
    draft.intentions = [
        {"type": "resource_editor", "linea_presupuesto_id": 69, "status": "pending"},
    ]
    db.flush()

    applied = gantt_workflow_service.mark_draft_applied(
        db,
        draft=draft,
        user_id=10,
        expected_version=1,
        application_result={"persisted_line_ids": [69], "source": "gantt_approval", "work_origin": "gantt"},
        now=datetime(2026, 6, 26, 5, tzinfo=timezone.utc),
    )

    assert applied.status == "applied"
    assert applied.version == 2
    assert applied.intentions[0]["status"] == "applied"
    assert applied.applied_by_id == 10
    assert applied.audit_log[-1]["application_result"]["persisted_line_ids"] == [69]
    assert gantt_workflow_service.get_active_draft(db, cronograma_id=_cronograma_stub().id) is None


def test_mark_draft_applied_requires_global_application_signature(db):
    draft = gantt_workflow_service.get_or_create_active_draft(
        db,
        cronograma=_cronograma_stub(),
        user_id=10,
        now=datetime(2026, 6, 26, tzinfo=timezone.utc),
    )
    draft.intentions = [
        {"type": "resource_editor", "linea_presupuesto_id": 69, "status": "pending"},
    ]
    db.flush()

    with pytest.raises(GanttWorkflowError) as exc:
        gantt_workflow_service.mark_draft_applied(
            db,
            draft=draft,
            user_id=10,
            expected_version=1,
            now=datetime(2026, 6, 26, 5, tzinfo=timezone.utc),
        )

    assert exc.value.code == "gantt_draft_apply_missing_application_result"
    assert draft.status == "draft"


def test_mark_draft_applied_requires_work_origin_with_global_signature(db):
    draft = gantt_workflow_service.get_or_create_active_draft(
        db,
        cronograma=_cronograma_stub(),
        user_id=10,
        now=datetime(2026, 6, 26, tzinfo=timezone.utc),
    )
    draft.intentions = [
        {"type": "resource_editor", "linea_presupuesto_id": 69, "status": "pending"},
    ]
    db.flush()

    with pytest.raises(GanttWorkflowError) as exc:
        gantt_workflow_service.mark_draft_applied(
            db,
            draft=draft,
            user_id=10,
            expected_version=1,
            application_result={"persisted_line_ids": [69]},
            now=datetime(2026, 6, 26, 5, tzinfo=timezone.utc),
        )

    assert exc.value.code == "gantt_draft_apply_missing_work_origin"
    assert draft.status == "draft"


def test_mark_draft_applied_rejects_mismatched_application_origin(db):
    draft = gantt_workflow_service.get_or_create_active_draft(
        db,
        cronograma=_cronograma_stub(),
        user_id=10,
        work_origin="gantt",
        now=datetime(2026, 6, 26, tzinfo=timezone.utc),
    )
    draft.intentions = [
        {"type": "resource_editor", "linea_presupuesto_id": 69, "status": "pending", "work_origin": "gantt"},
    ]
    db.flush()

    with pytest.raises(GanttWorkflowError) as exc:
        gantt_workflow_service.mark_draft_applied(
            db,
            draft=draft,
            user_id=10,
            expected_version=1,
            application_result={"persisted_line_ids": [69], "work_origin": "valorados"},
            now=datetime(2026, 6, 26, 5, tzinfo=timezone.utc),
        )

    assert exc.value.code == "cronograma_work_origin_conflict"
    assert draft.status == "draft"


def test_edit_lock_allows_readers_but_blocks_second_editor_until_expired(db):
    cronograma = _cronograma_stub()
    now = datetime(2026, 6, 26, 4, tzinfo=timezone.utc)
    lock = gantt_workflow_service.acquire_edit_lock(
        db,
        cronograma=cronograma,
        user_id=10,
        user_name="Usuario A",
        ttl_minutes=15,
        now=now,
    )

    assert lock.status == "active"
    assert lock.locked_by_user_id == 10

    with pytest.raises(GanttWorkflowError) as exc:
        gantt_workflow_service.acquire_edit_lock(
            db,
            cronograma=cronograma,
            user_id=11,
            user_name="Usuario B",
            ttl_minutes=15,
            now=now + timedelta(minutes=1),
        )

    assert exc.value.code == "gantt_edit_lock_taken"
    assert "Usuario A" in exc.value.message

    reclaimed = gantt_workflow_service.acquire_edit_lock(
        db,
        cronograma=cronograma,
        user_id=11,
        user_name="Usuario B",
        ttl_minutes=15,
        now=now + timedelta(minutes=16),
    )

    assert reclaimed.id == lock.id
    assert reclaimed.status == "active"
    assert reclaimed.locked_by_user_id == 11
    assert db.query(CronogramaGanttEditLock).count() == 1


def test_edit_lock_release_request_is_audited_without_transferring_work_lock(db):
    cronograma = _cronograma_stub()
    now = datetime(2026, 6, 26, 4, tzinfo=timezone.utc)
    lock = gantt_workflow_service.acquire_edit_lock(
        db,
        cronograma=cronograma,
        user_id=10,
        user_name="Usuario A",
        ttl_minutes=15,
        now=now,
    )

    requested = gantt_workflow_service.request_edit_lock_release(
        db,
        lock=lock,
        user_id=11,
        user_name="Usuario B",
        message="Necesito revisar rendimientos",
        now=now + timedelta(minutes=2),
    )

    assert requested.locked_by_user_id == 10
    assert requested.requested_release_by_user_id == 11
    assert requested.requested_release_by_name == "Usuario B"
    assert requested.request_message == "Necesito revisar rendimientos"
    assert requested.audit_log[-1]["event"] == "lock_release_requested"

    released = gantt_workflow_service.release_edit_lock(
        db,
        lock=lock,
        user_id=10,
        now=now + timedelta(minutes=3),
    )

    assert released.status == "released"
    assert released.requested_release_by_user_id is None
    assert released.requested_release_by_name is None
    assert released.request_message is None
    assert released.audit_log[-1]["requested_by_user_id"] == 11
