import math

from app.main import app
from app.models.bim_model import BimModel
from app.models.bim_model_version import BimModelVersion
from app.models.proyecto import Proyecto
from app.models.usuario import Usuario
from app.schemas.bim_federation import BimFederationSaveRequest
from app.schemas.bim_site_georeference import BimSiteGeoreferenceSave
from app.services.bim.federation_service import save_federation_revision
from app.services.bim.site_georeference_service import get_active_site_georeference, save_site_georeference


def test_site_georeference_endpoints_are_registered():
    routes = {(route.path, method) for route in app.routes for method in getattr(route, "methods", set())}
    path = "/api/v1/bim/projects/{project_id}/site-georeference"
    assert (path, "GET") in routes
    assert (path, "PUT") in routes


def _user(db, company_id):
    user = Usuario(email="georef.bim@example.com", hashed_password="test", nombre_completo="Georef BIM", rol="usuario", empresa_id=company_id)
    db.add(user)
    db.flush()
    return user


def _version(db, project):
    model = BimModel(proyecto_id=project.id, empresa_id=project.empresa_id, nombre="Modelo georreferenciado", disciplina="Arquitectura")
    db.add(model)
    db.flush()
    version = BimModelVersion(bim_model_id=model.id, version_label="P01", status="ready_for_review")
    db.add(version)
    db.flush()
    return version


def _site_payload(latitude=-0.1807, longitude=-78.4678):
    return BimSiteGeoreferenceSave(
        crs="EPSG:9377",
        latitude=latitude,
        longitude=longitude,
        altitude=2850,
        local_origin=(500000, 9970000, 0),
        heading_degrees=0,
        map_zoom=18,
        justification="Ancla topografica aprobada para coordinacion.",
    )


def test_site_georeference_maps_federated_origin_and_revisions(db, sample_empresa):
    project = Proyecto(nombre="Obra georreferenciada", codigo_root="GEO-001", revision=2, empresa_id=sample_empresa.id)
    db.add(project)
    db.flush()
    version = _version(db, project)
    user = _user(db, sample_empresa.id)
    db.commit()
    save_federation_revision(
        db,
        project_id=project.id,
        company_id=sample_empresa.id,
        user_id=user.id,
        payload=BimFederationSaveRequest(
            name="Federacion georreferenciada",
            justification="Origen topografico coordinado.",
            members=[{
                "version_id": version.id,
                "discipline": "Arquitectura",
                "transform": {"translation": (10, 20, 5), "rotation_degrees": (0, 0, 0), "scale": (1, 1, 1)},
                "georeference": {"crs": "EPSG:9377", "origin": (500000, 9970000, 0), "units": "m"},
            }],
        ),
    )
    first = save_site_georeference(
        db,
        project_id=project.id,
        company_id=sample_empresa.id,
        project_root_code=project.codigo_root,
        project_revision=project.revision,
        user_id=user.id,
        payload=_site_payload(),
    )
    assert first.revision == 1
    assert first.project_revision == 2
    assert len(first.map_points) == 1
    point = first.map_points[0]
    assert point.version_id == version.id
    assert point.latitude > first.latitude
    assert point.longitude > first.longitude
    assert math.isclose(point.altitude, 2855.0)

    second = save_site_georeference(
        db,
        project_id=project.id,
        company_id=sample_empresa.id,
        project_root_code=project.codigo_root,
        project_revision=project.revision,
        user_id=user.id,
        payload=_site_payload(latitude=-0.181),
    )
    assert second.revision == 2
    assert get_active_site_georeference(db, project_id=project.id, company_id=sample_empresa.id).id == second.id


def test_site_georeference_isolated_between_project_revisions(db, sample_empresa):
    revision_two = Proyecto(nombre="Obra R2", codigo_root="GEO-002", revision=2, empresa_id=sample_empresa.id)
    revision_three = Proyecto(nombre="Obra R3", codigo_root="GEO-002", revision=3, empresa_id=sample_empresa.id)
    db.add_all([revision_two, revision_three])
    db.flush()
    user = _user(db, sample_empresa.id)
    db.commit()
    saved = save_site_georeference(
        db,
        project_id=revision_two.id,
        company_id=sample_empresa.id,
        project_root_code=revision_two.codigo_root,
        project_revision=revision_two.revision,
        user_id=user.id,
        payload=_site_payload(),
    )
    assert saved.project_id == revision_two.id
    assert get_active_site_georeference(db, project_id=revision_three.id, company_id=sample_empresa.id) is None
