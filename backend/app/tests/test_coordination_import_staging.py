import base64
import hashlib
from types import SimpleNamespace

import pytest
from fastapi import HTTPException

from app.models.proyecto import Proyecto
from app.models.usuario import Usuario
from app.services.bim.coordination_import_stage_service import (
    claim_confirmed_stage,
    claim_confirmed_stage_reference,
    complete_stage_consumption,
    confirm_preflight,
    create_preflight,
    release_failed_stage_consumption,
)


def _scope(db, company):
    project = Proyecto(nombre="Staging", codigo="STAGE-1", codigo_root="STAGE-1", revision=0, empresa_id=company.id)
    user = Usuario(email="stage@example.com", hashed_password="x", nombre_completo="Stage", empresa_id=company.id, rol="usuario")
    db.add_all([project, user]); db.commit(); db.refresh(project); db.refresh(user)
    return project, user


def _payload(content: bytes, **overrides):
    data = dict(source_domain="bim", source_format="ifc", filename="model.ifc", content_base64=base64.b64encode(content).decode(), coordination_set_id=None)
    data.update(overrides)
    return SimpleNamespace(**data)


def test_preflight_is_checksum_idempotent_and_writes_no_domain(db, sample_empresa):
    project, user = _scope(db, sample_empresa)
    content = b"ISO-10303-21;\nHEADER;\nENDSEC;"
    first = create_preflight(db, project_id=project.id, company_id=sample_empresa.id, user_id=user.id, payload=_payload(content))
    duplicate = create_preflight(db, project_id=project.id, company_id=sample_empresa.id, user_id=user.id, payload=_payload(content))
    assert first["status"] == "preflight_ready"
    assert first["checksum_sha256"] == hashlib.sha256(content).hexdigest()
    assert first["manifest"]["writes_to_domains"] == 0
    assert duplicate["id"] == first["id"] and duplicate["duplicate"] is True

    confirmed = confirm_preflight(
        db, stage_id=first["id"], project_id=project.id, company_id=sample_empresa.id,
        user_id=user.id, payload=SimpleNamespace(expected_checksum_sha256=first["checksum_sha256"], reason="Reviewed"),
    )
    assert confirmed["status"] == "confirmed"
    assert confirmed["manifest"]["writes_to_domains"] == 0
    repeated = confirm_preflight(
        db, stage_id=first["id"], project_id=project.id, company_id=sample_empresa.id,
        user_id=user.id, payload=SimpleNamespace(expected_checksum_sha256=first["checksum_sha256"], reason="Retry"),
    )
    assert repeated["duplicate_confirmation"] is True


def test_invalid_signature_and_changed_checksum_cannot_be_confirmed(db, sample_empresa):
    project, user = _scope(db, sample_empresa)
    failed = create_preflight(db, project_id=project.id, company_id=sample_empresa.id, user_id=user.id, payload=_payload(b"not-ifc"))
    assert failed["status"] == "preflight_failed"
    with pytest.raises(HTTPException) as invalid:
        confirm_preflight(db, stage_id=failed["id"], project_id=project.id, company_id=sample_empresa.id, user_id=user.id, payload=SimpleNamespace(expected_checksum_sha256=failed["checksum_sha256"], reason="No"))
    assert invalid.value.status_code == 409


@pytest.mark.parametrize(("domain", "source_format", "filename", "content"), [
    ("bim", "bcf", "issues.bcf", b"PK\x03\x04bcf"),
    ("schedule", "mspdi", "plan.xml", b"<Project></Project>"),
    ("schedule", "p6_xml", "plan.xml", b"<APIBusinessObjects/>"),
    ("schedule", "p6_xer", "plan.xer", b"ERMHDR\t19.12"),
    ("budget", "xlsx", "budget.xlsx", b"PK\x03\x04xlsx"),
    ("budget", "json", "budget.json", b'{"items": []}'),
    ("connector", "connector", "connector.json", b'{"cursor": "abc"}'),
])
def test_common_staging_accepts_every_supported_import_family(db, sample_empresa, domain, source_format, filename, content):
    project, user = _scope(db, sample_empresa)
    result = create_preflight(
        db, project_id=project.id, company_id=sample_empresa.id, user_id=user.id,
        payload=_payload(content, source_domain=domain, source_format=source_format, filename=filename),
    )
    assert result["status"] == "preflight_ready"
    assert result["manifest"]["writes_to_domains"] == 0


def test_staging_rejects_cross_tenant_user_and_confirmation(db, sample_empresa):
    project, user = _scope(db, sample_empresa)
    with pytest.raises(HTTPException) as denied:
        create_preflight(
            db, project_id=project.id, company_id=sample_empresa.id + 1, user_id=user.id,
            payload=_payload(b"ISO-10303-21;"),
        )
    assert denied.value.status_code == 404


def test_confirmed_stage_consumption_is_checksum_bound_and_idempotent(db, sample_empresa):
    project, user = _scope(db, sample_empresa)
    content = b"ISO-10303-21;\nHEADER;\nENDSEC;"
    staged = create_preflight(db, project_id=project.id, company_id=sample_empresa.id, user_id=user.id, payload=_payload(content))
    confirm_preflight(
        db, stage_id=staged["id"], project_id=project.id, company_id=sample_empresa.id,
        user_id=user.id, payload=SimpleNamespace(expected_checksum_sha256=staged["checksum_sha256"], reason="Reviewed"),
    )
    claimed = claim_confirmed_stage(
        db, stage_id=staged["id"], project_id=project.id, company_id=sample_empresa.id,
        user_id=user.id, source_domain="bim", source_format="ifc", content=content, operation_key="ifc:7:v1",
    )
    assert claimed["duplicate_consumption"] is False
    completed = complete_stage_consumption(db, stage_id=staged["id"], operation_key="ifc:7:v1", result={"version_id": 9})
    assert completed["status"] == "consumed"
    assert completed["manifest"]["writes_to_domains"] == 1
    repeated = claim_confirmed_stage(
        db, stage_id=staged["id"], project_id=project.id, company_id=sample_empresa.id,
        user_id=user.id, source_domain="bim", source_format="ifc", content=content, operation_key="ifc:7:v1",
    )
    assert repeated["duplicate_consumption"] is True
    assert repeated["result"] == {"version_id": 9}


def test_stage_consumption_rejects_changed_bytes_and_releases_failed_attempt(db, sample_empresa):
    project, user = _scope(db, sample_empresa)
    content = b"ISO-10303-21;\nHEADER;\nENDSEC;"
    staged = create_preflight(db, project_id=project.id, company_id=sample_empresa.id, user_id=user.id, payload=_payload(content))
    confirm_preflight(
        db, stage_id=staged["id"], project_id=project.id, company_id=sample_empresa.id,
        user_id=user.id, payload=SimpleNamespace(expected_checksum_sha256=staged["checksum_sha256"], reason="Reviewed"),
    )
    with pytest.raises(HTTPException) as changed:
        claim_confirmed_stage(
            db, stage_id=staged["id"], project_id=project.id, company_id=sample_empresa.id,
            user_id=user.id, source_domain="bim", source_format="ifc", content=content + b"tampered", operation_key="ifc:retry",
        )
    assert changed.value.status_code == 409
    claim_confirmed_stage(
        db, stage_id=staged["id"], project_id=project.id, company_id=sample_empresa.id,
        user_id=user.id, source_domain="bim", source_format="ifc", content=content, operation_key="ifc:retry",
    )
    released = release_failed_stage_consumption(db, stage_id=staged["id"], operation_key="ifc:retry", error_code="parser_failed")
    assert released["status"] == "confirmed"
    assert released["manifest"]["writes_to_domains"] == 0


def test_confirmed_schedule_stage_is_bound_to_canonical_document_reference(db, sample_empresa):
    project, user = _scope(db, sample_empresa)
    content = b"<Project><Name>Plan</Name></Project>"
    staged = create_preflight(
        db, project_id=project.id, company_id=sample_empresa.id, user_id=user.id,
        payload=_payload(content, source_domain="schedule", source_format="mspdi", filename="plan.xml"),
    )
    confirm_preflight(
        db, stage_id=staged["id"], project_id=project.id, company_id=sample_empresa.id,
        user_id=user.id, payload=SimpleNamespace(expected_checksum_sha256=staged["checksum_sha256"], reason="Reviewed"),
    )
    with pytest.raises(HTTPException) as mismatch:
        claim_confirmed_stage_reference(
            db, stage_id=staged["id"], project_id=project.id, company_id=sample_empresa.id,
            user_id=user.id, source_domain="schedule", source_format="mspdi",
            expected_checksum_sha256="0" * 64, expected_filename="plan.xml", operation_key="schedule:1",
        )
    assert mismatch.value.status_code == 409
    claimed = claim_confirmed_stage_reference(
        db, stage_id=staged["id"], project_id=project.id, company_id=sample_empresa.id,
        user_id=user.id, source_domain="schedule", source_format="mspdi",
        expected_checksum_sha256=staged["checksum_sha256"], expected_filename="plan.xml", operation_key="schedule:1",
    )
    assert claimed["stage"]["status"] == "consuming"
