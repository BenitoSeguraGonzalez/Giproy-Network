import pytest
from fastapi import HTTPException

from app.models.bim_element import BimElement
from app.models.bim_model import BimModel
from app.models.bim_model_version import BimModelVersion
from app.models.proyecto import Proyecto
from app.services.bim.version_compare_service import compare_bim_versions


def _element(version_id, guid, name, *, geometry=1, properties=None):
    return BimElement(
        bim_model_version_id=version_id,
        global_id=guid,
        nombre=name,
        ifc_class="IFCWALL",
        storey_name="Nivel 01",
        classification="ARQ-WALL",
        metadata_json={"geometry_2d": {"x": geometry, "y": 1, "width": 2, "height": 3}},
        properties=properties or {"FireRating": "60"},
    )


def test_bim_version_compare_classifies_known_change_set_and_guid_fallback(db, sample_empresa):
    project = Proyecto(nombre="Proyecto comparación", empresa_id=sample_empresa.id)
    db.add(project)
    db.flush()
    model = BimModel(proyecto_id=project.id, empresa_id=sample_empresa.id, nombre="Arquitectura", disciplina="Arquitectura")
    db.add(model)
    db.flush()
    base = BimModelVersion(bim_model_id=model.id, version_label="A", status="ready_for_review")
    target = BimModelVersion(bim_model_id=model.id, version_label="B", status="ready_for_review")
    db.add_all([base, target])
    db.flush()
    db.add_all(
        [
            _element(base.id, "GUID-SAME", "Sin cambio"),
            _element(base.id, "GUID-GEO", "Geometría", geometry=1),
            _element(base.id, "GUID-PROP", "Propiedades", properties={"FireRating": "60"}),
            _element(base.id, "GUID-REMOVED", "Eliminado"),
            _element(base.id, "GUID-OLD", "Renumerado"),
            _element(target.id, "GUID-SAME", "Sin cambio"),
            _element(target.id, "GUID-GEO", "Geometría", geometry=9),
            _element(target.id, "GUID-PROP", "Propiedades", properties={"FireRating": "90"}),
            _element(target.id, "GUID-ADDED", "Agregado"),
            _element(target.id, "GUID-NEW", "Renumerado"),
        ]
    )
    db.commit()

    result = compare_bim_versions(
        db,
        project_id=project.id,
        company_id=sample_empresa.id,
        base_version_id=base.id,
        target_version_id=target.id,
    )

    assert result.summary["added"] == 1
    assert result.summary["removed"] == 1
    assert result.summary["geometry"] == 1
    assert result.summary["properties"] == 1
    assert result.summary["unchanged"] == 2
    assert result.summary["semantic_fallback"] == 1
    fallback = next(change for change in result.changes if change.match_strategy == "semantic_fallback")
    assert fallback.base_guid == "GUID-OLD"
    assert fallback.target_guid == "GUID-NEW"


def test_bim_version_compare_rejects_cross_tenant_version(db, sample_empresa):
    project = Proyecto(nombre="Proyecto aislado", empresa_id=sample_empresa.id)
    db.add(project)
    db.flush()
    model = BimModel(proyecto_id=project.id, empresa_id=sample_empresa.id, nombre="Modelo")
    db.add(model)
    db.flush()
    first = BimModelVersion(bim_model_id=model.id, version_label="A")
    second = BimModelVersion(bim_model_id=model.id, version_label="B")
    db.add_all([first, second])
    db.commit()

    with pytest.raises(HTTPException) as exc_info:
        compare_bim_versions(
            db,
            project_id=project.id,
            company_id=sample_empresa.id + 999,
            base_version_id=first.id,
            target_version_id=second.id,
        )

    assert exc_info.value.status_code == 404
