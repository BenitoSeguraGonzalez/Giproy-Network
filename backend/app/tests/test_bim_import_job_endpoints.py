from fastapi import FastAPI
from fastapi.testclient import TestClient

from app.api.endpoints import bim_models as bim_models_endpoint
from app.core.config import settings
from app.models.bim_import_job import BimImportJob
from app.models.bim_model_version import BimModelVersion
from app.models.proyecto import Proyecto
from app.models.system_bim_setting import SystemBimSetting
from app.models.usuario import Usuario
from app.schemas.bim_model import BimImportElementPayload, BimJsonImportRequest
from app.services.bim.import_service import import_json_bim_package


IFC_CONTENT = b"""ISO-10303-21;
DATA;
#20=IFCWALL('HTTP-W001',$,'Muro HTTP',$,$,$,$,$);
ENDSEC;
END-ISO-10303-21;
"""


def _client(db, user):
    app = FastAPI()
    app.include_router(bim_models_endpoint.router, prefix="/bim")

    def override_db():
        return db

    def override_user():
        return user

    app.dependency_overrides[bim_models_endpoint.get_db] = override_db
    app.dependency_overrides[bim_models_endpoint.get_current_active_user] = override_user
    return TestClient(app)


def _enabled_context(db, sample_empresa, *, role="superadministrador"):
    user = Usuario(
        email=f"bim-job-{role}@example.com",
        hashed_password="hash",
        nombre_completo="BIM Job User",
        rol=role,
        empresa_id=sample_empresa.id,
    )
    project = Proyecto(nombre=f"Proyecto BIM job {role}", empresa_id=sample_empresa.id)
    db.add_all(
        [
            user,
            project,
            SystemBimSetting(
                titulo=f"BIM jobs {role}",
                descripcion="Configuracion de prueba",
                is_enabled=True,
                superadmin_only=False,
                allowed_company_ids=str(sample_empresa.id),
            ),
        ]
    )
    db.commit()
    db.refresh(user)
    db.refresh(project)
    return user, project


def test_bim_import_job_http_lifecycle_is_tenant_scoped(
    db,
    sample_empresa,
    monkeypatch,
    tmp_path,
):
    monkeypatch.setattr(settings, "BIM_ENABLED", True)
    monkeypatch.setattr(settings, "BIM_ALLOWED_EMPRESA_IDS", "")
    monkeypatch.setattr(settings, "BIM_ALLOWED_USER_IDS", "")
    monkeypatch.setattr(settings, "BIM_LOCAL_STORAGE_DIR", tmp_path / "bim-storage")
    monkeypatch.setattr(bim_models_endpoint, "process_bim_import_job", lambda _job_id: None)
    user, project = _enabled_context(db, sample_empresa)
    client = _client(db, user)

    created = client.post(
        f"/bim/projects/{project.id}/imports/ifc-jobs",
        data={
            "model_name": "Modelo HTTP",
            "version_label": "v1",
            "discipline": "Arquitectura",
        },
        files={"file": ("modelo-http.ifc", IFC_CONTENT, "application/octet-stream")},
    )

    assert created.status_code == 202
    payload = created.json()
    assert payload["project_id"] == project.id
    assert payload["company_id"] == sample_empresa.id
    assert payload["status"] == "queued"
    job_id = payload["id"]

    listed = client.get(f"/bim/projects/{project.id}/imports/jobs")
    fetched = client.get(f"/bim/projects/{project.id}/imports/jobs/{job_id}")
    cancelled = client.post(f"/bim/projects/{project.id}/imports/jobs/{job_id}/cancel")

    assert listed.status_code == 200
    assert [job["id"] for job in listed.json()] == [job_id]
    assert fetched.status_code == 200
    assert fetched.json()["checksum_sha256"] == payload["checksum_sha256"]
    assert cancelled.status_code == 200
    assert cancelled.json()["status"] == "cancelled"
    assert db.query(BimImportJob).filter(BimImportJob.id == job_id).one().empresa_id == sample_empresa.id


def test_bim_import_job_http_rejects_non_superadmin(db, sample_empresa, monkeypatch, tmp_path):
    monkeypatch.setattr(settings, "BIM_ENABLED", True)
    monkeypatch.setattr(settings, "BIM_ALLOWED_EMPRESA_IDS", "")
    monkeypatch.setattr(settings, "BIM_ALLOWED_USER_IDS", "")
    monkeypatch.setattr(settings, "BIM_LOCAL_STORAGE_DIR", tmp_path / "bim-storage")
    user, project = _enabled_context(db, sample_empresa, role="usuario")

    response = _client(db, user).post(
        f"/bim/projects/{project.id}/imports/ifc-jobs",
        data={"model_name": "Modelo bloqueado", "version_label": "v1"},
        files={"file": ("bloqueado.ifc", IFC_CONTENT, "application/octet-stream")},
    )

    assert response.status_code == 403
    assert db.query(BimImportJob).filter(BimImportJob.proyecto_id == project.id).count() == 0


def test_bim_ifc_quality_report_http_generate_and_read(db, sample_empresa, monkeypatch, tmp_path):
    monkeypatch.setattr(settings, "BIM_ENABLED", True)
    monkeypatch.setattr(settings, "BIM_ALLOWED_EMPRESA_IDS", "")
    monkeypatch.setattr(settings, "BIM_ALLOWED_USER_IDS", "")
    user, project = _enabled_context(db, sample_empresa)
    imported = import_json_bim_package(
        db,
        project_id=project.id,
        company_id=sample_empresa.id,
        payload=BimJsonImportRequest(
            model_name="Modelo reporte HTTP",
            version_label="v1",
            activate=False,
            source_filename="quality.ifc",
            elements=[BimImportElementPayload(global_id="QUALITY-HTTP-1", ifc_class="IFCWALL")],
        ),
    )
    source_path = tmp_path / "quality.ifc"
    source_path.write_bytes(
        b"ISO-10303-21;\nHEADER;\nFILE_SCHEMA(('IFC4'));\nENDSEC;\nDATA;\n"
        b"#1=IFCPROJECT('P-HTTP',$,'Proyecto',$,$,$,$,$,$);\n"
        b"#2=IFCBUILDINGSTOREY('S-HTTP',$,'Nivel',$,$,$,$,$,$);\n"
        b"#3=IFCWALL('W-HTTP',$,'Muro',$,$,$,$,$);\nENDSEC;\nEND-ISO-10303-21;\n"
    )
    version = db.query(BimModelVersion).filter(BimModelVersion.id == imported.version_id).one()
    version.artifact_path = str(source_path)
    db.commit()
    client = _client(db, user)

    generated = client.post(f"/bim/projects/{project.id}/versions/{version.id}/quality-report")
    fetched = client.get(f"/bim/projects/{project.id}/versions/{version.id}/quality-report")

    assert generated.status_code == 200
    assert fetched.status_code == 200
    assert generated.json()["version_id"] == version.id
    assert fetched.json()["contract_version"] == "giproy_bim_ifc_quality_v1"
    assert fetched.json()["step_status"] == "valid"
    assert fetched.json()["schema_status"] == "supported"


def test_bim_fragments_artifact_http_register_list_and_validate(db, sample_empresa, monkeypatch, tmp_path):
    monkeypatch.setattr(settings, "BIM_ENABLED", True)
    monkeypatch.setattr(settings, "BIM_ALLOWED_EMPRESA_IDS", "")
    monkeypatch.setattr(settings, "BIM_ALLOWED_USER_IDS", "")
    monkeypatch.setattr(settings, "BIM_LOCAL_STORAGE_DIR", tmp_path / "bim-storage")
    user, project = _enabled_context(db, sample_empresa)
    imported = import_json_bim_package(
        db,
        project_id=project.id,
        company_id=sample_empresa.id,
        payload=BimJsonImportRequest(
            model_name="Modelo fragments HTTP",
            version_label="v1",
            activate=False,
            elements=[BimImportElementPayload(global_id="FRAG-HTTP-1", ifc_class="IFCWALL")],
        ),
    )
    client = _client(db, user)

    registered = client.post(
        f"/bim/projects/{project.id}/versions/{imported.version_id}/artifacts",
        data={"artifact_type": "fragments"},
        files={"file": ("modelo.frag", b"FRAGMENTS-HTTP-BINARY", "application/octet-stream")},
    )
    listed = client.get(f"/bim/projects/{project.id}/versions/{imported.version_id}/artifacts")
    validated = client.post(f"/bim/projects/{project.id}/artifacts/{registered.json()['id']}/validate")
    downloaded = client.get(f"/bim/projects/{project.id}/artifacts/{registered.json()['id']}/content")

    assert registered.status_code == 201
    assert registered.json()["contract_version"] == "giproy_bim_fragments_v1"
    assert registered.json()["generation"] == 1
    assert listed.status_code == 200
    assert [artifact["id"] for artifact in listed.json()] == [registered.json()["id"]]
    assert validated.status_code == 200
    assert validated.json()["status"] == "active"
    assert downloaded.status_code == 200
    assert downloaded.content == b"FRAGMENTS-HTTP-BINARY"
    assert downloaded.headers["x-bim-artifact-checksum"] == registered.json()["checksum_sha256"]
