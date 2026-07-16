from fastapi import FastAPI
from fastapi.testclient import TestClient

from app.api.endpoints import bim_links as bim_links_endpoint
from app.core.config import settings
from app.models.proyecto import Proyecto
from app.models.system_bim_setting import SystemBimSetting
from app.models.usuario import Usuario
from app.schemas.bim_model import BimImportElementPayload, BimJsonImportRequest
from app.services.bim.import_service import import_json_bim_package
from app.services.bim.link_registry import search_elements_for_project


def _seed_search_model(db, sample_empresa, *, element_count=225):
    project = Proyecto(nombre="Proyecto busqueda BIM", empresa_id=sample_empresa.id)
    db.add(project)
    db.commit()
    db.refresh(project)
    imported = import_json_bim_package(
        db,
        project_id=project.id,
        company_id=sample_empresa.id,
        payload=BimJsonImportRequest(
            model_name="Modelo busqueda",
            version_label="v1",
            activate=False,
            elements=[
                BimImportElementPayload(
                    global_id=f"SEARCH-{index:04d}",
                    nombre=f"Elemento {index:04d}",
                    ifc_class="IFCDUCTSEGMENT" if index % 5 == 0 else "IFCWALL",
                    storey_name=f"Nivel {(index % 4) + 1:02d}",
                    system_name="Suministro" if index % 5 == 0 else None,
                    classification=f"CL-{index % 7}",
                    properties={"Codigo tecnico": f"PROP-{index:04d}"},
                )
                for index in range(element_count)
            ],
        ),
    )
    return project, imported.version_id


def test_bim_element_search_paginates_large_version_and_searches_properties(db, sample_empresa):
    project, version_id = _seed_search_model(db, sample_empresa)

    first_page = search_elements_for_project(
        db,
        project_id=project.id,
        company_id=sample_empresa.id,
        version_id=version_id,
        page=1,
        page_size=100,
    )
    last_page = search_elements_for_project(
        db,
        project_id=project.id,
        company_id=sample_empresa.id,
        version_id=version_id,
        page=3,
        page_size=100,
    )
    property_match = search_elements_for_project(
        db,
        project_id=project.id,
        company_id=sample_empresa.id,
        version_id=version_id,
        query_text="PROP-0173",
    )
    system_matches = search_elements_for_project(
        db,
        project_id=project.id,
        company_id=sample_empresa.id,
        version_id=version_id,
        query_text="Suministro",
    )

    assert first_page.total == 225
    assert first_page.pages == 3
    assert len(first_page.items) == 100
    assert last_page.page == 3
    assert len(last_page.items) == 25
    assert [item.global_id for item in property_match.items] == ["SEARCH-0173"]
    assert system_matches.total == 45


def test_bim_element_search_http_is_feature_gated_and_tenant_scoped(db, sample_empresa, monkeypatch):
    monkeypatch.setattr(settings, "BIM_ENABLED", True)
    monkeypatch.setattr(settings, "BIM_ALLOWED_EMPRESA_IDS", "")
    monkeypatch.setattr(settings, "BIM_ALLOWED_USER_IDS", "")
    project, version_id = _seed_search_model(db, sample_empresa, element_count=12)
    user = Usuario(
        email="bim-search@example.com",
        hashed_password="hash",
        nombre_completo="BIM Search",
        rol="usuario",
        empresa_id=sample_empresa.id,
    )
    db.add_all(
        [
            user,
            SystemBimSetting(
                titulo="BIM search",
                descripcion="Busqueda paginada",
                is_enabled=True,
                superadmin_only=False,
                allowed_company_ids=str(sample_empresa.id),
            ),
        ]
    )
    db.commit()
    db.refresh(user)
    app = FastAPI()
    app.include_router(bim_links_endpoint.router, prefix="/bim")
    app.dependency_overrides[bim_links_endpoint.get_db] = lambda: db
    app.dependency_overrides[bim_links_endpoint.get_current_active_user] = lambda: user

    response = TestClient(app).get(
        f"/bim/projects/{project.id}/elements/search",
        params={"version_id": version_id, "q": "SEARCH-0007", "page_size": 5},
    )

    assert response.status_code == 200
    payload = response.json()
    assert payload["total"] == 1
    assert payload["items"][0]["global_id"] == "SEARCH-0007"
    assert payload["page_size"] == 5
