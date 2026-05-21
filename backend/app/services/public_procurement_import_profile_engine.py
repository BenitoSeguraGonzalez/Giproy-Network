from __future__ import annotations

import json
import re
from copy import deepcopy
from datetime import datetime, timezone
from decimal import Decimal
from pathlib import Path
from typing import Any

from fastapi import HTTPException, status


PROFILE_STORE_PATH = Path(__file__).resolve().parents[1] / "resources" / "public_procurement_import_profiles.json"
CONFIDENCE_SCORE = {
    "baja": 1,
    "media": 2,
    "alta": 3,
}


def _clean_text(value: Any) -> str:
    return re.sub(r"\s+", " ", str(value or "")).strip()


def _to_decimal(value: Any) -> Decimal:
    if value in (None, ""):
        return Decimal("0")
    try:
        return Decimal(str(value).replace(",", "."))
    except Exception:
        return Decimal("0")


def _normalize_profile_id(value: Any) -> str:
    text = _clean_text(value).lower()
    text = re.sub(r"[^a-z0-9_]+", "_", text)
    return re.sub(r"_+", "_", text).strip("_")


class PublicProcurementImportProfileEngine:
    """Declarative model layer for SOCE/SERCOP import profiles.

    The current parser remains the extraction engine. This service adds the
    model contract, detection, editability and import/export readiness rules so
    new formats can be governed without growing parser patches in the UI flow.
    """

    def __init__(self, store_path: Path | None = None) -> None:
        self.store_path = store_path or PROFILE_STORE_PATH

    def list_profiles(self, *, include_inactive: bool = True) -> list[dict[str, Any]]:
        profiles = self._read_profiles()
        if not include_inactive:
            profiles = [profile for profile in profiles if profile.get("status") == "active"]
        return sorted(
            profiles,
            key=lambda item: (-int(item.get("priority") or 0), str(item.get("id") or "")),
        )

    def get_profile(self, profile_id: str) -> dict[str, Any]:
        normalized_id = _normalize_profile_id(profile_id)
        for profile in self._read_profiles():
            if profile.get("id") == normalized_id:
                return profile
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Modelo de importacion no encontrado.")

    def save_profile(self, payload: dict[str, Any]) -> dict[str, Any]:
        profile = self._normalize_profile(payload)
        profiles = self._read_profiles()
        replaced = False
        for index, existing in enumerate(profiles):
            if existing.get("id") == profile["id"]:
                profiles[index] = profile
                replaced = True
                break
        if not replaced:
            profiles.append(profile)
        self._write_profiles(profiles)
        return profile

    def clone_profile(self, source_profile_id: str, payload: dict[str, Any] | None = None) -> dict[str, Any]:
        source = deepcopy(self.get_profile(source_profile_id))
        overrides = dict(payload or {})
        source["id"] = _normalize_profile_id(overrides.get("id") or f"{source['id']}_custom")
        source["name"] = _clean_text(overrides.get("name") or f"{source.get('name')} - copia")
        source["version"] = _clean_text(overrides.get("version") or datetime.now(timezone.utc).strftime("%Y-%m-%d.%H%M"))
        source["status"] = overrides.get("status") or "draft"
        source["description"] = _clean_text(overrides.get("description") or source.get("description"))
        return self.save_profile(source)

    def set_profile_status(self, profile_id: str, status_value: str) -> dict[str, Any]:
        profile = self.get_profile(profile_id)
        profile["status"] = self._normalize_status(status_value)
        return self.save_profile(profile)

    def propose_profile_from_analysis(self, analysis: dict[str, Any], *, desired_name: str | None = None) -> dict[str, Any]:
        summary = self._summary_from_analysis(analysis)
        parser_profile = _clean_text(summary.get("parser_profile") or "custom_soce_sercop_profile")
        sections = list(summary.get("detected_sections") or [])
        if not sections:
            sections = list((analysis.get("classification") or {}).get("detected_sections") or [])
        proposed_id = _normalize_profile_id(desired_name or f"{parser_profile}_custom")
        match_strategy = "descripcion_unidad_precio" if parser_profile.endswith("vae_resumen_v1") else "codigo"
        return self._normalize_profile({
            "id": proposed_id,
            "name": _clean_text(desired_name or f"Modelo {parser_profile}"),
            "version": datetime.now(timezone.utc).strftime("%Y-%m-%d.%H%M"),
            "status": "draft",
            "priority": 10,
            "description": "Modelo autocreado desde una lectura SOCE/SERCOP. Revise hooks y publique solo cuando este validado.",
            "document_kinds": [_clean_text(summary.get("document_kind") or "indeterminado")],
            "detection": {
                "parser_profiles": [parser_profile],
                "required_sections": sections,
                "keywords": [],
                "min_confidence": summary.get("confidence") or "media",
            },
            "hooks": {
                "budget": {
                    "start_markers": [],
                    "row_strategy": "auto_detected",
                    "match_strategy": match_strategy,
                },
                "apu": {
                    "start_markers": ["ANALISIS DE PRECIOS UNITARIOS"],
                    "end_markers": ["TOTAL", "COSTO DIRECTO"],
                    "resource_sections": ["EQUIPO", "MATERIALES", "TRANSPORTE", "MANO DE OBRA"],
                },
                "resources": {
                    "rendimiento_categories": ["equipo", "mano_obra"],
                    "unit_price_tolerance": "0.02",
                },
            },
            "matching": {
                "budget_to_apu": match_strategy,
                "fallback": "empty_apu_from_budget",
                "duplicate_policy": "first_compatible_else_block",
            },
            "validation": {
                "empty_apus_allowed_with_warning": True,
                "blocking_duplicate_apu_composition": True,
                "economic_tolerance": "0.02",
            },
            "ui": {
                "accent": "blue",
                "editable_by_superadmin": True,
            },
        })

    def enrich_analysis(
        self,
        analysis: dict[str, Any],
        *,
        files: list[tuple[str, bytes]] | None = None,
        requested_profile_id: str | None = None,
    ) -> dict[str, Any]:
        enriched = deepcopy(analysis or {})
        selected_profile, detection = self.detect_profile(enriched, requested_profile_id=requested_profile_id)
        diagnostics = self.build_diagnostics(enriched, selected_profile, detection)
        export_status = self.resolve_export_status(diagnostics)

        contract = dict(enriched.get("technical_import_contract") or {})
        if selected_profile:
            contract.update({
                "parser_profile": selected_profile["id"],
                "profile_id": selected_profile["id"],
                "profile_name": selected_profile.get("name"),
                "profile_version": selected_profile.get("version"),
                "profile_status": selected_profile.get("status"),
                "model_detection": detection,
            })
        else:
            contract.update({
                "profile_id": None,
                "profile_name": None,
                "profile_status": "unrecognized",
                "model_detection": detection,
            })
        enriched["technical_import_contract"] = contract
        enriched["import_model"] = {
            "profile": selected_profile,
            "detection": detection,
            "diagnostics": diagnostics,
            "export_status": export_status,
            "files_count": len(files or []),
        }
        self._sync_summary(enriched, selected_profile, diagnostics, export_status)
        return enriched

    def detect_profile(
        self,
        analysis: dict[str, Any],
        *,
        requested_profile_id: str | None = None,
    ) -> tuple[dict[str, Any] | None, dict[str, Any]]:
        active_profiles = self.list_profiles(include_inactive=False)
        if requested_profile_id:
            requested_normalized = _normalize_profile_id(requested_profile_id)
            requested = next((profile for profile in self._read_profiles() if profile.get("id") == requested_normalized), None)
            if requested:
                return requested, {
                    "status": "forced",
                    "score": 1000,
                    "reason": "Perfil indicado manualmente por superadministrador.",
                    "candidates": [{"profile_id": requested["id"], "score": 1000, "reason": "forced"}],
                }

        summary = self._summary_from_analysis(analysis)
        parser_profile = _clean_text(summary.get("parser_profile"))
        document_kind = _clean_text(summary.get("document_kind"))
        sections = set(summary.get("detected_sections") or [])
        confidence = _clean_text(summary.get("confidence") or "media").lower()

        candidates: list[dict[str, Any]] = []
        for profile in active_profiles:
            detection = dict(profile.get("detection") or {})
            score = int(profile.get("priority") or 0)
            reasons: list[str] = []
            if parser_profile and parser_profile in set(detection.get("parser_profiles") or []):
                score += 700
                reasons.append("parser_profile")
            if document_kind and document_kind in set(profile.get("document_kinds") or []):
                score += 150
                reasons.append("document_kind")
            required = set(detection.get("required_sections") or [])
            if required and required.issubset(sections):
                score += 100
                reasons.append("sections")
            min_confidence = str(detection.get("min_confidence") or "media").lower()
            if CONFIDENCE_SCORE.get(confidence, 0) >= CONFIDENCE_SCORE.get(min_confidence, 2):
                score += 30
                reasons.append("confidence")
            candidates.append({
                "profile_id": profile.get("id"),
                "score": score,
                "reason": ", ".join(reasons) or "sin coincidencias fuertes",
            })

        candidates.sort(key=lambda item: item["score"], reverse=True)
        selected = None
        status_value = "unrecognized"
        reason = "No se reconocio un modelo de importacion activo para este formato."
        if candidates and candidates[0]["score"] >= 500:
            selected = next((profile for profile in active_profiles if profile.get("id") == candidates[0]["profile_id"]), None)
            status_value = "matched"
            reason = "Modelo reconocido por perfil/parser y señales del documento."

        return selected, {
            "status": status_value,
            "score": candidates[0]["score"] if candidates else 0,
            "reason": reason,
            "parser_profile": parser_profile,
            "document_kind": document_kind,
            "detected_sections": sorted(sections),
            "candidates": candidates[:5],
        }

    def build_diagnostics(
        self,
        analysis: dict[str, Any],
        profile: dict[str, Any] | None,
        detection: dict[str, Any],
    ) -> dict[str, Any]:
        summary = self._summary_from_analysis(analysis)
        bundle_summary = dict((analysis.get("analysis_bundle") or {}).get("summary") or {})
        blocking = list(summary.get("blocking_incidents") or bundle_summary.get("blocking_incidents") or [])
        non_blocking = list(summary.get("non_blocking_incidents") or bundle_summary.get("non_blocking_incidents") or [])
        warnings = list(summary.get("warnings") or bundle_summary.get("warnings") or [])
        budget_rows = list(analysis.get("rubros") or (analysis.get("analysis_bundle") or {}).get("budget_items") or [])
        generated_apus = list(analysis.get("generated_apus") or [])
        bundle_apus = list((analysis.get("analysis_bundle") or {}).get("apus") or [])
        pdf_total = _to_decimal(analysis.get("total_amount"))
        budget_rows_total = sum((_to_decimal(row.get("precio_total")) for row in budget_rows), Decimal("0"))
        tolerance = _to_decimal(((profile or {}).get("validation") or {}).get("economic_tolerance") or "0.02")
        economic_delta = abs(pdf_total - budget_rows_total)

        issues: list[dict[str, Any]] = []
        if detection.get("status") == "unrecognized":
            issues.append({
                "severity": "error",
                "code": "format_not_supported",
                "message": "Formato no recogido para importacion. Cree o ajuste un modelo antes de materializar.",
            })
        for incident in blocking:
            issues.append({
                "severity": "error",
                "code": incident.get("code") if isinstance(incident, dict) else "blocking_incident",
                "message": incident.get("message") if isinstance(incident, dict) else str(incident),
                "detail": incident,
            })
        if generated_apus:
            issues.append({
                "severity": "warning",
                "code": "empty_apus",
                "message": f"Se importaran {len(generated_apus)} APUs vacios vinculados al presupuesto.",
                "count": len(generated_apus),
            })
        for incident in non_blocking:
            issues.append({
                "severity": "warning",
                "code": incident.get("code") if isinstance(incident, dict) else "non_blocking_incident",
                "message": incident.get("message") if isinstance(incident, dict) else str(incident),
                "detail": incident,
            })
        if economic_delta > tolerance:
            issues.append({
                "severity": "warning",
                "code": "budget_total_delta",
                "message": f"El total del documento y la suma de rubros difieren en {economic_delta:.2f} USD.",
                "delta": f"{economic_delta:.2f}",
            })
        for warning in warnings:
            if _clean_text(warning):
                issues.append({"severity": "info", "code": "parser_warning", "message": _clean_text(warning)})

        blocking_count = sum(1 for issue in issues if issue["severity"] == "error")
        warning_count = sum(1 for issue in issues if issue["severity"] == "warning")
        return {
            "status": "blocked" if blocking_count else ("warning" if warning_count else "valid"),
            "blocking_count": blocking_count,
            "warning_count": warning_count,
            "info_count": sum(1 for issue in issues if issue["severity"] == "info"),
            "issues": issues,
            "economic_validation": {
                "pdf_total": f"{pdf_total:.2f}",
                "budget_rows_total": f"{budget_rows_total:.2f}",
                "delta": f"{economic_delta:.2f}",
                "tolerance": f"{tolerance:.2f}",
                "ok": economic_delta <= tolerance,
            },
            "scope": {
                "budget_rows": len(budget_rows),
                "apus": len(bundle_apus),
                "empty_apus": len(generated_apus),
            },
        }

    @staticmethod
    def resolve_export_status(diagnostics: dict[str, Any]) -> dict[str, Any]:
        if diagnostics.get("blocking_count"):
            return {
                "status": "blocked",
                "exportable": False,
                "can_materialize": False,
                "can_export_marketplace": False,
                "message": "La importacion tiene incidencias bloqueantes; no debe exportarse a Marketplace.",
            }
        return {
            "status": "exportable_with_warnings" if diagnostics.get("warning_count") else "exportable",
            "exportable": True,
            "can_materialize": True,
            "can_export_marketplace": True,
            "message": "La importacion puede materializarse y exportarse con la trazabilidad disponible.",
        }

    def _sync_summary(
        self,
        analysis: dict[str, Any],
        profile: dict[str, Any] | None,
        diagnostics: dict[str, Any],
        export_status: dict[str, Any],
    ) -> None:
        summary = dict(analysis.get("summary") or {})
        bundle = dict(analysis.get("analysis_bundle") or {})
        bundle_summary = dict(bundle.get("summary") or {})
        model_summary = {
            "profile_id": (profile or {}).get("id"),
            "profile_name": (profile or {}).get("name"),
            "profile_version": (profile or {}).get("version"),
            "profile_status": (profile or {}).get("status") or "unrecognized",
            "diagnostic_status": diagnostics.get("status"),
            "blocking_count": diagnostics.get("blocking_count"),
            "warning_count": diagnostics.get("warning_count"),
            "export_status": export_status.get("status"),
            "exportable": export_status.get("exportable"),
        }
        summary["import_model"] = model_summary
        summary["parser_profile"] = (profile or {}).get("id") or summary.get("parser_profile")
        summary["economic_validation"] = diagnostics.get("economic_validation")
        summary["import_diagnostics"] = diagnostics
        summary["export_readiness"] = export_status
        summary["technical_validation_status"] = diagnostics.get("status")
        summary["exportable_to_marketplace"] = bool(export_status.get("exportable"))
        blocking_issues = [
            {"code": issue.get("code"), "message": issue.get("message"), "detail": issue.get("detail")}
            for issue in diagnostics.get("issues", [])
            if issue.get("severity") == "error"
        ]
        if blocking_issues and not summary.get("blocking_incidents"):
            summary["blocking_incidents"] = blocking_issues
            summary["requires_superadmin_consent"] = True
        analysis["summary"] = summary
        if bundle:
            bundle_summary["import_model"] = model_summary
            bundle_summary["parser_profile"] = (profile or {}).get("id") or bundle_summary.get("parser_profile")
            bundle_summary["economic_validation"] = diagnostics.get("economic_validation")
            bundle_summary["import_diagnostics"] = diagnostics
            bundle_summary["export_readiness"] = export_status
            bundle_summary["technical_validation_status"] = diagnostics.get("status")
            bundle_summary["exportable_to_marketplace"] = bool(export_status.get("exportable"))
            if blocking_issues and not bundle_summary.get("blocking_incidents"):
                bundle_summary["blocking_incidents"] = blocking_issues
                bundle_summary["requires_superadmin_consent"] = True
            bundle["summary"] = bundle_summary
            analysis["analysis_bundle"] = bundle

    @staticmethod
    def _summary_from_analysis(analysis: dict[str, Any]) -> dict[str, Any]:
        summary = dict(analysis.get("summary") or {})
        bundle_summary = dict((analysis.get("analysis_bundle") or {}).get("summary") or {})
        classification = dict(analysis.get("classification") or {})
        merged = {**bundle_summary, **summary}
        if "document_kind" not in merged:
            merged["document_kind"] = classification.get("document_kind")
        if "confidence" not in merged:
            merged["confidence"] = classification.get("confidence")
        if "detected_sections" not in merged:
            merged["detected_sections"] = classification.get("detected_sections")
        return merged

    def _read_profiles(self) -> list[dict[str, Any]]:
        if not self.store_path.exists():
            return []
        try:
            raw = json.loads(self.store_path.read_text(encoding="utf-8"))
        except Exception as exc:
            raise HTTPException(status_code=500, detail="No se pudieron leer los modelos de importacion.") from exc
        return [self._normalize_profile(item) for item in raw if isinstance(item, dict)]

    def _write_profiles(self, profiles: list[dict[str, Any]]) -> None:
        self.store_path.parent.mkdir(parents=True, exist_ok=True)
        payload = [self._normalize_profile(profile) for profile in profiles]
        self.store_path.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")

    def _normalize_profile(self, payload: dict[str, Any]) -> dict[str, Any]:
        raw = deepcopy(payload or {})
        profile_id = _normalize_profile_id(raw.get("id") or raw.get("name"))
        if not profile_id:
            raise HTTPException(status_code=400, detail="El modelo requiere identificador.")
        return {
            "id": profile_id,
            "name": _clean_text(raw.get("name") or profile_id),
            "version": _clean_text(raw.get("version") or "1"),
            "status": self._normalize_status(raw.get("status") or "draft"),
            "priority": int(raw.get("priority") or 0),
            "description": _clean_text(raw.get("description")),
            "document_kinds": list(raw.get("document_kinds") or []),
            "detection": dict(raw.get("detection") or {}),
            "hooks": dict(raw.get("hooks") or {}),
            "matching": dict(raw.get("matching") or {}),
            "validation": dict(raw.get("validation") or {}),
            "ui": dict(raw.get("ui") or {}),
            "updated_at": raw.get("updated_at") or datetime.now(timezone.utc).isoformat(),
        }

    @staticmethod
    def _normalize_status(value: Any) -> str:
        status_value = _clean_text(value).lower()
        if status_value not in {"active", "draft", "inactive"}:
            raise HTTPException(status_code=400, detail="Estado de modelo no valido.")
        return status_value


public_procurement_import_profile_engine = PublicProcurementImportProfileEngine()
