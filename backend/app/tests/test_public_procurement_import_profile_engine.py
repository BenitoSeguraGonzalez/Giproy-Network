import json
from types import SimpleNamespace

import pytest
from fastapi import HTTPException
from fastapi.testclient import TestClient

from app.api.deps import get_current_user
from app.main import app
from app.services.public_procurement_import_profile_engine import PublicProcurementImportProfileEngine


def test_import_profile_engine_matches_known_parser_profile():
    engine = PublicProcurementImportProfileEngine()

    analysis = {
        "total_amount": "10.00",
        "rubros": [{"precio_total": "10.00"}],
        "classification": {
            "document_kind": "presupuesto_apus_integrados",
            "confidence": "alta",
            "detected_sections": ["budget", "apus"],
        },
        "summary": {"parser_profile": "soce_sercop_pdf_integrado_codigo_v1"},
        "analysis_bundle": {"summary": {}},
    }

    enriched = engine.enrich_analysis(analysis, files=[("fuente.pdf", b"%PDF")])

    assert enriched["summary"]["import_model"]["profile_id"] == "soce_sercop_pdf_integrado_codigo_v1"
    assert enriched["summary"]["economic_validation"]["ok"] is True
    assert enriched["summary"]["export_readiness"]["can_export_marketplace"] is True


def test_import_profile_engine_blocks_unrecognized_format():
    engine = PublicProcurementImportProfileEngine()

    analysis = {
        "total_amount": "10.00",
        "rubros": [{"precio_total": "10.00"}],
        "classification": {"document_kind": "desconocido", "confidence": "baja", "detected_sections": []},
        "summary": {"parser_profile": "formato_desconocido"},
        "analysis_bundle": {"summary": {}},
    }

    enriched = engine.enrich_analysis(analysis, files=[("fuente.pdf", b"%PDF")])

    assert enriched["summary"]["technical_validation_status"] == "blocked"
    assert enriched["summary"]["export_readiness"]["can_export_marketplace"] is False
    assert enriched["summary"]["blocking_incidents"][0]["code"] == "format_not_supported"


def test_import_profile_engine_reports_warnings_without_blocking_export():
    engine = PublicProcurementImportProfileEngine()
    profile = engine.get_profile("soce_sercop_pdf_integrado_codigo_v1")

    diagnostics = engine.build_diagnostics(
        {
            "total_amount": "10,10",
            "rubros": [{"precio_total": "10.00"}],
            "generated_apus": [{"codigo": "APU-001"}],
            "summary": {
                "parser_profile": "soce_sercop_pdf_integrado_codigo_v1",
                "document_kind": "presupuesto_y_apus",
                "confidence": "alta",
                "warnings": [" advertencia parser "],
            },
            "analysis_bundle": {"apus": [{"codigo": "APU-002"}]},
        },
        profile,
        {"status": "matched"},
    )
    export_status = engine.resolve_export_status(diagnostics)

    assert diagnostics["status"] == "warning"
    assert diagnostics["blocking_count"] == 0
    assert diagnostics["warning_count"] == 2
    assert diagnostics["info_count"] == 1
    assert diagnostics["economic_validation"] == {
        "pdf_total": "10.10",
        "budget_rows_total": "10.00",
        "delta": "0.10",
        "tolerance": "0.02",
        "ok": False,
    }
    assert diagnostics["scope"] == {"budget_rows": 1, "apus": 1, "empty_apus": 1}
    assert export_status["status"] == "exportable_with_warnings"
    assert export_status["can_export_marketplace"] is True


def test_import_profile_engine_blocks_export_on_blocking_diagnostics():
    engine = PublicProcurementImportProfileEngine()

    diagnostics = engine.build_diagnostics(
        {
            "total_amount": "0",
            "summary": {
                "blocking_incidents": [{"code": "manual_review", "message": "Requiere revision"}],
            },
        },
        None,
        {"status": "unrecognized"},
    )
    export_status = engine.resolve_export_status(diagnostics)

    assert diagnostics["status"] == "blocked"
    assert diagnostics["blocking_count"] == 2
    assert {issue["code"] for issue in diagnostics["issues"] if issue["severity"] == "error"} == {
        "format_not_supported",
        "manual_review",
    }
    assert export_status == {
        "status": "blocked",
        "exportable": False,
        "can_materialize": False,
        "can_export_marketplace": False,
        "message": "La importacion tiene incidencias bloqueantes; no debe exportarse a Marketplace.",
    }


def test_import_profile_engine_forces_requested_profile_when_available():
    engine = PublicProcurementImportProfileEngine()

    profile, detection = engine.detect_profile(
        {"summary": {"parser_profile": "formato_desconocido"}},
        requested_profile_id="SOCE SERCOP PDF Integrado Codigo V1",
    )

    assert profile["id"] == "soce_sercop_pdf_integrado_codigo_v1"
    assert detection["status"] == "forced"
    assert detection["score"] == 1000
    assert detection["candidates"] == [
        {
            "profile_id": "soce_sercop_pdf_integrado_codigo_v1",
            "score": 1000,
            "reason": "forced",
        }
    ]


def test_import_profile_engine_lists_profiles_by_priority_and_filters_inactive(tmp_path):
    store_path = tmp_path / "profiles.json"
    store_path.write_text(
        json.dumps(
            [
                {"id": "perfil_bajo", "name": "Perfil bajo", "status": "active", "priority": 1},
                {"id": "perfil_inactivo", "name": "Perfil inactivo", "status": "inactive", "priority": 999},
                {"id": "perfil_alto", "name": "Perfil alto", "status": "active", "priority": 50},
            ]
        ),
        encoding="utf-8",
    )
    engine = PublicProcurementImportProfileEngine(store_path=store_path)

    all_ids = [profile["id"] for profile in engine.list_profiles()]
    active_ids = [profile["id"] for profile in engine.list_profiles(include_inactive=False)]

    assert all_ids == ["perfil_inactivo", "perfil_alto", "perfil_bajo"]
    assert active_ids == ["perfil_alto", "perfil_bajo"]


def test_import_profile_engine_save_profile_normalizes_and_replaces_existing(tmp_path):
    store_path = tmp_path / "profiles.json"
    store_path.write_text(
        json.dumps(
            [
                {
                    "id": "perfil_base",
                    "name": "Perfil base",
                    "status": "draft",
                    "priority": 1,
                    "updated_at": "2026-01-01T00:00:00+00:00",
                }
            ]
        ),
        encoding="utf-8",
    )
    engine = PublicProcurementImportProfileEngine(store_path=store_path)

    saved = engine.save_profile(
        {
            "id": " Perfil Base ",
            "name": "  Perfil   Base  Actualizado ",
            "status": "ACTIVE",
            "priority": "30",
            "description": "  texto   limpio ",
            "validation": {"economic_tolerance": "0.05"},
            "updated_at": "2026-01-02T00:00:00+00:00",
        }
    )
    stored = json.loads(store_path.read_text(encoding="utf-8"))

    assert saved["id"] == "perfil_base"
    assert saved["name"] == "Perfil Base Actualizado"
    assert saved["status"] == "active"
    assert saved["priority"] == 30
    assert saved["description"] == "texto limpio"
    assert saved["validation"] == {"economic_tolerance": "0.05"}
    assert len(stored) == 1
    assert stored[0]["id"] == "perfil_base"


def test_import_profile_engine_proposes_profile_from_vae_analysis():
    engine = PublicProcurementImportProfileEngine()

    profile = engine.propose_profile_from_analysis(
        {
            "summary": {
                "parser_profile": "soce_sercop_pdf_vae_resumen_v1",
                "document_kind": "presupuesto_y_apus",
                "confidence": "alta",
            },
            "classification": {"detected_sections": ["budget", "apus", "vae"]},
        },
        desired_name=" Modelo VAE Especial ",
    )

    assert profile["id"] == "modelo_vae_especial"
    assert profile["name"] == "Modelo VAE Especial"
    assert profile["status"] == "draft"
    assert profile["priority"] == 10
    assert profile["detection"]["parser_profiles"] == ["soce_sercop_pdf_vae_resumen_v1"]
    assert profile["detection"]["required_sections"] == ["budget", "apus", "vae"]
    assert profile["hooks"]["budget"]["match_strategy"] == "descripcion_unidad_precio"
    assert profile["matching"]["budget_to_apu"] == "descripcion_unidad_precio"
    assert profile["ui"]["editable_by_superadmin"] is True


def test_import_profile_engine_clone_profile_preserves_contract_and_overrides_identity(tmp_path):
    store_path = tmp_path / "profiles.json"
    store_path.write_text(
        json.dumps(
            [
                {
                    "id": "perfil_base",
                    "name": "Perfil base",
                    "version": "1",
                    "status": "active",
                    "priority": 10,
                    "description": "Descripcion base",
                    "document_kinds": ["presupuesto_y_apus"],
                    "detection": {"parser_profiles": ["perfil_base"]},
                    "hooks": {"budget": {"match_strategy": "codigo"}},
                    "matching": {"budget_to_apu": "codigo"},
                    "validation": {"economic_tolerance": "0.02"},
                    "ui": {"accent": "blue"},
                }
            ]
        ),
        encoding="utf-8",
    )
    engine = PublicProcurementImportProfileEngine(store_path=store_path)

    cloned = engine.clone_profile(
        "perfil_base",
        {
            "id": " Perfil Clonado ",
            "name": " Perfil   Clonado ",
            "version": "2",
            "status": "draft",
            "description": " Copia revisable ",
        },
    )

    assert cloned["id"] == "perfil_clonado"
    assert cloned["name"] == "Perfil Clonado"
    assert cloned["version"] == "2"
    assert cloned["status"] == "draft"
    assert cloned["description"] == "Copia revisable"
    assert cloned["detection"] == {"parser_profiles": ["perfil_base"]}
    assert cloned["matching"] == {"budget_to_apu": "codigo"}
    assert {profile["id"] for profile in engine.list_profiles()} == {"perfil_base", "perfil_clonado"}


def test_import_profile_engine_set_profile_status_normalizes_and_persists(tmp_path):
    store_path = tmp_path / "profiles.json"
    store_path.write_text(
        json.dumps(
            [
                {
                    "id": "perfil_estado",
                    "name": "Perfil estado",
                    "status": "draft",
                    "priority": 1,
                }
            ]
        ),
        encoding="utf-8",
    )
    engine = PublicProcurementImportProfileEngine(store_path=store_path)

    updated = engine.set_profile_status(" Perfil Estado ", " INACTIVE ")

    assert updated["id"] == "perfil_estado"
    assert updated["status"] == "inactive"
    assert engine.get_profile("perfil_estado")["status"] == "inactive"


def test_import_profile_engine_rejects_invalid_profile_contracts(tmp_path):
    engine = PublicProcurementImportProfileEngine(store_path=tmp_path / "profiles.json")

    with pytest.raises(HTTPException) as missing_id:
        engine.save_profile({"id": "   ", "name": "   "})
    with pytest.raises(HTTPException) as invalid_status:
        engine.save_profile({"id": "perfil_invalido", "status": "archived"})

    assert missing_id.value.status_code == 400
    assert "identificador" in missing_id.value.detail
    assert invalid_status.value.status_code == 400
    assert "Estado de modelo no valido" in invalid_status.value.detail


def test_import_profile_engine_enriches_summary_bundle_and_contract_for_known_profile():
    engine = PublicProcurementImportProfileEngine()

    enriched = engine.enrich_analysis(
        {
            "total_amount": "25.00",
            "rubros": [{"precio_total": "25.00"}],
            "classification": {
                "document_kind": "presupuesto_apus_integrados",
                "confidence": "alta",
                "detected_sections": ["budget", "apus"],
            },
            "summary": {
                "parser_profile": "soce_sercop_pdf_integrado_codigo_v1",
                "document_kind": "presupuesto_apus_integrados",
            },
            "analysis_bundle": {"summary": {"source": "bundle"}},
            "technical_import_contract": {"source_fingerprint": "sha1-prueba"},
        },
        files=[("fuente.pdf", b"%PDF")],
    )

    summary = enriched["summary"]
    bundle_summary = enriched["analysis_bundle"]["summary"]
    contract = enriched["technical_import_contract"]

    assert enriched["import_model"]["files_count"] == 1
    assert enriched["import_model"]["profile"]["id"] == "soce_sercop_pdf_integrado_codigo_v1"
    assert contract["source_fingerprint"] == "sha1-prueba"
    assert contract["profile_id"] == "soce_sercop_pdf_integrado_codigo_v1"
    assert contract["profile_status"] == "active"
    assert contract["model_detection"]["status"] == "matched"
    assert summary["import_model"]["profile_id"] == "soce_sercop_pdf_integrado_codigo_v1"
    assert summary["technical_validation_status"] == "valid"
    assert summary["exportable_to_marketplace"] is True
    assert bundle_summary["source"] == "bundle"
    assert bundle_summary["import_model"] == summary["import_model"]
    assert bundle_summary["export_readiness"] == summary["export_readiness"]


def test_import_profile_engine_syncs_blocking_incidents_to_summary_and_bundle():
    engine = PublicProcurementImportProfileEngine()

    enriched = engine.enrich_analysis(
        {
            "total_amount": "0",
            "classification": {"document_kind": "desconocido", "confidence": "baja", "detected_sections": []},
            "summary": {"parser_profile": "formato_desconocido"},
            "analysis_bundle": {"summary": {}},
        },
        files=[],
    )

    summary = enriched["summary"]
    bundle_summary = enriched["analysis_bundle"]["summary"]

    assert enriched["import_model"]["files_count"] == 0
    assert enriched["technical_import_contract"]["profile_status"] == "unrecognized"
    assert summary["technical_validation_status"] == "blocked"
    assert summary["exportable_to_marketplace"] is False
    assert summary["requires_superadmin_consent"] is True
    assert summary["blocking_incidents"][0]["code"] == "format_not_supported"
    assert bundle_summary["technical_validation_status"] == "blocked"
    assert bundle_summary["requires_superadmin_consent"] is True
    assert bundle_summary["blocking_incidents"] == summary["blocking_incidents"]


def test_admin_import_models_endpoint_requires_superadmin():
    app.dependency_overrides[get_current_user] = lambda: SimpleNamespace(rol="administrador")
    try:
        with TestClient(app) as client:
            response = client.get("/api/v1/admin-import-models/")
    finally:
        app.dependency_overrides.clear()

    assert response.status_code == 403


def test_admin_import_models_endpoint_lists_profiles_for_superadmin():
    app.dependency_overrides[get_current_user] = lambda: SimpleNamespace(rol="superadministrador")
    try:
        with TestClient(app) as client:
            response = client.get("/api/v1/admin-import-models/")
    finally:
        app.dependency_overrides.clear()

    assert response.status_code == 200
    ids = {item["id"] for item in response.json()["items"]}
    assert "soce_sercop_pdf_integrado_codigo_v1" in ids
    assert "soce_sercop_pdf_vae_resumen_v1" in ids
