from pathlib import Path

import pytest
from fastapi import FastAPI, HTTPException
from fastapi.testclient import TestClient

from app.api.endpoints import bim_models as bim_models_endpoint
from app.core.config import settings
from app.models.bim_element import BimElement
from app.models.bim_model import BimModel
from app.models.bim_model_version import BimModelVersion
from app.models.proyecto import Proyecto
from app.models.system_bim_setting import SystemBimSetting
from app.models.usuario import Usuario
from app.schemas.bim_4d_partition import Bim4dPartitionCsgArtifactCreate, Bim4dPartitionSpecCreate
from app.services.bim.partition_4d_service import create_partition_csg_artifact, create_partition_spec, delete_partition_spec, get_partition_artifact, list_partition_csg_artifacts, list_partition_specs, materialize_partition


def _box_mesh(min_x, max_x, volume):
    positions = [min_x, -1, -0.5, max_x, -1, -0.5, max_x, 1, -0.5, min_x, 1, -0.5, min_x, -1, 0.5, max_x, -1, 0.5, max_x, 1, 0.5, min_x, 1, 0.5]
    indices = [0, 2, 1, 0, 3, 2, 4, 5, 6, 4, 6, 7, 0, 1, 5, 0, 5, 4, 3, 7, 6, 3, 6, 2, 0, 4, 7, 0, 7, 3, 1, 2, 6, 1, 6, 5]
    return {"positions": positions, "normals": [], "indices": indices, "volume": volume, "triangle_count": 12}


def _bim_client(db, user):
    app = FastAPI()
    app.include_router(bim_models_endpoint.router, prefix="/bim")
    app.dependency_overrides[bim_models_endpoint.get_db] = lambda: db
    app.dependency_overrides[bim_models_endpoint.get_current_active_user] = lambda: user
    return TestClient(app)


def test_partition_preview_is_tenant_scoped_and_reversible(db, sample_empresa):
    user = Usuario(email="partition4d@example.com", hashed_password="x", nombre_completo="Partition 4D", empresa_id=sample_empresa.id, rol="superadministrador")
    project = Proyecto(nombre="Partition Project", empresa_id=sample_empresa.id); db.add_all([user, project]); db.flush()
    model = BimModel(proyecto_id=project.id, empresa_id=sample_empresa.id, nombre="Partition Model"); db.add(model); db.flush()
    version = BimModelVersion(bim_model_id=model.id, version_label="v1", status="published", is_active=True); db.add(version); db.flush()
    element = BimElement(bim_model_version_id=version.id, global_id="GUID-PART-001", ifc_class="IfcWall", nombre="Wall", metadata_json={"geometry_2d": {"width": 6, "height": 0.3}}, properties={"Height": "3.00 m"}); db.add(element); db.commit()
    payload = Bim4dPartitionSpecCreate(element_id=element.id, revision="P1", axis="x", segment_count=3, gap_ratio=0.04)
    result = create_partition_spec(db, project_id=project.id, company_id=sample_empresa.id, user_id=user.id, payload=payload)
    assert result["global_id"] == "GUID-PART-001" and result["materialized"] is False
    assert result["preview_bounds"] == {"width": 6, "height": 3, "depth": 0.3}
    assert list_partition_specs(db, project_id=project.id, company_id=sample_empresa.id)[0]["id"] == result["id"]
    with pytest.raises(HTTPException) as duplicate:
        create_partition_spec(db, project_id=project.id, company_id=sample_empresa.id, user_id=user.id, payload=payload)
    assert duplicate.value.status_code == 409
    assert list_partition_specs(db, project_id=project.id, company_id=sample_empresa.id + 999) == []
    delete_partition_spec(db, spec_id=result["id"], project_id=project.id, company_id=sample_empresa.id)
    assert list_partition_specs(db, project_id=project.id, company_id=sample_empresa.id) == []


def test_bim_4d_partition_migration_is_additive():
    path = Path(__file__).parents[2] / "alembic" / "versions" / "de2018a1b2c3_bim_4d_partition_specs.py"
    source = path.read_text(encoding="utf-8")
    assert 'down_revision = "de2017a1b2c3"' in source
    assert '"bim_4d_partition_specs"' in source
    assert "alter_column" not in source


def test_partition_materialization_is_deterministic_and_traceable(db, sample_empresa):
    user = Usuario(email="materialize4d@example.com", hashed_password="x", nombre_completo="Materialize 4D", empresa_id=sample_empresa.id, rol="superadministrador")
    project = Proyecto(nombre="Materialization Project", empresa_id=sample_empresa.id); db.add_all([user, project]); db.flush()
    model = BimModel(proyecto_id=project.id, empresa_id=sample_empresa.id, nombre="Materialization Model"); db.add(model); db.flush()
    version = BimModelVersion(bim_model_id=model.id, version_label="v1", status="published", is_active=True); db.add(version); db.flush()
    element = BimElement(bim_model_version_id=version.id, global_id="GUID-MAT-001", ifc_class="IfcWall", nombre="Wall", metadata_json={"geometry_2d": {"width": 6, "height": 0.3}}, properties={"Height": 3}); db.add(element); db.commit()
    spec = create_partition_spec(db, project_id=project.id, company_id=sample_empresa.id, user_id=user.id, payload=Bim4dPartitionSpecCreate(element_id=element.id, revision="M1", axis="x", segment_count=3, gap_ratio=0.1))
    artifact = materialize_partition(db, spec_id=spec["id"], project_id=project.id, company_id=sample_empresa.id, user_id=user.id)
    repeated = materialize_partition(db, spec_id=spec["id"], project_id=project.id, company_id=sample_empresa.id, user_id=user.id)
    assert artifact["id"] == repeated["id"]
    assert artifact["geometry_method"] == "bounding_box_v1" and artifact["exact_ifc_csg"] is False
    assert artifact["source_global_id"] == "GUID-MAT-001" and len(artifact["segments"]) == 3
    assert artifact["checksum_sha256"] == repeated["checksum_sha256"] and len(artifact["checksum_sha256"]) == 64
    assert artifact["total_volume"] == pytest.approx(6 * 3 * 0.3 * 0.9)
    assert artifact["total_volume"] == pytest.approx(sum(segment["volume"] for segment in artifact["segments"]))
    assert all(segment["surface_area"] > 0 and segment["source_global_id"] == "GUID-MAT-001" for segment in artifact["segments"])
    assert get_partition_artifact(db, spec_id=spec["id"], project_id=project.id, company_id=sample_empresa.id)["checksum_sha256"] == artifact["checksum_sha256"]
    assert list_partition_specs(db, project_id=project.id, company_id=sample_empresa.id)[0]["materialized"] is True
    with pytest.raises(HTTPException) as tenant_error:
        get_partition_artifact(db, spec_id=spec["id"], project_id=project.id, company_id=sample_empresa.id + 1)
    assert tenant_error.value.status_code == 404


def test_bim_4d_partition_artifact_migration_is_additive():
    path = Path(__file__).parents[2] / "alembic" / "versions" / "de2019a1b2c3_bim_4d_partition_artifacts.py"
    source = path.read_text(encoding="utf-8")
    assert 'down_revision = "de2018a1b2c3"' in source
    assert '"bim_4d_partition_artifacts"' in source
    assert "alter_column" not in source


def test_exact_csg_artifact_is_versioned_tenant_scoped_and_server_validated(db, sample_empresa):
    user = Usuario(email="csg4d@example.com", hashed_password="x", nombre_completo="CSG 4D", empresa_id=sample_empresa.id, rol="superadministrador")
    project = Proyecto(nombre="CSG Project", empresa_id=sample_empresa.id); db.add_all([user, project]); db.flush()
    model = BimModel(proyecto_id=project.id, empresa_id=sample_empresa.id, nombre="CSG Model"); db.add(model); db.flush()
    version = BimModelVersion(bim_model_id=model.id, version_label="v1", status="published", is_active=True); db.add(version); db.flush()
    element = BimElement(bim_model_version_id=version.id, global_id="GUID-CSG-001", ifc_class="IfcWall", nombre="Wall", metadata_json={"geometry_2d": {"width": 4, "height": 1}}, properties={"Height": 2}); db.add(element); db.commit()
    spec = create_partition_spec(db, project_id=project.id, company_id=sample_empresa.id, user_id=user.id, payload=Bim4dPartitionSpecCreate(element_id=element.id, revision="CSG-SPEC-1", axis="x", segment_count=2, gap_ratio=0))
    payload = Bim4dPartitionCsgArtifactCreate(contract_version="giproy_bim_4d_csg_artifact_v1", artifact_revision="CSG-R1", source_global_id=element.global_id, geometry_method="exact_bvh_csg_v1", source_mesh=_box_mesh(-2, 2, 8), segments=[{"index": 1, "mesh": _box_mesh(-2, 0, 4)}, {"index": 2, "mesh": _box_mesh(0, 2, 4)}], conservation_delta=0)

    artifact = create_partition_csg_artifact(db, spec_id=spec["id"], project_id=project.id, company_id=sample_empresa.id, user_id=user.id, payload=payload)
    assert artifact["geometry_method"] == "exact_bvh_csg_v1"
    assert artifact["source_global_id"] == "GUID-CSG-001"
    assert artifact["partition_volume"] == pytest.approx(8)
    assert artifact["conservation_delta"] == pytest.approx(0)
    assert len(artifact["checksum_sha256"]) == 64
    assert list_partition_csg_artifacts(db, spec_id=spec["id"], project_id=project.id, company_id=sample_empresa.id)[0]["id"] == artifact["id"]
    with pytest.raises(HTTPException) as duplicate:
        create_partition_csg_artifact(db, spec_id=spec["id"], project_id=project.id, company_id=sample_empresa.id, user_id=user.id, payload=payload)
    assert duplicate.value.status_code == 409
    with pytest.raises(HTTPException) as tenant_error:
        list_partition_csg_artifacts(db, spec_id=spec["id"], project_id=project.id, company_id=sample_empresa.id + 1)
    assert tenant_error.value.status_code == 404

    tampered = payload.model_copy(deep=True)
    tampered.artifact_revision = "CSG-R2"
    tampered.segments[0].mesh.volume = 5
    with pytest.raises(HTTPException) as invalid_volume:
        create_partition_csg_artifact(db, spec_id=spec["id"], project_id=project.id, company_id=sample_empresa.id, user_id=user.id, payload=tampered)
    assert invalid_volume.value.status_code == 422


def test_bim_4d_csg_artifact_migration_is_additive_and_reversible():
    path = Path(__file__).parents[2] / "alembic" / "versions" / "de2022a1b2c3_bim_4d_csg_artifacts.py"
    source = path.read_text(encoding="utf-8")
    assert 'down_revision = "de2021a1b2c3"' in source
    assert '"bim_4d_partition_csg_artifacts"' in source
    assert 'op.drop_table("bim_4d_partition_csg_artifacts")' in source
    assert "alter_column" not in source


def test_exact_csg_artifact_http_round_trip_uses_bim_permissions(db, sample_empresa, monkeypatch):
    monkeypatch.setattr(settings, "BIM_ENABLED", True)
    monkeypatch.setattr(settings, "BIM_ALLOWED_EMPRESA_IDS", "")
    monkeypatch.setattr(settings, "BIM_ALLOWED_USER_IDS", "")
    user = Usuario(email="csg-http@example.com", hashed_password="x", nombre_completo="CSG HTTP", empresa_id=sample_empresa.id, rol="superadministrador")
    project = Proyecto(nombre="CSG HTTP Project", empresa_id=sample_empresa.id)
    db.add_all([user, project, SystemBimSetting(titulo="CSG HTTP", descripcion="Gate CSG", is_enabled=True, superadmin_only=False, allowed_company_ids=str(sample_empresa.id))]); db.flush()
    model = BimModel(proyecto_id=project.id, empresa_id=sample_empresa.id, nombre="CSG HTTP Model"); db.add(model); db.flush()
    version = BimModelVersion(bim_model_id=model.id, version_label="v1", status="published", is_active=True); db.add(version); db.flush()
    element = BimElement(bim_model_version_id=version.id, global_id="GUID-CSG-HTTP", ifc_class="IfcWall", nombre="Wall", metadata_json={"geometry_2d": {"width": 4, "height": 1}}, properties={"Height": 2}); db.add(element); db.commit()
    spec = create_partition_spec(db, project_id=project.id, company_id=sample_empresa.id, user_id=user.id, payload=Bim4dPartitionSpecCreate(element_id=element.id, revision="HTTP-SPEC", axis="x", segment_count=2, gap_ratio=0))
    payload = Bim4dPartitionCsgArtifactCreate(contract_version="giproy_bim_4d_csg_artifact_v1", artifact_revision="HTTP-R1", source_global_id=element.global_id, geometry_method="exact_bvh_csg_v1", source_mesh=_box_mesh(-2, 2, 8), segments=[{"index": 1, "mesh": _box_mesh(-2, 0, 4)}, {"index": 2, "mesh": _box_mesh(0, 2, 4)}], conservation_delta=0)
    client = _bim_client(db, user)

    created = client.post(f"/bim/projects/{project.id}/4d/partition-specs/{spec['id']}/csg-artifacts", json=payload.model_dump())
    listed = client.get(f"/bim/projects/{project.id}/4d/partition-specs/{spec['id']}/csg-artifacts")

    assert created.status_code == 200
    assert listed.status_code == 200
    assert listed.json()[0]["checksum_sha256"] == created.json()["checksum_sha256"]
    assert listed.json()[0]["company_id"] == sample_empresa.id
