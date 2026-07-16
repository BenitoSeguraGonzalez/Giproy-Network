from fastapi import FastAPI
from fastapi.testclient import TestClient

from app.api.endpoints import bim_view_states as bim_view_states_endpoint
from app.core.config import settings
from app.models.proyecto import Proyecto
from app.models.system_bim_setting import SystemBimSetting
from app.models.usuario import Usuario
from app.schemas.bim_model import BimImportElementPayload, BimJsonImportRequest
from app.services.bim.import_service import import_json_bim_package


def _client(db, user):
    app = FastAPI()
    app.include_router(bim_view_states_endpoint.router, prefix="/bim")
    app.dependency_overrides[bim_view_states_endpoint.get_db] = lambda: db
    app.dependency_overrides[bim_view_states_endpoint.get_current_active_user] = lambda: user
    return TestClient(app)


def _context(db, sample_empresa):
    user = Usuario(
        email="bim-viewer-state@example.com",
        hashed_password="hash",
        nombre_completo="BIM Viewer State",
        rol="usuario",
        empresa_id=sample_empresa.id,
    )
    project = Proyecto(nombre="Proyecto vistas reproducibles", empresa_id=sample_empresa.id)
    db.add_all(
        [
            user,
            project,
            SystemBimSetting(
                titulo="BIM viewer states",
                descripcion="Vistas reproducibles",
                is_enabled=True,
                superadmin_only=False,
                allowed_company_ids=str(sample_empresa.id),
            ),
        ]
    )
    db.commit()
    db.refresh(user)
    db.refresh(project)
    imported = import_json_bim_package(
        db,
        project_id=project.id,
        company_id=sample_empresa.id,
        payload=BimJsonImportRequest(
            model_name="Modelo vistas",
            version_label="v1",
            activate=False,
            elements=[BimImportElementPayload(global_id="VIEW-STATE-1", ifc_class="IFCWALL")],
        ),
    )
    return user, project, imported.version_id


def _payload(version_id):
    return {
        "nombre": "Coordinacion nivel 1",
        "scope": "personal",
        "active_version_id": version_id,
        "element_id": None,
        "viewer_state": {
            "contract_version": "giproy_bim_view_state_v2",
            "source_version_id": version_id,
            "camera": {"projection": "orthographic", "position": [8, 6, 10], "target": [0, 0, 0]},
            "selection": {"global_id": "VIEW-STATE-1", "local_id": 7},
            "visibility": {"hidden_local_ids": [2, 3], "isolated": False},
            "colors": [{"local_ids": [7], "color": "#F39200"}],
            "filters": {"storey_name": "Nivel 01", "viewer_mode": "fragments"},
            "ghost": {"enabled": True},
            "clipping": {"enabled": True, "offset": 0.25},
            "measurements": [{"volume": 4.5, "x": 2, "y": 3, "z": 0.75}],
            "units": "m",
        },
    }


def test_reproducible_view_state_roundtrip_preserves_viewer_contract(db, sample_empresa, monkeypatch):
    monkeypatch.setattr(settings, "BIM_ENABLED", True)
    monkeypatch.setattr(settings, "BIM_ALLOWED_EMPRESA_IDS", "")
    monkeypatch.setattr(settings, "BIM_ALLOWED_USER_IDS", "")
    user, project, version_id = _context(db, sample_empresa)
    client = _client(db, user)

    created = client.post(f"/bim/projects/{project.id}/view-states", json=_payload(version_id))
    fetched = client.get(f"/bim/projects/{project.id}/view-states/{created.json()['id']}")

    assert created.status_code == 200
    assert fetched.status_code == 200
    viewer_state = fetched.json()["payload"]["viewer_state"]
    assert viewer_state["contract_version"] == "giproy_bim_view_state_v2"
    assert viewer_state["camera"]["projection"] == "orthographic"
    assert viewer_state["visibility"]["hidden_local_ids"] == [2, 3]
    assert viewer_state["measurements"][0]["volume"] == 4.5


def test_reproducible_view_state_rejects_mismatched_source_version(db, sample_empresa, monkeypatch):
    monkeypatch.setattr(settings, "BIM_ENABLED", True)
    user, project, version_id = _context(db, sample_empresa)
    payload = _payload(version_id)
    payload["viewer_state"]["source_version_id"] = version_id + 999

    response = _client(db, user).post(f"/bim/projects/{project.id}/view-states", json=payload)

    assert response.status_code == 400
    assert "version activa" in response.json()["detail"]
