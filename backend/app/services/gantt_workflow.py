from __future__ import annotations

from datetime import datetime, timedelta, timezone
from typing import Any

from sqlalchemy.orm import Session

from app.models.cronograma_gantt_control import CronogramaGanttDraft, CronogramaGanttEditLock


GANTT_DRAFT_STATUS_DRAFT = "draft"
GANTT_DRAFT_STATUS_PENDING = "pending"
GANTT_DRAFT_STATUS_APPLIED = "applied"
GANTT_DRAFT_STATUS_CANCELLED = "cancelled"
GANTT_DRAFT_STATUS_INVALIDATED = "invalidated"
GANTT_DRAFT_STATUS_ADJUSTMENT_REQUIRED = "adjustment_required"

GANTT_LOCK_STATUS_ACTIVE = "active"
GANTT_LOCK_STATUS_RELEASED = "released"
GANTT_LOCK_STATUS_EXPIRED = "expired"

WORK_ORIGIN_GANTT = "gantt"
WORK_ORIGIN_VALORADOS = "valorados"
VALID_WORK_ORIGINS = {WORK_ORIGIN_GANTT, WORK_ORIGIN_VALORADOS}


class GanttWorkflowError(ValueError):
    def __init__(self, code: str, message: str):
        super().__init__(message)
        self.code = code
        self.message = message


def _utc_now() -> datetime:
    return datetime.now(timezone.utc)


def _as_aware_utc(value: datetime | None) -> datetime | None:
    if value is None:
        return None
    if value.tzinfo is None:
        return value.replace(tzinfo=timezone.utc)
    return value.astimezone(timezone.utc)


def _normalize_list(value: Any) -> list[dict[str, Any]]:
    if not isinstance(value, list):
        return []
    return [item for item in value if isinstance(item, dict)]


def _append_audit(row: Any, event: dict[str, Any]) -> None:
    audit_log = _normalize_list(getattr(row, "audit_log", None))
    audit_log.append(event)
    row.audit_log = audit_log


def _same_int(value: Any, expected: Any) -> bool:
    try:
        return int(value) == int(expected)
    except Exception:
        return False


def _count_intentions_by_status(intentions: list[dict[str, Any]], status: str) -> int:
    return sum(1 for intention in intentions if intention.get("status") == status)


def _normalize_work_origin(value: Any) -> str:
    origin = str(value or "").strip().lower()
    if origin in VALID_WORK_ORIGINS:
        return origin
    return WORK_ORIGIN_GANTT


def _resolve_draft_work_origin(draft: CronogramaGanttDraft | None) -> str:
    if draft is None:
        return WORK_ORIGIN_GANTT
    base_snapshot = getattr(draft, "base_snapshot", None)
    if isinstance(base_snapshot, dict):
        return _normalize_work_origin(base_snapshot.get("work_origin"))
    return WORK_ORIGIN_GANTT


def _collect_intention_line_ids(intention: dict[str, Any]) -> set[str]:
    line_ids: set[str] = set()
    if not isinstance(intention, dict):
        return line_ids
    if intention.get("linea_presupuesto_id") is not None:
        line_ids.add(str(intention.get("linea_presupuesto_id")))
    if isinstance(intention.get("affected_line_ids"), list):
        line_ids.update(str(item) for item in intention.get("affected_line_ids") if item is not None)
    return line_ids


def intention_matches_affected_scope(
    intention: dict[str, Any],
    affected_scope: dict[str, Any],
) -> bool:
    if not isinstance(intention, dict) or not isinstance(affected_scope, dict):
        return False
    scope_line_id = affected_scope.get("linea_presupuesto_id")
    if scope_line_id is not None:
        intention_line_ids = set()
        if "linea_presupuesto_id" in intention:
            intention_line_ids.add(str(intention.get("linea_presupuesto_id")))
        if isinstance(intention.get("affected_line_ids"), list):
            intention_line_ids.update(str(item) for item in intention.get("affected_line_ids") if item is not None)
        if str(scope_line_id) in intention_line_ids:
            return True
    for key in (
        "apu_id",
        "recurso_id",
        "apu_hijo_id",
        "presupuesto_id",
    ):
        if key in affected_scope and _same_int(intention.get(key), affected_scope.get(key)):
            return True
    affected_resource_key = affected_scope.get("resource_identity_key")
    if affected_resource_key and intention.get("resource_identity_key") == affected_resource_key:
        return True
    return False


class GanttWorkflowService:
    def get_active_draft(
        self,
        db: Session,
        *,
        cronograma_id: int,
    ) -> CronogramaGanttDraft | None:
        return (
            db.query(CronogramaGanttDraft)
            .filter(
                CronogramaGanttDraft.cronograma_id == cronograma_id,
                CronogramaGanttDraft.status == GANTT_DRAFT_STATUS_DRAFT,
            )
            .order_by(CronogramaGanttDraft.id.desc())
            .first()
        )

    def get_or_create_active_draft(
        self,
        db: Session,
        *,
        cronograma: Any,
        user_id: int | None,
        base_snapshot: dict[str, Any] | None = None,
        work_origin: str = WORK_ORIGIN_GANTT,
        now: datetime | None = None,
    ) -> CronogramaGanttDraft:
        normalized_origin = _normalize_work_origin(work_origin)
        draft = self.get_active_draft(db, cronograma_id=int(cronograma.id))
        if draft:
            existing_origin = _resolve_draft_work_origin(draft)
            if existing_origin != normalized_origin:
                raise GanttWorkflowError(
                    "cronograma_work_origin_conflict",
                    (
                        "Ya existe trabajo no aprobado para este cronograma con otro origen. "
                        "Debe aplicarlo, descartarlo o convertirlo antes de continuar."
                    ),
                )
            return draft
        event_time = _as_aware_utc(now) or _utc_now()
        resolved_base_snapshot = dict(base_snapshot or {})
        resolved_base_snapshot["work_origin"] = normalized_origin
        draft = CronogramaGanttDraft(
            empresa_id=cronograma.empresa_id,
            proyecto_id=cronograma.proyecto_id,
            presupuesto_id=cronograma.presupuesto_id,
            cronograma_id=cronograma.id,
            status=GANTT_DRAFT_STATUS_DRAFT,
            version=1,
            base_snapshot=resolved_base_snapshot,
            intentions=[],
            preview_snapshot={},
            invalidations=[],
            audit_log=[
                {
                    "event": "draft_created",
                    "at": event_time.isoformat(),
                    "user_id": user_id,
                    "work_origin": normalized_origin,
                }
            ],
            created_by_id=user_id,
            updated_by_id=user_id,
        )
        db.add(draft)
        db.flush()
        return draft

    def save_editor_intention(
        self,
        db: Session,
        *,
        draft: CronogramaGanttDraft,
        intention: dict[str, Any],
        user_id: int | None,
        expected_version: int | None = None,
        preview_snapshot: dict[str, Any] | None = None,
        now: datetime | None = None,
    ) -> CronogramaGanttDraft:
        if draft.status != GANTT_DRAFT_STATUS_DRAFT:
            raise GanttWorkflowError(
                "gantt_draft_not_editable",
                "El borrador Gantt no esta en estado editable.",
            )
        if expected_version is not None and int(expected_version) != int(draft.version or 0):
            raise GanttWorkflowError(
                "gantt_draft_version_conflict",
                "El borrador Gantt fue actualizado por otra operacion.",
            )
        draft_origin = _resolve_draft_work_origin(draft)
        intention_origin = _normalize_work_origin(intention.get("work_origin") or draft_origin)
        if intention_origin != draft_origin:
            raise GanttWorkflowError(
                "cronograma_work_origin_conflict",
                (
                    "La intencion pertenece a otro origen de trabajo. "
                    "No se pueden mezclar Gantt y Cronograma Valorado en el mismo trabajo no aprobado."
                ),
            )
        event_time = _as_aware_utc(now) or _utc_now()
        intentions = _normalize_list(draft.intentions)
        incoming_line_ids = _collect_intention_line_ids(intention)
        replaced_statuses = {GANTT_DRAFT_STATUS_INVALIDATED, GANTT_DRAFT_STATUS_ADJUSTMENT_REQUIRED}
        replaced_count = 0
        if incoming_line_ids:
            filtered_intentions = []
            for existing_intention in intentions:
                existing_status = existing_intention.get("status")
                existing_line_ids = _collect_intention_line_ids(existing_intention)
                should_replace = (
                    existing_status in replaced_statuses
                    and bool(existing_line_ids & incoming_line_ids)
                )
                if should_replace:
                    replaced_count += 1
                    continue
                filtered_intentions.append(existing_intention)
            intentions = filtered_intentions
        intentions.append(
            {
                **intention,
                "work_origin": draft_origin,
                "status": GANTT_DRAFT_STATUS_PENDING,
                "created_by_id": user_id,
                "created_at": event_time.isoformat(),
            }
        )
        draft.intentions = intentions
        if preview_snapshot is not None:
            draft.preview_snapshot = preview_snapshot
        draft.version = int(draft.version or 0) + 1
        draft.updated_by_id = user_id
        _append_audit(
            draft,
            {
                "event": "intention_saved",
                "at": event_time.isoformat(),
                "user_id": user_id,
                "intention_type": intention.get("type"),
                "work_origin": draft_origin,
                "replaced_stale_intentions": replaced_count,
            },
        )
        db.flush()
        return draft

    def invalidate_related_intentions(
        self,
        db: Session,
        *,
        draft: CronogramaGanttDraft,
        affected_scope: dict[str, Any],
        reason: str,
        user_id: int | None,
        now: datetime | None = None,
    ) -> CronogramaGanttDraft:
        event_time = _as_aware_utc(now) or _utc_now()
        intentions = _normalize_list(draft.intentions)
        invalidations = _normalize_list(draft.invalidations)
        changed = False
        for intention in intentions:
            if intention.get("status") == "invalidated":
                continue
            if not intention_matches_affected_scope(intention, affected_scope):
                continue
            intention["status"] = "invalidated"
            intention["invalidated_at"] = event_time.isoformat()
            intention["invalidated_reason"] = reason
            invalidations.append(
                {
                    "at": event_time.isoformat(),
                    "reason": reason,
                    "affected_scope": affected_scope,
                    "intention": intention,
                }
            )
            changed = True
        if not changed:
            return draft
        draft.intentions = intentions
        draft.invalidations = invalidations
        draft.version = int(draft.version or 0) + 1
        draft.updated_by_id = user_id
        _append_audit(
            draft,
            {
                "event": "intentions_invalidated",
                "at": event_time.isoformat(),
                "user_id": user_id,
                "reason": reason,
                "affected_scope": affected_scope,
            },
        )
        db.flush()
        return draft

    def build_apply_preflight(self, draft: CronogramaGanttDraft | None) -> dict[str, Any]:
        if draft is None:
            return {
                "ok": True,
                "status": "none",
                "version": 0,
                "pending_count": 0,
                "invalidated_count": 0,
                "adjustment_required_count": 0,
                "work_origin": WORK_ORIGIN_GANTT,
                "issues": [],
            }
        intentions = _normalize_list(draft.intentions)
        invalidated_count = _count_intentions_by_status(intentions, GANTT_DRAFT_STATUS_INVALIDATED)
        adjustment_required_count = _count_intentions_by_status(
            intentions,
            GANTT_DRAFT_STATUS_ADJUSTMENT_REQUIRED,
        )
        pending_count = _count_intentions_by_status(intentions, GANTT_DRAFT_STATUS_PENDING)
        issues = []
        if draft.status != GANTT_DRAFT_STATUS_DRAFT:
            issues.append(
                {
                    "code": "gantt_draft_not_editable",
                    "message": "El borrador Gantt ya no esta en estado editable.",
                }
            )
        if invalidated_count > 0:
            issues.append(
                {
                    "code": "gantt_draft_has_invalidated_intentions",
                    "message": (
                        "El borrador Gantt contiene lineas invalidadas por cambios oficiales. "
                        "Debe descartarlas o ajustarlas antes de aplicar globalmente."
                    ),
                    "count": invalidated_count,
                }
            )
        if adjustment_required_count > 0:
            issues.append(
                {
                    "code": "gantt_draft_has_adjustment_required_intentions",
                    "message": (
                        "El borrador Gantt contiene intenciones pendientes de reajuste. "
                        "Debe reabrirlas y aceptar el editor light desde la base vigente antes de aplicar globalmente."
                    ),
                    "count": adjustment_required_count,
                }
            )
        return {
            "ok": not issues,
            "status": draft.status,
            "version": int(draft.version or 0),
            "pending_count": pending_count,
            "invalidated_count": invalidated_count,
            "adjustment_required_count": adjustment_required_count,
            "work_origin": _resolve_draft_work_origin(draft),
            "issues": issues,
        }

    def mark_draft_applied(
        self,
        db: Session,
        *,
        draft: CronogramaGanttDraft,
        user_id: int | None,
        expected_version: int | None = None,
        application_result: dict[str, Any] | None = None,
        now: datetime | None = None,
    ) -> CronogramaGanttDraft:
        if draft.status != GANTT_DRAFT_STATUS_DRAFT:
            raise GanttWorkflowError(
                "gantt_draft_not_editable",
                "El borrador Gantt no esta en estado editable.",
            )
        if expected_version is not None and int(expected_version) != int(draft.version or 0):
            raise GanttWorkflowError(
                "gantt_draft_version_conflict",
                "El borrador Gantt fue actualizado por otra operacion.",
            )
        preflight = self.build_apply_preflight(draft)
        if not preflight["ok"]:
            first_issue = preflight["issues"][0]
            raise GanttWorkflowError(first_issue["code"], first_issue["message"])
        application_result = application_result if isinstance(application_result, dict) else {}
        result_origin = application_result.get("work_origin")
        if result_origin is not None and _normalize_work_origin(result_origin) != preflight["work_origin"]:
            raise GanttWorkflowError(
                "cronograma_work_origin_conflict",
                "La firma de aplicacion global no coincide con el origen del trabajo no aprobado.",
            )
        persisted_line_ids = application_result.get("persisted_line_ids")
        if persisted_line_ids is None:
            persisted_line_ids = application_result.get("lineIds")
        if preflight["pending_count"] > 0 and not isinstance(persisted_line_ids, list):
            raise GanttWorkflowError(
                "gantt_draft_apply_missing_application_result",
                (
                    "El borrador Gantt no puede marcarse como aplicado sin una "
                    "firma de persistencia global del cronograma."
                ),
            )
        if preflight["pending_count"] > 0 and result_origin is None:
            raise GanttWorkflowError(
                "gantt_draft_apply_missing_work_origin",
                "La aplicacion global del borrador debe declarar el origen del trabajo no aprobado.",
            )
        if isinstance(persisted_line_ids, list) and preflight["pending_count"] > 0 and len(persisted_line_ids) == 0:
            raise GanttWorkflowError(
                "gantt_draft_apply_empty_application_result",
                (
                    "El borrador Gantt no puede marcarse como aplicado porque "
                    "la aplicacion global no persistio lineas."
                ),
            )
        event_time = _as_aware_utc(now) or _utc_now()
        intentions = _normalize_list(draft.intentions)
        for intention in intentions:
            if intention.get("status") == GANTT_DRAFT_STATUS_PENDING:
                intention["status"] = GANTT_DRAFT_STATUS_APPLIED
                intention["applied_at"] = event_time.isoformat()
        draft.intentions = intentions
        draft.status = GANTT_DRAFT_STATUS_APPLIED
        draft.version = int(draft.version or 0) + 1
        draft.updated_by_id = user_id
        draft.applied_by_id = user_id
        draft.applied_at = event_time
        _append_audit(
            draft,
            {
                "event": "draft_applied",
                "at": event_time.isoformat(),
                "user_id": user_id,
                "pending_count": preflight["pending_count"],
                "work_origin": preflight["work_origin"],
                "application_result": application_result,
            },
        )
        db.flush()
        return draft

    def cancel_active_drafts_for_project(
        self,
        db: Session,
        *,
        proyecto_id: int,
        empresa_id: int,
        reason: str,
        user_id: int | None = None,
        now: datetime | None = None,
    ) -> int:
        event_time = _as_aware_utc(now) or _utc_now()
        drafts = (
            db.query(CronogramaGanttDraft)
            .filter(
                CronogramaGanttDraft.proyecto_id == int(proyecto_id),
                CronogramaGanttDraft.empresa_id == int(empresa_id),
                CronogramaGanttDraft.status == GANTT_DRAFT_STATUS_DRAFT,
            )
            .all()
        )
        for draft in drafts:
            intentions = _normalize_list(draft.intentions)
            for intention in intentions:
                if intention.get("status") in {
                    GANTT_DRAFT_STATUS_PENDING,
                    GANTT_DRAFT_STATUS_INVALIDATED,
                    GANTT_DRAFT_STATUS_ADJUSTMENT_REQUIRED,
                }:
                    intention["status"] = GANTT_DRAFT_STATUS_CANCELLED
                    intention["cancelled_at"] = event_time.isoformat()
                    intention["cancelled_reason"] = reason
            draft.intentions = intentions
            draft.status = GANTT_DRAFT_STATUS_CANCELLED
            draft.cancelled_by_id = user_id
            draft.cancelled_at = event_time
            draft.cancellation_reason = reason
            draft.updated_by_id = user_id
            draft.version = int(draft.version or 0) + 1
            _append_audit(
                draft,
                {
                    "event": "draft_cancelled_by_project_state_change",
                    "at": event_time.isoformat(),
                    "user_id": user_id,
                    "reason": reason,
                },
            )
        if drafts:
            db.flush()
        return len(drafts)

    def discard_invalidated_intentions(
        self,
        db: Session,
        *,
        draft: CronogramaGanttDraft,
        user_id: int | None,
        expected_version: int | None = None,
        now: datetime | None = None,
    ) -> CronogramaGanttDraft:
        if draft.status != GANTT_DRAFT_STATUS_DRAFT:
            raise GanttWorkflowError(
                "gantt_draft_not_editable",
                "El borrador Gantt no esta en estado editable.",
            )
        if expected_version is not None and int(expected_version) != int(draft.version or 0):
            raise GanttWorkflowError(
                "gantt_draft_version_conflict",
                "El borrador Gantt fue actualizado por otra operacion.",
            )
        intentions = _normalize_list(draft.intentions)
        invalidated_intentions = [
            intention for intention in intentions if intention.get("status") == GANTT_DRAFT_STATUS_INVALIDATED
        ]
        if not invalidated_intentions:
            return draft
        event_time = _as_aware_utc(now) or _utc_now()
        discarded_line_ids: set[str] = set()
        for intention in invalidated_intentions:
            discarded_line_ids.update(_collect_intention_line_ids(intention))
        draft.intentions = [
            intention for intention in intentions if intention.get("status") != GANTT_DRAFT_STATUS_INVALIDATED
        ]
        preview_snapshot = dict(draft.preview_snapshot or {})
        line_payload_map = preview_snapshot.get("line_payload_map")
        if isinstance(line_payload_map, dict) and discarded_line_ids:
            preview_snapshot["line_payload_map"] = {
                str(line_id): payload
                for line_id, payload in line_payload_map.items()
                if str(line_id) not in discarded_line_ids
            }
            draft.preview_snapshot = preview_snapshot
        draft.version = int(draft.version or 0) + 1
        draft.updated_by_id = user_id
        _append_audit(
            draft,
            {
                "event": "invalidated_intentions_discarded",
                "at": event_time.isoformat(),
                "user_id": user_id,
                "discarded_count": len(invalidated_intentions),
                "discarded_line_ids": sorted(discarded_line_ids),
            },
        )
        db.flush()
        return draft

    def prepare_invalidated_intentions_for_adjustment(
        self,
        db: Session,
        *,
        draft: CronogramaGanttDraft,
        user_id: int | None,
        expected_version: int | None = None,
        now: datetime | None = None,
    ) -> CronogramaGanttDraft:
        if draft.status != GANTT_DRAFT_STATUS_DRAFT:
            raise GanttWorkflowError(
                "gantt_draft_not_editable",
                "El borrador Gantt no esta en estado editable.",
            )
        if expected_version is not None and int(expected_version) != int(draft.version or 0):
            raise GanttWorkflowError(
                "gantt_draft_version_conflict",
                "El borrador Gantt fue actualizado por otra operacion.",
            )
        intentions = _normalize_list(draft.intentions)
        invalidated_intentions = [
            intention for intention in intentions if intention.get("status") == GANTT_DRAFT_STATUS_INVALIDATED
        ]
        if not invalidated_intentions:
            return draft

        event_time = _as_aware_utc(now) or _utc_now()
        adjusted_line_ids: set[str] = set()
        cleaned_intentions: list[dict[str, Any]] = []
        derived_keys = {
            "operational_snapshot",
            "preview_snapshot",
            "derived_snapshot",
            "line_payload_map",
            "price_preview",
            "duration_preview",
            "work_preview",
        }
        for intention in intentions:
            if intention.get("status") != GANTT_DRAFT_STATUS_INVALIDATED:
                cleaned_intentions.append(intention)
                continue
            adjusted_line_ids.update(_collect_intention_line_ids(intention))
            adjusted_intention = {
                key: value
                for key, value in intention.items()
                if key not in derived_keys
            }
            adjusted_intention["status"] = GANTT_DRAFT_STATUS_ADJUSTMENT_REQUIRED
            adjusted_intention["requires_editor_reaccept"] = True
            adjusted_intention["adjustment_prepared_at"] = event_time.isoformat()
            adjusted_intention["adjustment_prepared_by_id"] = user_id
            cleaned_intentions.append(adjusted_intention)

        preview_snapshot = dict(draft.preview_snapshot or {})
        line_payload_map = preview_snapshot.get("line_payload_map")
        if isinstance(line_payload_map, dict) and adjusted_line_ids:
            preview_snapshot["line_payload_map"] = {
                str(line_id): payload
                for line_id, payload in line_payload_map.items()
                if str(line_id) not in adjusted_line_ids
            }
            draft.preview_snapshot = preview_snapshot

        draft.intentions = cleaned_intentions
        draft.version = int(draft.version or 0) + 1
        draft.updated_by_id = user_id
        _append_audit(
            draft,
            {
                "event": "invalidated_intentions_prepared_for_adjustment",
                "at": event_time.isoformat(),
                "user_id": user_id,
                "count": len(invalidated_intentions),
                "line_ids": sorted(adjusted_line_ids),
            },
        )
        db.flush()
        return draft

    def acquire_edit_lock(
        self,
        db: Session,
        *,
        cronograma: Any,
        user_id: int | None,
        user_name: str | None,
        ttl_minutes: int = 15,
        now: datetime | None = None,
    ) -> CronogramaGanttEditLock:
        event_time = _as_aware_utc(now) or _utc_now()
        expires_at = event_time + timedelta(minutes=max(int(ttl_minutes or 15), 1))
        lock = (
            db.query(CronogramaGanttEditLock)
            .filter(CronogramaGanttEditLock.cronograma_id == int(cronograma.id))
            .first()
        )
        if lock:
            lock_expires_at = _as_aware_utc(lock.expires_at)
            is_expired = bool(lock_expires_at and lock_expires_at <= event_time)
            owned_by_current_user = _same_int(lock.locked_by_user_id, user_id)
            if (
                lock.status == GANTT_LOCK_STATUS_ACTIVE
                and not is_expired
                and not owned_by_current_user
            ):
                raise GanttWorkflowError(
                    "gantt_edit_lock_taken",
                    f"Gantt esta siendo usado por {lock.locked_by_name or 'otro usuario'}.",
                )
            if is_expired and not owned_by_current_user:
                lock.status = GANTT_LOCK_STATUS_EXPIRED
                _append_audit(
                    lock,
                    {
                        "event": "lock_expired",
                        "at": event_time.isoformat(),
                        "previous_user_id": lock.locked_by_user_id,
                        "previous_user_name": lock.locked_by_name,
                    },
                )
            lock.status = GANTT_LOCK_STATUS_ACTIVE
            lock.locked_by_user_id = user_id
            lock.locked_by_name = user_name
            lock.requested_release_by_user_id = None
            lock.requested_release_by_name = None
            lock.request_message = None
            lock.last_heartbeat_at = event_time
            lock.expires_at = expires_at
            lock.released_at = None
            _append_audit(
                lock,
                {
                    "event": "lock_acquired",
                    "at": event_time.isoformat(),
                    "user_id": user_id,
                    "user_name": user_name,
                },
            )
            db.flush()
            return lock

        lock = CronogramaGanttEditLock(
            empresa_id=cronograma.empresa_id,
            proyecto_id=cronograma.proyecto_id,
            presupuesto_id=cronograma.presupuesto_id,
            cronograma_id=cronograma.id,
            status=GANTT_LOCK_STATUS_ACTIVE,
            locked_by_user_id=user_id,
            locked_by_name=user_name,
            last_heartbeat_at=event_time,
            expires_at=expires_at,
            audit_log=[
                {
                    "event": "lock_acquired",
                    "at": event_time.isoformat(),
                    "user_id": user_id,
                    "user_name": user_name,
                }
            ],
        )
        db.add(lock)
        db.flush()
        return lock

    def request_edit_lock_release(
        self,
        db: Session,
        *,
        lock: CronogramaGanttEditLock,
        user_id: int | None,
        user_name: str | None,
        message: str | None = None,
        now: datetime | None = None,
    ) -> CronogramaGanttEditLock:
        event_time = _as_aware_utc(now) or _utc_now()
        lock_expires_at = _as_aware_utc(lock.expires_at)
        if lock.status != GANTT_LOCK_STATUS_ACTIVE or (lock_expires_at and lock_expires_at <= event_time):
            raise GanttWorkflowError(
                "gantt_edit_lock_not_active",
                "El Gantt ya no tiene un bloqueo activo.",
            )
        if _same_int(lock.locked_by_user_id, user_id):
            raise GanttWorkflowError(
                "gantt_edit_lock_owned_by_requester",
                "Ya tienes el bloqueo de edicion de este Gantt.",
            )
        request_message = (message or "").strip()[:500] or None
        lock.requested_release_by_user_id = user_id
        lock.requested_release_by_name = user_name
        lock.request_message = request_message
        _append_audit(
            lock,
            {
                "event": "lock_release_requested",
                "at": event_time.isoformat(),
                "user_id": user_id,
                "user_name": user_name,
                "message": request_message,
                "locked_by_user_id": lock.locked_by_user_id,
                "locked_by_name": lock.locked_by_name,
            },
        )
        db.flush()
        return lock

    def heartbeat_edit_lock(
        self,
        db: Session,
        *,
        lock: CronogramaGanttEditLock,
        user_id: int | None,
        ttl_minutes: int = 15,
        now: datetime | None = None,
    ) -> CronogramaGanttEditLock:
        if lock.status != GANTT_LOCK_STATUS_ACTIVE or not _same_int(lock.locked_by_user_id, user_id):
            raise GanttWorkflowError(
                "gantt_edit_lock_not_owned",
                "El lock Gantt no pertenece al usuario actual.",
            )
        event_time = _as_aware_utc(now) or _utc_now()
        lock.last_heartbeat_at = event_time
        lock.expires_at = event_time + timedelta(minutes=max(int(ttl_minutes or 15), 1))
        db.flush()
        return lock

    def release_edit_lock(
        self,
        db: Session,
        *,
        lock: CronogramaGanttEditLock,
        user_id: int | None,
        now: datetime | None = None,
    ) -> CronogramaGanttEditLock:
        if lock.status == GANTT_LOCK_STATUS_ACTIVE and not _same_int(lock.locked_by_user_id, user_id):
            raise GanttWorkflowError(
                "gantt_edit_lock_not_owned",
                "El lock Gantt activo no pertenece al usuario actual.",
            )
        event_time = _as_aware_utc(now) or _utc_now()
        lock.status = GANTT_LOCK_STATUS_RELEASED
        lock.released_at = event_time
        release_requested_by_user_id = lock.requested_release_by_user_id
        release_requested_by_name = lock.requested_release_by_name
        lock.requested_release_by_user_id = None
        lock.requested_release_by_name = None
        lock.request_message = None
        _append_audit(
            lock,
            {
                "event": "lock_released",
                "at": event_time.isoformat(),
                "user_id": user_id,
                "requested_by_user_id": release_requested_by_user_id,
                "requested_by_name": release_requested_by_name,
            },
        )
        db.flush()
        return lock


gantt_workflow_service = GanttWorkflowService()
