import pytest
from pydantic import ValidationError

from app.main import app
from app.models.proyecto import Proyecto
from app.models.usuario import Usuario
from app.schemas.bim_map_catalog import BimMapCatalogSave
from app.services.bim.map_catalog_service import get_active_map_catalog, save_map_catalog


def _layer(key="osm", visible=True):
    return {
        "key": key,
        "name": "OpenStreetMap",
        "kind": "basemap",
        "service_type": "xyz",
        "url": "https://tiles.example.test/{z}/{x}/{y}.png",
        "attribution": "Map data",
        "min_zoom": 3,
        "max_zoom": 22,
        "opacity": 1,
        "visible": visible,
        "order": 0,
    }


def _payload(key="osm"):
    return BimMapCatalogSave(layers=[_layer(key)], justification="Catálogo topográfico aprobado.")


def test_bim_map_catalog_endpoints_are_registered():
    routes = {(path, method.upper()) for path, operations in app.openapi()["paths"].items() for method in operations}
    path = "/api/v1/bim/projects/{project_id}/map-catalog"
    assert (path, "GET") in routes
    assert (path, "PUT") in routes


def test_bim_map_catalog_validates_service_contracts():
    invalid = _layer()
    invalid["url"] = "https://tiles.example.test/no-placeholders"
    with pytest.raises(ValidationError):
        BimMapCatalogSave(layers=[invalid], justification="Catálogo inválido.")
    wms = _layer()
    wms.update({"service_type": "wms", "url": "https://maps.example.test/wms", "layer_name": None})
    with pytest.raises(ValidationError):
        BimMapCatalogSave(layers=[wms], justification="WMS sin capa.")


def test_bim_map_catalog_revisions_and_tenant_scope(db, sample_empresa):
    project = Proyecto(nombre="Mapa BIM", codigo_root="MAP-001", revision=4, empresa_id=sample_empresa.id)
    other_project = Proyecto(nombre="Mapa BIM R5", codigo_root="MAP-001", revision=5, empresa_id=sample_empresa.id)
    user = Usuario(email="maps.bim@example.com", hashed_password="test", nombre_completo="Maps BIM", rol="usuario", empresa_id=sample_empresa.id)
    db.add_all([project, other_project, user])
    db.commit()
    first = save_map_catalog(db, project_id=project.id, company_id=sample_empresa.id, project_root_code=project.codigo_root, project_revision=project.revision, user_id=user.id, payload=_payload())
    second = save_map_catalog(db, project_id=project.id, company_id=sample_empresa.id, project_root_code=project.codigo_root, project_revision=project.revision, user_id=user.id, payload=_payload("osm-v2"))
    assert first.revision == 1
    assert second.revision == 2
    assert second.layers[0].key == "osm-v2"
    assert get_active_map_catalog(db, project_id=project.id, company_id=sample_empresa.id).id == second.id
    assert get_active_map_catalog(db, project_id=other_project.id, company_id=sample_empresa.id) is None
