from datetime import datetime, timezone

from app.models.bim_4d import Bim4dActivitySnapshot
from app.models.bim_element import BimElement
from app.models.bim_model import BimModel
from app.models.bim_model_version import BimModelVersion
from app.models.proyecto import Proyecto
from app.services.bim.project_search_service import search_project_bim_context


def _search_case(db, company):
    project = Proyecto(nombre="Búsqueda coordinada", empresa_id=company.id)
    other_project = Proyecto(nombre="Proyecto ajeno", empresa_id=company.id)
    db.add_all([project, other_project]); db.flush()
    model = BimModel(proyecto_id=project.id, empresa_id=company.id, nombre="Arquitectura", disciplina="Arquitectura")
    foreign_model = BimModel(proyecto_id=other_project.id, empresa_id=company.id, nombre="Ajeno", disciplina="Arquitectura")
    db.add_all([model, foreign_model]); db.flush()
    version = BimModelVersion(bim_model_id=model.id, version_label="P01", status="ready")
    foreign_version = BimModelVersion(bim_model_id=foreign_model.id, version_label="P01", status="ready")
    db.add_all([version, foreign_version]); db.flush()
    db.add_all([
        BimElement(bim_model_version_id=version.id, global_id="WALL-AUTH", ifc_class="IfcWall", nombre="Muro autorizado"),
        BimElement(bim_model_version_id=foreign_version.id, global_id="WALL-FOREIGN", ifc_class="IfcWall", nombre="Muro ajeno"),
        Bim4dActivitySnapshot(
            empresa_id=company.id, proyecto_id=project.id, source_ref="ACT-MURO", snapshot_revision="1",
            activity_code="A-100", activity_name="Construir muro autorizado",
            planned_start=datetime(2026, 1, 1, tzinfo=timezone.utc), planned_finish=datetime(2026, 1, 2, tzinfo=timezone.utc),
        ),
    ])
    db.commit()
    return project


def test_search_is_project_scoped_and_excludes_domains_without_capability(db, sample_empresa):
    project = _search_case(db, sample_empresa)
    result = search_project_bim_context(
        db, project_id=project.id, company_id=sample_empresa.id, term="muro",
        capabilities={"bim.view"},
    )
    assert [item["kind"] for item in result["items"]] == ["element"]
    assert result["items"][0]["global_id"] == "WALL-AUTH"
    assert all("ajeno" not in item["label"].lower() for item in result["items"])


def test_search_includes_schedule_only_when_authorized_and_is_deterministic(db, sample_empresa):
    project = _search_case(db, sample_empresa)
    inputs = dict(
        project_id=project.id, company_id=sample_empresa.id, term="muro",
        capabilities={"bim.view", "schedule.view"}, limit=12,
    )
    first = search_project_bim_context(db, **inputs)
    second = search_project_bim_context(db, **inputs)
    assert first == second
    assert {item["kind"] for item in first["items"]} == {"element", "activity"}
    assert all(item["workspace"] in {"model", "planning-costs"} for item in first["items"])


def test_search_rejects_short_terms_without_querying_domains(db, sample_empresa):
    result = search_project_bim_context(
        db, project_id=999999, company_id=sample_empresa.id, term="x", capabilities={"bim.view"},
    )
    assert result == {"query": "x", "items": [], "truncated": False}
