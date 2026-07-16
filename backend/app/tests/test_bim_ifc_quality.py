import hashlib
import json
from pathlib import Path

from app.models.bim_ifc_quality_report import BimIfcQualityReport
from app.models.proyecto import Proyecto
from app.schemas.bim_model import BimImportElementPayload, BimJsonImportRequest
from app.services.bim.ifc_quality_service import (
    IFC_QUALITY_CONTRACT,
    analyze_ifc_quality,
    stage_ifc_quality_report,
)
from app.services.bim.import_service import import_json_bim_package


FIXTURE_ROOT = Path(__file__).resolve().parent / "fixtures" / "bim" / "real"


def test_real_ifc_corpus_has_valid_step_and_supported_schema():
    manifest = json.loads((FIXTURE_ROOT / "manifest.json").read_text(encoding="utf-8"))

    for dataset in manifest["datasets"]:
        source = (FIXTURE_ROOT / dataset["relative_path"]).read_bytes()
        analysis = analyze_ifc_quality(
            source.decode("utf-8", errors="replace"),
            source_checksum_sha256=hashlib.sha256(source).hexdigest(),
        )
        assert analysis.contract_version == IFC_QUALITY_CONTRACT
        assert analysis.step_status == "valid"
        assert analysis.schema_status == "supported"
        assert analysis.error_count == 0
        assert analysis.summary["entity_count"] > 0
        assert analysis.summary["certification_claimed"] is False


def test_invalid_ifc_separates_step_and_schema_errors():
    analysis = analyze_ifc_quality("#20=IFCWALL('INVALID',$,'Muro',$,$,$,$,$);")

    assert analysis.overall_status == "failed"
    assert analysis.step_status == "invalid"
    assert analysis.schema_status == "unknown"
    assert analysis.error_count >= 3
    assert {finding["domain"] for finding in analysis.findings} >= {"step", "schema", "semantic"}


def test_partially_supported_schema_is_warning_not_certification():
    source = """ISO-10303-21;
HEADER;
FILE_SCHEMA(('IFC4X3_ADD2'));
ENDSEC;
DATA;
#1=IFCPROJECT('PROJECT-1',$,'Proyecto',$,$,$,$,$,$);
#2=IFCBUILDINGSTOREY('STOREY-1',$,'Nivel 1',$,$,$,$,$,$);
#3=IFCWALL('WALL-1',$,'Muro',$,$,$,$,$);
ENDSEC;
END-ISO-10303-21;
"""
    analysis = analyze_ifc_quality(source)

    assert analysis.step_status == "valid"
    assert analysis.schema_status == "partially_supported"
    assert analysis.overall_status == "warnings"
    assert analysis.error_count == 0
    assert any(finding["code"] == "schema.partially_supported" for finding in analysis.findings)
    assert analysis.summary["certification_claimed"] is False


def test_quality_report_is_persisted_idempotently_per_tenant_version(db, sample_empresa):
    project = Proyecto(nombre="Proyecto calidad IFC", empresa_id=sample_empresa.id)
    db.add(project)
    db.commit()
    db.refresh(project)
    imported = import_json_bim_package(
        db,
        project_id=project.id,
        company_id=sample_empresa.id,
        payload=BimJsonImportRequest(
            model_name="Modelo calidad",
            version_label="v1",
            activate=False,
            elements=[BimImportElementPayload(global_id="QUALITY-001", ifc_class="IFCWALL")],
        ),
    )
    analysis = analyze_ifc_quality(
        """ISO-10303-21;
HEADER;
FILE_SCHEMA(('IFC4'));
ENDSEC;
DATA;
#1=IFCPROJECT('P-1',$,'Proyecto',$,$,$,$,$,$);
#2=IFCBUILDINGSTOREY('S-1',$,'Nivel',$,$,$,$,$,$);
#3=IFCWALL('W-1',$,'Muro',$,$,$,$,$);
ENDSEC;
END-ISO-10303-21;
"""
    )

    first = stage_ifc_quality_report(
        db,
        version_id=imported.version_id,
        project_id=project.id,
        company_id=sample_empresa.id,
        analysis=analysis,
    )
    db.commit()
    second = stage_ifc_quality_report(
        db,
        version_id=imported.version_id,
        project_id=project.id,
        company_id=sample_empresa.id,
        analysis=analysis,
    )
    db.commit()

    assert first.id == second.id
    assert db.query(BimIfcQualityReport).filter(BimIfcQualityReport.proyecto_id == project.id).count() == 1
    assert second.empresa_id == sample_empresa.id

