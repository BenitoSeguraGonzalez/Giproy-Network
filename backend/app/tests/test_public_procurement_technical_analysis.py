import hashlib

from app.services.public_procurement_technical_analysis import (
    DEFAULT_PARSER_PROFILE,
    DEFAULT_PROFILE_VERSION,
    PublicProcurementTechnicalAnalysisService,
)


class _FakeLegacyPortalService:
    def __init__(self) -> None:
        self.calls = []
        self.upload_calls = []
        self.excel_calls = []

    def analyze_uploads(self, files, source_role_hints=None, existing_analysis=None):
        self.calls.append((files, source_role_hints, existing_analysis))
        return {
            "source_filename": files[0][0],
            "classification": {
                "document_kind": "presupuesto_only",
                "confidence": "alta",
                "warnings": ["warning de prueba"],
            },
            "summary": {"document_kind": "presupuesto_only"},
        }

    def analyze_upload(self, filename, content, role_hint=None):
        self.upload_calls.append((filename, content, role_hint))
        return {"source_filename": filename, "role_hint": role_hint}

    def build_excel_bytes(self, analysis, article_title, export_context=None):
        self.excel_calls.append((analysis, article_title, export_context))
        return b"xlsx", f"{article_title}.xlsx"


def test_technical_analysis_delegates_without_changing_marketplace_payload():
    legacy = _FakeLegacyPortalService()
    service = PublicProcurementTechnicalAnalysisService(legacy_service=legacy)

    analysis = service.analyze_uploads([("fuente.pdf", b"%PDF")])

    assert "technical_import_contract" not in analysis
    assert analysis["source_filename"] == "fuente.pdf"
    assert legacy.calls == [([("fuente.pdf", b"%PDF")], None, None)]


def test_technical_analysis_forwards_role_hints_and_existing_analysis():
    legacy = _FakeLegacyPortalService()
    service = PublicProcurementTechnicalAnalysisService(legacy_service=legacy)
    files = [("fuente.pdf", b"%PDF")]
    source_role_hints = {"fuente.pdf": "presupuesto"}
    existing_analysis = {"previous": True}

    service.analyze_uploads(
        files,
        source_role_hints=source_role_hints,
        existing_analysis=existing_analysis,
    )

    assert legacy.calls == [(files, source_role_hints, existing_analysis)]


def test_technical_analysis_delegates_single_upload_and_excel_export():
    legacy = _FakeLegacyPortalService()
    service = PublicProcurementTechnicalAnalysisService(legacy_service=legacy)

    upload = service.analyze_upload("fuente.pdf", b"%PDF", role_hint="presupuesto")
    excel_bytes, filename = service.build_excel_bytes(
        {"summary": {"ok": True}},
        "Articulo Especial",
        export_context={"empresa_id": 10},
    )

    assert upload == {"source_filename": "fuente.pdf", "role_hint": "presupuesto"}
    assert legacy.upload_calls == [("fuente.pdf", b"%PDF", "presupuesto")]
    assert (excel_bytes, filename) == (b"xlsx", "Articulo Especial.xlsx")
    assert legacy.excel_calls == [
        ({"summary": {"ok": True}}, "Articulo Especial", {"empresa_id": 10})
    ]


def test_technical_analysis_can_emit_neutral_parser_contract():
    service = PublicProcurementTechnicalAnalysisService(legacy_service=_FakeLegacyPortalService())

    analysis = service.analyze_uploads(
        [("fuente.pdf", b"%PDF")],
        include_parser_contract=True,
    )

    contract = analysis["technical_import_contract"]
    assert contract["parser_profile"] == DEFAULT_PARSER_PROFILE
    assert contract["profile_version"] == DEFAULT_PROFILE_VERSION
    assert contract["document_kind"] == "presupuesto_only"
    assert contract["confidence"] == "alta"
    assert contract["warnings"] == ["warning de prueba"]
    assert contract["source_fingerprints"][0]["filename"] == "fuente.pdf"
    assert contract["source_fingerprints"][0]["size"] == 4
    assert len(contract["source_fingerprint"]) == 40


def test_technical_analysis_parser_contract_honors_requested_profile_and_version():
    service = PublicProcurementTechnicalAnalysisService(legacy_service=_FakeLegacyPortalService())

    analysis = service.analyze_uploads(
        [("fuente.pdf", b"%PDF")],
        parser_profile="soce_sercop_pdf_integrado_codigo_v1",
        profile_version="version-prueba",
        include_parser_contract=True,
    )

    contract = analysis["technical_import_contract"]
    assert contract["parser_profile"] == "soce_sercop_pdf_integrado_codigo_v1"
    assert contract["profile_id"] == "soce_sercop_pdf_integrado_codigo_v1"
    assert contract["profile_version"] == "2026-05-19.1"
    assert contract["model_detection"]["status"] == "forced"
    assert analysis["summary"]["import_model"]["profile_status"] == "active"


def test_parser_contract_sanitizes_source_filenames_and_combines_fingerprints():
    service = PublicProcurementTechnicalAnalysisService(legacy_service=_FakeLegacyPortalService())

    contract = service.build_parser_contract(
        [
            ("C:/tmp/portal/fuente-a.pdf", b"alpha"),
            ("../fuente-b.xlsx", b"beta"),
        ],
        analysis={
            "classification": {
                "document_kind": "presupuesto_y_apus",
                "confidence": "media",
            },
        },
    )

    first_sha1 = hashlib.sha1(b"alpha").hexdigest()
    second_sha1 = hashlib.sha1(b"beta").hexdigest()
    expected_joined = hashlib.sha1(f"{first_sha1}|{second_sha1}".encode("utf-8")).hexdigest()

    assert contract["source_fingerprint"] == expected_joined
    assert contract["source_fingerprints"] == [
        {"filename": "fuente-a.pdf", "sha1": first_sha1, "size": 5},
        {"filename": "fuente-b.xlsx", "sha1": second_sha1, "size": 4},
    ]
    assert contract["document_kind"] == "presupuesto_y_apus"
    assert contract["confidence"] == "media"


def test_parser_contract_prefers_summary_fallbacks_when_classification_is_missing():
    service = PublicProcurementTechnicalAnalysisService(legacy_service=_FakeLegacyPortalService())

    contract = service.build_parser_contract(
        [("", None)],
        analysis={
            "summary": {
                "parser_profile": "perfil_resumen",
                "document_kind": "presupuesto_only",
                "confidence": "alta",
                "warnings": ["sin apus"],
                "blocking_incidents": [{"code": "format_not_supported"}],
                "requires_superadmin_consent": True,
            },
        },
        profile_version="version-prueba",
    )

    assert contract["parser_profile"] == "perfil_resumen"
    assert contract["profile_version"] == "version-prueba"
    assert contract["source_fingerprints"][0]["filename"] == "fuente"
    assert contract["source_fingerprints"][0]["size"] == 0
    assert contract["document_kind"] == "presupuesto_only"
    assert contract["confidence"] == "alta"
    assert contract["warnings"] == ["sin apus"]
    assert contract["blocking_incidents"] == [{"code": "format_not_supported"}]
    assert contract["requires_superadmin_consent"] is True
