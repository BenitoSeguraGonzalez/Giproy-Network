from __future__ import annotations

from datetime import datetime, timezone
from decimal import Decimal
from typing import Any

from sqlalchemy.orm import Session

from app.models.project_functional_modification import ProjectFunctionalModification


FUNCTIONAL_MODIFICATION_STATUS_ACTIVE = "active"
FUNCTIONAL_MODIFICATION_STATUS_SUPERSEDED = "superseded"


def _utc_now() -> datetime:
    return datetime.now(timezone.utc)


def _normalize_json_object(value: Any) -> dict[str, Any]:
    return value if isinstance(value, dict) else {}


def _normalize_json_list(value: Any) -> list[Any]:
    return value if isinstance(value, list) else []


def _append_audit(row: ProjectFunctionalModification, event: dict[str, Any]) -> None:
    audit_log = row.audit_log if isinstance(row.audit_log, list) else []
    audit_log.append(event)
    row.audit_log = audit_log


def _normalize_numeric_id(value: Any) -> int | None:
    try:
        normalized = int(value)
    except (TypeError, ValueError):
        return None
    return normalized if normalized > 0 else None


def _extract_line_payload_map(snapshot: dict[str, Any]) -> dict[str, Any]:
    preview_snapshot = _normalize_json_object(snapshot.get("preview_snapshot"))
    line_payload_map = preview_snapshot.get("line_payload_map")
    if not isinstance(line_payload_map, dict):
        return {}
    return {
        str(key): value
        for key, value in line_payload_map.items()
        if _normalize_numeric_id(key) is not None and isinstance(value, dict)
    }


def _extract_functional_summary(
    patch: dict[str, Any],
    snapshot: dict[str, Any],
) -> dict[str, Any]:
    intentions = _normalize_json_list(patch.get("intentions"))
    line_payload_map = _extract_line_payload_map(snapshot)
    affected_line_ids: set[int] = set()
    affected_apu_ids: set[int] = set()
    affected_apu_line_ids: set[int] = set()
    resource_intention_count = 0
    schedule_intention_count = 0
    affected_resource_ids: set[int] = set()
    operational_snapshots: list[dict[str, Any]] = []
    price_previews: list[dict[str, Any]] = []

    for line_id in line_payload_map:
        normalized_line_id = _normalize_numeric_id(line_id)
        if normalized_line_id is not None:
            affected_line_ids.add(normalized_line_id)

    for intention in intentions:
        if not isinstance(intention, dict):
            continue
        normalized_line_id = _normalize_numeric_id(
            intention.get("linea_presupuesto_id") or intention.get("line_id")
        )
        if normalized_line_id is not None:
            affected_line_ids.add(normalized_line_id)
        for raw_line_id in _normalize_json_list(intention.get("affected_line_ids")):
            normalized_affected = _normalize_numeric_id(raw_line_id)
            if normalized_affected is not None:
                affected_line_ids.add(normalized_affected)
        normalized_apu_id = _normalize_numeric_id(intention.get("apu_id"))
        if normalized_apu_id is not None:
            affected_apu_ids.add(normalized_apu_id)
        operational_snapshot = _normalize_json_object(intention.get("operational_snapshot"))
        if operational_snapshot:
            resources = _normalize_json_list(operational_snapshot.get("resources"))
            for resource in resources:
                if not isinstance(resource, dict):
                    continue
                normalized_resource_id = _normalize_numeric_id(resource.get("recurso_id"))
                if normalized_resource_id is not None:
                    affected_resource_ids.add(normalized_resource_id)
            operational_snapshots.append(
                {
                    "linea_presupuesto_id": normalized_line_id,
                    "apu_id": normalized_apu_id,
                    "status": operational_snapshot.get("status"),
                    "has_nested": bool(operational_snapshot.get("has_nested")),
                    "resource_count": len(
                        [resource for resource in resources if isinstance(resource, dict)]
                    ),
                    "resources": [
                        {
                            "recurso_id": _normalize_numeric_id(resource.get("recurso_id")),
                            "codigo": resource.get("codigo"),
                            "descripcion": resource.get("descripcion"),
                            "categoria_id": _normalize_numeric_id(resource.get("categoria_id")),
                            "unidad": resource.get("unidad"),
                            "precio_unitario": resource.get("precio_unitario"),
                            "cantidad": resource.get("cantidad"),
                            "rendimiento_equivalente": resource.get("rendimiento_equivalente"),
                            "trabajo_relativo": resource.get("trabajo_relativo"),
                            "work_policy": resource.get("work_policy"),
                            "origin": resource.get("origin"),
                            "source_lines": resource.get("source_lines")
                            if isinstance(resource.get("source_lines"), list)
                            else [],
                        }
                        for resource in resources
                        if isinstance(resource, dict)
                    ],
                }
            )
        price_preview = _normalize_json_object(intention.get("price_preview"))
        if price_preview:
            price_previews.append(
                {
                    "linea_presupuesto_id": normalized_line_id,
                    "apu_id": normalized_apu_id,
                    "currency": price_preview.get("currency"),
                    "money_decimals": price_preview.get("money_decimals"),
                    "direct_unit_price": price_preview.get("direct_unit_price"),
                    "indirect_unit_price": price_preview.get("indirect_unit_price"),
                    "total_unit_price": price_preview.get("total_unit_price"),
                    "budget_quantity": price_preview.get("budget_quantity"),
                    "budget_line_total_before": price_preview.get("budget_line_total_before"),
                    "budget_line_total_after": price_preview.get("budget_line_total_after"),
                    "price_delta": price_preview.get("price_delta"),
                    "indirect_percent": price_preview.get("indirect_percent"),
                    "visible_temporal_price": price_preview.get("visible_temporal_price"),
                }
            )
        intention_type = str(intention.get("type") or "").strip()
        if intention_type == "resource_editor":
            resource_intention_count += 1
        else:
            schedule_intention_count += 1

    operational_apu_application = _normalize_json_object(
        patch.get("operational_apu_application")
    )
    for raw_apu_id in _normalize_json_list(
        operational_apu_application.get("updated_apu_ids")
    ):
        normalized_apu_id = _normalize_numeric_id(raw_apu_id)
        if normalized_apu_id is not None:
            affected_apu_ids.add(normalized_apu_id)
    for raw_apu_line_id in _normalize_json_list(
        operational_apu_application.get("updated_line_ids")
    ):
        normalized_apu_line_id = _normalize_numeric_id(raw_apu_line_id)
        if normalized_apu_line_id is not None:
            affected_apu_line_ids.add(normalized_apu_line_id)

    return {
        "affected_line_ids": sorted(affected_line_ids),
        "affected_apu_ids": sorted(affected_apu_ids),
        "affected_apu_line_ids": sorted(affected_apu_line_ids),
        "affected_resource_ids": sorted(affected_resource_ids),
        "line_payload_map": line_payload_map,
        "line_payload_count": len(line_payload_map),
        "intention_count": len(intentions),
        "resource_intention_count": resource_intention_count,
        "schedule_intention_count": schedule_intention_count,
        "operational_snapshots": operational_snapshots,
        "operational_apu_application": operational_apu_application,
        "price_previews": price_previews,
    }


class ProjectFunctionalModificationService:
    def get_active(
        self,
        db: Session,
        *,
        empresa_id: int,
        proyecto_id: int,
        presupuesto_id: int,
        base_trabajo_id: int | None,
        revision: int,
    ) -> ProjectFunctionalModification | None:
        query = db.query(ProjectFunctionalModification).filter(
            ProjectFunctionalModification.empresa_id == int(empresa_id),
            ProjectFunctionalModification.proyecto_id == int(proyecto_id),
            ProjectFunctionalModification.presupuesto_id == int(presupuesto_id),
            ProjectFunctionalModification.revision == int(revision or 0),
            ProjectFunctionalModification.active.is_(True),
            ProjectFunctionalModification.status == FUNCTIONAL_MODIFICATION_STATUS_ACTIVE,
        )
        if base_trabajo_id is None:
            query = query.filter(ProjectFunctionalModification.base_trabajo_id.is_(None))
        else:
            query = query.filter(ProjectFunctionalModification.base_trabajo_id == int(base_trabajo_id))
        return query.order_by(ProjectFunctionalModification.id.desc()).first()

    def create_active(
        self,
        db: Session,
        *,
        empresa_id: int,
        proyecto_id: int,
        presupuesto_id: int,
        base_trabajo_id: int | None,
        revision: int,
        source: str,
        source_ref: dict[str, Any] | None = None,
        patch: dict[str, Any] | None = None,
        snapshot: dict[str, Any] | None = None,
        user_id: int | None = None,
        now: datetime | None = None,
    ) -> ProjectFunctionalModification:
        event_time = now or _utc_now()
        existing = self.get_active(
            db,
            empresa_id=empresa_id,
            proyecto_id=proyecto_id,
            presupuesto_id=presupuesto_id,
            base_trabajo_id=base_trabajo_id,
            revision=revision,
        )
        if existing:
            existing.active = False
            existing.status = FUNCTIONAL_MODIFICATION_STATUS_SUPERSEDED
            existing.superseded_by_id = user_id
            existing.superseded_at = event_time
            existing.superseded_reason = "new_active_functional_modification"
            _append_audit(
                existing,
                {
                    "event": "functional_modification_superseded",
                    "at": event_time.isoformat(),
                    "user_id": user_id,
                },
            )

        row = ProjectFunctionalModification(
            empresa_id=int(empresa_id),
            proyecto_id=int(proyecto_id),
            presupuesto_id=int(presupuesto_id),
            base_trabajo_id=int(base_trabajo_id) if base_trabajo_id is not None else None,
            revision=int(revision or 0),
            status=FUNCTIONAL_MODIFICATION_STATUS_ACTIVE,
            active=True,
            source=str(source or "manual").strip()[:30] or "manual",
            source_ref=_normalize_json_object(source_ref),
            patch=_normalize_json_object(patch),
            snapshot=_normalize_json_object(snapshot),
            audit_log=[
                {
                    "event": "functional_modification_created",
                    "at": event_time.isoformat(),
                    "user_id": user_id,
                    "source": str(source or "manual").strip()[:30] or "manual",
                }
            ],
            created_by_id=user_id,
            applied_at=event_time,
        )
        db.add(row)
        db.flush()
        return row

    def resolve_official_source(
        self,
        db: Session,
        *,
        empresa_id: int,
        proyecto_id: int,
        presupuesto_id: int,
        base_trabajo_id: int | None,
        revision: int,
        base_snapshot: dict[str, Any] | None = None,
    ) -> dict[str, Any]:
        active = self.get_active(
            db,
            empresa_id=empresa_id,
            proyecto_id=proyecto_id,
            presupuesto_id=presupuesto_id,
            base_trabajo_id=base_trabajo_id,
            revision=revision,
        )
        if active:
            patch = _normalize_json_object(active.patch)
            snapshot = _normalize_json_object(active.snapshot)
            return {
                "source": "modificacion_activa",
                "status": active.status,
                "active": True,
                "active_modification_id": active.id,
                "empresa_id": active.empresa_id,
                "proyecto_id": active.proyecto_id,
                "presupuesto_id": active.presupuesto_id,
                "base_trabajo_id": active.base_trabajo_id,
                "revision": active.revision,
                "origin": active.source,
                "source_ref": _normalize_json_object(active.source_ref),
                "patch": patch,
                "snapshot": snapshot,
                "summary": _extract_functional_summary(patch, snapshot),
            }

        return {
            "source": "base_proyecto",
            "status": "base",
            "active": False,
            "active_modification_id": None,
            "empresa_id": int(empresa_id),
            "proyecto_id": int(proyecto_id),
            "presupuesto_id": int(presupuesto_id),
            "base_trabajo_id": int(base_trabajo_id) if base_trabajo_id is not None else None,
            "revision": int(revision or 0),
            "origin": "base_project",
            "source_ref": {},
            "patch": {},
            "snapshot": _normalize_json_object(base_snapshot),
            "summary": {
                "affected_line_ids": [],
                "affected_apu_ids": [],
                "affected_apu_line_ids": [],
                "affected_resource_ids": [],
                "line_payload_map": {},
                "line_payload_count": 0,
                "intention_count": 0,
                "resource_intention_count": 0,
                "schedule_intention_count": 0,
                "operational_snapshots": [],
                "operational_apu_application": {},
                "price_previews": [],
            },
        }

    def resolve_project_apu_price_overrides(
        self,
        db: Session,
        *,
        empresa_id: int,
        proyecto_id: int | None,
        base_trabajo_id: int | None,
        revision: int | None,
    ) -> tuple[dict[int, Decimal], dict[str, Any]]:
        if not proyecto_id:
            return {}, {}

        from app.models.presupuesto import Presupuesto
        from app.models.proyecto import Proyecto

        proyecto = db.query(Proyecto).filter(
            Proyecto.id == int(proyecto_id),
            Proyecto.empresa_id == int(empresa_id),
        ).first()
        if not proyecto:
            return {}, {}

        effective_base_id = base_trabajo_id or proyecto.base_trabajo_id
        effective_revision = revision if revision is not None else proyecto.revision
        presupuesto = (
            db.query(Presupuesto)
            .filter(
                Presupuesto.proyecto_id == proyecto.id,
                Presupuesto.empresa_id == int(empresa_id),
                Presupuesto.revision == int(effective_revision or 0),
            )
            .order_by(Presupuesto.id.desc())
            .first()
        )
        if not presupuesto:
            return {}, {}

        official_source = self.resolve_official_source(
            db,
            empresa_id=int(empresa_id),
            proyecto_id=proyecto.id,
            presupuesto_id=presupuesto.id,
            base_trabajo_id=effective_base_id,
            revision=int(effective_revision or 0),
        )
        summary = official_source.get("summary") if isinstance(official_source, dict) else {}
        price_previews = summary.get("price_previews") if isinstance(summary, dict) else []
        overrides: dict[int, Decimal] = {}
        if isinstance(price_previews, list):
            for preview in price_previews:
                if not isinstance(preview, dict):
                    continue
                try:
                    apu_id = int(preview.get("apu_id") or 0)
                    unit_price = Decimal(str(preview.get("total_unit_price")))
                except Exception:
                    continue
                if apu_id > 0 and unit_price >= 0:
                    overrides[apu_id] = unit_price
        return overrides, official_source


project_functional_modification_service = ProjectFunctionalModificationService()
