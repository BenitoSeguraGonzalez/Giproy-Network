from pathlib import Path

import pytest
from fastapi import HTTPException

from app.models.bim_ifc_quality_report import BimIfcQualityReport
from app.models.bim_model import BimModel
from app.models.bim_model_version import BimModelVersion
from app.models.proyecto import Proyecto
from app.models.usuario import Usuario
from app.schemas.bim_as_built import BimAsBuiltAcceptanceCreate, BimAsBuiltAcceptanceDecision
from app.services.bim.as_built_acceptance_service import (
    create_as_built_acceptance,
    decide_as_built_acceptance,
    list_as_built_acceptances,
)


def _candidate(db, empresa, user, *, label, checksum):
    project = db.query(Proyecto).filter(Proyecto.empresa_id == empresa.id).first()
    if not project:
        project = Proyecto(nombre="Entrega BIM", empresa_id=empresa.id)
        db.add(project)
        db.flush()
    model = BimModel(proyecto_id=project.id, empresa_id=empresa.id, nombre=f"Modelo {label}")
    db.add(model)
    db.flush()
    version = BimModelVersion(
        bim_model_id=model.id,
        version_label=label,
        source_filename=f"{label}.ifc",
        status="ready",
        is_active=True,
        element_count=12,
    )
    db.add(version)
    db.flush()
    db.add(BimIfcQualityReport(
        bim_model_version_id=version.id,
        proyecto_id=project.id,
        empresa_id=empresa.id,
        contract_version="giproy_bim_ifc_quality_v1",
        source_checksum_sha256=checksum,
        schema_identifier="IFC4",
        step_status="valid",
        schema_status="supported",
        semantic_status="passed",
        overall_status="passed",
        error_count=0,
        warning_count=0,
        findings=[],
        summary_json={},
    ))
    db.commit()
    return project, version


def test_as_built_acceptance_supersedes_previous(db, sample_empresa):
    user = Usuario(email="handover@example.com", hashed_password="x", nombre_completo="Handover", empresa_id=sample_empresa.id, rol="superadministrador")
    db.add(user)
    db.flush()
    project, version_one = _candidate(db, sample_empresa, user, label="AB-01", checksum="a" * 64)
    first = create_as_built_acceptance(
        db,
        project_id=project.id,
        company_id=sample_empresa.id,
        user_id=user.id,
        payload=BimAsBuiltAcceptanceCreate(version_id=version_one.id, revision="ENT-01", acceptance_criteria=["Geometria verificada"], declaration_notes="Primera entrega verificable"),
    )
    decide_as_built_acceptance(db, acceptance_id=first["id"], project_id=project.id, company_id=sample_empresa.id, user_id=user.id, payload=BimAsBuiltAcceptanceDecision(decision="accepted", reason="Aceptada para entrega inicial", expected_lock_version=1))
    _, version_two = _candidate(db, sample_empresa, user, label="AB-02", checksum="b" * 64)
    second = create_as_built_acceptance(
        db,
        project_id=project.id,
        company_id=sample_empresa.id,
        user_id=user.id,
        payload=BimAsBuiltAcceptanceCreate(version_id=version_two.id, revision="ENT-02", acceptance_criteria=["Geometria verificada", "Propiedades revisadas"], declaration_notes="Revision final de entrega"),
    )
    decided = decide_as_built_acceptance(db, acceptance_id=second["id"], project_id=project.id, company_id=sample_empresa.id, user_id=user.id, payload=BimAsBuiltAcceptanceDecision(decision="accepted", reason="Aceptada como as-built vigente", expected_lock_version=1))
    rows = list_as_built_acceptances(db, project_id=project.id, company_id=sample_empresa.id)
    assert decided["source_checksum_sha256"] == "b" * 64
    assert {row["status"] for row in rows} == {"accepted", "superseded"}


def test_as_built_rejects_failed_quality_and_checksum_change(db, sample_empresa):
    user = Usuario(email="quality-handover@example.com", hashed_password="x", nombre_completo="Quality", empresa_id=sample_empresa.id, rol="superadministrador")
    db.add(user)
    db.flush()
    project, version = _candidate(db, sample_empresa, user, label="AB-Q", checksum="c" * 64)
    quality = db.query(BimIfcQualityReport).filter_by(bim_model_version_id=version.id).one()
    quality.overall_status = "failed"
    db.commit()
    with pytest.raises(HTTPException, match="reporte IFC"):
        create_as_built_acceptance(db, project_id=project.id, company_id=sample_empresa.id, user_id=user.id, payload=BimAsBuiltAcceptanceCreate(version_id=version.id, revision="ENT-Q0", acceptance_criteria=["Calidad"], declaration_notes="Entrega con calidad fallida"))
    quality.overall_status = "passed"
    db.commit()
    value = create_as_built_acceptance(db, project_id=project.id, company_id=sample_empresa.id, user_id=user.id, payload=BimAsBuiltAcceptanceCreate(version_id=version.id, revision="ENT-Q1", acceptance_criteria=["Calidad"], declaration_notes="Entrega con checksum congelado"))
    quality.source_checksum_sha256 = "d" * 64
    db.commit()
    with pytest.raises(HTTPException, match="checksum IFC"):
        decide_as_built_acceptance(db, acceptance_id=value["id"], project_id=project.id, company_id=sample_empresa.id, user_id=user.id, payload=BimAsBuiltAcceptanceDecision(decision="accepted", reason="Intento tras mutacion del checksum", expected_lock_version=1))


def test_as_built_migration_is_additive():
    source = (Path(__file__).parents[2] / "alembic" / "versions" / "de2045a1b2c3_bim_as_built_acceptances.py").read_text(encoding="utf-8")
    assert 'down_revision = "de2044a1b2c3"' in source
    assert 'ondelete="RESTRICT"' in source
    assert "alter_column" not in source
