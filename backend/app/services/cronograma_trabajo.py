from __future__ import annotations

from datetime import date, datetime, timedelta
from decimal import Decimal
from io import BytesIO
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple
from contextvars import ContextVar
import hashlib
import os
import re
import shutil
import subprocess
import tempfile
import time
import xml.etree.ElementTree as ET
from functools import lru_cache

from fastapi.encoders import jsonable_encoder
from sqlalchemy.orm import Session, joinedload

from app.models.apu import APU, APULinea
from app.models.cronograma_trabajo import CronogramaTrabajo
from app.models.edt import EdtNode
from app.models.presupuesto import Presupuesto, PresupuestoDetalle
from app.repositories.presupuesto import presupuesto_repo
from app.models.proyecto import Proyecto
from app.models.proyecto_detalle import ProyectoDetalle
from app.models.recurso import Recurso
from app.repositories.cronograma_trabajo import cronograma_trabajo_repo
from app.schemas.cronograma_trabajo import (
    CronogramaTrabajoComputedRow,
    CronogramaTrabajoConfig,
    CronogramaTrabajoDependency,
    CronogramaTrabajoDeltaResponse,
    CronogramaTrabajoExportCapabilities,
    CronogramaTrabajoLinea,
    CronogramaTrabajoResponse,
    CronogramaTrabajoSummary,
    CronogramaTrabajoUpdate,
)
from app.services.cronograma_cpm import ActividadCpm, CriticalPathEngine, DependenciaCpm
from app.services.apu_explosion import (
    build_operational_resource_key,
    collect_apu_exploded_resources,
    resolve_resource_category_id,
    resolve_resource_price,
    resolve_resource_unit_label,
)
from app.services.functional_source import resolve_active_apu_resource_modification
from app.services.project_functional_modification import project_functional_modification_service
from app.services.project_calendar import project_calendar_service
from app.services.presupuesto import refresh_presupuesto_prices


DEFAULT_CONFIG = {
    "hora_inicio_jornada": 8.0,
    "jornada_laboral_horas": 8.0,
    "dias_laborables_semana": 5,
    "dias_laborables_mes": 22.0,
    "dias_mes": 30.0,
    "recursos_asumidos_base": 1.0,
    "fecha_inicio_proyecto": None,
    "fecha_fin_objetivo_proyecto": None,
    "apu_resource_modifications_v1": {},
    "advanced_calendar": {
        "enabled": False,
        "mode": "simple",
        "weekly_pattern": [],
        "date_exceptions": [],
        "holidays": [],
        "metadata": {},
    },
}

CALENDAR_LOOKAHEAD_DAYS = 3650
MAX_WORKDAY_AUTO_SEGMENTS = 750
RESERVED_CONFIG_KEY = "__config__"
_LINE_OVERRIDE_CACHE: ContextVar[Optional[dict[int, "CronogramaTrabajoLinea"]]] = ContextVar(
    "cronograma_trabajo_line_override_cache",
    default=None,
)
_WORKDAY_CALC_CACHE: ContextVar[Optional[dict[str, dict[Any, Any]]]] = ContextVar(
    "cronograma_trabajo_workday_calc_cache",
    default=None,
)
GANTT_AUTO_SUBBAR_SOURCES = {"gantt_workday_auto_segment"}
GANTT_RENEWABLE_SUBBAR_SOURCES = {
    "factory_reset_seed",
    "initial_creation_seed",
    "gantt_schedule_period_seed",
    "gantt_initial_segments",
    "valuado_initial_segment",
}
APU_OPERATIONAL_RESOURCES_METADATA_KEY = "apu_operational_resources_v1"
APU_RESOURCE_MODIFICATIONS_CONFIG_KEY = "apu_resource_modifications_v1"
MS_PROJECT_TEMPLATE_NAME = "Cronograma de trabajo.mpp"
ASPOSE_TASKS_LICENSE_ENV = "ASPOSE_TASKS_LICENSE_PATH"
ASPOSE_TASKS_JAVA_JAR_ENV = "ASPOSE_TASKS_JAVA_JAR_PATH"
ASPOSE_TASKS_MPP_TEMPLATE_ENV = "ASPOSE_TASKS_MPP_TEMPLATE_PATH"
ASPOSE_TASKS_JAVA_BIN_ENV = "ASPOSE_TASKS_JAVA_BIN"
ASPOSE_TASKS_MPP_TIMEOUT_ENV = "ASPOSE_TASKS_MPP_TIMEOUT_SECONDS"
ASPOSE_TASKS_JAVAC_BIN_ENV = "ASPOSE_TASKS_JAVAC_BIN"
ASPOSE_TASKS_MPP_CACHE_TTL_ENV = "ASPOSE_TASKS_MPP_CACHE_TTL_SECONDS"
GANTT_SESSION_STATUSES = {
    "draft_session",
    "accepted_session",
    "confirmed_against_budget",
}


def _as_decimal(value, default: str = "0") -> Decimal:
    try:
        if value is None:
            return Decimal(default)
        return Decimal(str(value))
    except Exception:
        return Decimal(default)


def _to_float(value, default: float = 0.0) -> float:
    try:
        if value is None:
            return default
        return float(value)
    except Exception:
        return default


def _round_hour_parts(value: float) -> tuple[int, int]:
    normalized = max(0.0, min(float(value or 0.0), 23.99))
    hour = int(normalized)
    minute = int(round((normalized - hour) * 60))
    if minute >= 60:
        hour = min(hour + 1, 23)
        minute = 0
    return hour, minute


class CronogramaTrabajoService:
    CATEGORY_LABELS = {
        1: "equipos_herramientas",
        2: "materiales",
        3: "transporte",
        4: "mano_obra",
        5: "apu_hijo",
    }
    SHIFT_FACTORS = {
        "diurno": Decimal("1"),
        "vespertino": Decimal("1"),
        "nocturno": Decimal("1"),
        "doble": Decimal("2"),
        "triple": Decimal("3"),
    }
    EQUIPMENT_OWNERSHIP_KINDS = {"owned", "rented"}
    GOVERNING_RESOURCE_PRIORITIES = {
        "equipo_maquinaria": 1,
        "mano_obra_especializada": 2,
        "mano_obra_semiespecializada": 3,
        "mano_obra_no_especializada": 4,
        "herramientas": 5,
        "materiales": 99,
        "transporte": 99,
    }
    GOVERNING_RESOURCE_LABELS = {
        "equipo_maquinaria": "Equipo / Maquinaria",
        "mano_obra_especializada": "Mano de obra especializada",
        "mano_obra_semiespecializada": "Mano de obra semiespecializada",
        "mano_obra_no_especializada": "Mano de obra no especializada",
        "herramientas": "Herramientas",
        "materiales": "Materiales",
        "transporte": "Transporte",
    }
    CPM_ENGINE = CriticalPathEngine()

    def _rollback_failed_session(self, db: Session) -> None:
        try:
            db.rollback()
        except Exception:
            return

    def _normalize_datetime_value(
        self, value: Optional[datetime]
    ) -> Optional[datetime]:
        if value is None:
            return None
        if isinstance(value, str):
            try:
                value = datetime.fromisoformat(value.replace("Z", "+00:00"))
            except Exception:
                return None
        if isinstance(value, date) and not isinstance(value, datetime):
            value = datetime.combine(value, datetime.min.time())
        if not isinstance(value, datetime):
            return None
        if getattr(value, "tzinfo", None) is not None:
            return value.replace(tzinfo=None, microsecond=0)
        return value.replace(microsecond=0)

    def _normalize_equipment_ownership_kind(self, value: Optional[str]) -> str:
        normalized = str(value or "").strip().lower()
        return normalized if normalized in self.EQUIPMENT_OWNERSHIP_KINDS else ""

    def _normalize_gantt_session_status(
        self, value: Optional[str], default: str = "draft_session"
    ) -> str:
        normalized = str(value or default).strip().lower()
        return normalized if normalized in GANTT_SESSION_STATUSES else default

    def _normalize_gantt_subbar(
        self,
        *,
        budget_line_id: str,
        raw_value: Any,
        index: int,
        prioritize_parent_initial: bool = True,
    ) -> Optional[dict]:
        if not isinstance(raw_value, dict):
            return None
        period_id = (
            str(
                raw_value.get("period_id")
                or raw_value.get("periodId")
                or raw_value.get("parent_period_id")
                or raw_value.get("parentPeriodId")
                or ""
            ).strip()
            or None
        )
        parent_period_id = (
            str(
                raw_value.get("parent_period_id")
                or raw_value.get("parentPeriodId")
                or ""
            ).strip()
            or None
        )
        parent_initial_id = (
            str(
                raw_value.get("parent_initial_id")
                or raw_value.get("parentInitialId")
                or ""
            ).strip()
            or None
        )

        # TASK-1079: Priorizar parent_initial_id para tramos iniciales valorados (tramo origen)
        if prioritize_parent_initial and parent_initial_id:
            parent_key = parent_initial_id
        else:
            parent_key = parent_period_id or period_id or "unbound"

        starts_at = self._normalize_datetime_value(
            raw_value.get("starts_at")
            or raw_value.get("start_date")
            or raw_value.get("startDate")
        )
        ends_at = self._normalize_datetime_value(
            raw_value.get("ends_at")
            or raw_value.get("end_date")
            or raw_value.get("endDate")
        )
        line_token = str(budget_line_id or "unbound").strip() or "unbound"
        return {
            "id": str(
                raw_value.get("id")
                or raw_value.get("subbar_id")
                or raw_value.get("subbarId")
                or f"line-{line_token}-parent-{parent_key}-segment-{index + 1}"
            ).strip(),
            "budget_line_id": str(budget_line_id or "").strip() or None,
            "period_id": period_id,
            "parent_period_id": parent_period_id,
            "parent_initial_id": parent_initial_id or parent_period_id or period_id,
            "starts_at": starts_at.isoformat() if starts_at else None,
            "ends_at": ends_at.isoformat() if ends_at else None,
            "percent": round(max(_to_float(raw_value.get("percent"), 0.0), 0.0), 4),
            "amount": round(max(_to_float(raw_value.get("amount"), 0.0), 0.0), 4),
            "status": self._normalize_gantt_session_status(raw_value.get("status")),
            "source": str(raw_value.get("source") or "derived_period").strip().lower()
            or "derived_period",
            "metadata": dict(raw_value.get("metadata") or {}),
        }

    def _normalize_manual_temporal_window(self, raw_value: Any) -> Optional[dict]:
        if not isinstance(raw_value, dict):
            return None
        starts_at = self._normalize_datetime_value(
            raw_value.get("starts_at")
            or raw_value.get("start_date")
            or raw_value.get("startDate")
        )
        ends_at = self._normalize_datetime_value(
            raw_value.get("ends_at")
            or raw_value.get("end_date")
            or raw_value.get("endDate")
        )
        duration_days = round(
            max(_to_float(raw_value.get("duration_days"), 0.0), 0.0), 4
        )
        duration_hours = round(
            max(_to_float(raw_value.get("duration_hours"), 0.0), 0.0), 4
        )
        source = (
            str(raw_value.get("source") or "manual_temporal_material_only")
            .strip()
            .lower()
            or "manual_temporal_material_only"
        )
        if (
            starts_at is None
            and ends_at is None
            and duration_days <= 0
            and duration_hours <= 0
        ):
            return None
        return {
            "starts_at": starts_at.isoformat() if starts_at else None,
            "ends_at": ends_at.isoformat() if ends_at else None,
            "duration_days": duration_days,
            "duration_hours": duration_hours,
            "source": source,
        }

    def _normalize_operational_metadata(
        self, budget_line_id: str, metadata: Optional[dict]
    ) -> dict:
        normalized_metadata = dict(metadata or {})
        if (
            "session_state" not in normalized_metadata
            and "subbars" not in normalized_metadata
            and "manualTemporalWindow" not in normalized_metadata
            and isinstance(normalized_metadata.get("gantt_session"), dict)
            and isinstance(normalized_metadata.get("gantt_subbars"), list)
        ):
            return normalized_metadata

        raw_session = (
            normalized_metadata.get("gantt_session")
            or normalized_metadata.get("session_state")
            or {}
        )
        if isinstance(raw_session, str):
            raw_session = {"status": raw_session}
        accepted_at = self._normalize_datetime_value(
            (raw_session or {}).get("accepted_at")
        )
        confirmed_at = self._normalize_datetime_value(
            (raw_session or {}).get("confirmed_against_budget_at")
        )
        session_payload = {
            "status": self._normalize_gantt_session_status(
                (raw_session or {}).get("status")
            ),
            "created_from_session": str(
                (raw_session or {}).get("created_from_session")
                or (raw_session or {}).get("session_id")
                or ""
            ).strip()
            or None,
            "accepted_at": accepted_at.isoformat() if accepted_at else None,
            "confirmed_against_budget_at": (
                confirmed_at.isoformat() if confirmed_at else None
            ),
            "conflict_code": str((raw_session or {}).get("conflict_code") or "").strip()
            or None,
        }
        raw_subbars = (
            normalized_metadata.get("gantt_subbars")
            or normalized_metadata.get("subbars")
            or []
        )
        normalized_subbars = []
        if isinstance(raw_subbars, list):
            for index, item in enumerate(raw_subbars):
                normalized_subbar = self._normalize_gantt_subbar(
                    budget_line_id=budget_line_id,
                    raw_value=item,
                    index=index,
                    prioritize_parent_initial=True,  # TASK-1079
                )
                if normalized_subbar is not None:
                    normalized_subbars.append(normalized_subbar)
        if (
            normalized_subbars
            and not session_payload.get("created_from_session")
            and str(budget_line_id or "").strip()
        ):
            session_payload["created_from_session"] = f"line-{budget_line_id}"
        manual_temporal_window = self._normalize_manual_temporal_window(
            normalized_metadata.get("manual_temporal_window")
            or normalized_metadata.get("manualTemporalWindow")
        )
        normalized_metadata["gantt_session"] = session_payload
        normalized_metadata["gantt_subbars"] = normalized_subbars
        if manual_temporal_window is not None:
            normalized_metadata["manual_temporal_window"] = manual_temporal_window
        else:
            normalized_metadata.pop("manual_temporal_window", None)
        normalized_metadata.pop("session_state", None)
        normalized_metadata.pop("subbars", None)
        normalized_metadata.pop("manualTemporalWindow", None)
        return normalized_metadata

    def _build_gantt_operational_summary(
        self, budget_line_id: str, metadata: Optional[dict]
    ) -> dict:
        normalized_metadata = self._normalize_operational_metadata(
            budget_line_id, metadata
        )
        session_payload = dict(normalized_metadata.get("gantt_session") or {})
        subbars = list(normalized_metadata.get("gantt_subbars") or [])
        manual_temporal_window = dict(
            normalized_metadata.get("manual_temporal_window") or {}
        )
        accepted_count = sum(
            1
            for subbar in subbars
            if self._normalize_gantt_session_status(subbar.get("status"))
            in {"accepted_session", "confirmed_against_budget"}
        )
        confirmed_count = sum(
            1
            for subbar in subbars
            if self._normalize_gantt_session_status(subbar.get("status"))
            == "confirmed_against_budget"
        )
        return {
            "budget_line_id": str(budget_line_id or "").strip() or None,
            "session_status": self._normalize_gantt_session_status(
                session_payload.get("status")
            ),
            "created_from_session": session_payload.get("created_from_session"),
            "conflict_code": session_payload.get("conflict_code"),
            "has_subbars": bool(subbars),
            "subbar_count": len(subbars),
            "accepted_subbar_count": accepted_count,
            "confirmed_subbar_count": confirmed_count,
            "has_manual_temporal_window": bool(manual_temporal_window),
            "manual_temporal_source": manual_temporal_window.get("source"),
            "manual_temporal_starts_at": manual_temporal_window.get("starts_at"),
            "manual_temporal_ends_at": manual_temporal_window.get("ends_at"),
            "manual_temporal_duration_days": round(
                max(_to_float(manual_temporal_window.get("duration_days"), 0.0), 0.0), 4
            ),
            "manual_temporal_duration_hours": round(
                max(_to_float(manual_temporal_window.get("duration_hours"), 0.0), 0.0),
                4,
            ),
        }

    def _summarize_gantt_subbars_by_parent_initial(
        self, subbars: Optional[List[dict]]
    ) -> Dict[str, float]:
        summary: Dict[str, float] = {}
        for item in list(subbars or []):
            parent_initial_id = str(item.get("parent_initial_id") or "").strip()
            if not parent_initial_id:
                continue
            summary[parent_initial_id] = round(
                summary.get(parent_initial_id, 0.0)
                + round(max(_to_float(item.get("percent"), 0.0), 0.0), 4),
                4,
            )
        return summary

    def _should_refresh_authoritative_initial_subbars(
        self,
        *,
        budget_line_id: str,
        existing_subbars: Optional[List[dict]],
    ) -> bool:
        renewable_sources = {
            "gantt_schedule_period_seed",
            "gantt_initial_segments",
            "valuado_initial_segment",
        }
        if not existing_subbars:
            return True
        normalized_existing: List[dict] = []
        for index, item in enumerate(list(existing_subbars or [])):
            normalized = self._normalize_gantt_subbar(
                budget_line_id=budget_line_id,
                raw_value=item,
                index=index,
                prioritize_parent_initial=True,
            )
            if normalized is not None:
                normalized_existing.append(normalized)
        if not normalized_existing:
            return True
        return all(
            str(item.get("source") or "").strip().lower() in renewable_sources
            for item in normalized_existing
        )

    def validate_interparent_merge_subbars(
        self,
        *,
        budget_line_id: str,
        merged_subbars: Optional[List[dict]],
        expected_parent_percent_map: Dict[str, float],
        tolerance: float = 0.05,
    ) -> List[dict]:
        normalized_subbars: List[dict] = []
        for index, item in enumerate(list(merged_subbars or [])):
            normalized = self._normalize_gantt_subbar(
                budget_line_id=budget_line_id,
                raw_value=item,
                index=index,
                prioritize_parent_initial=True,
            )
            if normalized is None:
                continue
            parent_initial_id = str(normalized.get("parent_initial_id") or "").strip()
            if not parent_initial_id:
                raise ValueError(
                    "La fusión interpadre requiere que cada subbarra tenga `parent_initial_id`."
                )
            if parent_initial_id not in expected_parent_percent_map:
                raise ValueError(
                    f"La subbarra resultante referencia un tramo inicial no reconocido: {parent_initial_id}."
                )
            normalized_subbars.append(normalized)

        if not normalized_subbars:
            raise ValueError(
                "La fusión interpadre requiere subbarras válidas para persistir el borrador operativo."
            )

        actual_parent_percent_map = self._summarize_gantt_subbars_by_parent_initial(
            normalized_subbars
        )
        expected_keys = {
            str(key).strip()
            for key, value in dict(expected_parent_percent_map or {}).items()
            if str(key).strip() and round(max(_to_float(value, 0.0), 0.0), 4) > 0
        }
        actual_keys = {
            str(key).strip()
            for key, value in actual_parent_percent_map.items()
            if str(key).strip() and round(max(_to_float(value, 0.0), 0.0), 4) > 0
        }
        if actual_keys != expected_keys:
            raise ValueError(
                "La fusión interpadre dejó un conjunto de tramos iniciales inconsistente frente al cronograma valorado."
            )

        for parent_initial_id, expected_percent in dict(
            expected_parent_percent_map or {}
        ).items():
            expected_value = round(max(_to_float(expected_percent, 0.0), 0.0), 4)
            actual_value = round(
                max(_to_float(actual_parent_percent_map.get(parent_initial_id), 0.0), 0.0),
                4,
            )
            if abs(actual_value - expected_value) > tolerance:
                raise ValueError(
                    f"La fusión interpadre rompe el mandato del tramo inicial {parent_initial_id}: esperado {expected_value}% y recibido {actual_value}%."
                )

        return normalized_subbars

    def _infer_governing_resource_kind(
        self,
        *,
        category: Optional[int],
        recurso: Optional[Recurso],
        descripcion: Optional[str],
    ) -> str:
        normalized = (
            str(getattr(recurso, "governing_resource_kind", "") or "").strip().lower()
        )
        if normalized in self.GOVERNING_RESOURCE_PRIORITIES:
            return normalized
        if category == 1:
            raw_description = (
                str(descripcion or getattr(recurso, "descripcion", "") or "")
                .strip()
                .lower()
            )
            return (
                "herramientas"
                if "herramient" in raw_description
                else "equipo_maquinaria"
            )
        if category == 4:
            return "mano_obra_no_especializada"
        if category == 2:
            return "materiales"
        if category == 3:
            return "transporte"
        return ""

    def _build_governing_resource_candidate(
        self,
        *,
        linea: APULinea,
        inherited_factor: Decimal,
        order_index: int,
    ) -> Optional[Dict[str, Any]]:
        if not linea or linea.apu_hijo_id:
            return None

        category = self._resolve_line_category(linea)
        if category not in {1, 4}:
            return None

        line_quantity = _as_decimal(getattr(linea, "cantidad", None), "0")
        rendimiento = _as_decimal(getattr(linea, "rendimiento", None), "0")
        if line_quantity <= 0 or rendimiento <= 0:
            return None

        recurso = getattr(linea, "recurso", None)
        descripcion = (
            getattr(recurso, "descripcion", None)
            or getattr(linea, "descripcion", None)
            or f"Línea {getattr(linea, 'id', order_index)}"
        )
        total_work_hours = inherited_factor * rendimiento
        line_cost_total = inherited_factor * self._resolve_apu_line_cost_total(linea)
        cost_per_hour = (
            line_cost_total / total_work_hours if total_work_hours > 0 else Decimal("0")
        )
        governing_kind = self._infer_governing_resource_kind(
            category=category,
            recurso=recurso,
            descripcion=descripcion,
        )
        broad_category_label = (
            "Equipos y Herramientas"
            if category == 1
            else "Mano de Obra" if category == 4 else ""
        )
        return {
            "linea_id": getattr(linea, "id", None),
            "recurso_id": getattr(linea, "recurso_id", None)
            or getattr(recurso, "id", None),
            "nombre": descripcion,
            "categoria_id": category,
            "categoria": broad_category_label,
            "categoria_detalle": governing_kind,
            "categoria_detalle_label": self.GOVERNING_RESOURCE_LABELS.get(
                governing_kind, governing_kind or "N/D"
            ),
            "priority": self.GOVERNING_RESOURCE_PRIORITIES.get(governing_kind, 999),
            "rendimiento_horas_unidad": rendimiento,
            "cantidad_total": inherited_factor,
            "cantidad_cuadrilla": line_quantity,
            "trabajo_horas": total_work_hours,
            "costo_total": line_cost_total,
            "costo_hora": cost_per_hour,
            "order_index": order_index,
        }

    def _collect_apu_governing_resource_candidates(
        self,
        apu: Optional[APU],
        *,
        inherited_factor: Decimal = Decimal("1"),
        order_seed: int = 0,
    ) -> List[Dict[str, Any]]:
        if not apu:
            return []

        candidates: List[Dict[str, Any]] = []
        ordered_lines = sorted(
            apu.lineas or [], key=lambda item: ((item.orden or 0), item.id or 0)
        )
        for index, linea in enumerate(ordered_lines, start=1):
            next_order = order_seed + index
            if linea.apu_hijo_id and linea.apu_hijo:
                child_factor = inherited_factor * _as_decimal(
                    getattr(linea, "cantidad", None), "1"
                )
                candidates.extend(
                    self._collect_apu_governing_resource_candidates(
                        linea.apu_hijo,
                        inherited_factor=child_factor,
                        order_seed=(next_order * 1000),
                    )
                )
                continue
            candidate = self._build_governing_resource_candidate(
                linea=linea,
                inherited_factor=inherited_factor,
                order_index=next_order,
            )
            if candidate:
                candidates.append(candidate)
        return candidates

    def _select_governing_resource_candidate(
        self,
        candidates: List[Dict[str, Any]],
    ) -> Optional[Dict[str, Any]]:
        if not candidates:
            return None

        sorted_candidates = sorted(
            candidates,
            key=lambda item: (
                -_to_float(item.get("trabajo_horas"), 0.0),
                int(item.get("priority") or 999),
                -_to_float(item.get("costo_hora"), 0.0),
                int(item.get("order_index") or 0),
            ),
        )
        winner = dict(sorted_candidates[0])
        runner_up = sorted_candidates[1] if len(sorted_candidates) > 1 else None
        criterion = "1-rendimiento"
        if runner_up is not None:
            winner_work = _to_float(winner.get("trabajo_horas"), 0.0)
            runner_work = _to_float(runner_up.get("trabajo_horas"), 0.0)
            if abs(winner_work - runner_work) <= 0.0001:
                winner_priority = int(winner.get("priority") or 999)
                runner_priority = int(runner_up.get("priority") or 999)
                if winner_priority != runner_priority:
                    criterion = "2-jerarquia"
                else:
                    winner_cost = _to_float(winner.get("costo_hora"), 0.0)
                    runner_cost = _to_float(runner_up.get("costo_hora"), 0.0)
                    criterion = (
                        "3-costo"
                        if abs(winner_cost - runner_cost) > 0.0001
                        else "4-orden_estable"
                    )
        winner["criterio_aplicado"] = criterion
        winner["candidate_count"] = len(sorted_candidates)
        return winner

    def _resolve_repo_root(self) -> Path:
        return Path(__file__).resolve().parents[3]

    def _resolve_ms_project_template_path(self) -> Path:
        raw_value = os.getenv(ASPOSE_TASKS_MPP_TEMPLATE_ENV, "").strip()
        if raw_value:
            candidate = Path(raw_value)
            if not candidate.is_absolute():
                candidate = (self._resolve_repo_root() / candidate).resolve()
            return candidate
        return (
            self._resolve_repo_root()
            / "docs"
            / "adicionales"
            / "gantt"
            / MS_PROJECT_TEMPLATE_NAME
        )

    def _resolve_aspose_tasks_license_path(self) -> Optional[Path]:
        raw_value = os.getenv(ASPOSE_TASKS_LICENSE_ENV, "").strip()
        if raw_value:
            candidate = Path(raw_value)
            if not candidate.is_absolute():
                candidate = (self._resolve_repo_root() / candidate).resolve()
            return candidate
        return (
            self._resolve_repo_root()
            / "Complementos"
            / "Aspose.Tasks for Java 20.2 (25 Feb 2020) Retail + License Key"
            / "Aspose.Total.lic"
        )

    def _resolve_aspose_tasks_java_jar_path(self) -> Path:
        raw_value = os.getenv(ASPOSE_TASKS_JAVA_JAR_ENV, "").strip()
        if raw_value:
            candidate = Path(raw_value)
            if not candidate.is_absolute():
                candidate = (self._resolve_repo_root() / candidate).resolve()
            return candidate
        return (
            self._resolve_repo_root()
            / "Complementos"
            / "Aspose.Tasks for Java 20.2 (25 Feb 2020) Retail + License Key"
            / "aspose-tasks-20.2-java"
            / "lib"
            / "aspose-tasks-20.2-jdk17.jar"
        )

    def _resolve_aspose_tasks_java_runner_path(self) -> Path:
        return (
            self._resolve_repo_root()
            / "backend"
            / "scripts"
            / "aspose_tasks_mpp_runner.java"
        )

    def _resolve_java_bin(self) -> Optional[str]:
        raw_value = os.getenv(ASPOSE_TASKS_JAVA_BIN_ENV, "").strip()
        if raw_value:
            candidate = shutil.which(raw_value)
            if candidate:
                return candidate
            candidate_path = Path(raw_value)
            if candidate_path.exists():
                return str(candidate_path)
            return None
        return shutil.which("java")

    def _resolve_javac_bin(self) -> Optional[str]:
        raw_value = os.getenv(ASPOSE_TASKS_JAVAC_BIN_ENV, "").strip()
        if raw_value:
            candidate = shutil.which(raw_value)
            if candidate:
                return candidate
            candidate_path = Path(raw_value)
            if candidate_path.exists():
                return str(candidate_path)
            return None
        return shutil.which("javac")

    def _resolve_aspose_tasks_java_build_dir(self) -> Path:
        return (
            self._resolve_repo_root()
            / "backend"
            / "scripts"
            / ".compiled_aspose_tasks_runner"
        )

    def _ensure_compiled_aspose_tasks_runner(
        self, java_bin: str, jar_path: Path, runner_path: Path
    ) -> tuple[list[str], Optional[str]]:
        jar_path = Path(jar_path)
        runner_path = Path(runner_path)
        build_dir = self._resolve_aspose_tasks_java_build_dir()
        class_name = runner_path.stem
        class_path = build_dir / f"{class_name}.class"
        javac_bin = self._resolve_javac_bin()
        source_mtime = runner_path.stat().st_mtime
        class_mtime = class_path.stat().st_mtime if class_path.exists() else 0.0

        if javac_bin and (not class_path.exists() or class_mtime < source_mtime):
            build_dir.mkdir(parents=True, exist_ok=True)
            compile_command = [
                str(javac_bin),
                "-cp",
                str(jar_path),
                "-d",
                str(build_dir),
                str(runner_path),
            ]
            compile_result = subprocess.run(
                compile_command,
                cwd=str(self._resolve_repo_root()),
                capture_output=True,
                text=True,
                check=False,
                timeout=60,
            )
            if compile_result.returncode != 0 or not class_path.exists():
                details = (compile_result.stderr or compile_result.stdout or "").strip()
                raise RuntimeError(
                    "No se pudo compilar el runner Java de exportación .mpp."
                    + (f" Detalle: {details}" if details else "")
                )

        if class_path.exists():
            return (
                [
                    str(java_bin),
                    "-cp",
                    os.pathsep.join([str(build_dir), str(jar_path)]),
                    class_name,
                ],
                "compiled",
            )

        return (
            [
                str(java_bin),
                "-cp",
                str(jar_path),
                str(runner_path),
            ],
            "source",
        )

    def _resolve_mpp_timeout_seconds(self) -> int:
        raw_value = os.getenv(ASPOSE_TASKS_MPP_TIMEOUT_ENV, "").strip()
        try:
            parsed = int(raw_value) if raw_value else 180
        except Exception:
            parsed = 180
        return max(parsed, 30)

    def _resolve_mpp_cache_ttl_seconds(self) -> int:
        raw_value = os.getenv(ASPOSE_TASKS_MPP_CACHE_TTL_ENV, "").strip()
        try:
            parsed = int(raw_value) if raw_value else 21600
        except Exception:
            parsed = 21600
        return max(parsed, 0)

    def _resolve_mpp_cache_dir(self) -> Path:
        return self._resolve_repo_root() / "backend" / ".runtime_mpp_cache"

    def _build_mpp_cache_key(
        self,
        schedule: CronogramaTrabajo,
        presupuesto_id: int,
        proyecto_id: int,
        empresa_id: int,
        environment: dict,
    ) -> str:
        template_path = Path(str(environment.get("template_path") or ""))
        runner_path = Path(str(environment.get("runner_path") or ""))
        payload = "|".join(
            [
                str(empresa_id),
                str(proyecto_id),
                str(presupuesto_id),
                str(getattr(schedule, "updated_at", None) or ""),
                str(template_path),
                str(template_path.stat().st_mtime if template_path.exists() else ""),
                str(runner_path),
                str(runner_path.stat().st_mtime if runner_path.exists() else ""),
                "mpp-runtime-v2",
            ]
        )
        return hashlib.sha256(payload.encode("utf-8")).hexdigest()

    def _load_mpp_from_cache(self, cache_key: str) -> Optional[BytesIO]:
        ttl_seconds = self._resolve_mpp_cache_ttl_seconds()
        if ttl_seconds <= 0:
            return None
        cache_path = self._resolve_mpp_cache_dir() / f"{cache_key}.mpp"
        if not cache_path.exists():
            return None
        age_seconds = max((time.time() - cache_path.stat().st_mtime), 0.0)
        if age_seconds > ttl_seconds:
            try:
                cache_path.unlink()
            except FileNotFoundError:
                pass
            return None
        return BytesIO(cache_path.read_bytes())

    def _store_mpp_in_cache(self, cache_key: str, payload: bytes) -> None:
        ttl_seconds = self._resolve_mpp_cache_ttl_seconds()
        if ttl_seconds <= 0:
            return
        cache_dir = self._resolve_mpp_cache_dir()
        cache_dir.mkdir(parents=True, exist_ok=True)
        cache_path = cache_dir / f"{cache_key}.mpp"
        cache_path.write_bytes(payload)

    @lru_cache(maxsize=1)
    def _detect_ms_project_environment(self) -> dict:
        java_bin = self._resolve_java_bin()
        if not java_bin:
            return {
                "available": False,
                "reason": "No se encontró `java` en el entorno del servidor para generar archivos .mpp.",
                "project_path": None,
                "template_path": None,
                "provider": "aspose_tasks_java",
            }

        license_path = self._resolve_aspose_tasks_license_path()
        if not license_path:
            return {
                "available": False,
                "reason": f"No se configuró `{ASPOSE_TASKS_LICENSE_ENV}` para habilitar generación .mpp server-side.",
                "project_path": None,
                "template_path": None,
                "provider": "aspose_tasks_java",
            }
        if not license_path.exists():
            return {
                "available": False,
                "reason": f"La licencia Aspose.Tasks configurada no existe: {license_path}",
                "project_path": None,
                "template_path": None,
                "provider": "aspose_tasks_java",
            }

        jar_path = self._resolve_aspose_tasks_java_jar_path()
        if not jar_path.exists():
            return {
                "available": False,
                "reason": f"No se encontró el JAR de Aspose.Tasks for Java: {jar_path}",
                "project_path": None,
                "template_path": None,
                "provider": "aspose_tasks_java",
            }

        runner_path = self._resolve_aspose_tasks_java_runner_path()
        if not runner_path.exists():
            return {
                "available": False,
                "reason": f"No se encontró el runner Java de exportación .mpp: {runner_path}",
                "project_path": None,
                "template_path": None,
                "provider": "aspose_tasks_java",
            }

        template_path = self._resolve_ms_project_template_path()
        if not template_path.exists():
            return {
                "available": False,
                "reason": f"No se encontró la plantilla semilla .mpp requerida: {template_path}",
                "project_path": None,
                "template_path": None,
                "provider": "aspose_tasks_java",
            }
        return {
            "available": True,
            "reason": None,
            "project_path": None,
            "template_path": str(template_path),
            "provider": "aspose_tasks_java",
            "java_bin": java_bin,
            "jar_path": str(jar_path),
            "runner_path": str(runner_path),
            "license_path": str(license_path),
        }

    def get_export_capabilities(self) -> CronogramaTrabajoExportCapabilities:
        environment = self._detect_ms_project_environment()
        template_path = self._resolve_ms_project_template_path()
        direct_reason = environment.get("reason")

        return CronogramaTrabajoExportCapabilities(
            preferred_format="mpp" if environment.get("available") else "xml",
            available_formats=(
                ["xml", "mpp"] if environment.get("available") else ["xml"]
            ),
            direct_mpp_available=bool(environment.get("available")),
            direct_export_reason=direct_reason,
            template_name=MS_PROJECT_TEMPLATE_NAME if template_path.exists() else None,
        )

    def _ensure_schedule(
        self,
        db: Session,
        presupuesto_id: int,
        proyecto_id: int,
        empresa_id: int,
    ) -> CronogramaTrabajo:
        schedule = cronograma_trabajo_repo.get_by_budget_id(
            db, presupuesto_id, empresa_id
        )
        if schedule:
            return schedule
        return cronograma_trabajo_repo.create(
            db,
            {
                "presupuesto_id": presupuesto_id,
                "proyecto_id": proyecto_id,
                "empresa_id": empresa_id,
                "schedule_data": self.build_initial_creation_schedule_data(
                    db,
                    presupuesto_id=presupuesto_id,
                    proyecto_id=proyecto_id,
                    empresa_id=empresa_id,
                ),
            },
        )

    def _split_schedule_payload(
        self, raw_schedule_data: Optional[dict]
    ) -> Tuple[dict, dict]:
        raw_schedule_data = raw_schedule_data or {}
        if "lineas" in raw_schedule_data:
            config = raw_schedule_data.get("config") or {}
            lineas = raw_schedule_data.get("lineas") or {}
            return config, lineas

        config = raw_schedule_data.get(RESERVED_CONFIG_KEY) or {}
        lineas = {
            str(key): value
            for key, value in raw_schedule_data.items()
            if str(key) != RESERVED_CONFIG_KEY
        }
        return config, lineas

    def _join_schedule_payload(self, config: dict, lineas: dict) -> dict:
        payload = {RESERVED_CONFIG_KEY: config or {}}
        payload.update(lineas or {})
        return payload

    def _resolve_config(self, raw_config: Optional[dict]) -> CronogramaTrabajoConfig:
        raw_config = raw_config or {}
        normalized = {**DEFAULT_CONFIG, **raw_config}
        normalized["hora_inicio_jornada"] = round(
            min(max(_to_float(normalized.get("hora_inicio_jornada"), 8.0), 0.0), 23.5),
            4,
        )
        normalized["jornada_laboral_horas"] = round(
            min(
                max(_to_float(normalized.get("jornada_laboral_horas"), 8.0), 0.5), 24.0
            ),
            4,
        )
        dias_mes = max(_to_float(normalized.get("dias_mes"), 30.0), 1.0)
        if "dias_laborables_semana" in raw_config:
            dias_laborables_semana = int(
                round(
                    min(
                        max(
                            _to_float(raw_config.get("dias_laborables_semana"), 5.0),
                            1.0,
                        ),
                        7.0,
                    )
                )
            )
            normalized["dias_laborables_semana"] = dias_laborables_semana
            normalized["dias_laborables_mes"] = round(
                (dias_laborables_semana * dias_mes) / 7.0, 4
            )
        else:
            dias_laborables_mes = max(
                _to_float(normalized.get("dias_laborables_mes"), 22.0), 1.0
            )
            normalized["dias_laborables_semana"] = int(
                round(min(max((dias_laborables_mes * 7.0) / dias_mes, 1.0), 7.0))
            )
        normalized["fecha_inicio_proyecto"] = self._normalize_datetime_value(
            normalized.get("fecha_inicio_proyecto")
        )
        normalized["fecha_inicio_referencia_proyecto"] = self._normalize_datetime_value(
            normalized.get("fecha_inicio_referencia_proyecto")
        )
        if normalized.get("fecha_inicio_autoridad") not in {"datos_proyecto", "gantt"}:
            normalized["fecha_inicio_autoridad"] = None
        normalized["fecha_fin_objetivo_proyecto"] = self._normalize_datetime_value(
            normalized.get("fecha_fin_objetivo_proyecto")
        )
        return CronogramaTrabajoConfig(**normalized)

    def _resolve_schedule_start_anchor(
        self,
        config: CronogramaTrabajoConfig,
        proyecto_start: Optional[datetime],
    ) -> datetime:
        fallback = self._normalize_datetime_value(
            proyecto_start
        ) or datetime.utcnow().replace(microsecond=0)
        return (
            self._align_to_workday_start(
                config.fecha_inicio_proyecto or fallback, config
            )
            or fallback
        )

    def _holiday_dates_from_calendar(self, holiday_calendar) -> set[date]:
        if not holiday_calendar:
            return set()
        return {
            item.observed_date
            for item in list(getattr(holiday_calendar, "items", []) or [])
            if getattr(item, "is_working_day", False) is False
            and getattr(item, "observed_date", None) is not None
        }

    def _resolve_project_detail(
        self, db: Session, proyecto: Optional[Proyecto]
    ) -> Optional[ProyectoDetalle]:
        if not proyecto or not getattr(proyecto, "codigo_root", None):
            return None
        return (
            db.query(ProyectoDetalle)
            .filter(
                ProyectoDetalle.codigo_root == proyecto.codigo_root,
                ProyectoDetalle.empresa_id == proyecto.empresa_id,
            )
            .first()
        )

    def _resolve_project_start_reference(
        self,
        *,
        config: CronogramaTrabajoConfig,
        proyecto: Optional[Proyecto] = None,
        detail: Optional[ProyectoDetalle] = None,
    ) -> Optional[datetime]:
        config_start = self._normalize_datetime_value(
            getattr(config, "fecha_inicio_proyecto", None)
        )
        if config_start is not None:
            return config_start

        proyecto_start = self._normalize_datetime_value(
            getattr(proyecto, "fecha_inicio", None)
        )
        if proyecto_start is not None:
            return proyecto_start

        detail_start = self._normalize_datetime_value(
            getattr(detail, "fecha_inicio", None)
        )
        if detail_start is not None:
            return detail_start

        return None

    def _resolve_external_project_start(
        self,
        proyecto: Optional[Proyecto] = None,
        detail: Optional[ProyectoDetalle] = None,
    ) -> Optional[datetime]:
        detail_start = self._normalize_datetime_value(
            getattr(detail, "fecha_inicio", None)
        )
        if detail_start is not None:
            return detail_start

        proyecto_start = self._normalize_datetime_value(
            getattr(proyecto, "fecha_inicio", None)
        )
        if proyecto_start is not None:
            return proyecto_start

        return None

    def _sync_config_with_external_project_start(
        self,
        *,
        config: CronogramaTrabajoConfig,
        lineas: Dict[str, dict],
        proyecto: Optional[Proyecto] = None,
        detail: Optional[ProyectoDetalle] = None,
    ) -> tuple[CronogramaTrabajoConfig, Dict[str, dict], bool]:
        project_start = self._resolve_external_project_start(proyecto, detail)
        if project_start is None:
            return config, lineas, False

        project_start = self._align_to_workday_start(project_start, config) or project_start
        last_reference = self._normalize_datetime_value(
            getattr(config, "fecha_inicio_referencia_proyecto", None)
        )
        config_start = self._normalize_datetime_value(
            getattr(config, "fecha_inicio_proyecto", None)
        )
        if last_reference is None and config_start is None:
            next_config = config.model_copy(
                update={
                    "fecha_inicio_proyecto": project_start,
                    "fecha_inicio_referencia_proyecto": project_start,
                    "fecha_inicio_autoridad": "datos_proyecto",
                }
            )
            return next_config, lineas, True

        current_anchor = self._resolve_schedule_start_anchor(config, last_reference)

        if last_reference is None or abs((project_start - last_reference).total_seconds()) >= 1:
            shifted_lineas = self._shift_line_overrides_for_project_start_delta(
                lineas,
                old_anchor=current_anchor,
                new_anchor=project_start,
            )
            next_config = config.model_copy(
                update={
                    "fecha_inicio_proyecto": project_start,
                    "fecha_inicio_referencia_proyecto": project_start,
                    "fecha_inicio_autoridad": "datos_proyecto",
                }
            )
            return next_config, shifted_lineas, True

        if getattr(config, "fecha_inicio_referencia_proyecto", None) is None:
            next_config = config.model_copy(
                update={"fecha_inicio_referencia_proyecto": project_start}
            )
            return next_config, lineas, True

        return config, lineas, False

    def _mark_gantt_start_authority(
        self,
        *,
        config: CronogramaTrabajoConfig,
        proyecto: Optional[Proyecto] = None,
        detail: Optional[ProyectoDetalle] = None,
    ) -> CronogramaTrabajoConfig:
        project_start = self._resolve_external_project_start(proyecto, detail)
        update_payload = {"fecha_inicio_autoridad": "gantt"}
        if project_start is not None:
            update_payload["fecha_inicio_referencia_proyecto"] = (
                self._align_to_workday_start(project_start, config) or project_start
            )
        return config.model_copy(update=update_payload)

    def _estimate_calendar_window(
        self,
        *,
        db: Session,
        proyecto: Optional[Proyecto],
        config: CronogramaTrabajoConfig,
        line_overrides: Optional[Dict[str, dict]] = None,
    ) -> tuple[date, date]:
        detail = self._resolve_project_detail(db, proyecto)
        resolved_project_start = self._resolve_project_start_reference(
            config=config,
            proyecto=proyecto,
            detail=detail,
        )
        start_anchor = self._resolve_schedule_start_anchor(
            config, resolved_project_start
        )

        end_candidates: list[datetime] = []
        max_calendar_finish = start_anchor + timedelta(days=CALENDAR_LOOKAHEAD_DAYS)

        def append_bounded_candidate(value: Optional[datetime]) -> None:
            if value is None:
                return
            if value < start_anchor - timedelta(days=365):
                return
            if value > max_calendar_finish:
                return
            end_candidates.append(value)

        if detail:
            detail_finish = self._normalize_datetime_value(
                getattr(detail, "fecha_finalizacion", None)
            )
            append_bounded_candidate(detail_finish)
            try:
                plazo = int(getattr(detail, "plazo_ejecucion", 0) or 0)
            except Exception:
                plazo = 0
            if plazo > 0:
                append_bounded_candidate(start_anchor + timedelta(days=plazo))
        project_finish = self._normalize_datetime_value(
            getattr(proyecto, "fecha_fin_estimada", None)
        )
        append_bounded_candidate(project_finish)

        for raw_value in (line_overrides or {}).values():
            override = self._resolve_line_override(raw_value)
            start_value = self._normalize_datetime_value(override.start_date)
            end_value = self._normalize_datetime_value(override.end_date)
            append_bounded_candidate(start_value)
            append_bounded_candidate(end_value)

        finish_anchor = max(
            end_candidates, default=(start_anchor + timedelta(days=365))
        )
        if finish_anchor > max_calendar_finish:
            finish_anchor = max_calendar_finish
        start_date = (start_anchor - timedelta(days=15)).date()
        end_date = (finish_anchor + timedelta(days=45)).date()
        if end_date < start_date:
            end_date = start_date
        return start_date, end_date

    def _shift_line_overrides_for_project_start_delta(
        self,
        lineas: Dict[str, dict],
        *,
        old_anchor: datetime,
        new_anchor: datetime,
    ) -> Dict[str, dict]:
        delta = new_anchor - old_anchor
        if abs(delta.total_seconds()) < 1:
            return lineas

        shifted: Dict[str, dict] = {}
        for key, raw_value in (lineas or {}).items():
            override = self._resolve_line_override(raw_value)
            payload = override.model_dump(mode="json")
            start_date = self._normalize_datetime_value(override.start_date)
            end_date = self._normalize_datetime_value(override.end_date)
            if start_date is not None:
                payload["start_date"] = (start_date + delta).isoformat()
            if end_date is not None:
                payload["end_date"] = (end_date + delta).isoformat()
            metadata = dict(payload.get("metadata") or {})
            manual_temporal_window = dict(metadata.get("manual_temporal_window") or {})
            manual_start = self._normalize_datetime_value(
                manual_temporal_window.get("starts_at")
            )
            manual_end = self._normalize_datetime_value(
                manual_temporal_window.get("ends_at")
            )
            if manual_start is not None:
                manual_temporal_window["starts_at"] = (manual_start + delta).isoformat()
            if manual_end is not None:
                manual_temporal_window["ends_at"] = (manual_end + delta).isoformat()
            if manual_temporal_window:
                metadata["manual_temporal_window"] = manual_temporal_window
            shifted_subbars = []
            for subbar in list(metadata.get("gantt_subbars") or []):
                next_subbar = dict(subbar or {})
                subbar_start = self._normalize_datetime_value(
                    next_subbar.get("starts_at")
                )
                subbar_end = self._normalize_datetime_value(next_subbar.get("ends_at"))
                if subbar_start is not None:
                    next_subbar["starts_at"] = (subbar_start + delta).isoformat()
                if subbar_end is not None:
                    next_subbar["ends_at"] = (subbar_end + delta).isoformat()
                shifted_subbars.append(next_subbar)
            if shifted_subbars:
                metadata["gantt_subbars"] = shifted_subbars
            payload["metadata"] = self._normalize_operational_metadata(
                str(key), metadata
            )
            shifted[str(key)] = payload
        return shifted

    def _align_to_workday_start(
        self, value: Optional[datetime], config: CronogramaTrabajoConfig
    ) -> Optional[datetime]:
        value = self._normalize_datetime_value(value)
        if value is None:
            return None
        cache = _WORKDAY_CALC_CACHE.get()
        cache_key = None
        if cache is not None:
            cache_key = (
                id(config),
                value.isoformat(),
            )
            cached = cache.setdefault("align_to_workday_start", {}).get(cache_key)
            if cached is not None:
                return cached
        if self._uses_advanced_calendar(config):
            result = self._advanced_align_to_work_start(value, config)
            if cache is not None:
                cache["align_to_workday_start"][cache_key] = result
            return result
        hour, minute = _round_hour_parts(config.hora_inicio_jornada or 8.0)
        if (
            value.hour == 0
            and value.minute == 0
            and value.second == 0
            and value.microsecond == 0
        ):
            result = value.replace(hour=hour, minute=minute, second=0, microsecond=0)
        else:
            result = value.replace(microsecond=0)
        if cache is not None:
            cache["align_to_workday_start"][cache_key] = result
        return result

    def _resolve_workday_day_start(
        self, value: Optional[datetime], config: CronogramaTrabajoConfig
    ) -> Optional[datetime]:
        value = self._normalize_datetime_value(value)
        if value is None:
            return None
        cache = _WORKDAY_CALC_CACHE.get()
        cache_key = None
        if cache is not None:
            cache_key = (id(config), value.date().isoformat())
            cached = cache.setdefault("workday_day_start", {}).get(cache_key)
            if cached is not None:
                return cached
        if self._uses_advanced_calendar(config):
            slots = self._advanced_slots_for_date(value.date(), config)
            if slots:
                start_minutes, _ = slots[0]
                result = value.replace(
                    hour=start_minutes // 60,
                    minute=start_minutes % 60,
                    second=0,
                    microsecond=0,
                )
            else:
                result = value.replace(hour=0, minute=0, second=0, microsecond=0)
        else:
            hour, minute = _round_hour_parts(config.hora_inicio_jornada or 8.0)
            result = value.replace(hour=hour, minute=minute, second=0, microsecond=0)
        if cache is not None:
            cache["workday_day_start"][cache_key] = result
        return result

    def _uses_advanced_calendar(self, config: CronogramaTrabajoConfig) -> bool:
        cache = _WORKDAY_CALC_CACHE.get()
        cache_key = id(config)
        if cache is not None:
            cached = cache.setdefault("uses_advanced_calendar", {}).get(cache_key)
            if cached is not None:
                return cached
        advanced_calendar = getattr(config, "advanced_calendar", None)
        result = bool(
            advanced_calendar
            and getattr(advanced_calendar, "enabled", False)
            and getattr(advanced_calendar, "mode", "simple") == "advanced"
        )
        if cache is not None:
            cache["uses_advanced_calendar"][cache_key] = result
        return result

    def _advanced_time_minutes(self, value: str) -> int:
        try:
            hour, minute = [int(part) for part in str(value or "00:00").split(":")]
        except Exception:
            hour, minute = 0, 0
        return max(0, min(hour * 60 + minute, 24 * 60))

    def _advanced_simple_slots(self, config: CronogramaTrabajoConfig) -> list[tuple[int, int]]:
        start_hour, start_minute = _round_hour_parts(config.hora_inicio_jornada or 8.0)
        start_minutes = start_hour * 60 + start_minute
        duration_minutes = int(round(max(float(config.jornada_laboral_horas or 8.0), 1.0) * 60))
        end_minutes = min(start_minutes + duration_minutes, 24 * 60)
        return [(start_minutes, end_minutes)] if end_minutes > start_minutes else []

    def _advanced_slots_for_date(
        self,
        target_date: date,
        config: CronogramaTrabajoConfig,
        holiday_dates: Optional[set[date]] = None,
    ) -> list[tuple[int, int]]:
        advanced_calendar = getattr(config, "advanced_calendar", None)
        if not self._uses_advanced_calendar(config) or advanced_calendar is None:
            return []

        exceptions = {
            item.date: item for item in list(getattr(advanced_calendar, "date_exceptions", []) or [])
        }
        date_key = target_date.isoformat()
        exception = exceptions.get(date_key)
        if exception is not None:
            if exception.slots is not None:
                return [
                    (self._advanced_time_minutes(slot.start), self._advanced_time_minutes(slot.end))
                    for slot in exception.slots
                    if self._advanced_time_minutes(slot.end) > self._advanced_time_minutes(slot.start)
                ]
            if exception.is_working_day is False:
                return []

        holidays = {
            item.date
            for item in list(getattr(advanced_calendar, "holidays", []) or [])
            if getattr(item, "is_working_day", False) is False
        }
        if date_key in holidays or (holiday_dates and target_date in holiday_dates):
            return []

        weekly_pattern = list(getattr(advanced_calendar, "weekly_pattern", []) or [])
        if not weekly_pattern:
            laborable_week_days = min(
                max(int(round(float(config.dias_laborables_semana or 5.0))), 1), 7
            )
            if laborable_week_days >= 7 or target_date.isoweekday() <= laborable_week_days:
                return self._advanced_simple_slots(config)
            return []

        weekday = target_date.weekday()
        weekly_day = next((item for item in weekly_pattern if item.day == weekday), None)
        if weekly_day is None or weekly_day.is_working_day is False:
            return []
        return [
            (self._advanced_time_minutes(slot.start), self._advanced_time_minutes(slot.end))
            for slot in weekly_day.slots
            if self._advanced_time_minutes(slot.end) > self._advanced_time_minutes(slot.start)
        ]

    def _advanced_slot_datetimes(
        self,
        target_date: date,
        config: CronogramaTrabajoConfig,
        holiday_dates: Optional[set[date]] = None,
    ) -> list[tuple[datetime, datetime]]:
        slots = []
        for start_minutes, end_minutes in self._advanced_slots_for_date(
            target_date, config, holiday_dates
        ):
            day_start = datetime.combine(target_date, datetime.min.time())
            slots.append(
                (
                    day_start + timedelta(minutes=start_minutes),
                    day_start + timedelta(minutes=end_minutes),
                )
            )
        return slots

    def _advanced_align_to_work_start(
        self,
        value: datetime,
        config: CronogramaTrabajoConfig,
        holiday_dates: Optional[set[date]] = None,
    ) -> Optional[datetime]:
        cursor = value.replace(microsecond=0)
        if (
            cursor.hour == 0
            and cursor.minute == 0
            and cursor.second == 0
            and cursor.microsecond == 0
        ):
            cursor = cursor.replace(hour=0, minute=0, second=0, microsecond=0)
        for _ in range(3700):
            for slot_start, slot_end in self._advanced_slot_datetimes(
                cursor.date(), config, holiday_dates
            ):
                if cursor <= slot_start:
                    return slot_start.replace(microsecond=0)
                if slot_start <= cursor < slot_end:
                    return cursor.replace(microsecond=0)
            cursor = (cursor + timedelta(days=1)).replace(
                hour=0, minute=0, second=0, microsecond=0
            )
        return value.replace(microsecond=0)

    def _align_to_available_work_start(
        self,
        value: Optional[datetime],
        config: CronogramaTrabajoConfig,
        holiday_dates: Optional[set[date]] = None,
    ) -> Optional[datetime]:
        value = self._normalize_datetime_value(value)
        if value is None:
            return None
        if self._uses_advanced_calendar(config):
            return self._advanced_align_to_work_start(value, config, holiday_dates)

        jornada_horas = max(float(config.jornada_laboral_horas or 8.0), 1.0)
        cursor = value.replace(microsecond=0)
        for _ in range(3700):
            if self._is_workday(cursor, config, holiday_dates):
                workday_start = self._resolve_workday_day_start(cursor, config) or cursor
                workday_finish = workday_start + timedelta(hours=jornada_horas)
                if cursor <= workday_start:
                    return workday_start.replace(microsecond=0)
                if cursor < workday_finish:
                    return cursor.replace(microsecond=0)
            cursor = (cursor + timedelta(days=1)).replace(
                hour=0, minute=0, second=0, microsecond=0
            )
        return value.replace(microsecond=0)

    def _is_workday(
        self,
        value: datetime,
        config: CronogramaTrabajoConfig,
        holiday_dates: Optional[set[date]] = None,
    ) -> bool:
        cache = _WORKDAY_CALC_CACHE.get()
        cache_key = None
        if cache is not None:
            cache_key = (
                id(config),
                value.date().isoformat(),
                id(holiday_dates),
            )
            cached = cache.setdefault("is_workday", {}).get(cache_key)
            if cached is not None:
                return cached
        if self._uses_advanced_calendar(config):
            result = bool(self._advanced_slots_for_date(value.date(), config, holiday_dates))
        else:
            laborable_week_days = min(
                max(int(round(float(config.dias_laborables_semana or 5.0))), 1), 7
            )
            weekday = value.isoweekday()
            if holiday_dates and value.date() in holiday_dates:
                result = False
            else:
                result = laborable_week_days >= 7 or weekday <= laborable_week_days
        if cache is not None:
            cache["is_workday"][cache_key] = result
        return result

    def _build_finish_from_start(
        self,
        start_date: Optional[datetime],
        duration_days: float,
        config: CronogramaTrabajoConfig,
        holiday_dates: Optional[set[date]] = None,
    ) -> Optional[datetime]:
        if start_date is None:
            return None
        if self._uses_advanced_calendar(config):
            return self._advanced_add_work_duration(
                start_date, max(_to_float(duration_days, 0.0), 0.0), config, holiday_dates
            )
        normalized_start = (
            self._align_to_available_work_start(start_date, config, holiday_dates) or start_date
        )
        safe_duration = max(_to_float(duration_days, 0.0), 0.0)
        if safe_duration <= 0:
            return normalized_start
        remaining_hours = safe_duration * max(
            float(config.jornada_laboral_horas or 8.0), 1.0
        )
        jornada_horas = max(float(config.jornada_laboral_horas or 8.0), 1.0)
        current = normalized_start.replace(microsecond=0)
        while remaining_hours > 0.000001:
            workday_finish = (
                self._resolve_workday_day_start(current, config) or current
            ) + timedelta(hours=jornada_horas)
            available_hours = max(
                (workday_finish - current).total_seconds() / 3600.0, 0.0
            )
            consume_hours = min(remaining_hours, available_hours)
            current = (current + timedelta(hours=consume_hours)).replace(microsecond=0)
            remaining_hours -= consume_hours
            if remaining_hours > 0.000001:
                next_day = (current + timedelta(days=1)).replace(
                    hour=0, minute=0, second=0, microsecond=0
                )
                current = self._align_to_workday_start(next_day, config) or next_day
                while current and not self._is_workday(current, config, holiday_dates):
                    current = self._align_to_workday_start(
                        current + timedelta(days=1), config
                    ) or (current + timedelta(days=1))
        return current

    def _find_previous_workday_start(
        self,
        value: Optional[datetime],
        config: CronogramaTrabajoConfig,
        holiday_dates: Optional[set[date]] = None,
    ) -> Optional[datetime]:
        value = self._normalize_datetime_value(value)
        if value is None:
            return None
        if self._uses_advanced_calendar(config):
            cursor = (value - timedelta(days=1)).replace(
                hour=23, minute=59, second=59, microsecond=0
            )
            for _ in range(3700):
                slots = self._advanced_slot_datetimes(cursor.date(), config, holiday_dates)
                if slots:
                    return slots[-1][0].replace(microsecond=0)
                cursor = (cursor - timedelta(days=1)).replace(
                    hour=23, minute=59, second=59, microsecond=0
                )
            return None
        cursor = (value - timedelta(days=1)).replace(
            hour=0, minute=0, second=0, microsecond=0
        )
        for _ in range(3700):
            if self._is_workday(cursor, config, holiday_dates):
                return self._align_to_workday_start(cursor, config) or cursor
            cursor = (cursor - timedelta(days=1)).replace(
                hour=0, minute=0, second=0, microsecond=0
            )
        return None

    def _subtract_work_duration(
        self,
        value: Optional[datetime],
        duration_days: float,
        config: CronogramaTrabajoConfig,
        holiday_dates: Optional[set[date]] = None,
    ) -> Optional[datetime]:
        value = self._normalize_datetime_value(value)
        if value is None:
            return None
        if self._uses_advanced_calendar(config):
            return self._advanced_subtract_work_duration(
                value, duration_days, config, holiday_dates
            )
        safe_value = value.replace(microsecond=0)
        safe_duration = max(_to_float(duration_days, 0.0), 0.0)
        if safe_duration <= 0.000001:
            return safe_value
        jornada_horas = max(float(config.jornada_laboral_horas or 8.0), 1.0)
        remaining_hours = safe_duration * jornada_horas
        current = safe_value
        for _ in range(10000):
            if remaining_hours <= 0.000001:
                return current
            workday_start = self._resolve_workday_day_start(current, config) or current
            consumed_hours = max(
                (current - workday_start).total_seconds() / 3600.0, 0.0
            )
            if consumed_hours > 0.000001:
                rollback_hours = min(remaining_hours, consumed_hours)
                current = (current - timedelta(hours=rollback_hours)).replace(
                    microsecond=0
                )
                remaining_hours -= rollback_hours
                continue
            previous_start = self._find_previous_workday_start(
                current, config, holiday_dates
            )
            if previous_start is None:
                return safe_value
            current = (
                previous_start + timedelta(hours=jornada_horas)
            ).replace(microsecond=0)
        return current

    def _advanced_add_work_duration(
        self,
        value: Optional[datetime],
        duration_days: float,
        config: CronogramaTrabajoConfig,
        holiday_dates: Optional[set[date]] = None,
    ) -> Optional[datetime]:
        value = self._normalize_datetime_value(value)
        if value is None:
            return None
        remaining_hours = max(_to_float(duration_days, 0.0), 0.0) * max(
            float(config.jornada_laboral_horas or 8.0), 1.0
        )
        current = self._advanced_align_to_work_start(value, config, holiday_dates) or value
        if remaining_hours <= 0.000001:
            return current.replace(microsecond=0)
        for _ in range(10000):
            for slot_start, slot_end in self._advanced_slot_datetimes(
                current.date(), config, holiday_dates
            ):
                if current < slot_start:
                    current = slot_start
                if slot_start <= current < slot_end:
                    available_hours = max((slot_end - current).total_seconds() / 3600.0, 0.0)
                    consume_hours = min(remaining_hours, available_hours)
                    current = (current + timedelta(hours=consume_hours)).replace(microsecond=0)
                    remaining_hours -= consume_hours
                    if remaining_hours <= 0.000001:
                        return current
            current = (current + timedelta(days=1)).replace(
                hour=0, minute=0, second=0, microsecond=0
            )
            current = self._advanced_align_to_work_start(current, config, holiday_dates) or current
        return current.replace(microsecond=0)

    def _advanced_subtract_work_duration(
        self,
        value: Optional[datetime],
        duration_days: float,
        config: CronogramaTrabajoConfig,
        holiday_dates: Optional[set[date]] = None,
    ) -> Optional[datetime]:
        value = self._normalize_datetime_value(value)
        if value is None:
            return None
        remaining_hours = max(_to_float(duration_days, 0.0), 0.0) * max(
            float(config.jornada_laboral_horas or 8.0), 1.0
        )
        current = value.replace(microsecond=0)
        if remaining_hours <= 0.000001:
            return current
        for _ in range(10000):
            slots = self._advanced_slot_datetimes(current.date(), config, holiday_dates)
            for slot_start, slot_end in reversed(slots):
                if current > slot_end:
                    current = slot_end
                if slot_start < current <= slot_end:
                    available_hours = max((current - slot_start).total_seconds() / 3600.0, 0.0)
                    rollback_hours = min(remaining_hours, available_hours)
                    current = (current - timedelta(hours=rollback_hours)).replace(microsecond=0)
                    remaining_hours -= rollback_hours
                    if remaining_hours <= 0.000001:
                        return current
            current = (current - timedelta(days=1)).replace(
                hour=23, minute=59, second=59, microsecond=0
            )
        return current.replace(microsecond=0)

    def _add_work_duration(
        self,
        value: Optional[datetime],
        duration_days: float,
        config: CronogramaTrabajoConfig,
        holiday_dates: Optional[set[date]] = None,
    ) -> Optional[datetime]:
        value = self._normalize_datetime_value(value)
        if value is None:
            return None
        safe_duration = _to_float(duration_days, 0.0)
        # TASK-1859: duracion cero = anclaje exacto, sin alinear a calendario laboral
        if abs(safe_duration) <= 0.000001:
            return value.replace(microsecond=0)
        safe_value = (
            self._align_to_available_work_start(value, config, holiday_dates)
            if safe_duration > 0
            else self._normalize_datetime_value(value)
        ) or value
        if safe_duration < 0:
            return self._subtract_work_duration(
                safe_value, abs(safe_duration), config, holiday_dates
            )
        return self._build_finish_from_start(
            safe_value, safe_duration, config, holiday_dates
        )

    def _add_dependency_finish_lag(
        self,
        value: Optional[datetime],
        duration_days: float,
        config: CronogramaTrabajoConfig,
        holiday_dates: Optional[set[date]] = None,
    ) -> Optional[datetime]:
        value = self._normalize_datetime_value(value)
        if value is None:
            return None
        safe_duration = _to_float(duration_days, 0.0)
        if abs(safe_duration) <= 0.000001:
            return value.replace(microsecond=0)
        return self._add_work_duration(value, safe_duration, config, holiday_dates)

    def _resolve_dependency_target_start(
        self,
        source_start: Optional[datetime],
        source_finish: Optional[datetime],
        target_duration_days: float,
        dependency: CronogramaTrabajoDependency,
        config: CronogramaTrabajoConfig,
        holiday_dates: Optional[set[date]] = None,
    ) -> Optional[datetime]:
        source_start = self._normalize_datetime_value(source_start)
        source_finish = self._normalize_datetime_value(source_finish)
        relation_type = str(getattr(dependency, "type", "FS") or "FS").upper()
        source_duration_days = self._measure_work_duration_days(
            source_start,
            source_finish,
            config,
            holiday_dates,
        )
        lag_days = self._dependency_lag_to_work_days(
            dependency,
            config,
            source_duration_days=source_duration_days,
        )

        if relation_type == "SS":
            return self._add_work_duration(
                source_start, lag_days, config, holiday_dates
            )
        if relation_type == "FF":
            target_finish = self._add_dependency_finish_lag(
                source_finish, lag_days, config, holiday_dates
            )
            if abs(_to_float(target_duration_days, 0.0)) <= 0.000001:
                return self._normalize_datetime_value(target_finish)
            return self._add_work_duration(
                target_finish, -target_duration_days, config, holiday_dates
            )
        if relation_type == "SF":
            target_finish = self._add_dependency_finish_lag(
                source_start, lag_days, config, holiday_dates
            )
            if abs(_to_float(target_duration_days, 0.0)) <= 0.000001:
                return self._normalize_datetime_value(target_finish)
            return self._add_work_duration(
                target_finish, -target_duration_days, config, holiday_dates
            )
        return self._add_work_duration(
            source_finish, lag_days, config, holiday_dates
        )

    def _build_workday_auto_segments(
        self,
        *,
        budget_line_id: str,
        start_date: Optional[datetime],
        duration_days: float,
        config: CronogramaTrabajoConfig,
        holiday_dates: Optional[set[date]] = None,
    ) -> list[dict]:
        start_date = self._normalize_datetime_value(start_date)
        if start_date is None:
            return []

        jornada_horas = max(float(config.jornada_laboral_horas or 8.0), 1.0)
        remaining_hours = max(_to_float(duration_days, 0.0), 0.0) * jornada_horas
        if remaining_hours <= 0.000001:
            return []
        requested_hours = remaining_hours
        if _to_float(duration_days, 0.0) > CALENDAR_LOOKAHEAD_DAYS:
            return []

        current = self._align_to_available_work_start(
            start_date, config, holiday_dates
        ) or start_date
        raw_segments: list[tuple[datetime, datetime, float]] = []

        for _ in range(10000):
            if remaining_hours <= 0.000001:
                break

            if self._uses_advanced_calendar(config):
                windows = self._advanced_slot_datetimes(
                    current.date(), config, holiday_dates
                )
            elif self._is_workday(current, config, holiday_dates):
                work_start = self._resolve_workday_day_start(current, config) or current
                windows = [(work_start, work_start + timedelta(hours=jornada_horas))]
            else:
                windows = []

            consumed_in_day = False
            for window_start, window_finish in windows:
                if current < window_start:
                    current = window_start
                if not (window_start <= current < window_finish):
                    continue
                available_hours = max(
                    (window_finish - current).total_seconds() / 3600.0, 0.0
                )
                if available_hours <= 0.000001:
                    continue
                consume_hours = min(remaining_hours, available_hours)
                segment_start = current.replace(microsecond=0)
                segment_finish = (
                    current + timedelta(hours=consume_hours)
                ).replace(microsecond=0)
                if segment_finish > segment_start:
                    raw_segments.append((segment_start, segment_finish, consume_hours))
                    if len(raw_segments) > MAX_WORKDAY_AUTO_SEGMENTS:
                        return []
                current = segment_finish
                remaining_hours -= consume_hours
                consumed_in_day = True
                if remaining_hours <= 0.000001:
                    break

            if remaining_hours <= 0.000001:
                break
            current = (current + timedelta(days=1)).replace(
                hour=0, minute=0, second=0, microsecond=0
            )
            if not consumed_in_day:
                current = self._align_to_available_work_start(
                    current, config, holiday_dates
                ) or current

        if remaining_hours > 0.000001:
            return []
        if len(raw_segments) <= 1:
            return []

        total_hours = sum(segment[2] for segment in raw_segments)
        if total_hours <= 0 or abs(total_hours - requested_hours) > 0.0001:
            return []

        line_token = str(budget_line_id or "unbound").strip() or "unbound"
        segments = []
        for index, (segment_start, segment_finish, segment_hours) in enumerate(
            raw_segments
        ):
            percent = round((segment_hours / total_hours) * 100.0, 4)
            period_id = f"workday-{index + 1}"
            segments.append(
                {
                    "id": f"line-{line_token}-workday-auto-{index + 1}",
                    "budget_line_id": line_token,
                    "period_id": period_id,
                    "parent_period_id": period_id,
                    "parent_initial_id": f"workday-auto-{line_token}",
                    "starts_at": segment_start.isoformat(),
                    "ends_at": segment_finish.isoformat(),
                    "percent": percent,
                    "amount": 0.0,
                    "status": "confirmed_against_budget",
                    "source": "gantt_workday_auto_segment",
                    "metadata": {
                        "label": f"Tramo laboral {index + 1}",
                        "source_contract": "cronograma_trabajo_work_calendar",
                        "work_hours": round(segment_hours, 4),
                        "jornada_horas": round(jornada_horas, 4),
                    },
                }
            )
        return segments

    def _has_only_renewable_gantt_subbars(self, metadata: dict) -> bool:
        subbars = list((metadata or {}).get("gantt_subbars") or [])
        if not subbars:
            return False
        renewable_sources = GANTT_AUTO_SUBBAR_SOURCES | GANTT_RENEWABLE_SUBBAR_SOURCES
        return all(
            isinstance(segment, dict)
            and str(segment.get("source") or "").strip().lower() in renewable_sources
            for segment in subbars
        )

    def _decorate_rows_with_workday_auto_segments(
        self,
        rows: list[CronogramaTrabajoComputedRow],
        config: CronogramaTrabajoConfig,
        holiday_dates: Optional[set[date]] = None,
    ) -> list[CronogramaTrabajoComputedRow]:
        renewable_sources = GANTT_AUTO_SUBBAR_SOURCES | GANTT_RENEWABLE_SUBBAR_SOURCES
        for row in rows or []:
            metadata = dict(getattr(row, "metadata", {}) or {})
            existing_subbars = list(metadata.get("gantt_subbars") or [])
            has_protected_subbars = any(
                str(segment.get("source") or "").strip().lower()
                not in renewable_sources
                for segment in existing_subbars
                if isinstance(segment, dict)
            )
            if has_protected_subbars:
                metadata["gantt_operational"] = self._build_gantt_operational_summary(
                    str(getattr(row, "presupuesto_linea_id", "") or ""),
                    metadata,
                )
                row.metadata = metadata
                continue

            segments = self._build_workday_auto_segments(
                budget_line_id=str(getattr(row, "presupuesto_linea_id", "") or ""),
                start_date=getattr(row, "start_date", None),
                duration_days=getattr(row, "dias_calendario", None)
                or getattr(row, "dias_utiles", None)
                or 0.0,
                config=config,
                holiday_dates=holiday_dates,
            )
            if segments:
                metadata["gantt_subbars"] = segments
            elif existing_subbars and not has_protected_subbars:
                metadata.pop("gantt_subbars", None)

            metadata["gantt_operational"] = self._build_gantt_operational_summary(
                str(getattr(row, "presupuesto_linea_id", "") or ""),
                metadata,
            )
            row.metadata = metadata
        return rows

    def _resolve_dual_duration_contract(
        self,
        *,
        trabajo_gobernante: Decimal,
        recursos_asumidos: Decimal,
        jornada: Decimal,
        override_duration: Optional[Decimal] = None,
    ) -> dict:
        jornada_segura = jornada if jornada > 0 else Decimal("8")
        recursos_seguro = recursos_asumidos if recursos_asumidos > 0 else Decimal("1")

        if override_duration is not None:
            gantt_dias = max(override_duration, Decimal("0"))
            gantt_horas = gantt_dias * jornada_segura
            export_dias = gantt_dias
            export_horas = gantt_horas
            return {
                "gantt_duration_hours": gantt_horas,
                "gantt_duration_days": gantt_dias,
                "export_duration_hours": export_horas,
                "export_duration_days": export_dias,
                "export_assumed_resources": recursos_seguro,
            }

        gantt_horas = max(trabajo_gobernante, Decimal("0"))
        gantt_dias = (
            gantt_horas / jornada_segura if jornada_segura > 0 else Decimal("0")
        )
        export_horas = (
            trabajo_gobernante / recursos_seguro
            if recursos_seguro > 0
            else max(trabajo_gobernante, Decimal("0"))
        )
        export_dias = (
            export_horas / jornada_segura if jornada_segura > 0 else Decimal("0")
        )
        return {
            "gantt_duration_hours": gantt_horas,
            "gantt_duration_days": gantt_dias,
            "export_duration_hours": export_horas,
            "export_duration_days": export_dias,
            "export_assumed_resources": recursos_seguro,
        }

    def _align_to_workday_finish(
        self,
        value: Optional[datetime],
        config: CronogramaTrabajoConfig,
        holiday_dates: Optional[set[date]] = None,
    ) -> Optional[datetime]:
        value = self._normalize_datetime_value(value)
        if value is None:
            return None
        if (
            value.hour == 0
            and value.minute == 0
            and value.second == 0
            and value.microsecond == 0
        ):
            aligned_start = self._align_to_workday_start(value, config)
            if aligned_start is None:
                return None
            return self._build_finish_from_start(
                aligned_start, 1, config, holiday_dates
            )
        return value.replace(microsecond=0)

    def _resolve_line_override(self, raw_value) -> CronogramaTrabajoLinea:
        cache = _LINE_OVERRIDE_CACHE.get()
        cache_key = (
            id(raw_value)
            if isinstance(raw_value, (dict, CronogramaTrabajoLinea))
            else None
        )
        if cache is not None and cache_key is not None and cache_key in cache:
            return cache[cache_key]

        if isinstance(raw_value, CronogramaTrabajoLinea):
            line_override = raw_value.model_copy(deep=True)
            line_override.metadata = self._normalize_operational_metadata(
                str(getattr(raw_value, "linea_id", "") or ""),
                line_override.metadata,
            )
            return line_override
        if isinstance(raw_value, dict):
            line_override = CronogramaTrabajoLinea(**raw_value)
            budget_line_id = str(
                raw_value.get("linea_id") or raw_value.get("presupuesto_linea_id") or ""
            )
        else:
            line_override = CronogramaTrabajoLinea()
            budget_line_id = ""
        line_override.metadata = self._normalize_operational_metadata(
            budget_line_id,
            line_override.metadata,
        )
        if cache is not None and cache_key is not None:
            cache[cache_key] = line_override
        return line_override

    def _resolve_line_dependencies(
        self,
        line_id: int,
        override: CronogramaTrabajoLinea,
    ) -> list[CronogramaTrabajoDependency]:
        dependencies: list[CronogramaTrabajoDependency] = []
        for dependency in override.dependencies or []:
            target_id = dependency.target_id or line_id
            dependencies.append(
                CronogramaTrabajoDependency(
                    source_id=int(dependency.source_id),
                    target_id=int(target_id),
                    type=dependency.type,
                    lag_days=float(dependency.lag_days or 0.0),
                    lag_unit=dependency.lag_unit,
                    lag_mode=dependency.lag_mode,
                    metadata=dependency.metadata or {},
                )
            )

        if dependencies:
            return dependencies

        seen: set[int] = set()
        for predecessor in override.predecessors or []:
            source_id = int(predecessor)
            if source_id in seen:
                continue
            seen.add(source_id)
            dependencies.append(
                CronogramaTrabajoDependency(
                    source_id=source_id,
                    target_id=line_id,
                    type="FS",
                    lag_days=0.0,
                    lag_unit="day",
                )
            )
        return dependencies

    def _resolve_line_category(self, linea: APULinea) -> int:
        return resolve_resource_category_id(linea, getattr(linea, "recurso", None))

    def _compute_apu_work_breakdown(
        self,
        apu: Optional[APU],
        budget_quantity: Decimal,
        cache: Dict[int, Dict[str, Decimal]],
    ) -> Dict[str, Decimal]:
        base_breakdown = self._compute_apu_unit_breakdown(apu, cache)
        factor = budget_quantity
        return {key: value * factor for key, value in base_breakdown.items()}

    def _compute_apu_structure_breakdown(
        self,
        apu: Optional[APU],
        budget_quantity: Decimal,
        cache: Dict[int, Dict[str, Decimal]],
    ) -> Dict[str, Decimal]:
        unit_breakdown = self._compute_apu_unit_structure_breakdown(apu, cache)
        factor = budget_quantity
        return {key: value * factor for key, value in unit_breakdown.items()}

    def _compute_apu_unit_breakdown(
        self,
        apu: Optional[APU],
        cache: Dict[int, Dict[str, Decimal]],
    ) -> Dict[str, Decimal]:
        zero = {
            "equipos_herramientas": Decimal("0"),
            "materiales": Decimal("0"),
            "transporte": Decimal("0"),
            "mano_obra": Decimal("0"),
        }
        if not apu:
            return dict(zero)
        if apu.id in cache:
            return dict(cache[apu.id])

        breakdown = dict(zero)
        for linea in sorted(
            apu.lineas or [], key=lambda item: ((item.orden or 0), item.id or 0)
        ):
            quantity = _as_decimal(linea.cantidad, "0")
            rendimiento = _as_decimal(linea.rendimiento, "1")
            work_factor = quantity * rendimiento
            category = self._resolve_line_category(linea)
            category_key = self.CATEGORY_LABELS.get(category)

            if linea.apu_hijo_id and linea.apu_hijo:
                nested_breakdown = self._compute_apu_unit_breakdown(
                    linea.apu_hijo, cache
                )
                for key, value in nested_breakdown.items():
                    breakdown[key] += value * work_factor
                continue

            if not category_key or category_key == "materiales":
                # Materiales no aportan horas al cronograma de trabajo.
                continue

            if category_key == "apu_hijo":
                continue
            breakdown[category_key] += work_factor

        cache[apu.id] = dict(breakdown)
        return dict(breakdown)

    def _resolve_resource_unit_label(self, recurso: Optional[Recurso]) -> str:
        return resolve_resource_unit_label(recurso)

    def _resolve_resource_price(self, linea: APULinea, recurso: Optional[Recurso]) -> Decimal:
        return resolve_resource_price(linea, recurso)

    def _build_operational_resource_key(
        self,
        *,
        recurso_id: int,
        category_id: int,
        unit_label: str,
        price: Decimal,
    ) -> str:
        return build_operational_resource_key(
            resource_id=recurso_id,
            category_id=category_id,
            unit_label=unit_label,
            price=price,
        )

    def _collect_apu_operational_resources(
        self,
        apu: Optional[APU],
        *,
        inherited_factor: Decimal = Decimal("1"),
        nested: bool = False,
        accumulator: Optional[Dict[str, Dict[str, Any]]] = None,
        active_path: Optional[set[int]] = None,
    ) -> Dict[str, Dict[str, Any]]:
        return collect_apu_exploded_resources(
            apu,
            inherited_factor=inherited_factor,
            nested=nested,
            accumulator=accumulator,
            active_path=active_path,
            category_labels=self.CATEGORY_LABELS,
        )

    def _build_apu_operational_resources_metadata(self, apu: Optional[APU]) -> Dict[str, Any]:
        if not apu:
            return {
                "status": "base_sin_anidados",
                "has_nested": False,
                "resources": [],
                "conflicts": [],
            }

        calculation_mode, nested_count = self._resolve_apu_calculation_mode(apu)
        accumulator = self._collect_apu_operational_resources(apu)
        keys_by_resource: Dict[int, set[str]] = {}
        for key, entry in accumulator.items():
            keys_by_resource.setdefault(int(entry["recurso_id"]), set()).add(key)

        conflicts = [
            {"recurso_id": recurso_id, "keys": sorted(keys)}
            for recurso_id, keys in keys_by_resource.items()
            if len(keys) > 1
        ]
        conflicted_resource_ids = {item["recurso_id"] for item in conflicts}
        resources = []
        for entry in accumulator.values():
            cantidad = _as_decimal(entry.get("cantidad"), "0")
            trabajo_relativo = _as_decimal(entry.get("trabajo_relativo"), "0")
            rendimiento_equivalente = (
                trabajo_relativo / cantidad
                if cantidad > 0
                else Decimal("0")
            )
            has_direct = int(entry.get("direct_sources") or 0) > 0
            has_nested = int(entry.get("nested_sources") or 0) > 0
            if int(entry["recurso_id"]) in conflicted_resource_ids:
                origin = "no_fusionado"
            elif has_direct and has_nested:
                origin = "consolidado"
            elif has_nested:
                origin = "anidado"
            else:
                origin = "directo"
            resources.append(
                {
                    "id": entry["key"],
                    "recurso_id": entry["recurso_id"],
                    "codigo": entry["codigo"],
                    "descripcion": entry["descripcion"],
                    "categoria_id": entry["categoria_id"],
                    "categoria": entry["categoria"],
                    "unidad": entry["unidad"],
                    "precio_unitario": round(_to_float(entry["precio_unitario"]), 6),
                    "cantidad": round(_to_float(cantidad), 6),
                    "trabajo_relativo": round(_to_float(trabajo_relativo), 6),
                    "rendimiento_equivalente": round(_to_float(rendimiento_equivalente), 6),
                    "origin": origin,
                    "direct_sources": int(entry.get("direct_sources") or 0),
                    "nested_sources": int(entry.get("nested_sources") or 0),
                    "source_lines": entry.get("source_lines") or [],
                }
            )

        resources.sort(
            key=lambda item: (
                int(item.get("categoria_id") or 0),
                str(item.get("descripcion") or ""),
                str(item.get("codigo") or ""),
            )
        )
        has_nested_apus = nested_count > 0
        return {
            "status": "conflicto_explosion" if conflicts else (
                "anidados_explotados" if has_nested_apus else "base_sin_anidados"
            ),
            "has_nested": has_nested_apus,
            "calculation_mode": calculation_mode,
            "nested_apu_count": nested_count,
            "resources": resources,
            "conflicts": conflicts,
        }

    def _normalize_exploded_operational_snapshot(
        self,
        snapshot: Dict[str, Any],
    ) -> Dict[str, Any]:
        resources = snapshot.get("resources") if isinstance(snapshot, dict) else None
        if not isinstance(resources, list):
            return dict(snapshot or {})

        has_exploded_nested = bool(snapshot.get("has_nested")) or any(
            isinstance(resource, dict)
            and str(resource.get("origin") or "").strip().lower() in {"anidado", "consolidado"}
            for resource in resources
        )
        if not has_exploded_nested:
            return dict(snapshot)

        normalized_resources = []
        for resource in resources:
            if not isinstance(resource, dict):
                normalized_resources.append(resource)
                continue

            normalized = dict(resource)
            quantity = _as_decimal(normalized.get("cantidad"), "0")
            source_lines = normalized.get("source_lines")
            source_work = Decimal("0")
            if isinstance(source_lines, list):
                source_work = sum(
                    (
                        _as_decimal(source_line.get("trabajo_relativo"), "0")
                        for source_line in source_lines
                        if isinstance(source_line, dict)
                    ),
                    Decimal("0"),
                )
            relative_work = source_work if source_work > 0 else _as_decimal(
                normalized.get("trabajo_relativo"),
                "0",
            )
            if relative_work <= 0:
                rendimiento = _as_decimal(
                    normalized.get("rendimiento_equivalente")
                    if normalized.get("rendimiento_equivalente") is not None
                    else normalized.get("rendimiento"),
                    "0",
                )
                relative_work = quantity * rendimiento

            equivalent_performance = (
                relative_work / quantity
                if quantity > 0
                else Decimal("0")
            )
            normalized["trabajo_relativo"] = round(_to_float(relative_work), 6)
            normalized["rendimiento_equivalente"] = round(
                _to_float(equivalent_performance),
                6,
            )
            normalized_resources.append(normalized)

        resolved = dict(snapshot)
        resolved["has_nested"] = True
        resolved["resources"] = normalized_resources
        return resolved

    def _resolve_active_apu_operational_snapshot(
        self,
        *,
        apu: Optional[APU],
        config: CronogramaTrabajoConfig,
        row_metadata: Optional[dict],
    ) -> Dict[str, Any]:
        active_modification_snapshot = resolve_active_apu_resource_modification(
            config=config,
            apu_id=getattr(apu, "id", None),
        )
        if active_modification_snapshot is not None:
            return self._normalize_exploded_operational_snapshot(active_modification_snapshot)

        metadata_snapshot = (
            row_metadata.get(APU_OPERATIONAL_RESOURCES_METADATA_KEY)
            if isinstance(row_metadata, dict)
            else None
        )
        if (
            apu is None
            and isinstance(metadata_snapshot, dict)
            and isinstance(metadata_snapshot.get("resources"), list)
        ):
            resolved = dict(metadata_snapshot)
            resolved["source"] = resolved.get("source") or "line_metadata"
            return self._normalize_exploded_operational_snapshot(resolved)

        return self._normalize_exploded_operational_snapshot(
            self._build_apu_operational_resources_metadata(apu)
        )

    def _build_operational_calculation_from_snapshot(
        self,
        snapshot: Optional[dict],
        budget_quantity: Decimal,
    ) -> Optional[Dict[str, Any]]:
        resources = snapshot.get("resources") if isinstance(snapshot, dict) else None
        if not isinstance(resources, list) or not resources:
            return None

        unit_breakdown = {
            "equipos_herramientas": Decimal("0"),
            "materiales": Decimal("0"),
            "transporte": Decimal("0"),
            "mano_obra": Decimal("0"),
        }
        crew_breakdown = {
            "equipos_herramientas": Decimal("0"),
            "mano_obra": Decimal("0"),
        }
        candidates: List[Dict[str, Any]] = []
        for index, resource in enumerate(resources, start=1):
            if not isinstance(resource, dict):
                continue
            try:
                category_id = int(resource.get("categoria_id") or 0)
            except (TypeError, ValueError):
                category_id = 0
            category_key = self.CATEGORY_LABELS.get(category_id)
            if not category_key:
                continue

            quantity = _as_decimal(resource.get("cantidad"), "0")
            rendimiento = _as_decimal(
                resource.get("rendimiento_equivalente")
                if resource.get("rendimiento_equivalente") is not None
                else resource.get("rendimiento"),
                "0",
            )
            unit_work = _as_decimal(resource.get("trabajo_relativo"), "0")
            if unit_work <= 0:
                unit_work = quantity * rendimiento
            if quantity > 0 and unit_work > 0:
                rendimiento = unit_work / quantity
            if category_key in unit_breakdown:
                unit_breakdown[category_key] += unit_work
            if category_key in crew_breakdown:
                crew_breakdown[category_key] += quantity
            if category_id in {1, 4} and unit_work > 0:
                total_work = unit_work * budget_quantity
                candidates.append(
                    {
                        "recurso_id": resource.get("recurso_id"),
                        "nombre": resource.get("descripcion") or resource.get("recurso"),
                        "categoria": (
                            "Equipos y Herramientas"
                            if category_id == 1
                            else "Mano de Obra"
                        ),
                        "categoria_detalle": resource.get("origin") or "operativo",
                        "categoria_detalle_label": resource.get("origin") or "Operativo",
                        "priority": 1 if category_id == 4 else 2,
                        "rendimiento_horas_unidad": rendimiento,
                        "cantidad_total": budget_quantity,
                        "cantidad_cuadrilla": quantity,
                        "trabajo_horas": total_work,
                        "costo_total": Decimal("0"),
                        "costo_hora": Decimal("0"),
                        "order_index": index,
                    }
                )

        breakdown = {
            key: value * budget_quantity
            for key, value in unit_breakdown.items()
        }
        return {
            "unit_breakdown": unit_breakdown,
            "breakdown": breakdown,
            "crew_breakdown": crew_breakdown,
            "governing_resource": self._select_governing_resource_candidate(candidates),
        }

    def _resolve_apu_line_cost_total(
        self,
        linea: APULinea,
    ) -> Decimal:
        subtotal = _as_decimal(getattr(linea, "subtotal", None), "0")
        if subtotal > 0:
            return subtotal

        quantity = _as_decimal(getattr(linea, "cantidad", None), "0")
        frozen_price = _as_decimal(getattr(linea, "precio_congelado", None), "0")
        if frozen_price > 0:
            return quantity * frozen_price

        recurso_price = _as_decimal(
            getattr(getattr(linea, "recurso", None), "precio", None), "0"
        )
        if recurso_price > 0:
            return quantity * recurso_price

        child_cost = _as_decimal(
            getattr(getattr(linea, "apu_hijo", None), "costo_directo", None)
            or getattr(getattr(linea, "apu_hijo", None), "precio_unitario_total", None),
            "0",
        )
        if child_cost > 0:
            return quantity * child_cost

        return Decimal("0")

    def _compute_apu_unit_cost_breakdown(
        self,
        apu: Optional[APU],
        cache: Dict[int, Dict[str, Decimal]],
    ) -> Dict[str, Decimal]:
        zero = {
            "equipos_herramientas": Decimal("0"),
            "materiales": Decimal("0"),
            "transporte": Decimal("0"),
            "mano_obra": Decimal("0"),
        }
        if not apu:
            return dict(zero)

        cache_key = 20_000_000 + int(apu.id)
        if cache_key in cache:
            return dict(cache[cache_key])

        breakdown = dict(zero)
        for linea in sorted(
            apu.lineas or [], key=lambda item: ((item.orden or 0), item.id or 0)
        ):
            line_cost_total = self._resolve_apu_line_cost_total(linea)
            if line_cost_total <= 0:
                continue

            if linea.apu_hijo_id and linea.apu_hijo:
                nested_breakdown = self._compute_apu_unit_cost_breakdown(
                    linea.apu_hijo, cache
                )
                nested_total = sum(nested_breakdown.values(), Decimal("0"))
                if nested_total > 0:
                    for key, value in nested_breakdown.items():
                        share = (
                            value / nested_total if nested_total > 0 else Decimal("0")
                        )
                        breakdown[key] += line_cost_total * share
                else:
                    breakdown["materiales"] += line_cost_total
                continue

            category = self._resolve_line_category(linea)
            category_key = self.CATEGORY_LABELS.get(category)
            if category_key in breakdown:
                breakdown[category_key] += line_cost_total

        cache[cache_key] = dict(breakdown)
        return dict(breakdown)

    def _compute_apu_unit_equipment_ownership_breakdown(
        self,
        apu: Optional[APU],
        cache: Dict[int, Dict[str, Decimal]],
    ) -> Dict[str, Decimal]:
        zero = {
            "owned": Decimal("0"),
            "rented": Decimal("0"),
            "unknown": Decimal("0"),
        }
        if not apu:
            return dict(zero)

        cache_key = 30_000_000 + int(apu.id)
        if cache_key in cache:
            return dict(cache[cache_key])

        breakdown = dict(zero)
        for linea in sorted(
            apu.lineas or [], key=lambda item: ((item.orden or 0), item.id or 0)
        ):
            line_cost_total = self._resolve_apu_line_cost_total(linea)
            if line_cost_total <= 0:
                continue

            if linea.apu_hijo_id and linea.apu_hijo:
                nested_breakdown = self._compute_apu_unit_equipment_ownership_breakdown(
                    linea.apu_hijo, cache
                )
                nested_total = sum(nested_breakdown.values(), Decimal("0"))
                if nested_total <= 0:
                    continue
                for key, value in nested_breakdown.items():
                    share = value / nested_total if nested_total > 0 else Decimal("0")
                    breakdown[key] += line_cost_total * share
                continue

            if self._resolve_line_category(linea) != 1:
                continue

            ownership_kind = self._normalize_equipment_ownership_kind(
                getattr(
                    getattr(linea, "recurso", None), "equipment_ownership_kind", None
                )
            )
            bucket = ownership_kind if ownership_kind else "unknown"
            breakdown[bucket] += line_cost_total

        cache[cache_key] = dict(breakdown)
        return dict(breakdown)

    def _compute_apu_unit_structure_breakdown(
        self,
        apu: Optional[APU],
        cache: Dict[int, Dict[str, Decimal]],
    ) -> Dict[str, Decimal]:
        zero = {
            "trabajo_propio": Decimal("0"),
            "trabajo_hijos": Decimal("0"),
            "cuadrilla_propia": Decimal("0"),
            "cuadrilla_hijos": Decimal("0"),
            "native_line_count": Decimal("0"),
            "nested_line_count": Decimal("0"),
        }
        if not apu:
            return dict(zero)

        cache_key = 10_000_000 + int(apu.id)
        if cache_key in cache:
            return dict(cache[cache_key])

        breakdown = dict(zero)
        native_lines = sorted(
            [line for line in (apu.lineas or []) if not line.apu_hijo_id],
            key=lambda item: ((item.orden or 0), item.id or 0),
        )
        nested_lines = sorted(
            [line for line in (apu.lineas or []) if line.apu_hijo_id],
            key=lambda item: ((item.orden or 0), item.id or 0),
        )

        breakdown["native_line_count"] = Decimal(str(len(native_lines)))
        breakdown["nested_line_count"] = Decimal(str(len(nested_lines)))

        for linea in native_lines:
            quantity = _as_decimal(linea.cantidad, "0")
            rendimiento = _as_decimal(linea.rendimiento, "1")
            factor = quantity * rendimiento
            category = self._resolve_line_category(linea)
            category_key = self.CATEGORY_LABELS.get(category)

            if category_key in {"equipos_herramientas", "mano_obra"}:
                breakdown["cuadrilla_propia"] += quantity
            if category_key and category_key != "materiales":
                breakdown["trabajo_propio"] += factor

        for linea in nested_lines:
            if not linea.apu_hijo:
                continue
            quantity = _as_decimal(linea.cantidad, "0")
            rendimiento = _as_decimal(linea.rendimiento, "1")
            factor = quantity * rendimiento
            nested_structure = self._compute_apu_unit_structure_breakdown(
                linea.apu_hijo, cache
            )
            nested_crew = self._compute_apu_unit_crew_breakdown(linea.apu_hijo, cache)
            nested_work = self._compute_apu_unit_breakdown(linea.apu_hijo, cache)
            breakdown["trabajo_hijos"] += (
                nested_work["equipos_herramientas"]
                + nested_work["mano_obra"]
                + nested_work["transporte"]
            ) * factor
            breakdown["cuadrilla_hijos"] += (
                nested_crew["equipos_herramientas"] + nested_crew["mano_obra"]
            ) * factor
            breakdown["native_line_count"] += nested_structure["native_line_count"]
            breakdown["nested_line_count"] += nested_structure["nested_line_count"]

        cache[cache_key] = dict(breakdown)
        return dict(breakdown)

    def _compute_apu_unit_crew_breakdown(
        self,
        apu: Optional[APU],
        cache: Dict[int, Dict[str, Decimal]],
    ) -> Dict[str, Decimal]:
        zero = {
            "equipos_herramientas": Decimal("0"),
            "mano_obra": Decimal("0"),
        }
        if not apu:
            return dict(zero)
        cache_key = -int(apu.id)
        if cache_key in cache:
            return dict(cache[cache_key])

        breakdown = dict(zero)
        for linea in sorted(
            apu.lineas or [], key=lambda item: ((item.orden or 0), item.id or 0)
        ):
            quantity = _as_decimal(linea.cantidad, "0")
            rendimiento = _as_decimal(linea.rendimiento, "1")
            factor = quantity * rendimiento
            category = self._resolve_line_category(linea)
            category_key = self.CATEGORY_LABELS.get(category)

            if linea.apu_hijo_id and linea.apu_hijo:
                nested_breakdown = self._compute_apu_unit_crew_breakdown(
                    linea.apu_hijo, cache
                )
                for key, value in nested_breakdown.items():
                    breakdown[key] += value * factor
                continue

            if category_key == "equipos_herramientas":
                breakdown["equipos_herramientas"] += quantity
            elif category_key == "mano_obra":
                breakdown["mano_obra"] += quantity

        cache[cache_key] = dict(breakdown)
        return dict(breakdown)

    def _resolve_apu_calculation_mode(self, apu: Optional[APU]) -> Tuple[str, int]:
        if not apu:
            return "simple", 0
        nested_lines = [line for line in (apu.lineas or []) if line.apu_hijo_id]
        nested_count = len(nested_lines)
        if nested_count == 0:
            return "simple", 0
        native_lines = [line for line in (apu.lineas or []) if not line.apu_hijo_id]
        if native_lines:
            return "apu_unificado", nested_count
        has_quantity_variant = any(
            _as_decimal(line.cantidad, "1") != Decimal("1")
            or _as_decimal(line.rendimiento, "1") != Decimal("1")
            for line in nested_lines
        )
        if has_quantity_variant:
            return "apu_anidado_con_cantidad", nested_count
        return "apu_anidado", nested_count

    def _resolve_shift_factor(self, turno: Optional[str]) -> Decimal:
        normalized = str(turno or "diurno").strip().lower()
        return self.SHIFT_FACTORS.get(normalized, Decimal("1"))

    def _build_duration_model_metadata(
        self,
        *,
        row_metadata: Optional[dict],
        progress_pct: float,
        jornada: Decimal,
        trabajo_gobernante: Decimal,
        recursos_asumidos: Decimal,
        rendimiento_gobernante_categoria: Optional[str],
        recurso_gobernante: Optional[Dict[str, Any]] = None,
    ) -> dict:
        row_metadata = dict(row_metadata or {})
        turno = str(row_metadata.get("turno") or "diurno").strip().lower()
        turno_factor = self._resolve_shift_factor(turno)
        factor_eficiencia = Decimal(
            str(max(_to_float(row_metadata.get("factor_eficiencia"), 1.0), 0.000001))
        )
        avance_real_ratio = Decimal(
            str(max(min(_to_float(progress_pct, 0.0) / 100.0, 1.0), 0.0))
        )
        jornada_segura = jornada if jornada > 0 else Decimal("8")
        cuadrilla_segura = recursos_asumidos if recursos_asumidos > 0 else Decimal("1")
        productividad_factor = turno_factor * factor_eficiencia
        if productividad_factor <= 0:
            productividad_factor = Decimal("1")
        duracion_base_horas = max(trabajo_gobernante, Decimal("0"))
        duracion_base_dias = (
            duracion_base_horas / jornada_segura if jornada_segura > 0 else Decimal("0")
        )
        duracion_referencia_horas = (
            duracion_base_horas / productividad_factor
            if productividad_factor > 0
            else duracion_base_horas
        )
        duracion_referencia_dias = (
            duracion_referencia_horas / jornada_segura
            if jornada_segura > 0
            else Decimal("0")
        )
        trabajo_remanente_horas = trabajo_gobernante * (
            Decimal("1") - avance_real_ratio
        )
        duracion_remanente_horas = duracion_referencia_horas * (
            Decimal("1") - avance_real_ratio
        )
        duracion_remanente_dias = (
            duracion_remanente_horas / jornada_segura
            if jornada_segura > 0
            else Decimal("0")
        )
        return {
            "version": "apu_duration_reference_v1",
            "governing_category": rendimiento_gobernante_categoria,
            "governing_resource_id": (
                recurso_gobernante.get("recurso_id") if recurso_gobernante else None
            ),
            "governing_resource_name": (
                recurso_gobernante.get("nombre") if recurso_gobernante else None
            ),
            "governing_resource_kind": (
                recurso_gobernante.get("categoria_detalle")
                if recurso_gobernante
                else None
            ),
            "governing_resource_kind_label": (
                recurso_gobernante.get("categoria_detalle_label")
                if recurso_gobernante
                else None
            ),
            "governing_resource_criterion": (
                recurso_gobernante.get("criterio_aplicado")
                if recurso_gobernante
                else None
            ),
            "governing_resource_cost_per_hour": (
                round(_to_float(recurso_gobernante.get("costo_hora"), 0.0), 4)
                if recurso_gobernante
                else 0.0
            ),
            "turno": turno,
            "turno_factor": round(_to_float(turno_factor), 4),
            "factor_eficiencia": round(_to_float(factor_eficiencia), 4),
            "avance_real_pct": round(_to_float(avance_real_ratio * Decimal("100")), 2),
            "jornada_horas": round(_to_float(jornada_segura), 4),
            "cuadrilla_asumida": round(_to_float(cuadrilla_segura), 4),
            "trabajo_gobernante_horas": round(_to_float(trabajo_gobernante), 4),
            "trabajo_remanente_horas": round(_to_float(trabajo_remanente_horas), 4),
            "duracion_base_horas": round(_to_float(duracion_base_horas), 4),
            "duracion_base_dias": round(_to_float(duracion_base_dias), 4),
            "duracion_referencia_horas": round(_to_float(duracion_referencia_horas), 4),
            "duracion_referencia_dias": round(_to_float(duracion_referencia_dias), 4),
            "duracion_remanente_horas": round(_to_float(duracion_remanente_horas), 4),
            "duracion_remanente_dias": round(_to_float(duracion_remanente_dias), 4),
            "editable_en_gantt": False,
            "notes": "Referencia técnica visible; aún no sustituye la duración operativa vigente.",
        }

    def _build_cost_model_metadata(
        self,
        *,
        apu: Optional[APU],
        budget_line_total: Decimal,
        budget_quantity: Decimal,
        unit_cost_breakdown: Dict[str, Decimal],
        equipment_ownership_breakdown: Optional[Dict[str, Decimal]] = None,
        current_duration_days: Decimal,
        current_duration_hours: Decimal,
        dec_cost: int = 4,
    ) -> dict:
        quantity = budget_quantity if budget_quantity > 0 else Decimal("1")
        unit_direct_cost = _as_decimal(getattr(apu, "costo_directo", None), "0")
        base_line_direct_cost = unit_direct_cost * quantity
        line_direct_cost = (
            budget_line_total if budget_line_total > 0 else unit_direct_cost * quantity
        )

        category_line_costs = {
            "Equipos y Herramientas": unit_cost_breakdown.get(
                "equipos_herramientas", Decimal("0")
            )
            * quantity,
            "Materiales": unit_cost_breakdown.get("materiales", Decimal("0"))
            * quantity,
            "Transporte": unit_cost_breakdown.get("transporte", Decimal("0"))
            * quantity,
            "Mano de Obra": unit_cost_breakdown.get("mano_obra", Decimal("0"))
            * quantity,
        }
        category_unit_costs = {
            "Equipos y Herramientas": unit_cost_breakdown.get(
                "equipos_herramientas", Decimal("0")
            ),
            "Materiales": unit_cost_breakdown.get("materiales", Decimal("0")),
            "Transporte": unit_cost_breakdown.get("transporte", Decimal("0")),
            "Mano de Obra": unit_cost_breakdown.get("mano_obra", Decimal("0")),
        }
        time_dependent_categories = (
            "Equipos y Herramientas",
            "Transporte",
            "Mano de Obra",
        )
        quantity_dependent_categories = ("Materiales",)
        time_dependent_cost = sum(
            (category_line_costs[label] for label in time_dependent_categories),
            Decimal("0"),
        )
        quantity_dependent_cost = sum(
            (category_line_costs[label] for label in quantity_dependent_categories),
            Decimal("0"),
        )
        total_cost = (
            line_direct_cost
            if line_direct_cost > 0
            else time_dependent_cost + quantity_dependent_cost
        )
        if total_cost <= 0:
            total_cost = time_dependent_cost + quantity_dependent_cost
        operational_line_cost = time_dependent_cost + quantity_dependent_cost
        official_budget_line_total = (
            budget_line_total if budget_line_total > 0 else base_line_direct_cost
        )
        price_source = (
            "presupuesto_linea"
            if budget_line_total > 0
            else "apu_base"
        )

        dominant_time_category = None
        if time_dependent_cost > 0:
            dominant_time_category = max(
                time_dependent_categories,
                key=lambda label: category_line_costs.get(label, Decimal("0")),
            )

        current_duration_days_safe = (
            current_duration_days if current_duration_days > 0 else Decimal("0")
        )
        current_duration_hours_safe = (
            current_duration_hours if current_duration_hours > 0 else Decimal("0")
        )
        temporal_cost_per_day = (
            time_dependent_cost / current_duration_days_safe
            if current_duration_days_safe > 0 and time_dependent_cost > 0
            else Decimal("0")
        )
        temporal_cost_per_hour = (
            time_dependent_cost / current_duration_hours_safe
            if current_duration_hours_safe > 0 and time_dependent_cost > 0
            else Decimal("0")
        )
        equipment_cost_present = (
            category_line_costs.get("Equipos y Herramientas", Decimal("0")) > 0
        )
        ownership_breakdown = equipment_ownership_breakdown or {}
        equipment_owned_cost = max(
            _as_decimal(ownership_breakdown.get("owned"), "0") * quantity, Decimal("0")
        )
        equipment_rented_cost = max(
            _as_decimal(ownership_breakdown.get("rented"), "0") * quantity, Decimal("0")
        )
        equipment_unknown_cost = max(
            _as_decimal(ownership_breakdown.get("unknown"), "0") * quantity,
            Decimal("0"),
        )
        equipment_ownership_supported = equipment_cost_present
        equipment_cost_traceability_gap = bool(
            equipment_cost_present and equipment_unknown_cost > 0
        )
        missing_inputs = (
            ["equipment_ownership_kind"] if equipment_cost_traceability_gap else []
        )
        confidence_level = (
            "proxy_equipment" if equipment_cost_traceability_gap else "traceable"
        )
        blocked_for_real_crashing = bool(equipment_cost_traceability_gap)
        blocking_reason = (
            "pending_equipment_ownership_model" if blocked_for_real_crashing else ""
        )
        note = "Modelo observacional inicial: separa costo temporal y por cantidad sin recalcular todavía el cronograma valorado."
        if equipment_cost_traceability_gap:
            note = (
                f"{note} El costo de equipos sigue en modo proxy porque la capa clásica aún no distingue "
                "explícitamente entre equipo propio inactivo y equipo alquilado activo."
            )
        elif equipment_cost_present:
            note = (
                f"{note} El ownership clásico de equipos ya está declarado y permite distinguir "
                "equipo propio inactivo de equipo alquilado activo."
            )

        return {
            "version": "gantt_cost_model_v1",
            "price_source": price_source,
            "unit_direct_cost": round(_to_float(unit_direct_cost), dec_cost),
            "base_line_direct_cost": round(_to_float(base_line_direct_cost), dec_cost),
            "official_budget_line_total": round(
                _to_float(official_budget_line_total), dec_cost
            ),
            "operational_line_cost": round(_to_float(operational_line_cost), dec_cost),
            "line_direct_cost": round(_to_float(total_cost), dec_cost),
            "time_dependent_cost": round(_to_float(time_dependent_cost), dec_cost),
            "quantity_dependent_cost": round(
                _to_float(quantity_dependent_cost), dec_cost
            ),
            "time_dependent_share_pct": round(
                _to_float(
                    (time_dependent_cost / total_cost) * Decimal("100")
                    if total_cost > 0
                    else Decimal("0")
                ),
                2,
            ),
            "quantity_dependent_share_pct": round(
                _to_float(
                    (quantity_dependent_cost / total_cost) * Decimal("100")
                    if total_cost > 0
                    else Decimal("0")
                ),
                2,
            ),
            "category_unit_costs": {
                label: round(_to_float(value), dec_cost)
                for label, value in category_unit_costs.items()
                if value > 0
            },
            "category_line_costs": {
                label: round(_to_float(value), dec_cost)
                for label, value in category_line_costs.items()
                if value > 0
            },
            "time_dependent_categories": list(time_dependent_categories),
            "quantity_dependent_categories": list(quantity_dependent_categories),
            "dominant_time_category": dominant_time_category,
            "temporal_cost_per_day": round(_to_float(temporal_cost_per_day), dec_cost),
            "temporal_cost_per_hour": round(
                _to_float(temporal_cost_per_hour), dec_cost
            ),
            "idle_own_equipment_supported": equipment_cost_present
            and not equipment_cost_traceability_gap,
            "equipment_ownership_supported": equipment_ownership_supported,
            "equipment_cost_traceability_gap": equipment_cost_traceability_gap,
            "economic_confidence_level": confidence_level,
            "missing_inputs": missing_inputs,
            "blocked_for_real_crashing": blocked_for_real_crashing,
            "blocking_reason": blocking_reason,
            "next_required_capability": (
                "resource_equipment_ownership_model"
                if blocked_for_real_crashing
                else ""
            ),
            "equipment_owned_cost": round(_to_float(equipment_owned_cost), dec_cost),
            "equipment_rented_cost": round(_to_float(equipment_rented_cost), dec_cost),
            "equipment_unknown_cost": round(
                _to_float(equipment_unknown_cost), dec_cost
            ),
            "crashing_ready": bool(
                time_dependent_cost > 0 and current_duration_days_safe > 0
            ),
            "note": note,
        }

    def _build_crashing_review_metadata(
        self,
        *,
        trabajo_gobernante: Decimal,
        recursos_asumidos: Decimal,
        jornada: Decimal,
        current_export_duration_days: Decimal,
        temporal_cost_per_day: Decimal,
        dominant_time_category: Optional[str],
        dominant_category_line_cost: Decimal = Decimal("0"),
        dominant_category_crew_units: Decimal = Decimal("0"),
        equipment_ownership_breakdown: Optional[Dict[str, Decimal]] = None,
    ) -> dict:
        jornada_segura = jornada if jornada > 0 else Decimal("8")
        recursos_actuales = recursos_asumidos if recursos_asumidos > 0 else Decimal("1")
        recursos_siguiente = recursos_actuales + Decimal("1")
        next_contract = self._resolve_dual_duration_contract(
            trabajo_gobernante=trabajo_gobernante,
            recursos_asumidos=recursos_siguiente,
            jornada=jornada_segura,
        )
        next_export_duration_days = _as_decimal(
            next_contract.get("export_duration_days"), "0"
        )
        days_saved = max(
            Decimal("0"), current_export_duration_days - next_export_duration_days
        )
        temporal_cost_release = max(
            Decimal("0"), days_saved * max(temporal_cost_per_day, Decimal("0"))
        )
        dominant_cost = max(dominant_category_line_cost, Decimal("0"))
        dominant_crew = (
            dominant_category_crew_units
            if dominant_category_crew_units > 0
            else Decimal("0")
        )
        dominant_daily_cost = (
            dominant_cost / current_export_duration_days
            if dominant_cost > 0 and current_export_duration_days > 0
            else Decimal("0")
        )
        ownership_breakdown = equipment_ownership_breakdown or {}
        equipment_owned_cost = max(
            _as_decimal(ownership_breakdown.get("owned"), "0"), Decimal("0")
        )
        equipment_rented_cost = max(
            _as_decimal(ownership_breakdown.get("rented"), "0"), Decimal("0")
        )
        equipment_unknown_cost = max(
            _as_decimal(ownership_breakdown.get("unknown"), "0"), Decimal("0")
        )
        equipment_cost_traceability_gap = bool(
            dominant_time_category == "Equipos y Herramientas"
            and equipment_unknown_cost > 0
        )
        equipment_ownership_supported = bool(
            dominant_time_category == "Equipos y Herramientas"
        )
        if (
            dominant_time_category == "Equipos y Herramientas"
            and current_export_duration_days > 0
            and not equipment_cost_traceability_gap
        ):
            dominant_daily_cost = (
                equipment_rented_cost / current_export_duration_days
                if equipment_rented_cost > 0
                else Decimal("0")
            )
        proxy_denominator = dominant_crew if dominant_crew > 0 else recursos_actuales
        incremental_resource_daily_cost_proxy = (
            dominant_daily_cost / proxy_denominator
            if dominant_daily_cost > 0 and proxy_denominator > 0
            else Decimal("0")
        )
        incremental_resource_total_cost_proxy = (
            incremental_resource_daily_cost_proxy * next_export_duration_days
            if incremental_resource_daily_cost_proxy > 0
            and next_export_duration_days > 0
            else Decimal("0")
        )
        net_crashing_cost_delta_proxy = (
            incremental_resource_total_cost_proxy - temporal_cost_release
        )
        incremental_cost_per_day_saved_proxy = (
            net_crashing_cost_delta_proxy / days_saved
            if days_saved > 0
            else Decimal("0")
        )
        missing_inputs = (
            ["equipment_ownership_kind"] if equipment_cost_traceability_gap else []
        )
        confidence_level = (
            "proxy_equipment" if equipment_cost_traceability_gap else "traceable"
        )
        blocked_for_real_crashing = bool(equipment_cost_traceability_gap)
        blocking_reason = (
            "pending_equipment_ownership_model" if blocked_for_real_crashing else ""
        )
        review_ready = bool(
            trabajo_gobernante > 0
            and jornada_segura > 0
            and recursos_actuales > 0
            and current_export_duration_days > 0
            and days_saved > 0
        )
        note = (
            "Lectura preliminar de crashing usando la fórmula de exportación por recursos asumidos y un proxy del "
            "costo incremental del recurso adicional. Aún no modela el crashing económico completo."
        )
        if equipment_cost_traceability_gap:
            note = (
                f"{note} Si gobierna `Equipos y Herramientas`, el costo incremental sigue siendo proxy porque "
                "la capa clásica todavía no distingue equipo propio vs alquilado."
            )
        elif dominant_time_category == "Equipos y Herramientas":
            note = (
                f"{note} Para equipos clásicos, el crashing considera costo incremental activo solo para equipo "
                "alquilado; el equipo propio ya comprometido se trata como costo temporal liberable."
            )
        return {
            "version": "gantt_crashing_review_v1",
            "review_ready": review_ready,
            "current_assumed_resources": round(_to_float(recursos_actuales), 4),
            "next_assumed_resources": round(_to_float(recursos_siguiente), 4),
            "resource_delta": 1.0,
            "current_export_duration_days": round(
                _to_float(current_export_duration_days), 4
            ),
            "next_export_duration_days": round(_to_float(next_export_duration_days), 4),
            "days_saved_with_next_resource": round(_to_float(days_saved), 4),
            "temporal_cost_per_day": round(_to_float(temporal_cost_per_day), 4),
            "temporal_cost_release": round(_to_float(temporal_cost_release), 4),
            "dominant_category_line_cost": round(_to_float(dominant_cost), 4),
            "dominant_category_crew_units": round(_to_float(dominant_crew), 4),
            "incremental_resource_daily_cost_proxy": round(
                _to_float(incremental_resource_daily_cost_proxy), 4
            ),
            "incremental_resource_total_cost_proxy": round(
                _to_float(incremental_resource_total_cost_proxy), 4
            ),
            "net_crashing_cost_delta_proxy": round(
                _to_float(net_crashing_cost_delta_proxy), 4
            ),
            "incremental_cost_per_day_saved_proxy": round(
                _to_float(incremental_cost_per_day_saved_proxy), 4
            ),
            "dominant_time_category": dominant_time_category,
            "equipment_ownership_supported": equipment_ownership_supported,
            "equipment_cost_traceability_gap": equipment_cost_traceability_gap,
            "economic_confidence_level": confidence_level,
            "missing_inputs": missing_inputs,
            "blocked_for_real_crashing": blocked_for_real_crashing,
            "blocking_reason": blocking_reason,
            "next_required_capability": (
                "resource_equipment_ownership_model"
                if blocked_for_real_crashing
                else ""
            ),
            "equipment_owned_cost": round(_to_float(equipment_owned_cost), 4),
            "equipment_rented_cost": round(_to_float(equipment_rented_cost), 4),
            "equipment_unknown_cost": round(_to_float(equipment_unknown_cost), 4),
            "note": note,
        }

    def _finalize_duration_model_metadata(
        self,
        duration_model: Optional[dict],
        *,
        current_duration_days: Decimal,
    ) -> dict:
        duration_model = dict(duration_model or {})
        current_duration_value = round(_to_float(current_duration_days), 4)
        remaining_duration_value = _to_float(
            duration_model.get("duracion_remanente_dias"), 0.0
        )
        progress_pct = _to_float(duration_model.get("avance_real_pct"), 0.0)
        remaining_delta_days = round(
            remaining_duration_value - current_duration_value, 4
        )
        remaining_eligible = bool(
            progress_pct > 0.0
            and remaining_duration_value >= 0.0
            and abs(remaining_delta_days) > 0.0001
        )
        remaining_reason = ""
        if progress_pct <= 0.0:
            remaining_reason = "El avance real todavía es 0%."
        elif remaining_duration_value < 0.0:
            remaining_reason = "La duración remanente calculada no es válida."
        elif abs(remaining_delta_days) <= 0.0001:
            remaining_reason = (
                "La duración vigente ya coincide con la duración remanente técnica."
            )
        duration_model["remaining_duration_recommendation"] = {
            "source": "apu_duration_reference_v1",
            "eligible": remaining_eligible,
            "reason": remaining_reason,
            "recommended_duration_days": round(remaining_duration_value, 4),
            "current_duration_days": current_duration_value,
            "delta_days": remaining_delta_days,
            "progress_pct": round(progress_pct, 2),
        }
        duration_model["current_visible_duration_days"] = current_duration_value
        duration_model["remaining_duration_delta_days"] = remaining_delta_days
        duration_model["remaining_duration_eligible"] = remaining_eligible
        duration_model["remaining_duration_reason"] = remaining_reason
        return duration_model

    def _resolve_rows_dates(
        self,
        rows: list[CronogramaTrabajoComputedRow],
        project_start: Optional[datetime],
        line_overrides: Dict[str, dict],
        config: CronogramaTrabajoConfig,
        holiday_dates: Optional[set[date]] = None,
    ) -> list[CronogramaTrabajoComputedRow]:
        base_start = self._resolve_schedule_start_anchor(config, project_start)
        explicit_project_start = self._normalize_datetime_value(
            getattr(config, "fecha_inicio_proyecto", None)
        ) or self._normalize_datetime_value(project_start)
        project_start_boundary = (
            self._resolve_schedule_start_anchor(config, explicit_project_start)
            if explicit_project_start is not None
            else None
        )
        while base_start and not self._is_workday(base_start, config, holiday_dates):
            base_start = self._align_to_workday_start(
                base_start + timedelta(days=1), config
            ) or (base_start + timedelta(days=1))
        max_schedule_finish = base_start + timedelta(days=CALENDAR_LOOKAHEAD_DAYS)
        row_map = {int(row.presupuesto_linea_id): row for row in rows}

        resolved: Dict[int, Tuple[datetime, datetime]] = {}

        def resolve_row_dates(
            line_id: int, visiting: Optional[set[int]] = None
        ) -> Tuple[datetime, datetime]:
            if line_id in resolved:
                return resolved[line_id]
            row = row_map.get(line_id)
            if not row:
                return base_start, base_start

            visiting = visiting or set()
            if line_id in visiting:
                start_date = (
                    self._align_to_workday_start(row.start_date or base_start, config)
                    or base_start
                )
                end_date = (
                    self._align_to_workday_finish(row.end_date, config, holiday_dates)
                    or self._build_finish_from_start(
                        start_date,
                        row.dias_calendario or row.dias_utiles or 1,
                        config,
                        holiday_dates,
                    )
                    or start_date
                )
                resolved[line_id] = (start_date, end_date)
                return resolved[line_id]

            visiting.add(line_id)
            override = self._resolve_line_override(line_overrides.get(str(line_id)))
            dependencies = [
                dependency
                for dependency in self._resolve_line_dependencies(line_id, override)
                if int(getattr(dependency, "source_id", 0) or 0) in row_map
                and int(getattr(dependency, "source_id", 0) or 0) != line_id
            ]
            row.dependencies = dependencies
            row.predecessors = [
                int(dependency.source_id) for dependency in dependencies
            ]
            target_duration_days = _to_float(
                row.dias_calendario or row.dias_utiles or 0.0, 0.0
            )

            if dependencies:
                constrained_starts = []
                for dependency in dependencies:
                    source_id = int(getattr(dependency, "source_id", 0) or 0)
                    source_start, source_finish = resolve_row_dates(source_id, visiting)
                    candidate_start = self._resolve_dependency_target_start(
                        source_start,
                        source_finish,
                        target_duration_days,
                        dependency,
                        config,
                        holiday_dates,
                    )
                    if candidate_start is not None:
                        if (
                            project_start_boundary is not None
                            and candidate_start < project_start_boundary
                        ):
                            row_reference = (
                                str(getattr(row, "codigo_item", "") or "").strip()
                                or str(getattr(row, "descripcion", "") or "").strip()
                                or f"Línea {getattr(row, 'presupuesto_linea_id', '')}"
                            )
                            raise ValueError(
                                "Operación cancelada: ninguna tarea puede iniciar antes de la fecha/hora de inicio del proyecto. "
                                f"La tarea {row_reference} comienza en {candidate_start.isoformat()} y el proyecto inicia en {project_start_boundary.isoformat()}."
                            )
                        constrained_starts.append(candidate_start)
                start_date = (
                    max(constrained_starts)
                    if constrained_starts
                    else base_start
                )
            elif override.start_date:
                start_candidate = self._normalize_datetime_value(override.start_date)
                if (
                    start_candidate is not None
                    and start_candidate <= max_schedule_finish
                ):
                    start_date = (
                        self._align_to_workday_start(start_candidate, config)
                        or base_start
                    )
                else:
                    start_date = base_start
            else:
                start_date = base_start

            # TASK-1859: el bucle post-anclaje solo aplica a filas sin dependencias.
            # Cuando hay dependencias, cada _resolve_dependency_target_start ya aplico
            # la politica de ajuste correspondiente al tipo de dependencia y lag.
            if not dependencies:
                while start_date and not self._is_workday(
                    start_date, config, holiday_dates
                ):
                    start_date = self._align_to_workday_start(
                        start_date + timedelta(days=1), config
                    ) or (start_date + timedelta(days=1))

            if dependencies:
                end_date = (
                    self._build_finish_from_start(
                        start_date,
                        row.dias_calendario or row.dias_utiles or 1,
                        config,
                        holiday_dates,
                    )
                    or start_date
                )
            elif override.end_date:
                end_candidate = self._normalize_datetime_value(override.end_date)
                explicit_end = (
                    self._align_to_workday_finish(
                        end_candidate, config, holiday_dates
                    )
                    if end_candidate is not None
                    and end_candidate <= max_schedule_finish
                    else None
                )
                if explicit_end and explicit_end >= start_date:
                    end_date = explicit_end
                else:
                    end_date = (
                        self._build_finish_from_start(
                            start_date,
                            row.dias_calendario or row.dias_utiles or 1,
                            config,
                            holiday_dates,
                        )
                        or start_date
                    )
            else:
                end_date = (
                    self._build_finish_from_start(
                        start_date,
                        row.dias_calendario or row.dias_utiles or 1,
                        config,
                        holiday_dates,
                    )
                    or start_date
                )

            row.start_date = start_date
            row.end_date = end_date
            resolved[line_id] = (start_date, end_date)
            visiting.remove(line_id)
            return resolved[line_id]

        for row in rows:
            resolve_row_dates(int(row.presupuesto_linea_id), set())

        return rows

    def _validate_rows_not_before_project_start(
        self,
        rows: list[CronogramaTrabajoComputedRow],
        project_start: Optional[datetime],
        config: CronogramaTrabajoConfig,
        holiday_dates: Optional[set[date]] = None,
    ) -> None:
        project_start_anchor = self._resolve_schedule_start_anchor(config, project_start)
        while project_start_anchor and not self._is_workday(
            project_start_anchor, config, holiday_dates
        ):
            project_start_anchor = self._align_to_workday_start(
                project_start_anchor + timedelta(days=1), config
            ) or (project_start_anchor + timedelta(days=1))
        if project_start_anchor is None:
            return

        for row in rows or []:
            row_start = self._normalize_datetime_value(getattr(row, "start_date", None))
            if row_start is None or row_start >= project_start_anchor:
                continue
            row_reference = (
                str(getattr(row, "codigo_item", "") or "").strip()
                or str(getattr(row, "descripcion", "") or "").strip()
                or f"Línea {getattr(row, 'presupuesto_linea_id', '')}"
            )
            raise ValueError(
                "Operación cancelada: ninguna tarea puede iniciar antes de la fecha/hora de inicio del proyecto. "
                f"La tarea {row_reference} comienza en {row_start.isoformat()} y el proyecto inicia en {project_start_anchor.isoformat()}."
            )

    def _measure_work_duration_days(
        self,
        start: Optional[datetime],
        finish: Optional[datetime],
        config: CronogramaTrabajoConfig,
        holiday_dates: Optional[set[date]] = None,
    ) -> float:
        start = self._normalize_datetime_value(start)
        finish = self._normalize_datetime_value(finish)
        if start is None or finish is None or finish <= start:
            return 0.0

        jornada = max(_to_float(config.jornada_laboral_horas, 8.0), 1.0)
        total_hours = 0.0
        cursor = start.replace(hour=0, minute=0, second=0, microsecond=0)
        end_day = finish.replace(hour=0, minute=0, second=0, microsecond=0)

        for _ in range(10000):
            if cursor > end_day:
                break

            if self._uses_advanced_calendar(config):
                windows = self._advanced_slot_datetimes(cursor.date(), config, holiday_dates)
            elif self._is_workday(cursor, config, holiday_dates):
                work_start = self._resolve_workday_day_start(cursor, config) or cursor
                windows = [(work_start, work_start + timedelta(hours=jornada))]
            else:
                windows = []

            for window_start, window_finish in windows:
                overlap_start = max(start, window_start)
                overlap_finish = min(finish, window_finish)
                if overlap_finish > overlap_start:
                    total_hours += (overlap_finish - overlap_start).total_seconds() / 3600.0

            cursor = cursor + timedelta(days=1)

        return total_hours / jornada

    def _dependency_lag_to_work_days(
        self,
        dependency: CronogramaTrabajoDependency,
        config: CronogramaTrabajoConfig,
        source_duration_days: Optional[float] = None,
    ) -> float:
        lag_days = _to_float(getattr(dependency, "lag_days", 0.0), 0.0)
        lag_unit = str(getattr(dependency, "lag_unit", "day") or "day").lower()
        if lag_unit == "percent":
            return (lag_days / 100.0) * max(_to_float(source_duration_days, 0.0), 0.0)
        if lag_unit == "minute":
            jornada = max(_to_float(config.jornada_laboral_horas, 8.0), 1.0)
            return (lag_days / 60.0) / jornada
        if lag_unit != "hour":
            return lag_days
        jornada = max(_to_float(config.jornada_laboral_horas, 8.0), 1.0)
        return lag_days / jornada

    def _resolve_cpm_row_duration_days(
        self,
        row: CronogramaTrabajoComputedRow,
        config: CronogramaTrabajoConfig,
        holiday_dates: Optional[set[date]] = None,
    ) -> float:
        start_date = self._normalize_datetime_value(getattr(row, "start_date", None))
        end_date = self._normalize_datetime_value(getattr(row, "end_date", None))
        if start_date is not None and end_date is not None and end_date >= start_date:
            visible_duration = self._measure_work_duration_days(
                start_date,
                end_date,
                config,
                holiday_dates or set(),
            )
            if visible_duration > 0:
                return visible_duration
        duration_days = _to_float(getattr(row, "dias_utiles", 0.0), 0.0)
        if duration_days > 0:
            return duration_days
        duration_hours = _to_float(getattr(row, "duracion_horas", 0.0), 0.0)
        jornada = max(_to_float(config.jornada_laboral_horas, 8.0), 1.0)
        return duration_hours / jornada if duration_hours > 0 else 0.0

    def _resolve_cpm_row_restriction(
        self, row: CronogramaTrabajoComputedRow
    ) -> tuple[Optional[str], Optional[float]]:
        metadata = dict(getattr(row, "metadata", {}) or {})
        restriction_type = str(
            metadata.get("restriction_type") or metadata.get("restriccion_tipo") or ""
        ).upper()
        restriction_value = metadata.get("restriction_value")
        if restriction_value is None:
            restriction_value = metadata.get("restriccion_valor")
        try:
            restriction_value = (
                float(restriction_value) if restriction_value is not None else None
            )
        except Exception:
            restriction_value = None
        return (restriction_type or None, restriction_value)

    def _build_cpm_activities(
        self,
        rows: list[CronogramaTrabajoComputedRow],
        config: CronogramaTrabajoConfig,
        holiday_dates: Optional[set[date]] = None,
    ) -> Dict[str, ActividadCpm]:
        activities: Dict[str, ActividadCpm] = {}
        valid_ids = {str(int(row.presupuesto_linea_id)) for row in rows}
        durations_by_id = {
            str(int(row.presupuesto_linea_id)): self._resolve_cpm_row_duration_days(
                row, config, holiday_dates
            )
            for row in rows
        }
        for row in rows:
            row_id = str(int(row.presupuesto_linea_id))
            restriction_type, restriction_value = self._resolve_cpm_row_restriction(row)
            dependencies = []
            for dependency in list(row.dependencies or []):
                source_id = str(int(dependency.source_id))
                if source_id not in valid_ids or source_id == row_id:
                    continue
                dependencies.append(
                    DependenciaCpm(
                        predecesor_id=source_id,
                        tipo=getattr(dependency, "type", "FS"),
                        lag=self._dependency_lag_to_work_days(
                            dependency,
                            config,
                            source_duration_days=durations_by_id.get(source_id),
                        ),
                    )
                )
            metadata = dict(row.metadata or {})
            activities[row_id] = ActividadCpm(
                id=row_id,
                nombre=row.descripcion,
                duracion=durations_by_id.get(row_id, 0.0),
                predecesores=dependencies,
                calendario_id=metadata.get("calendar_id")
                or metadata.get("calendario_id"),
                turno=str(metadata.get("turno") or "diurno").lower(),
                factor_eficiencia=max(
                    _to_float(metadata.get("factor_eficiencia"), 1.0), 0.000001
                ),
                restriccion_tipo=restriction_type,
                restriccion_valor=restriction_value,
                avance_real=max(
                    min(_to_float(row.progress_pct, 0.0) / 100.0, 1.0), 0.0
                ),
            )
        return activities

    def _decorate_rows_with_cpm_metadata(
        self,
        rows: list[CronogramaTrabajoComputedRow],
        config: CronogramaTrabajoConfig,
        holiday_dates: Optional[set[date]] = None,
    ) -> list[CronogramaTrabajoComputedRow]:
        if not rows:
            return rows

        visible_anchor = min(
            (
                self._normalize_datetime_value(
                    self._align_to_workday_start(row.start_date, config)
                )
                for row in rows
                if row.start_date is not None
            ),
            default=None,
        )

        try:
            result = self.CPM_ENGINE.calcular(
                self._build_cpm_activities(rows, config, holiday_dates)
            )
        except Exception as exc:
            warning = f"CPM paralelo no disponible: {exc}"
            for row in rows:
                next_metadata = dict(row.metadata or {})
                next_metadata["cpm_warning"] = warning
                next_metadata["cpm_available"] = False
                row.metadata = next_metadata
            return rows

        warning_list = list(result.advertencias or [])
        critical_paths = [
            [str(node_id) for node_id in path if str(node_id)]
            for path in list(result.rutas_criticas or [])
            if isinstance(path, list) and path
        ]
        critical_path_count = len(critical_paths)
        project_duration_days = round(float(result.duracion_total or 0.0), 4)
        for row in rows:
            row_id = str(int(row.presupuesto_linea_id))
            activity = result.actividades.get(row_id)
            if activity is None:
                continue
            next_metadata = dict(row.metadata or {})
            critical_path_indexes = [
                index + 1
                for index, path in enumerate(critical_paths)
                if row_id in path
            ]
            restriction_state = "none"
            if activity.restriccion_tipo in {"MSO", "MFO"}:
                restriction_state = "hard"
            elif activity.restriccion_tipo in {"SNET", "SNLT", "FNET", "FNLT"}:
                restriction_state = "window"
            next_metadata["cpm_available"] = True
            next_metadata["is_critical"] = bool(activity.es_critica)
            next_metadata["critical"] = bool(activity.es_critica)
            next_metadata["has_negative_float"] = bool(activity.holgura_total < 0)
            visible_start = self._normalize_datetime_value(
                self._align_to_workday_start(row.start_date, config)
            )
            visible_finish = self._align_to_workday_finish(
                row.end_date, config, holiday_dates
            )
            visible_start_days = None
            visible_finish_days = None
            if visible_anchor is not None and visible_start is not None:
                visible_start_days = round(
                    (visible_start - visible_anchor).total_seconds() / 86400.0,
                    4,
                )
            if visible_anchor is not None and visible_finish is not None:
                visible_finish_days = round(
                    (visible_finish - visible_anchor).total_seconds() / 86400.0,
                    4,
                )
            visible_duration_days = round(
                _to_float(
                    getattr(row, "dias_utiles", 0.0),
                    _to_float(getattr(row, "dias_calendario", 0.0), 0.0),
                ),
                4,
            )
            recommended_start = None
            recommended_finish = None
            recommended_duration_days = round(float(activity.duracion_efectiva), 4)
            if visible_anchor is not None:
                recommended_start = self._align_to_workday_start(
                    visible_anchor + timedelta(days=float(activity.es)),
                    config,
                )
                recommended_finish = (
                    self._build_finish_from_start(
                        recommended_start,
                        float(activity.duracion_efectiva),
                        config,
                        holiday_dates,
                    )
                    if recommended_start is not None
                    else None
                )
            drift_start_days = (
                round(visible_start_days - float(activity.es), 4)
                if visible_start_days is not None
                else None
            )
            drift_finish_days = (
                round(visible_finish_days - float(activity.ef), 4)
                if visible_finish_days is not None
                else None
            )
            drift_duration_days = round(
                visible_duration_days - float(activity.duracion_efectiva), 4
            )
            has_schedule_drift = any(
                abs(value) > 0.0001
                for value in [drift_start_days, drift_finish_days, drift_duration_days]
                if value is not None
            )
            reconciliation_eligible = bool(
                has_schedule_drift
                and recommended_start is not None
                and recommended_finish is not None
                and recommended_duration_days >= 0
            )
            reconciliation_reason = ""
            if not has_schedule_drift:
                reconciliation_reason = ""
            elif recommended_start is None or recommended_finish is None:
                reconciliation_reason = (
                    "No hay una programación CPM recomendada disponible."
                )
            elif recommended_duration_days < 0:
                reconciliation_reason = "La duración CPM recomendada no es válida."
            next_metadata["cpm"] = {
                "early_start_days": round(float(activity.es), 4),
                "early_finish_days": round(float(activity.ef), 4),
                "late_start_days": round(float(activity.ls), 4),
                "late_finish_days": round(float(activity.lf), 4),
                "total_float_days": round(float(activity.holgura_total), 4),
                "free_float_days": round(float(activity.holgura_libre), 4),
                "effective_duration_days": round(float(activity.duracion_efectiva), 4),
                "restriction_type": activity.restriccion_tipo,
                "restriction_value": activity.restriccion_valor,
                "restriction_state": restriction_state,
                "critical_path_indexes": critical_path_indexes,
                "critical_path_count": critical_path_count,
                "project_duration_days": project_duration_days,
            }
            next_metadata["cpm_network"] = {
                "project_duration_days": project_duration_days,
                "critical_path_count": critical_path_count,
                "critical_paths": critical_paths,
                "critical_path_indexes": critical_path_indexes,
                "has_negative_float": bool(result.tiene_holgura_negativa),
                "warnings": warning_list,
            }
            next_metadata["cpm_schedule_alignment"] = {
                "status": "warning" if has_schedule_drift else "aligned",
                "has_drift": has_schedule_drift,
                "visible_anchor_start": (
                    visible_anchor.isoformat() if visible_anchor is not None else None
                ),
                "visible_start_days": visible_start_days,
                "visible_finish_days": visible_finish_days,
                "visible_duration_days": visible_duration_days,
                "recommended_start": (
                    recommended_start.isoformat()
                    if recommended_start is not None
                    else None
                ),
                "recommended_finish": (
                    recommended_finish.isoformat()
                    if recommended_finish is not None
                    else None
                ),
                "recommended_duration_days": recommended_duration_days,
                "drift_start_days": drift_start_days,
                "drift_finish_days": drift_finish_days,
                "drift_duration_days": drift_duration_days,
                "manual_reconciliation_eligible": reconciliation_eligible,
                "manual_reconciliation_reason": reconciliation_reason,
            }
            if warning_list:
                next_metadata["cpm_warnings"] = warning_list
            row.metadata = next_metadata
        return rows

    def _validate_schedule_updates(
        self,
        presupuesto: Presupuesto,
        line_updates: Dict[str, dict],
    ) -> None:
        calculable_rows = [
            detail
            for detail in sorted(
                list(presupuesto.detalle or []),
                key=lambda item: ((item.orden or 0), item.id or 0),
            )
            if detail.apu_id and detail.apu
        ]
        valid_line_ids = {int(detail.id) for detail in calculable_rows}
        dependency_graph: dict[int, list[int]] = {int(detail.id): [] for detail in calculable_rows}

        for raw_line_id, raw_value in (line_updates or {}).items():
            try:
                line_id = int(raw_line_id)
            except Exception as exc:
                raise ValueError(
                    f"Línea inválida en cronograma de trabajo: {raw_line_id}"
                ) from exc

            if line_id not in valid_line_ids:
                raise ValueError(
                    f"La línea {line_id} no pertenece a una partida calculable del presupuesto activo."
                )

            override = self._resolve_line_override(raw_value)
            if (
                override.assumed_resource_units is not None
                and float(override.assumed_resource_units) <= 0
            ):
                raise ValueError(
                    f"La línea {line_id} requiere una cuadrilla asumida mayor que cero."
                )
            if override.progress_pct is not None and (
                float(override.progress_pct) < 0 or float(override.progress_pct) > 100
            ):
                raise ValueError(
                    f"La línea {line_id} requiere un porcentaje de avance entre 0 y 100."
                )

            seen: set[int] = set()
            invalid: list[int] = []
            self_references: list[int] = []
            for dependency in self._resolve_line_dependencies(line_id, override):
                pred_id = int(dependency.source_id)
                if pred_id in seen:
                    continue
                seen.add(pred_id)
                if pred_id not in valid_line_ids:
                    invalid.append(pred_id)
                    continue
                if pred_id == line_id:
                    self_references.append(pred_id)
                    continue
                dependency_graph.setdefault(pred_id, []).append(line_id)

            if invalid:
                raise ValueError(
                    f"La línea {line_id} contiene predecesoras inexistentes en este presupuesto: {', '.join(map(str, invalid))}."
                )
            if self_references:
                raise ValueError(
                    f"La línea {line_id} no puede depender de sí misma. Revise: {', '.join(map(str, self_references))}."
                )

        visiting: set[int] = set()
        visited: set[int] = set()
        stack: list[int] = []

        def visit(node_id: int) -> Optional[list[int]]:
            if node_id in visiting:
                cycle_start = stack.index(node_id) if node_id in stack else 0
                return stack[cycle_start:] + [node_id]
            if node_id in visited:
                return None
            visiting.add(node_id)
            stack.append(node_id)
            for next_id in dependency_graph.get(node_id, []):
                cycle = visit(next_id)
                if cycle:
                    return cycle
            stack.pop()
            visiting.remove(node_id)
            visited.add(node_id)
            return None

        for node_id in dependency_graph:
            cycle = visit(node_id)
            if cycle:
                raise ValueError(
                    f"La secuenciación genera un ciclo de dependencias: {' -> '.join(map(str, cycle))}."
                )

    def _sanitize_schedule_updates_for_active_budget(
        self,
        presupuesto: Presupuesto,
        line_updates: Dict[str, dict],
    ) -> Dict[str, dict]:
        calculable_rows = [
            detail
            for detail in sorted(
                list(presupuesto.detalle or []),
                key=lambda item: ((item.orden or 0), item.id or 0),
            )
            if detail.apu_id and detail.apu
        ]
        valid_line_ids = {str(int(detail.id)) for detail in calculable_rows}
        sanitized: Dict[str, dict] = {}
        for raw_line_id, raw_value in (line_updates or {}).items():
            normalized_line_id = str(raw_line_id or "").strip()
            if normalized_line_id in valid_line_ids:
                sanitized[normalized_line_id] = raw_value
        return sanitized

    def _derive_initial_valued_segments(
        self,
        db: Session,
        presupuesto_id: int,
        empresa_id: int,
    ) -> Dict[str, List[dict]]:
        """TASK-1082: Derivar tramos iniciales reales desde Cronograma Valorado."""
        presupuesto = presupuesto_repo.get(db, presupuesto_id, empresa_id)
        if not presupuesto:
            return {}
        try:
            from app.api.endpoints.cronogramas import (  # import diferido para evitar ciclo en carga de modulo
                _build_homogeneous_distribution,
                _build_periods,
                _get_or_create_cronograma,
                _normalize_execution_window,
                _validate_distribution,
            )
        except Exception:
            self._rollback_failed_session(db)
            return {}

        try:
            cronograma = _get_or_create_cronograma(db, presupuesto)
        except Exception:
            self._rollback_failed_session(db)
            return {}

        try:
            codigo_root = getattr(getattr(presupuesto, "proyecto", None), "codigo_root", None) or getattr(
                getattr(presupuesto, "proyecto", None), "codigo", None
            )
            project_detail = None
            if codigo_root:
                project_detail = (
                    db.query(ProyectoDetalle)
                    .filter(
                        ProyectoDetalle.codigo_root == codigo_root,
                        ProyectoDetalle.empresa_id == presupuesto.empresa_id,
                    )
                    .first()
                )

            start_at, end_at = _normalize_execution_window(project_detail)
            periods = _build_periods(
                start_at,
                end_at,
                cronograma.period_type,
                project_detail.plazo_ejecucion if project_detail else None,
            )
            if not periods:
                return {}

            period_count = len(periods)
            global_distribution = list(cronograma.global_distribution or [])
            if cronograma.distribution_mode in {"gantt", "homogeneo"} or not global_distribution:
                global_distribution = _build_homogeneous_distribution(period_count)
            else:
                try:
                    global_distribution = _validate_distribution(
                        list(global_distribution),
                        period_count,
                        detail="La distribución global no coincide con el número de periodos.",
                    )
                except Exception:
                    global_distribution = _build_homogeneous_distribution(period_count)

            line_overrides = dict(cronograma.line_distribution_overrides or {})
            segments_by_line: Dict[str, List[dict]] = {}
            detail_rows = sorted(
                [line for line in list(getattr(presupuesto, "detalle", []) or []) if getattr(line, "apu_id", None)],
                key=lambda item: ((item.orden or 0), item.id or 0),
            )
            for line in detail_rows:
                line_id = int(getattr(line, "id", 0) or 0)
                if line_id <= 0:
                    continue
                override_distribution = line_overrides.get(str(line_id))
                if isinstance(override_distribution, list) and len(override_distribution) == period_count:
                    try:
                        distribution = _validate_distribution(
                            list(override_distribution),
                            period_count,
                            detail=f"La línea {getattr(line, 'descripcion', line_id)} tiene una distribución inválida.",
                        )
                        temporal_source = "line_override"
                    except Exception:
                        distribution = list(global_distribution)
                        temporal_source = "global_fallback"
                else:
                    distribution = list(global_distribution)
                    temporal_source = "global_fallback"
                total_amount = round(
                    max(_to_float(getattr(line, "precio_total", 0.0), 0.0), 0.0), 4
                )
                line_segments: List[dict] = []
                for index, period in enumerate(periods):
                    pct = round(
                        max(_to_float(distribution[index] if index < len(distribution) else 0.0, 0.0), 0.0),
                        6,
                    )
                    if pct <= 0:
                        continue
                    period_id = str(getattr(period, "id", None) or f"P{index + 1}").strip()
                    parent_initial_id = f"valuado-initial-{line_id}-{period_id}"
                    amount = round(total_amount * (pct / 100.0), 4)
                    line_segments.append(
                        {
                            "id": f"line-{line_id}-initial-{period_id}",
                            "budget_line_id": str(line_id),
                            "period_id": period_id,
                            "parent_period_id": period_id,
                            "parent_initial_id": parent_initial_id,
                            "starts_at": getattr(period, "starts_at", None),
                            "ends_at": getattr(period, "ends_at", None),
                            "percent": pct,
                            "amount": amount,
                            "status": "confirmed_against_budget",
                            "source": "valuado_initial_segment",
                            "metadata": {
                                "label": str(getattr(period, "label", None) or period_id),
                                "period_index": index + 1,
                                "tipo": "inicial_valorado",
                                "source_contract": "cronograma_valorado",
                                "temporal_source": temporal_source,
                            },
                        }
                    )
                if line_segments:
                    segments_by_line[str(line_id)] = line_segments
            return segments_by_line
        except Exception:
            self._rollback_failed_session(db)
            return {}

    def _build_rows(
        self,
        db: Session,
        presupuesto: Presupuesto,
        config: CronogramaTrabajoConfig,
        line_overrides: Dict[str, dict],
        holiday_dates: Optional[set[date]] = None,
        derive_initial_segments: bool = False,  # TASK-1079
        refresh_budget_prices: bool = True,
    ) -> Tuple[list[CronogramaTrabajoComputedRow], CronogramaTrabajoSummary]:
        if not getattr(db, "is_active", True):
            self._rollback_failed_session(db)

        if refresh_budget_prices:
            refresh_presupuesto_prices(db, presupuesto.id)
            db.refresh(presupuesto)

        # TASK-1082: Auto-derive solo si la linea no tiene subbarras persistidas.
        if derive_initial_segments:
            initial_segments = self._derive_initial_valued_segments(
                db, presupuesto.id, presupuesto.empresa_id
            )
            for line_id, segments in initial_segments.items():
                if line_id not in line_overrides:
                    line_overrides[line_id] = {}
                metadata = dict(line_overrides[line_id].get("metadata") or {})
                existing_subbars = list(metadata.get("gantt_subbars") or [])
                if existing_subbars and not self._should_refresh_authoritative_initial_subbars(
                    budget_line_id=str(line_id),
                    existing_subbars=existing_subbars,
                ):
                    continue
                metadata["gantt_subbars"] = segments
                line_overrides[line_id]["metadata"] = metadata

        proyecto = (
            db.query(Proyecto)
            .filter(
                Proyecto.id == presupuesto.proyecto_id,
                Proyecto.empresa_id == presupuesto.empresa_id,
            )
            .first()
        )
        project_detail = self._resolve_project_detail(db, proyecto)
        project_start = self._resolve_project_start_reference(
            config=config,
            proyecto=proyecto,
            detail=project_detail,
        )

        cache: Dict[int, Dict[str, Decimal]] = {}
        rows: list[CronogramaTrabajoComputedRow] = []
        summary = CronogramaTrabajoSummary()

        detail_rows = sorted(
            list(presupuesto.detalle or []),
            key=lambda item: ((item.orden or 0), item.id or 0),
        )

        for detail in detail_rows:
            if not detail.apu_id or not detail.apu:
                continue

            override = self._resolve_line_override(line_overrides.get(str(detail.id)))
            quantity = _as_decimal(detail.cantidad, "0")
            unit_breakdown = self._compute_apu_unit_breakdown(detail.apu, cache)
            unit_cost_breakdown = self._compute_apu_unit_cost_breakdown(
                detail.apu, cache
            )
            equipment_ownership_breakdown = (
                self._compute_apu_unit_equipment_ownership_breakdown(detail.apu, cache)
            )
            crew_breakdown = self._compute_apu_unit_crew_breakdown(detail.apu, cache)
            breakdown = self._compute_apu_work_breakdown(detail.apu, quantity, cache)
            structure_breakdown = self._compute_apu_structure_breakdown(
                detail.apu, quantity, cache
            )
            governing_candidates = self._collect_apu_governing_resource_candidates(
                detail.apu,
                inherited_factor=quantity if quantity > 0 else Decimal("1"),
            )
            governing_resource = self._select_governing_resource_candidate(
                governing_candidates
            )
            calculation_mode, nested_apu_count = self._resolve_apu_calculation_mode(
                detail.apu
            )
            base_metadata = dict(override.metadata or {})
            apu_operational_resources_metadata = (
                self._resolve_active_apu_operational_snapshot(
                    apu=detail.apu,
                    config=config,
                    row_metadata=base_metadata,
                )
            )
            operational_calculation = self._build_operational_calculation_from_snapshot(
                apu_operational_resources_metadata,
                quantity,
            )
            if operational_calculation:
                unit_breakdown = operational_calculation["unit_breakdown"]
                breakdown = operational_calculation["breakdown"]
                crew_breakdown = operational_calculation["crew_breakdown"]
                governing_resource = operational_calculation["governing_resource"]
            horas_equipos = breakdown["equipos_herramientas"]
            horas_mano_obra = breakdown["mano_obra"]
            horas_transporte = breakdown["transporte"]
            trabajo_total = horas_equipos + horas_mano_obra
            trabajo_gobernante = max(horas_equipos, horas_mano_obra)
            rendimiento_gobernante_categoria = None
            if governing_resource:
                trabajo_gobernante = _as_decimal(
                    governing_resource.get("trabajo_horas"), "0"
                )
                rendimiento_gobernante_categoria = governing_resource.get("categoria")
            elif horas_mano_obra > horas_equipos:
                rendimiento_gobernante_categoria = "Mano de Obra"
            elif horas_equipos > 0:
                rendimiento_gobernante_categoria = "Equipos y Herramientas"
            elif horas_transporte > 0:
                trabajo_gobernante = horas_transporte
                rendimiento_gobernante_categoria = "Transporte"
            else:
                trabajo_gobernante = trabajo_total
            cuadrilla_equipos = crew_breakdown["equipos_herramientas"]
            cuadrilla_mano_obra = crew_breakdown["mano_obra"]
            cuadrilla_total = cuadrilla_equipos + cuadrilla_mano_obra
            trabajo_hijos = structure_breakdown["trabajo_hijos"]
            trabajo_propio = max(Decimal("0"), trabajo_total - trabajo_hijos)
            cuadrilla_hijos = structure_breakdown["cuadrilla_hijos"]
            cuadrilla_propia = max(Decimal("0"), cuadrilla_total - cuadrilla_hijos)
            recursos_calculados = cuadrilla_total
            default_recursos_asumidos = max(
                Decimal(str(config.recursos_asumidos_base or 1.0)),
                recursos_calculados if recursos_calculados > 0 else Decimal("1"),
            )
            recursos_asumidos = Decimal(
                str(
                    override.assumed_resource_units
                    if override.assumed_resource_units is not None
                    else default_recursos_asumidos
                )
            )
            if recursos_asumidos <= 0:
                recursos_asumidos = Decimal("1")

            jornada = Decimal(str(config.jornada_laboral_horas or 8.0))
            if jornada <= 0:
                jornada = Decimal("8")

            override_duration = None
            if override.duration is not None:
                raw_override_duration = Decimal(str(override.duration))
                if raw_override_duration >= 0:
                    override_duration = raw_override_duration

            duration_contract = self._resolve_dual_duration_contract(
                trabajo_gobernante=trabajo_gobernante,
                recursos_asumidos=recursos_asumidos,
                jornada=jornada,
                override_duration=override_duration,
            )
            recursos_asumidos = duration_contract["export_assumed_resources"]
            duracion_horas = duration_contract["gantt_duration_hours"]
            dias_utiles = duration_contract["gantt_duration_days"]
            dias_calendario = duration_contract["gantt_duration_days"]
            duracion_horas_exportacion = duration_contract["export_duration_hours"]
            dias_utiles_exportacion = duration_contract["export_duration_days"]
            dias_calendario_exportacion = duration_contract["export_duration_days"]

            dependencies = self._resolve_line_dependencies(int(detail.id), override)
            predecessors = [dependency.source_id for dependency in dependencies]
            categorias = {
                "Equipos y Herramientas": round(_to_float(horas_equipos), 4),
                "Materiales": 0.0,
                "Transporte": round(_to_float(horas_transporte), 4),
                "Mano de Obra": round(_to_float(horas_mano_obra), 4),
            }
            duration_model_metadata = self._build_duration_model_metadata(
                row_metadata=base_metadata,
                progress_pct=round(_to_float(override.progress_pct, 0.0), 2),
                jornada=jornada,
                trabajo_gobernante=trabajo_gobernante,
                recursos_asumidos=recursos_asumidos,
                rendimiento_gobernante_categoria=rendimiento_gobernante_categoria,
                recurso_gobernante=governing_resource,
            )
            cost_model_metadata = self._build_cost_model_metadata(
                apu=detail.apu,
                budget_line_total=_as_decimal(
                    getattr(detail, "precio_total", None), "0"
                ),
                budget_quantity=quantity,
                unit_cost_breakdown=unit_cost_breakdown,
                equipment_ownership_breakdown=equipment_ownership_breakdown,
                current_duration_days=dias_utiles,
                current_duration_hours=duracion_horas,
            )
            crashing_review_metadata = self._build_crashing_review_metadata(
                trabajo_gobernante=trabajo_gobernante,
                recursos_asumidos=recursos_asumidos,
                jornada=jornada,
                current_export_duration_days=dias_utiles_exportacion,
                temporal_cost_per_day=_as_decimal(
                    cost_model_metadata.get("temporal_cost_per_day"), "0"
                ),
                dominant_time_category=cost_model_metadata.get(
                    "dominant_time_category"
                ),
                dominant_category_line_cost=_as_decimal(
                    (cost_model_metadata.get("category_line_costs") or {}).get(
                        cost_model_metadata.get("dominant_time_category")
                    ),
                    "0",
                ),
                dominant_category_crew_units=(
                    cuadrilla_equipos
                    if cost_model_metadata.get("dominant_time_category")
                    == "Equipos y Herramientas"
                    else (
                        cuadrilla_mano_obra
                        if cost_model_metadata.get("dominant_time_category")
                        == "Mano de Obra"
                        else recursos_asumidos
                    )
                ),
                equipment_ownership_breakdown=equipment_ownership_breakdown,
            )

            row = CronogramaTrabajoComputedRow(
                linea_id=detail.id,
                presupuesto_linea_id=detail.id,
                sequence_index=summary.partidas_calculables + 1,
                edt_id=detail.edt_id,
                apu_id=detail.apu_id,
                codigo_item=detail.codigo_item,
                descripcion=detail.descripcion,
                unidad=detail.unidad,
                cantidad=_to_float(detail.cantidad, 0.0),
                tipo=detail.tipo or "apu",
                calculation_mode=calculation_mode,
                nested_apu_count=nested_apu_count,
                native_line_count=int(structure_breakdown["native_line_count"]),
                nested_line_count=int(structure_breakdown["nested_line_count"]),
                rendimiento_unitario_equipos=round(
                    _to_float(unit_breakdown["equipos_herramientas"]), 4
                ),
                rendimiento_unitario_mano_obra=round(
                    _to_float(unit_breakdown["mano_obra"]), 4
                ),
                rendimiento_unitario_transporte=round(
                    _to_float(unit_breakdown["transporte"]), 4
                ),
                trabajo_equipos=round(_to_float(horas_equipos), 4),
                trabajo_mano_obra=round(_to_float(horas_mano_obra), 4),
                trabajo_transporte=round(_to_float(horas_transporte), 4),
                trabajo_gobernante=round(_to_float(trabajo_gobernante), 4),
                rendimiento_gobernante_categoria=rendimiento_gobernante_categoria,
                recurso_gobernante_id=(
                    governing_resource.get("recurso_id") if governing_resource else None
                ),
                recurso_gobernante_nombre=(
                    governing_resource.get("nombre") if governing_resource else None
                ),
                recurso_gobernante_categoria_detalle=(
                    governing_resource.get("categoria_detalle")
                    if governing_resource
                    else None
                ),
                recurso_gobernante_criterio=(
                    governing_resource.get("criterio_aplicado")
                    if governing_resource
                    else None
                ),
                recurso_gobernante_costo_hora=(
                    round(_to_float(governing_resource.get("costo_hora"), 0.0), 4)
                    if governing_resource
                    else 0.0
                ),
                trabajo_total=round(_to_float(trabajo_total), 4),
                trabajo_propio=round(_to_float(trabajo_propio), 4),
                trabajo_hijos=round(_to_float(trabajo_hijos), 4),
                cuadrilla_equipos=round(_to_float(cuadrilla_equipos), 4),
                cuadrilla_mano_obra=round(_to_float(cuadrilla_mano_obra), 4),
                cuadrilla_total=round(_to_float(cuadrilla_total), 4),
                cuadrilla_propia=round(_to_float(cuadrilla_propia), 4),
                cuadrilla_hijos=round(_to_float(cuadrilla_hijos), 4),
                horas_equipos=round(_to_float(horas_equipos), 4),
                horas_mano_obra=round(_to_float(horas_mano_obra), 4),
                horas_transporte=round(_to_float(horas_transporte), 4),
                horas_total=round(_to_float(trabajo_total), 4),
                recursos_calculados=round(_to_float(recursos_calculados), 4),
                recursos_asumidos=round(_to_float(recursos_asumidos), 4),
                duracion_horas=round(_to_float(duracion_horas), 4),
                dias_utiles=round(_to_float(dias_utiles), 4),
                dias_calendario=round(_to_float(dias_calendario), 4),
                duracion_horas_exportacion=round(
                    _to_float(duracion_horas_exportacion), 4
                ),
                dias_utiles_exportacion=round(_to_float(dias_utiles_exportacion), 4),
                dias_calendario_exportacion=round(
                    _to_float(dias_calendario_exportacion), 4
                ),
                start_date=self._align_to_workday_start(override.start_date, config),
                end_date=self._align_to_workday_finish(override.end_date, config),
                predecessors=predecessors,
                dependencies=dependencies,
                progress_pct=round(_to_float(override.progress_pct, 0.0), 2),
                categorias=categorias,
                metadata={
                    **base_metadata,
                    APU_OPERATIONAL_RESOURCES_METADATA_KEY: (
                        apu_operational_resources_metadata
                    ),
                    "duration_model": duration_model_metadata,
                    "cost_model": cost_model_metadata,
                    "crashing_review": crashing_review_metadata,
                    "governing_resource": {
                        "resource_id": (
                            governing_resource.get("recurso_id")
                            if governing_resource
                            else None
                        ),
                        "name": (
                            governing_resource.get("nombre")
                            if governing_resource
                            else None
                        ),
                        "category": (
                            governing_resource.get("categoria")
                            if governing_resource
                            else None
                        ),
                        "kind": (
                            governing_resource.get("categoria_detalle")
                            if governing_resource
                            else None
                        ),
                        "kind_label": (
                            governing_resource.get("categoria_detalle_label")
                            if governing_resource
                            else None
                        ),
                        "criterion": (
                            governing_resource.get("criterio_aplicado")
                            if governing_resource
                            else None
                        ),
                        "performance_hours_per_unit": (
                            round(
                                _to_float(
                                    governing_resource.get("rendimiento_horas_unidad"),
                                    0.0,
                                ),
                                4,
                            )
                            if governing_resource
                            else 0.0
                        ),
                        "budget_quantity": round(_to_float(quantity), 4),
                        "work_hours": (
                            round(
                                _to_float(governing_resource.get("trabajo_horas"), 0.0),
                                4,
                            )
                            if governing_resource
                            else 0.0
                        ),
                        "cost_per_hour": (
                            round(
                                _to_float(governing_resource.get("costo_hora"), 0.0), 4
                            )
                            if governing_resource
                            else 0.0
                        ),
                        "candidate_count": (
                            int(governing_resource.get("candidate_count") or 0)
                            if governing_resource
                            else 0
                        ),
                    },
                    "duration_contract": {
                        "version": "gantt_project_dual_duration_v1",
                        "gantt_formula": "cantidad_presupuesto_x_rendimiento_gobernante_horas_unidad",
                        "project_export_formula": "cantidad_presupuesto_x_rendimiento_gobernante_horas_unidad_dividido_recursos_asumidos",
                        "gantt_duration_hours": round(_to_float(duracion_horas), 4),
                        "gantt_duration_days": round(_to_float(dias_utiles), 4),
                        "project_export_duration_hours": round(
                            _to_float(duracion_horas_exportacion), 4
                        ),
                        "project_export_duration_days": round(
                            _to_float(dias_utiles_exportacion), 4
                        ),
                    },
                },
            )
            row.metadata["duration_model"] = self._finalize_duration_model_metadata(
                row.metadata.get("duration_model"),
                current_duration_days=Decimal(str(row.dias_utiles or 0.0)),
            )
            row.metadata["gantt_operational"] = self._build_gantt_operational_summary(
                str(detail.id),
                row.metadata,
            )
            rows.append(row)

            summary.partidas_calculables += 1
            summary.trabajo_total += row.trabajo_total
            summary.cuadrilla_total += row.cuadrilla_total
            summary.horas_total += row.horas_total
            summary.horas_equipos += row.horas_equipos
            summary.horas_mano_obra += row.horas_mano_obra
            summary.horas_transporte += row.horas_transporte
            summary.recursos_calculados_total += row.recursos_calculados
            summary.dias_utiles_total += row.dias_utiles
            summary.dias_calendario_total += row.dias_calendario

        summary.trabajo_total = round(summary.trabajo_total, 4)
        summary.cuadrilla_total = round(summary.cuadrilla_total, 4)
        summary.horas_total = round(summary.horas_total, 4)
        summary.horas_equipos = round(summary.horas_equipos, 4)
        summary.horas_mano_obra = round(summary.horas_mano_obra, 4)
        summary.horas_transporte = round(summary.horas_transporte, 4)
        summary.recursos_calculados_total = round(summary.recursos_calculados_total, 4)
        summary.dias_utiles_total = round(summary.dias_utiles_total, 4)
        summary.dias_calendario_total = round(summary.dias_calendario_total, 4)
        rows = self._resolve_rows_dates(
            rows, project_start, line_overrides, config, holiday_dates
        )
        rows = self._decorate_rows_with_workday_auto_segments(
            rows, config, holiday_dates
        )
        rows = self._decorate_rows_with_cpm_metadata(rows, config, holiday_dates)
        return rows, summary

    def _build_single_seed_schedule_data(
        self,
        db: Session,
        presupuesto_id: int,
        proyecto_id: int,
        empresa_id: int,
        *,
        session_source: str,
        segment_source: str,
        segment_label: str,
        source_contract: str,
    ) -> dict:
        presupuesto = (
            db.query(Presupuesto)
            .options(joinedload(Presupuesto.detalle).joinedload(PresupuestoDetalle.apu))
            .filter(
                Presupuesto.id == presupuesto_id,
                Presupuesto.empresa_id == empresa_id,
            )
            .first()
        )
        if not presupuesto:
            return self._join_schedule_payload({}, {})

        proyecto = (
            db.query(Proyecto)
            .filter(
                Proyecto.id == proyecto_id,
                Proyecto.empresa_id == empresa_id,
            )
            .first()
        )
        config = self._resolve_config({})
        window_start, window_end = self._estimate_calendar_window(
            db=db,
            proyecto=proyecto,
            config=config,
            line_overrides={},
        )
        holiday_calendar = (
            project_calendar_service.get_snapshot_calendar(
                db,
                proyecto=proyecto,
                start_date=window_start,
                end_date=window_end,
            )
            if proyecto
            else None
        )
        holiday_dates = self._holiday_dates_from_calendar(holiday_calendar)
        rows, _ = self._build_rows(
            db,
            presupuesto,
            config,
            {},
            holiday_dates,
            derive_initial_segments=False,
            refresh_budget_prices=False,
        )
        amount_by_line = {
            str(getattr(line, "id", "")): round(
                max(_to_float(getattr(line, "precio_total", 0.0), 0.0), 0.0),
                4,
            )
            for line in list(getattr(presupuesto, "detalle", []) or [])
            if getattr(line, "apu_id", None)
        }
        lineas = {}
        for row in rows:
            line_id = str(getattr(row, "presupuesto_linea_id", "")).strip()
            if not line_id:
                continue
            start_date = self._normalize_datetime_value(getattr(row, "start_date", None))
            end_date = self._normalize_datetime_value(
                getattr(row, "end_date", None) or getattr(row, "start_date", None)
            )
            traceability_prefix = session_source.replace("_", "-").strip() or "seed"
            parent_initial_id = f"{traceability_prefix}-line-{line_id}"
            lineas[line_id] = {
                "metadata": {
                    "gantt_session": {
                        "status": "confirmed_against_budget",
                        "created_from_session": session_source,
                    },
                    "gantt_subbars": [
                        {
                            "id": f"{segment_source.replace('_', '-')}-segment-{line_id}",
                            "budget_line_id": line_id,
                            "period_id": session_source,
                            "parent_period_id": session_source,
                            "parent_initial_id": parent_initial_id,
                            "starts_at": start_date.isoformat() if start_date else None,
                            "ends_at": end_date.isoformat() if end_date else None,
                            "percent": 100.0,
                            "amount": amount_by_line.get(line_id, 0.0),
                            "status": "confirmed_against_budget",
                            "source": segment_source,
                            "metadata": {
                                "label": segment_label,
                                "tipo": segment_source,
                                "source_contract": source_contract,
                            },
                        }
                    ],
                }
            }
        return self._join_schedule_payload({}, lineas)

    def build_factory_reset_schedule_data(
        self,
        db: Session,
        presupuesto_id: int,
        proyecto_id: int,
        empresa_id: int,
    ) -> dict:
        return self._build_single_seed_schedule_data(
            db,
            presupuesto_id=presupuesto_id,
            proyecto_id=proyecto_id,
            empresa_id=empresa_id,
            session_source="factory_reset",
            segment_source="factory_reset_seed",
            segment_label="Factory reset",
            source_contract="factory_reset",
        )

    def build_initial_creation_schedule_data(
        self,
        db: Session,
        presupuesto_id: int,
        proyecto_id: int,
        empresa_id: int,
    ) -> dict:
        return self._build_single_seed_schedule_data(
            db,
            presupuesto_id=presupuesto_id,
            proyecto_id=proyecto_id,
            empresa_id=empresa_id,
            session_source="initial_creation",
            segment_source="initial_creation_seed",
            segment_label="Creación inicial",
            source_contract="initial_creation",
        )

    def _build_response(
        self, db: Session, schedule: CronogramaTrabajo
    ) -> CronogramaTrabajoResponse:
        token = _LINE_OVERRIDE_CACHE.set({})
        workday_token = _WORKDAY_CALC_CACHE.set({})
        try:
            return self._build_response_uncached(db, schedule)
        finally:
            _WORKDAY_CALC_CACHE.reset(workday_token)
            _LINE_OVERRIDE_CACHE.reset(token)

    def _build_response_uncached(
        self, db: Session, schedule: CronogramaTrabajo
    ) -> CronogramaTrabajoResponse:
        schedule = (
            db.query(CronogramaTrabajo)
            .filter(CronogramaTrabajo.id == schedule.id)
            .first()
        )
        presupuesto = (
            db.query(Presupuesto)
            .options(
                joinedload(Presupuesto.detalle)
                .joinedload(PresupuestoDetalle.apu)
                .joinedload(APU.lineas)
                .joinedload(APULinea.recurso),
                joinedload(Presupuesto.detalle)
                .joinedload(PresupuestoDetalle.apu)
                .joinedload(APU.lineas)
                .joinedload(APULinea.apu_hijo),
                joinedload(Presupuesto.detalle)
                .joinedload(PresupuestoDetalle.apu)
                .joinedload(APU.lineas)
                .joinedload(APULinea.apu_hijo)
                .joinedload(APU.lineas)
                .joinedload(APULinea.recurso),
            )
            .filter(
                Presupuesto.id == schedule.presupuesto_id,
                Presupuesto.empresa_id == schedule.empresa_id,
            )
            .first()
        )
        proyecto = (
            db.query(Proyecto)
            .filter(
                Proyecto.id == schedule.proyecto_id,
                Proyecto.empresa_id == schedule.empresa_id,
            )
            .first()
        )
        raw_config, raw_lineas = self._split_schedule_payload(schedule.schedule_data)
        config = self._resolve_config(raw_config)
        detail = self._resolve_project_detail(db, proyecto)
        config, raw_lineas, synced_project_start = (
            self._sync_config_with_external_project_start(
                config=config,
                lineas=raw_lineas,
                proyecto=proyecto,
                detail=detail,
            )
        )
        if synced_project_start:
            schedule = cronograma_trabajo_repo.update(
                db,
                schedule,
                {
                    "schedule_data": self._join_schedule_payload(
                        config.model_dump(mode="json"),
                        raw_lineas,
                    )
                },
            )
        resolved_project_start = self._resolve_project_start_reference(
            config=config,
            proyecto=proyecto,
            detail=detail,
        )
        if (
            getattr(config, "fecha_inicio_proyecto", None) is None
            and resolved_project_start is not None
        ):
            config = config.model_copy(
                update={"fecha_inicio_proyecto": resolved_project_start}
            )
        window_start, window_end = self._estimate_calendar_window(
            db=db,
            proyecto=proyecto,
            config=config,
            line_overrides=raw_lineas,
        )
        holiday_calendar = (
            project_calendar_service.get_snapshot_calendar(
                db,
                proyecto=proyecto,
                start_date=window_start,
                end_date=window_end,
            )
            if proyecto
            else None
        )
        holiday_dates = self._holiday_dates_from_calendar(holiday_calendar)
        rows, summary = self._build_rows(
            db,
            presupuesto,
            config,
            raw_lineas,
            holiday_dates,
            derive_initial_segments=True,
            refresh_budget_prices=False,
        )
        resolved_start = self._resolve_schedule_start_anchor(
            config, resolved_project_start
        )
        while resolved_start and not self._is_workday(
            resolved_start, config, holiday_dates
        ):
            resolved_start = self._align_to_workday_start(
                resolved_start + timedelta(days=1), config
            ) or (resolved_start + timedelta(days=1))
        resolved_finish = max(
            (
                self._normalize_datetime_value(
                    getattr(row, "end_date", None) or getattr(row, "start_date", None)
                )
                for row in rows
            ),
            default=None,
        )
        response_lineas = self._apply_computed_rows_to_line_overrides(raw_lineas, rows)
        line_map = {}
        for key, value in (response_lineas or {}).items():
            override = self._resolve_line_override(value)
            try:
                line_id = int(key)
            except Exception:
                line_map[str(key)] = override
                continue
            override.dependencies = self._resolve_line_dependencies(line_id, override)
            override.predecessors = [
                dependency.source_id for dependency in override.dependencies
            ]
            line_map[str(key)] = override
        base_trabajo_id = None
        budget_details = getattr(presupuesto, "detalle", []) or []
        try:
            budget_details_iter = iter(budget_details)
        except TypeError:
            budget_details_iter = iter(())
        for detail_line in budget_details_iter:
            apu = getattr(detail_line, "apu", None)
            if apu and getattr(apu, "base_trabajo_id", None) is not None:
                base_trabajo_id = getattr(apu, "base_trabajo_id", None)
                break
        try:
            presupuesto_revision = int(getattr(presupuesto, "revision", 0) or 0)
        except (TypeError, ValueError):
            presupuesto_revision = 0
        official_source = project_functional_modification_service.resolve_official_source(
            db,
            empresa_id=schedule.empresa_id,
            proyecto_id=schedule.proyecto_id,
            presupuesto_id=schedule.presupuesto_id,
            base_trabajo_id=base_trabajo_id,
            revision=presupuesto_revision,
            base_snapshot={
                "presupuesto_id": schedule.presupuesto_id,
                "base_trabajo_id": base_trabajo_id,
                "revision": presupuesto_revision,
            },
        )
        return CronogramaTrabajoResponse(
            id=schedule.id,
            presupuesto_id=schedule.presupuesto_id,
            proyecto_id=schedule.proyecto_id,
            empresa_id=schedule.empresa_id,
            config=config,
            official_source=official_source,
            schedule_data=line_map,
            rows=rows,
            summary=summary,
            export_capabilities=self.get_export_capabilities(),
            holiday_calendar=holiday_calendar,
            fecha_inicio=resolved_start,
            fecha_fin=resolved_finish,
            updated_at=schedule.updated_at,
        )

    def _build_ms_project_task_tree(
        self,
        edt_roots,
        budget_lines,
        row_map: Dict[str, CronogramaTrabajoComputedRow],
        config: CronogramaTrabajoConfig,
        holiday_dates: Optional[set[date]] = None,
    ):
        lines_by_edt: Dict[str, list] = {}
        for line in budget_lines:
            key = str(line.edt_id)
            lines_by_edt.setdefault(key, []).append(line)

        tasks = []

        def visit(node: EdtNode, level: int = 1):
            child_tasks = []
            for child in sorted(
                node.hijos or [], key=lambda item: ((item.orden or 0), item.id or 0)
            ):
                child_tasks.extend(visit(child, level + 1))

            attached = sorted(
                lines_by_edt.get(str(node.id), []),
                key=lambda item: ((item.orden or 0), item.id or 0),
            )
            if not child_tasks and not attached:
                return []

            summary_task = {
                "uid_ref": f"edt-{node.id}",
                "name": node.nombre or node.codigo or f"EDT {node.id}",
                "outline_level": level,
                "outline_number": node.codigo or str(node.id),
                "summary": True,
                "start": None,
                "finish": None,
                "duration_hours": 0.0,
                "predecessors": [],
                "notes": "Capítulo EDT del cronograma de trabajo",
            }
            current = [summary_task]

            for line in attached:
                row = row_map.get(str(line.id))
                if not row:
                    continue
                current.append(
                    {
                        "uid_ref": f"line-{line.id}",
                        "line_id": line.id,
                        "apu_id": line.apu_id,
                        "name": line.descripcion,
                        "outline_level": level + 1,
                        "outline_number": line.codigo_item
                        or f"{node.codigo}.{line.id}",
                        "summary": False,
                        "start": row.start_date,
                        "finish": self._build_finish_from_start(
                            row.start_date,
                            row.dias_calendario_exportacion
                            or row.dias_utiles_exportacion
                            or 0.0,
                            config,
                            holiday_dates,
                        ),
                        "duration_hours": row.duracion_horas_exportacion
                        or row.duracion_horas,
                        "predecessors": list(row.predecessors or []),
                        "dependencies": list(row.dependencies or []),
                        "notes": (
                            f"APU {line.codigo_item or line.id} | "
                            f"Duración Gantt: {row.duracion_horas:.4f} h | "
                            f"Duración exportable: {(row.duracion_horas_exportacion or row.duracion_horas):.4f} h | "
                            f"Trabajo útil: {row.trabajo_total:.4f} h | "
                            f"Recursos calculados: {row.recursos_calculados:.2f} | "
                            f"Recursos asumidos: {row.recursos_asumidos:.2f}"
                        ),
                    }
                )

            current.extend(child_tasks)
            return current

        for root in edt_roots:
            tasks.extend(visit(root, 1))
        return tasks

    def _resolve_ms_project_task_duration_hours(self, task: dict) -> float:
        duration_hours = max(float(task.get("duration_hours") or 0.0), 0.0)
        if duration_hours > 0:
            return duration_hours

        start = task.get("start")
        finish = task.get("finish")
        if not isinstance(start, datetime) or not isinstance(finish, datetime):
            return 0.0

        try:
            delta_hours = (finish - start).total_seconds() / 3600.0
        except Exception:
            return 0.0
        return max(delta_hours, 0.0)

    def _build_mpp_runtime_xml_payload(self, xml_payload: bytes) -> bytes:
        try:
            root = ET.fromstring(xml_payload)
        except ET.ParseError:
            return xml_payload

        namespace = (
            root.tag.split("}", 1)[0].strip("{") if root.tag.startswith("{") else ""
        )

        def qname(name: str) -> str:
            return f"{{{namespace}}}{name}" if namespace else name

        resources_el = root.find(qname("Resources"))
        if resources_el is not None:
            root.remove(resources_el)

        assignments_el = root.find(qname("Assignments"))
        if assignments_el is not None:
            root.remove(assignments_el)

        return ET.tostring(root, encoding="utf-8", xml_declaration=True)

    def _resource_type_for_ms_project(self, recurso: Recurso) -> str:
        subcategory_code = getattr(recurso, "subcategoria_codigo", None)
        try:
            subcategory_code = int(subcategory_code)
        except Exception:
            subcategory_code = None
        # MS Project: 0 work, 1 material, 2 cost. Materials should not inflate labor availability.
        return "1" if subcategory_code == 2 else "0"

    def _build_ms_project_resource_payload(
        self, db: Session, task_tree: list[dict]
    ) -> Tuple[list[dict], list[dict]]:
        line_tasks = [
            task for task in task_tree if not task.get("summary") and task.get("apu_id")
        ]
        apu_ids = sorted(
            {int(task["apu_id"]) for task in line_tasks if task.get("apu_id")}
        )
        if not apu_ids:
            return [], []

        apu_lines = (
            db.query(APULinea)
            .options(joinedload(APULinea.recurso).joinedload(Recurso.unidad))
            .filter(APULinea.apu_id.in_(apu_ids), APULinea.recurso_id != None)
            .order_by(APULinea.apu_id.asc(), APULinea.orden.asc(), APULinea.id.asc())
            .all()
        )
        lines_by_apu: Dict[int, list[APULinea]] = {}
        resources_by_id: Dict[int, Recurso] = {}
        for apu_line in apu_lines:
            if not apu_line.recurso:
                continue
            lines_by_apu.setdefault(int(apu_line.apu_id), []).append(apu_line)
            resources_by_id[int(apu_line.recurso_id)] = apu_line.recurso

        resources = []
        resource_uid_by_id = {}
        for uid, resource_id in enumerate(sorted(resources_by_id), start=1):
            recurso = resources_by_id[resource_id]
            resource_uid_by_id[resource_id] = uid
            resources.append(
                {
                    "uid": uid,
                    "resource_id": resource_id,
                    "name": recurso.descripcion
                    or recurso.codigo
                    or f"Recurso {resource_id}",
                    "code": recurso.codigo or str(resource_id),
                    "type": self._resource_type_for_ms_project(recurso),
                    "unit": getattr(
                        getattr(recurso, "unidad", None), "abreviatura", None
                    )
                    or "",
                    "standard_rate": float(
                        _as_decimal(getattr(recurso, "precio", None))
                    ),
                }
            )

        assignments = []
        assignment_uid = 1
        for task in line_tasks:
            task_apu_lines = lines_by_apu.get(int(task["apu_id"] or 0), [])
            if not task_apu_lines:
                continue
            task_duration_hours = self._resolve_ms_project_task_duration_hours(task)
            total_weight = (
                sum(
                    max(float(_as_decimal(linea.cantidad, "0")), 0.0001)
                    for linea in task_apu_lines
                )
                or 1.0
            )
            for apu_line in task_apu_lines:
                resource_uid = resource_uid_by_id.get(int(apu_line.recurso_id or 0))
                if not resource_uid:
                    continue
                quantity = max(float(_as_decimal(apu_line.cantidad, "0")), 0.0)
                units = max(quantity, 0.01)
                work_hours = task_duration_hours * (
                    max(quantity, 0.0001) / total_weight
                )
                assignments.append(
                    {
                        "uid": assignment_uid,
                        "task_ref": task["uid_ref"],
                        "resource_uid": resource_uid,
                        "units": units,
                        "work_hours": work_hours,
                    }
                )
                assignment_uid += 1

        return resources, assignments

    def _read_ms_project_text(self, element: ET.Element, qname, name: str) -> str:
        child = element.find(qname(name))
        return (child.text or "").strip() if child is not None else ""

    def _parse_ms_project_datetime(self, value: str) -> Optional[datetime]:
        value = (value or "").strip()
        if not value:
            return None
        try:
            parsed = datetime.fromisoformat(value.replace("Z", "+00:00"))
            if parsed.tzinfo is not None:
                parsed = parsed.replace(tzinfo=None)
            return parsed
        except ValueError:
            try:
                return datetime.strptime(value[:10], "%Y-%m-%d")
            except ValueError:
                return None

    def _parse_ms_project_duration_hours(self, value: str) -> Optional[float]:
        value = (value or "").strip().upper()
        if not value:
            return None
        match = re.fullmatch(
            r"P(?:(?P<days>-?\d+(?:\.\d+)?)D)?(?:T(?:(?P<hours>-?\d+(?:\.\d+)?)H)?(?:(?P<minutes>-?\d+(?:\.\d+)?)M)?(?:(?P<seconds>-?\d+(?:\.\d+)?)S)?)?",
            value,
        )
        if not match:
            return None
        days = float(match.group("days") or 0.0)
        hours = float(match.group("hours") or 0.0)
        minutes = float(match.group("minutes") or 0.0)
        seconds = float(match.group("seconds") or 0.0)
        return (days * 24.0) + hours + (minutes / 60.0) + (seconds / 3600.0)

    def _parse_ms_project_dependency_type(self, value: str) -> str:
        return {"0": "FF", "1": "FS", "2": "SS", "3": "SF"}.get(
            str(value or "1").strip(), "FS"
        )

    def _parse_ms_project_lag_days(
        self, value: str, config: CronogramaTrabajoConfig
    ) -> float:
        try:
            lag_minutes = float(value or 0.0) / 10.0
        except Exception:
            lag_minutes = 0.0
        jornada = max(float(config.jornada_laboral_horas or 8.0), 1.0)
        return round((lag_minutes / 60.0) / jornada, 4)

    def _resolve_ms_project_line_id(
        self,
        task_el: ET.Element,
        qname,
        valid_line_ids: set[int],
        unique_code_to_line_id: Dict[str, int],
    ) -> Optional[int]:
        candidates = [
            self._read_ms_project_text(task_el, qname, "Text1"),
            self._read_ms_project_text(task_el, qname, "Text2"),
            self._read_ms_project_text(task_el, qname, "OutlineNumber"),
        ]
        notes = self._read_ms_project_text(task_el, qname, "Notes")
        candidates.extend(re.findall(r"line-(\d+)", notes or "", flags=re.IGNORECASE))
        for candidate in candidates:
            normalized = str(candidate or "").strip()
            if not normalized:
                continue
            line_match = re.search(r"line-(\d+)", normalized, flags=re.IGNORECASE)
            if line_match:
                line_id = int(line_match.group(1))
                if line_id in valid_line_ids:
                    return line_id
            if normalized.isdigit():
                line_id = int(normalized)
                if line_id in valid_line_ids:
                    return line_id
            if normalized in unique_code_to_line_id:
                return unique_code_to_line_id[normalized]
        return None

    def get_schedule(
        self,
        db: Session,
        presupuesto_id: int,
        proyecto_id: int,
        empresa_id: int,
    ) -> CronogramaTrabajoResponse:
        schedule = self._ensure_schedule(db, presupuesto_id, proyecto_id, empresa_id)
        return self._build_response(db, schedule)

    def _build_delta_commit_row(self, row: CronogramaTrabajoComputedRow) -> dict:
        full_payload = row.model_dump(mode="json")
        metadata = dict(full_payload.get("metadata") or {})
        return {
            key: full_payload.get(key)
            for key in (
                "linea_id",
                "presupuesto_linea_id",
                "sequence_index",
                "start_date",
                "end_date",
                "predecessors",
                "dependencies",
                "progress_pct",
                "recursos_asumidos",
                "duracion_horas",
                "dias_utiles",
                "dias_calendario",
                "duracion_horas_exportacion",
                "dias_utiles_exportacion",
                "dias_calendario_exportacion",
            )
        } | {"metadata": {
            key: metadata[key]
            for key in (
                "gantt_subbars",
                "gantt_operational",
                "gantt_session",
                "cpm",
                "cpm_network",
                "cpm_schedule_alignment",
                "cpm_available",
                "is_critical",
                "critical",
                "has_negative_float",
                "manual_milestone",
                "manualMilestone",
                "milestone_kind",
                "temporal_source",
                "manual_temporal_window",
            )
            if key in metadata
        }}

    def _apply_computed_rows_to_line_overrides(
        self,
        line_overrides: Dict[str, dict],
        rows: list[CronogramaTrabajoComputedRow],
    ) -> Dict[str, dict]:
        next_line_overrides = {str(key): dict(value or {}) for key, value in (line_overrides or {}).items()}
        persistence_anchor = min(
            (
                value
                for value in (
                    self._normalize_datetime_value(getattr(row, "start_date", None))
                    for row in (rows or [])
                )
                if value is not None
            ),
            default=None,
        )
        max_persisted_finish = (
            persistence_anchor + timedelta(days=CALENDAR_LOOKAHEAD_DAYS)
            if persistence_anchor is not None
            else None
        )
        min_persisted_start = (
            persistence_anchor - timedelta(days=365)
            if persistence_anchor is not None
            else None
        )

        def is_persistable_date(value: Optional[datetime]) -> bool:
            if value is None:
                return False
            if min_persisted_start is not None and value < min_persisted_start:
                return False
            if max_persisted_finish is not None and value > max_persisted_finish:
                return False
            return True

        for row in rows or []:
            key = str(getattr(row, "presupuesto_linea_id", "") or "").strip()
            if not key:
                continue
            payload = dict(next_line_overrides.get(key) or {})
            start_date = self._normalize_datetime_value(getattr(row, "start_date", None))
            end_date = self._normalize_datetime_value(getattr(row, "end_date", None))
            if is_persistable_date(start_date):
                payload["start_date"] = start_date.isoformat()
            else:
                payload.pop("start_date", None)
            if is_persistable_date(end_date) and (
                start_date is None or end_date >= start_date
            ):
                payload["end_date"] = end_date.isoformat()
            else:
                payload.pop("end_date", None)

            metadata = dict(payload.get("metadata") or {})
            row_metadata = dict(getattr(row, "metadata", {}) or {})
            if APU_OPERATIONAL_RESOURCES_METADATA_KEY in row_metadata:
                metadata[APU_OPERATIONAL_RESOURCES_METADATA_KEY] = dict(
                    row_metadata.get(APU_OPERATIONAL_RESOURCES_METADATA_KEY) or {}
                )
            if "gantt_subbars" in row_metadata:
                metadata["gantt_subbars"] = list(row_metadata.get("gantt_subbars") or [])
            elif self._has_only_renewable_gantt_subbars(metadata):
                metadata.pop("gantt_subbars", None)
            if "gantt_operational" in row_metadata:
                metadata["gantt_operational"] = dict(row_metadata.get("gantt_operational") or {})
            payload["metadata"] = self._normalize_operational_metadata(key, metadata)
            next_line_overrides[key] = payload
        return next_line_overrides

    def update_schedule_delta(
        self,
        db: Session,
        presupuesto_id: int,
        proyecto_id: int,
        empresa_id: int,
        obj_in: CronogramaTrabajoUpdate,
    ) -> Optional[CronogramaTrabajoDeltaResponse]:
        schedule = self._ensure_schedule(db, presupuesto_id, proyecto_id, empresa_id)
        presupuesto = (
            db.query(Presupuesto)
            .options(joinedload(Presupuesto.detalle).joinedload(PresupuestoDetalle.apu))
            .filter(
                Presupuesto.id == presupuesto_id, Presupuesto.empresa_id == empresa_id
            )
            .first()
        )
        if not presupuesto:
            return None
        raw_config, raw_lineas = self._split_schedule_payload(schedule.schedule_data)
        proyecto = (
            db.query(Proyecto)
            .filter(
                Proyecto.id == presupuesto.proyecto_id,
                Proyecto.empresa_id == presupuesto.empresa_id,
            )
            .first()
        )
        persisted_project_start = self._normalize_datetime_value(
            getattr(proyecto, "fecha_inicio", None)
        )

        config = {**raw_config}
        if obj_in.config is not None:
            previous_config = self._resolve_config(raw_config)
            config = obj_in.config.model_dump(mode="json")
            provided_fields = getattr(obj_in.config, "model_fields_set", set())
            if (
                "dias_laborables_semana" not in provided_fields
                and "dias_laborables_semana" not in raw_config
            ):
                config.pop("dias_laborables_semana", None)
            next_config = self._resolve_config(config)
            previous_anchor = self._resolve_schedule_start_anchor(
                previous_config, persisted_project_start
            )
            next_anchor = self._resolve_schedule_start_anchor(
                next_config, persisted_project_start
            )
            raw_lineas = self._shift_line_overrides_for_project_start_delta(
                raw_lineas,
                old_anchor=previous_anchor,
                new_anchor=next_anchor,
            )

        lineas = {**raw_lineas}
        changed_keys = {str(key) for key in (obj_in.schedule_data or {}).keys()}
        for key, value in (obj_in.schedule_data or {}).items():
            incoming_payload = value.model_dump(mode="json")
            incoming_payload["metadata"] = self._normalize_operational_metadata(
                str(key),
                incoming_payload.get("metadata"),
            )
            lineas[str(key)] = incoming_payload

        lineas = self._sanitize_schedule_updates_for_active_budget(presupuesto, lineas)
        self._validate_schedule_updates(presupuesto, lineas)

        resolved_config = self._resolve_config(config)
        project_detail = self._resolve_project_detail(db, proyecto)
        if (
            obj_in.config is not None
            and "fecha_inicio_proyecto"
            in getattr(obj_in.config, "model_fields_set", set())
        ):
            resolved_config = self._mark_gantt_start_authority(
                config=resolved_config,
                proyecto=proyecto,
                detail=project_detail,
            )
            config = resolved_config.model_dump(mode="json")
        else:
            resolved_config, lineas, synced_project_start = (
                self._sync_config_with_external_project_start(
                    config=resolved_config,
                    lineas=lineas,
                    proyecto=proyecto,
                    detail=project_detail,
                )
            )
            if synced_project_start:
                config = resolved_config.model_dump(mode="json")
        resolved_project_start = self._resolve_project_start_reference(
            config=resolved_config,
            proyecto=proyecto,
            detail=project_detail,
        )
        if (
            getattr(resolved_config, "fecha_inicio_proyecto", None) is None
            and resolved_project_start is not None
        ):
            resolved_config = resolved_config.model_copy(
                update={"fecha_inicio_proyecto": resolved_project_start}
            )
        window_start, window_end = self._estimate_calendar_window(
            db=db,
            proyecto=proyecto,
            config=resolved_config,
            line_overrides=lineas,
        )
        holiday_calendar = (
            project_calendar_service.get_snapshot_calendar(
                db,
                proyecto=proyecto,
                start_date=window_start,
                end_date=window_end,
            )
            if proyecto
            else None
        )
        holiday_dates = self._holiday_dates_from_calendar(holiday_calendar)
        preview_rows, summary = self._build_rows(
            db,
            presupuesto,
            resolved_config,
            lineas,
            holiday_dates,
            derive_initial_segments=False,
            refresh_budget_prices=False,
        )
        self._validate_rows_not_before_project_start(
            preview_rows,
            resolved_project_start,
            resolved_config,
            holiday_dates,
        )
        lineas = self._apply_computed_rows_to_line_overrides(lineas, preview_rows)

        updated = cronograma_trabajo_repo.update(
            db,
            schedule,
            {"schedule_data": self._join_schedule_payload(config, lineas)},
        )
        changed_schedule_data = {
            key: self._resolve_line_override(lineas.get(key))
            for key in changed_keys
            if key in lineas
        }
        resolved_start = self._resolve_schedule_start_anchor(
            resolved_config, resolved_project_start
        )
        while resolved_start and not self._is_workday(
            resolved_start, resolved_config, holiday_dates
        ):
            resolved_start = self._align_to_workday_start(
                resolved_start + timedelta(days=1), resolved_config
            ) or (resolved_start + timedelta(days=1))
        resolved_finish = max(
            (
                self._normalize_datetime_value(
                    getattr(row, "end_date", None) or getattr(row, "start_date", None)
                )
                for row in preview_rows
            ),
            default=None,
        )
        return CronogramaTrabajoDeltaResponse(
            id=updated.id,
            presupuesto_id=updated.presupuesto_id,
            proyecto_id=updated.proyecto_id,
            empresa_id=updated.empresa_id,
            schedule_data=changed_schedule_data,
            rows=[self._build_delta_commit_row(row) for row in preview_rows],
            summary=summary,
            fecha_inicio=resolved_start,
            fecha_fin=resolved_finish,
            updated_at=updated.updated_at,
        )

    def export_ms_project_xml(
        self,
        db: Session,
        presupuesto_id: int,
        proyecto_id: int,
        empresa_id: int,
        include_resources: bool = True,
    ) -> BytesIO:
        schedule = self._ensure_schedule(db, presupuesto_id, proyecto_id, empresa_id)
        response = self._build_response(db, schedule)
        presupuesto = (
            db.query(Presupuesto)
            .options(joinedload(Presupuesto.detalle))
            .filter(
                Presupuesto.id == presupuesto_id, Presupuesto.empresa_id == empresa_id
            )
            .first()
        )
        proyecto = (
            db.query(Proyecto)
            .filter(Proyecto.id == proyecto_id, Proyecto.empresa_id == empresa_id)
            .first()
        )
        edt_roots = (
            db.query(EdtNode)
            .filter(
                EdtNode.proyecto_id == proyecto_id,
                EdtNode.empresa_id == empresa_id,
                EdtNode.parent_id == None,
            )
            .order_by(EdtNode.orden.asc(), EdtNode.id.asc())
            .all()
        )

        row_map = {str(row.presupuesto_linea_id): row for row in response.rows}
        holiday_dates = self._holiday_dates_from_calendar(response.holiday_calendar)
        task_tree = self._build_ms_project_task_tree(
            edt_roots,
            list(presupuesto.detalle or []),
            row_map,
            response.config,
            holiday_dates,
        )
        resource_payload: list[dict] = []
        assignment_payload: list[dict] = []
        if include_resources:
            resource_payload, assignment_payload = (
                self._build_ms_project_resource_payload(db, task_tree)
            )

        ns = "http://schemas.microsoft.com/project"
        ET.register_namespace("", ns)
        project_el = ET.Element(f"{{{ns}}}Project")
        ET.SubElement(project_el, f"{{{ns}}}Name").text = (
            proyecto.nombre if proyecto else f"Proyecto {proyecto_id}"
        )
        ET.SubElement(project_el, f"{{{ns}}}Title").text = (
            f"Cronograma de Trabajo - {proyecto.nombre if proyecto else proyecto_id}"
        )
        start_date = self._resolve_schedule_start_anchor(
            response.config,
            self._normalize_datetime_value(getattr(proyecto, "fecha_inicio", None)),
        )
        ET.SubElement(project_el, f"{{{ns}}}StartDate").text = start_date.isoformat()
        ET.SubElement(project_el, f"{{{ns}}}ScheduleFromStart").text = "1"
        ET.SubElement(project_el, f"{{{ns}}}MinutesPerDay").text = str(
            int(round((response.config.jornada_laboral_horas or 8.0) * 60))
        )
        ET.SubElement(project_el, f"{{{ns}}}MinutesPerWeek").text = str(
            int(
                round(
                    (response.config.jornada_laboral_horas or 8.0)
                    * (response.config.dias_laborables_semana or 5.0)
                    * 60
                )
            )
        )
        ET.SubElement(project_el, f"{{{ns}}}DaysPerMonth").text = str(
            int(round(response.config.dias_laborables_mes or 22))
        )
        calendar_uid = "1"
        calendar_hours = min(
            max(float(response.config.jornada_laboral_horas or 8.0), 1.0), 24.0
        )
        laborable_week_days = min(
            max(int(round(float(response.config.dias_laborables_semana or 5.0))), 1), 7
        )
        start_hour = float(response.config.hora_inicio_jornada or 8.0)
        start_hour_int, start_minute = _round_hour_parts(start_hour)
        work_end_hour = int(start_hour_int + calendar_hours)
        work_end_minute = int(round((start_hour + calendar_hours - work_end_hour) * 60))
        if work_end_hour >= 24:
            work_end_hour = 23
            work_end_minute = 59

        calendars_el = ET.SubElement(project_el, f"{{{ns}}}Calendars")
        calendar_el = ET.SubElement(calendars_el, f"{{{ns}}}Calendar")
        ET.SubElement(calendar_el, f"{{{ns}}}UID").text = calendar_uid
        ET.SubElement(calendar_el, f"{{{ns}}}Name").text = "GiProy Calendario Laboral"
        ET.SubElement(calendar_el, f"{{{ns}}}IsBaseCalendar").text = "1"
        ET.SubElement(calendar_el, f"{{{ns}}}BaseCalendarUID").text = "-1"
        weekdays_el = ET.SubElement(calendar_el, f"{{{ns}}}WeekDays")
        for day_type in range(1, 8):
            # MS Project day types: 1 Sunday, 2 Monday, ..., 7 Saturday.
            is_working = laborable_week_days >= 7 or (
                day_type != 1 and day_type <= laborable_week_days + 1
            )
            weekday_el = ET.SubElement(weekdays_el, f"{{{ns}}}WeekDay")
            ET.SubElement(weekday_el, f"{{{ns}}}DayType").text = str(day_type)
            ET.SubElement(weekday_el, f"{{{ns}}}DayWorking").text = (
                "1" if is_working else "0"
            )
            if is_working:
                working_times_el = ET.SubElement(weekday_el, f"{{{ns}}}WorkingTimes")
                working_time_el = ET.SubElement(
                    working_times_el, f"{{{ns}}}WorkingTime"
                )
                ET.SubElement(working_time_el, f"{{{ns}}}FromTime").text = (
                    f"{start_hour_int:02d}:{start_minute:02d}:00"
                )
                ET.SubElement(working_time_el, f"{{{ns}}}ToTime").text = (
                    f"{work_end_hour:02d}:{work_end_minute:02d}:00"
                )
        tasks_el = ET.SubElement(project_el, f"{{{ns}}}Tasks")

        uid_counter = 1
        ref_to_uid: Dict[str, int] = {}
        project_task = ET.SubElement(tasks_el, f"{{{ns}}}Task")
        ET.SubElement(project_task, f"{{{ns}}}UID").text = "0"
        ET.SubElement(project_task, f"{{{ns}}}ID").text = "0"
        ET.SubElement(project_task, f"{{{ns}}}Name").text = (
            proyecto.nombre if proyecto else "Proyecto"
        )
        ET.SubElement(project_task, f"{{{ns}}}Type").text = "1"
        ET.SubElement(project_task, f"{{{ns}}}IsNull").text = "0"
        ET.SubElement(project_task, f"{{{ns}}}OutlineLevel").text = "0"
        ET.SubElement(project_task, f"{{{ns}}}Summary").text = "1"
        ET.SubElement(project_task, f"{{{ns}}}CalendarUID").text = calendar_uid
        ET.SubElement(project_task, f"{{{ns}}}Start").text = start_date.isoformat()

        for task in task_tree:
            uid = uid_counter
            uid_counter += 1
            ref_to_uid[task["uid_ref"]] = uid
            task_el = ET.SubElement(tasks_el, f"{{{ns}}}Task")
            ET.SubElement(task_el, f"{{{ns}}}UID").text = str(uid)
            ET.SubElement(task_el, f"{{{ns}}}ID").text = str(uid)
            ET.SubElement(task_el, f"{{{ns}}}Name").text = task["name"]
            ET.SubElement(task_el, f"{{{ns}}}Type").text = "1"
            ET.SubElement(task_el, f"{{{ns}}}IsNull").text = "0"
            ET.SubElement(task_el, f"{{{ns}}}OutlineLevel").text = str(
                task["outline_level"]
            )
            ET.SubElement(task_el, f"{{{ns}}}OutlineNumber").text = task[
                "outline_number"
            ]
            ET.SubElement(task_el, f"{{{ns}}}Summary").text = (
                "1" if task["summary"] else "0"
            )
            ET.SubElement(task_el, f"{{{ns}}}Active").text = "1"
            ET.SubElement(task_el, f"{{{ns}}}Manual").text = "0"
            ET.SubElement(task_el, f"{{{ns}}}Notes").text = task.get("notes") or ""
            if not task["summary"] and task.get("line_id"):
                ET.SubElement(task_el, f"{{{ns}}}Text1").text = (
                    f"line-{task['line_id']}"
                )
            ET.SubElement(task_el, f"{{{ns}}}CalendarUID").text = calendar_uid

            if task["start"]:
                ET.SubElement(task_el, f"{{{ns}}}Start").text = task[
                    "start"
                ].isoformat()
            if task["finish"]:
                ET.SubElement(task_el, f"{{{ns}}}Finish").text = task[
                    "finish"
                ].isoformat()

            duration_hours = self._resolve_ms_project_task_duration_hours(task)
            ET.SubElement(task_el, f"{{{ns}}}DurationFormat").text = "53"
            ET.SubElement(task_el, f"{{{ns}}}Duration").text = (
                f"PT{round(duration_hours, 2)}H0M0S"
            )
            if not task["summary"] and duration_hours <= 0:
                ET.SubElement(task_el, f"{{{ns}}}Milestone").text = "1"
            if not task["summary"]:
                link_type_map = {"FF": "0", "FS": "1", "SS": "2", "SF": "3"}
                dependencies = task.get("dependencies") or [
                    CronogramaTrabajoDependency(source_id=int(predecessor), type="FS")
                    for predecessor in task.get("predecessors") or []
                ]
                for dependency in dependencies:
                    predecessor_uid = ref_to_uid.get(f"line-{dependency.source_id}")
                    if not predecessor_uid:
                        continue
                    predecessor_el = ET.SubElement(task_el, f"{{{ns}}}PredecessorLink")
                    ET.SubElement(predecessor_el, f"{{{ns}}}PredecessorUID").text = str(
                        predecessor_uid
                    )
                    ET.SubElement(predecessor_el, f"{{{ns}}}Type").text = (
                        link_type_map.get(dependency.type, "1")
                    )
                    lag_days = _to_float(getattr(dependency, "lag_days", 0.0), 0.0)
                    if getattr(dependency, "lag_unit", "day") == "hour":
                        lag_minutes = int(round(lag_days * 60))
                    else:
                        lag_minutes = int(
                            round(
                                lag_days
                                * (response.config.jornada_laboral_horas or 8.0)
                                * 60
                            )
                        )
                    ET.SubElement(predecessor_el, f"{{{ns}}}LinkLag").text = str(
                        lag_minutes * 10
                    )
                    ET.SubElement(predecessor_el, f"{{{ns}}}LagFormat").text = "7"

        if include_resources:
            resources_el = ET.SubElement(project_el, f"{{{ns}}}Resources")
            for resource in resource_payload:
                resource_el = ET.SubElement(resources_el, f"{{{ns}}}Resource")
                ET.SubElement(resource_el, f"{{{ns}}}UID").text = str(resource["uid"])
                ET.SubElement(resource_el, f"{{{ns}}}ID").text = str(resource["uid"])
                ET.SubElement(resource_el, f"{{{ns}}}Name").text = resource["name"]
                ET.SubElement(resource_el, f"{{{ns}}}Type").text = resource["type"]
                ET.SubElement(resource_el, f"{{{ns}}}IsNull").text = "0"
                ET.SubElement(resource_el, f"{{{ns}}}Initials").text = str(
                    resource["code"]
                )[:12]
                ET.SubElement(resource_el, f"{{{ns}}}Group").text = "GiProy APU"
                if resource["unit"]:
                    ET.SubElement(resource_el, f"{{{ns}}}MaterialLabel").text = (
                        resource["unit"]
                    )
                ET.SubElement(resource_el, f"{{{ns}}}StandardRate").text = str(
                    round(resource["standard_rate"], 4)
                )

            assignments_el = ET.SubElement(project_el, f"{{{ns}}}Assignments")
            for assignment in assignment_payload:
                task_uid = ref_to_uid.get(assignment["task_ref"])
                if not task_uid:
                    continue
                assignment_el = ET.SubElement(assignments_el, f"{{{ns}}}Assignment")
                ET.SubElement(assignment_el, f"{{{ns}}}UID").text = str(
                    assignment["uid"]
                )
                ET.SubElement(assignment_el, f"{{{ns}}}TaskUID").text = str(task_uid)
                ET.SubElement(assignment_el, f"{{{ns}}}ResourceUID").text = str(
                    assignment["resource_uid"]
                )
                ET.SubElement(assignment_el, f"{{{ns}}}Units").text = str(
                    round(float(assignment["units"]), 4)
                )
                ET.SubElement(assignment_el, f"{{{ns}}}Work").text = (
                    f"PT{round(float(assignment['work_hours']), 2)}H0M0S"
                )

        tree = ET.ElementTree(project_el)
        buffer = BytesIO()
        tree.write(buffer, encoding="utf-8", xml_declaration=True)
        buffer.seek(0)
        return buffer

    def import_ms_project_xml(
        self,
        db: Session,
        presupuesto_id: int,
        proyecto_id: int,
        empresa_id: int,
        xml_payload: bytes,
    ) -> CronogramaTrabajoResponse:
        if not xml_payload:
            raise ValueError("El archivo XML de Microsoft Project está vacío.")

        try:
            root = ET.fromstring(xml_payload)
        except ET.ParseError as exc:
            raise ValueError(
                "El archivo XML de Microsoft Project no es válido."
            ) from exc

        namespace = (
            root.tag.split("}", 1)[0].strip("{") if root.tag.startswith("{") else ""
        )

        def qname(name: str) -> str:
            return f"{{{namespace}}}{name}" if namespace else name

        tasks_el = root.find(qname("Tasks"))
        if tasks_el is None:
            raise ValueError("El XML no contiene tareas de Microsoft Project.")

        schedule = self._ensure_schedule(db, presupuesto_id, proyecto_id, empresa_id)
        response = self._build_response(db, schedule)
        config = response.config
        presupuesto = (
            db.query(Presupuesto)
            .options(joinedload(Presupuesto.detalle).joinedload(PresupuestoDetalle.apu))
            .filter(
                Presupuesto.id == presupuesto_id, Presupuesto.empresa_id == empresa_id
            )
            .first()
        )
        if not presupuesto:
            raise ValueError("Presupuesto no encontrado para importar el cronograma.")

        valid_line_ids = {
            int(detail.id)
            for detail in (presupuesto.detalle or [])
            if detail.apu_id and detail.apu
        }
        code_counts: Dict[str, int] = {}
        code_to_line_id: Dict[str, int] = {}
        for detail in presupuesto.detalle or []:
            code = str(detail.codigo_item or "").strip()
            if not code or int(detail.id) not in valid_line_ids:
                continue
            code_counts[code] = code_counts.get(code, 0) + 1
            code_to_line_id[code] = int(detail.id)
        unique_code_to_line_id = {
            code: line_id
            for code, line_id in code_to_line_id.items()
            if code_counts.get(code) == 1
        }

        parsed_tasks: list[tuple[int, int, ET.Element]] = []
        task_uid_to_line_id: Dict[int, int] = {}
        for task_el in tasks_el.findall(qname("Task")):
            uid_text = self._read_ms_project_text(task_el, qname, "UID")
            try:
                uid = int(uid_text)
            except Exception:
                continue
            if uid == 0 or self._read_ms_project_text(task_el, qname, "IsNull") == "1":
                continue
            if self._read_ms_project_text(task_el, qname, "Summary") == "1":
                continue
            line_id = self._resolve_ms_project_line_id(
                task_el, qname, valid_line_ids, unique_code_to_line_id
            )
            if line_id is None:
                continue
            parsed_tasks.append((uid, line_id, task_el))
            task_uid_to_line_id[uid] = line_id

        if not parsed_tasks:
            raise ValueError(
                "No se encontraron tareas de línea del presupuesto en el XML. "
                "Importa un XML exportado desde GiProy o conserva el campo Text1/OutlineNumber de las partidas."
            )

        raw_config, raw_lineas = self._split_schedule_payload(schedule.schedule_data)
        lineas = {**raw_lineas}
        imported_at = datetime.utcnow().isoformat()
        for uid, line_id, task_el in parsed_tasks:
            existing_override = self._resolve_line_override(lineas.get(str(line_id)))
            existing_payload = existing_override.model_dump(mode="json")
            start_date = self._parse_ms_project_datetime(
                self._read_ms_project_text(task_el, qname, "Start")
            )
            end_date = self._parse_ms_project_datetime(
                self._read_ms_project_text(task_el, qname, "Finish")
            )
            duration_hours = self._parse_ms_project_duration_hours(
                self._read_ms_project_text(task_el, qname, "Duration")
            )
            duration_days = None
            if duration_hours is not None:
                duration_days = round(
                    duration_hours
                    / max(float(config.jornada_laboral_horas or 8.0), 1.0),
                    4,
                )

            dependencies: list[dict] = []
            predecessors: list[int] = []
            for predecessor_el in task_el.findall(qname("PredecessorLink")):
                predecessor_uid_text = self._read_ms_project_text(
                    predecessor_el, qname, "PredecessorUID"
                )
                try:
                    predecessor_uid = int(predecessor_uid_text)
                except Exception:
                    continue
                source_line_id = task_uid_to_line_id.get(predecessor_uid)
                if not source_line_id or source_line_id == line_id:
                    continue
                dependency = CronogramaTrabajoDependency(
                    source_id=source_line_id,
                    target_id=line_id,
                    type=self._parse_ms_project_dependency_type(
                        self._read_ms_project_text(predecessor_el, qname, "Type")
                    ),
                    lag_days=self._parse_ms_project_lag_days(
                        self._read_ms_project_text(predecessor_el, qname, "LinkLag"),
                        config,
                    ),
                    lag_unit="day",
                    metadata={"source": "ms_project_xml", "imported_at": imported_at},
                )
                if source_line_id not in predecessors:
                    predecessors.append(source_line_id)
                dependencies.append(dependency.model_dump(mode="json"))

            progress_pct = existing_override.progress_pct
            percent_text = self._read_ms_project_text(task_el, qname, "PercentComplete")
            if percent_text:
                progress_pct = min(
                    max(_to_float(percent_text, progress_pct), 0.0), 100.0
                )

            metadata = dict(existing_override.metadata or {})
            metadata["ms_project_import"] = {
                "imported_at": imported_at,
                "task_uid": uid,
                "source": "xml",
            }
            lineas[str(line_id)] = {
                **existing_payload,
                "start_date": (
                    start_date.isoformat()
                    if start_date
                    else existing_payload.get("start_date")
                ),
                "end_date": (
                    end_date.isoformat()
                    if end_date
                    else existing_payload.get("end_date")
                ),
                "duration": (
                    duration_days
                    if duration_days is not None
                    else existing_payload.get("duration")
                ),
                "progress_pct": progress_pct,
                "predecessors": predecessors,
                "dependencies": dependencies,
                "metadata": metadata,
            }

        self._validate_schedule_updates(presupuesto, lineas)
        updated = cronograma_trabajo_repo.update(
            db,
            schedule,
            {
                "schedule_data": jsonable_encoder(
                    self._join_schedule_payload(raw_config, lineas)
                )
            },
        )
        return self._build_response(db, updated)

    def export_ms_project_mpp(
        self,
        db: Session,
        presupuesto_id: int,
        proyecto_id: int,
        empresa_id: int,
        open_after_export: bool = False,
    ) -> BytesIO:
        environment = self._detect_ms_project_environment()
        if not environment.get("available"):
            raise RuntimeError(
                environment.get("reason")
                or "La exportación .mpp no está disponible en este entorno."
            )

        schedule = self._ensure_schedule(db, presupuesto_id, proyecto_id, empresa_id)
        cache_key = self._build_mpp_cache_key(
            schedule, presupuesto_id, proyecto_id, empresa_id, environment
        )
        cached_payload = self._load_mpp_from_cache(cache_key)
        if cached_payload is not None:
            return cached_payload

        xml_buffer = self.export_ms_project_xml(
            db, presupuesto_id, proyecto_id, empresa_id, include_resources=False
        )
        with tempfile.TemporaryDirectory(
            prefix="giproy_cronograma_aspose_"
        ) as temp_dir:
            temp_dir_path = Path(temp_dir)
            xml_path = temp_dir_path / f"cronograma_trabajo_{presupuesto_id}.xml"
            mpp_path = temp_dir_path / f"cronograma_trabajo_{presupuesto_id}.mpp"
            xml_path.write_bytes(xml_buffer.getvalue())

            command_prefix, runner_mode = self._ensure_compiled_aspose_tasks_runner(
                str(environment["java_bin"]),
                environment["jar_path"],
                environment["runner_path"],
            )
            command = [
                *command_prefix,
                str(environment["license_path"]),
                str(environment["template_path"]),
                str(xml_path),
                str(mpp_path),
            ]
            try:
                result = subprocess.run(
                    command,
                    cwd=str(self._resolve_repo_root()),
                    capture_output=True,
                    text=True,
                    check=False,
                    timeout=self._resolve_mpp_timeout_seconds(),
                )
            except subprocess.TimeoutExpired as exc:
                raise RuntimeError(
                    "La generación .mpp excedió el tiempo máximo permitido en el servidor."
                ) from exc
            except Exception as exc:
                raise RuntimeError(
                    f"No se pudo iniciar el runner Java de exportación .mpp: {exc}"
                ) from exc

            if result.returncode != 0:
                details = (result.stderr or result.stdout or "").strip()
                normalized_details = details.lower()
                if (
                    "Only update of original MPP files is currently supported"
                    in details
                ):
                    raise RuntimeError(
                        "El runner Java de Aspose.Tasks no pudo reconstruir el .mpp desde la plantilla semilla actual. "
                        "Revise la plantilla configurada para exportación."
                    )
                license_markers = [
                    "cannot find license filename",
                    "cannot open license file",
                    "failed to load license",
                    "error in license",
                    "setlicense",
                    "invalid license",
                    "license file",
                ]
                if any(marker in normalized_details for marker in license_markers):
                    raise RuntimeError(
                        "El runner Java de Aspose.Tasks no pudo activar la licencia configurada para generar .mpp."
                    )
                raise RuntimeError(
                    f"No se pudo generar el archivo .mpp con Aspose.Tasks for Java (runner {runner_mode})."
                    + (f" Detalle: {details}" if details else "")
                )

            if not mpp_path.exists():
                raise RuntimeError("El runner Java no generó el archivo .mpp esperado.")

            payload = mpp_path.read_bytes()
            self._store_mpp_in_cache(cache_key, payload)
            return BytesIO(payload)

    def persist_interparent_merge_schedule_data(
        self,
        db: Session,
        *,
        presupuesto_id: int,
        proyecto_id: int,
        empresa_id: int,
        linea_id: int,
        merged_subbars: Optional[List[dict]] = None,
    ) -> CronogramaTrabajoResponse:
        schedule = self._ensure_schedule(db, presupuesto_id, proyecto_id, empresa_id)
        raw_config, raw_lineas = self._split_schedule_payload(schedule.schedule_data)
        line_key = str(linea_id)
        lineas = {**raw_lineas}
        current_line = dict(lineas.get(line_key) or {})
        current_metadata = dict(current_line.get("metadata") or {})
        next_metadata = {
            **current_metadata,
            "gantt_session": {
                **dict(current_metadata.get("gantt_session") or {}),
                "status": "draft_session",
            },
            "gantt_subbars": list(merged_subbars or []),
        }
        normalized_metadata = self._normalize_operational_metadata(line_key, next_metadata)
        normalized_metadata["gantt_operational"] = self._build_gantt_operational_summary(
            line_key,
            normalized_metadata,
        )
        current_line["metadata"] = normalized_metadata
        lineas[line_key] = current_line
        updated = cronograma_trabajo_repo.update(
            db,
            schedule,
            {"schedule_data": self._join_schedule_payload(raw_config, lineas)},
        )
        return self._build_response(db, updated)

    def update_schedule(
        self,
        db: Session,
        presupuesto_id: int,
        proyecto_id: int,
        empresa_id: int,
        obj_in: CronogramaTrabajoUpdate,
    ) -> Optional[CronogramaTrabajoResponse]:
        schedule = self._ensure_schedule(db, presupuesto_id, proyecto_id, empresa_id)
        presupuesto = (
            db.query(Presupuesto)
            .options(joinedload(Presupuesto.detalle).joinedload(PresupuestoDetalle.apu))
            .filter(
                Presupuesto.id == presupuesto_id, Presupuesto.empresa_id == empresa_id
            )
            .first()
        )
        if not presupuesto:
            return None
        raw_config, raw_lineas = self._split_schedule_payload(schedule.schedule_data)
        proyecto = (
            db.query(Proyecto)
            .filter(
                Proyecto.id == presupuesto.proyecto_id,
                Proyecto.empresa_id == presupuesto.empresa_id,
            )
            .first()
        )
        persisted_project_start = self._normalize_datetime_value(
            getattr(proyecto, "fecha_inicio", None)
        )

        config = {**raw_config}
        if obj_in.config is not None:
            previous_config = self._resolve_config(raw_config)
            config = obj_in.config.model_dump(mode="json")
            provided_fields = getattr(obj_in.config, "model_fields_set", set())
            if (
                "dias_laborables_semana" not in provided_fields
                and "dias_laborables_semana" not in raw_config
            ):
                config.pop("dias_laborables_semana", None)
            next_config = self._resolve_config(config)
            previous_anchor = self._resolve_schedule_start_anchor(
                previous_config, persisted_project_start
            )
            next_anchor = self._resolve_schedule_start_anchor(
                next_config, persisted_project_start
            )
            raw_lineas = self._shift_line_overrides_for_project_start_delta(
                raw_lineas,
                old_anchor=previous_anchor,
                new_anchor=next_anchor,
            )

        lineas = {**raw_lineas}
        for key, value in (obj_in.schedule_data or {}).items():
            incoming_payload = value.model_dump(mode="json")
            incoming_payload["metadata"] = self._normalize_operational_metadata(
                str(key),
                incoming_payload.get("metadata"),
            )
            lineas[str(key)] = incoming_payload

        lineas = self._sanitize_schedule_updates_for_active_budget(presupuesto, lineas)

        self._validate_schedule_updates(presupuesto, lineas)

        resolved_config = self._resolve_config(config)
        project_detail = self._resolve_project_detail(db, proyecto)
        if (
            obj_in.config is not None
            and "fecha_inicio_proyecto"
            in getattr(obj_in.config, "model_fields_set", set())
        ):
            resolved_config = self._mark_gantt_start_authority(
                config=resolved_config,
                proyecto=proyecto,
                detail=project_detail,
            )
            config = resolved_config.model_dump(mode="json")
        else:
            resolved_config, lineas, synced_project_start = (
                self._sync_config_with_external_project_start(
                    config=resolved_config,
                    lineas=lineas,
                    proyecto=proyecto,
                    detail=project_detail,
                )
            )
            if synced_project_start:
                config = resolved_config.model_dump(mode="json")
        resolved_project_start = self._resolve_project_start_reference(
            config=resolved_config,
            proyecto=proyecto,
            detail=project_detail,
        )
        if (
            getattr(resolved_config, "fecha_inicio_proyecto", None) is None
            and resolved_project_start is not None
        ):
            resolved_config = resolved_config.model_copy(
                update={"fecha_inicio_proyecto": resolved_project_start}
            )
        window_start, window_end = self._estimate_calendar_window(
            db=db,
            proyecto=proyecto,
            config=resolved_config,
            line_overrides=lineas,
        )
        holiday_calendar = (
            project_calendar_service.get_snapshot_calendar(
                db,
                proyecto=proyecto,
                start_date=window_start,
                end_date=window_end,
            )
            if proyecto
            else None
        )
        holiday_dates = self._holiday_dates_from_calendar(holiday_calendar)
        preview_rows, _ = self._build_rows(
            db,
            presupuesto,
            resolved_config,
            lineas,
            holiday_dates,
            derive_initial_segments=False,
            refresh_budget_prices=False,
        )
        self._validate_rows_not_before_project_start(
            preview_rows,
            resolved_project_start,
            resolved_config,
            holiday_dates,
        )
        lineas = self._apply_computed_rows_to_line_overrides(lineas, preview_rows)

        updated = cronograma_trabajo_repo.update(
            db,
            schedule,
            {"schedule_data": self._join_schedule_payload(config, lineas)},
        )
        return self._build_response(db, updated)


cronograma_trabajo_service = CronogramaTrabajoService()
