from __future__ import annotations

import hashlib
from pathlib import Path
from typing import Any

from app.services.public_procurement_import_profile_engine import public_procurement_import_profile_engine
from app.services.public_procurement_portal_import import public_procurement_portal_import_service


DEFAULT_PARSER_PROFILE = "giproy_public_procurement_legacy_portal"
DEFAULT_PROFILE_VERSION = "2026-05-18.1"


class PublicProcurementTechnicalAnalysisService:
    """Common technical analyzer facade for public procurement documents.

    The first implementation deliberately delegates to the existing Portal
    analyzer so Marketplace keeps its current behavior while Proyectos can
    consume a neutral parser contract in a later slice.
    """

    def __init__(self, legacy_service=None) -> None:
        self._legacy_service = legacy_service or public_procurement_portal_import_service

    def analyze_upload(self, filename: str, content: bytes, role_hint: str | None = None) -> dict:
        return self._legacy_service.analyze_upload(filename, content, role_hint=role_hint)

    def analyze_uploads(
        self,
        files: list[tuple[str, bytes]],
        source_role_hints: dict[str, str] | None = None,
        existing_analysis: dict | None = None,
        *,
        parser_profile: str | None = None,
        profile_version: str | None = None,
        include_parser_contract: bool = False,
    ) -> dict:
        analysis = self._legacy_service.analyze_uploads(
            files,
            source_role_hints=source_role_hints,
            existing_analysis=existing_analysis,
        )
        if not include_parser_contract:
            return analysis

        enriched = dict(analysis or {})
        enriched["technical_import_contract"] = self.build_parser_contract(
            files,
            analysis=enriched,
            parser_profile=parser_profile,
            profile_version=profile_version,
        )
        return public_procurement_import_profile_engine.enrich_analysis(
            enriched,
            files=files,
            requested_profile_id=parser_profile,
        )

    def build_excel_bytes(
        self,
        analysis: dict,
        article_title: str,
        export_context: dict | None = None,
    ) -> tuple[bytes, str]:
        return self._legacy_service.build_excel_bytes(analysis, article_title, export_context)

    def build_parser_contract(
        self,
        files: list[tuple[str, bytes]],
        *,
        analysis: dict | None = None,
        parser_profile: str | None = None,
        profile_version: str | None = None,
    ) -> dict[str, Any]:
        analysis = dict(analysis or {})
        classification = dict(analysis.get("classification") or {})
        summary = dict(analysis.get("summary") or {})
        bundle_summary = dict((analysis.get("analysis_bundle") or {}).get("summary") or {})
        source_fingerprints = self._build_source_fingerprints(files)
        joined_digest = hashlib.sha1(
            "|".join(item["sha1"] for item in source_fingerprints).encode("utf-8")
        ).hexdigest()

        return {
            "parser_profile": parser_profile or summary.get("parser_profile") or bundle_summary.get("parser_profile") or DEFAULT_PARSER_PROFILE,
            "profile_version": profile_version or DEFAULT_PROFILE_VERSION,
            "source_fingerprint": joined_digest,
            "source_fingerprints": source_fingerprints,
            "confidence": classification.get("confidence") or summary.get("confidence") or "media",
            "document_kind": classification.get("document_kind") or summary.get("document_kind") or "indeterminado",
            "warnings": list(classification.get("warnings") or summary.get("warnings") or bundle_summary.get("warnings") or []),
            "blocking_incidents": list(summary.get("blocking_incidents") or bundle_summary.get("blocking_incidents") or []),
            "non_blocking_incidents": list(summary.get("non_blocking_incidents") or bundle_summary.get("non_blocking_incidents") or []),
            "requires_superadmin_consent": bool(summary.get("requires_superadmin_consent") or bundle_summary.get("requires_superadmin_consent")),
        }

    @staticmethod
    def _build_source_fingerprints(files: list[tuple[str, bytes]]) -> list[dict[str, Any]]:
        fingerprints: list[dict[str, Any]] = []
        for filename, content in files:
            safe_name = Path(filename or "fuente").name
            payload = content or b""
            fingerprints.append(
                {
                    "filename": safe_name,
                    "sha1": hashlib.sha1(payload).hexdigest(),
                    "size": len(payload),
                }
            )
        return fingerprints


public_procurement_technical_analysis_service = PublicProcurementTechnicalAnalysisService()
