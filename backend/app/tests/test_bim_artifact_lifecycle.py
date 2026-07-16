from pathlib import Path

from app.models.bim_artifact import BimArtifact
from app.models.bim_element import BimElement
from app.models.proyecto import Proyecto
from app.schemas.bim_model import BimImportElementPayload, BimJsonImportRequest
from app.services.bim.artifact_registry import (
    rollback_artifact,
    stage_artifact_file,
    validate_artifact,
)
from app.services.bim.artifact_service import generate_viewer_artifact
from app.services.bim.import_service import import_json_bim_package


def _version(db, sample_empresa):
    project = Proyecto(nombre="Proyecto lifecycle artifacts", empresa_id=sample_empresa.id)
    db.add(project)
    db.commit()
    db.refresh(project)
    imported = import_json_bim_package(
        db,
        project_id=project.id,
        company_id=sample_empresa.id,
        payload=BimJsonImportRequest(
            model_name="Modelo lifecycle",
            version_label="v1",
            activate=False,
            elements=[BimImportElementPayload(global_id="ART-1", ifc_class="IFCWALL", nombre="Muro 1")],
        ),
    )
    return project, imported.version_id


def test_viewer_artifact_regeneration_is_idempotent(db, sample_empresa, tmp_path):
    project, version_id = _version(db, sample_empresa)

    first = generate_viewer_artifact(
        db,
        project_id=project.id,
        company_id=sample_empresa.id,
        version_id=version_id,
        storage_root=tmp_path,
    )
    second = generate_viewer_artifact(
        db,
        project_id=project.id,
        company_id=sample_empresa.id,
        version_id=version_id,
        storage_root=tmp_path,
    )

    assert first.artifact_id == second.artifact_id
    assert first.generation == 1
    assert first.checksum_sha256 == second.checksum_sha256
    assert db.query(BimArtifact).filter(BimArtifact.bim_model_version_id == version_id).count() == 1


def test_artifact_corruption_is_detected(db, sample_empresa, tmp_path):
    project, version_id = _version(db, sample_empresa)
    generated = generate_viewer_artifact(
        db,
        project_id=project.id,
        company_id=sample_empresa.id,
        version_id=version_id,
        storage_root=tmp_path,
    )
    artifact = db.query(BimArtifact).filter(BimArtifact.id == generated.artifact_id).one()
    Path(artifact.artifact_path).write_text("corrupt", encoding="utf-8")

    validated = validate_artifact(db, artifact)

    assert validated.status == "corrupt"


def test_fragments_contract_incompatibility_is_detected(db, sample_empresa, tmp_path):
    project, version_id = _version(db, sample_empresa)
    fragments_path = tmp_path / "model.frag"
    fragments_path.write_bytes(b"FRAGMENTS-BINARY-V1")
    artifact = stage_artifact_file(
        db,
        version_id=version_id,
        project_id=project.id,
        company_id=sample_empresa.id,
        artifact_type="fragments",
        artifact_path=str(fragments_path),
        contract_version="giproy_bim_fragments_v0",
    )
    db.commit()

    validated = validate_artifact(db, artifact)

    assert validated.status == "incompatible"


def test_viewer_artifact_can_roll_back_to_previous_valid_generation(db, sample_empresa, tmp_path):
    project, version_id = _version(db, sample_empresa)
    first = generate_viewer_artifact(
        db,
        project_id=project.id,
        company_id=sample_empresa.id,
        version_id=version_id,
        storage_root=tmp_path,
    )
    db.add(
        BimElement(
            bim_model_version_id=version_id,
            global_id="ART-2",
            ifc_class="IFCSLAB",
            nombre="Losa 2",
        )
    )
    db.commit()
    second = generate_viewer_artifact(
        db,
        project_id=project.id,
        company_id=sample_empresa.id,
        version_id=version_id,
        storage_root=tmp_path,
    )

    restored = rollback_artifact(
        db,
        artifact_id=second.artifact_id,
        project_id=project.id,
        company_id=sample_empresa.id,
    )

    assert second.generation == 2
    assert restored.id == first.artifact_id
    assert restored.status == "active"
    assert db.query(BimArtifact).filter(BimArtifact.id == second.artifact_id).one().status == "rolled_back"

