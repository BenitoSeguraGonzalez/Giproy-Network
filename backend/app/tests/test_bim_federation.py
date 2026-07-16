import pytest
from fastapi import HTTPException

from app.models.bim_federation import BimFederation
from app.models.bim_model import BimModel
from app.models.bim_model_version import BimModelVersion
from app.models.proyecto import Proyecto
from app.models.usuario import Usuario
from app.schemas.bim_federation import BimFederationSaveRequest
from app.services.bim.federation_service import get_active_federation, save_federation_revision


def _member(version_id, discipline, *, origin=(0, 0, 0), translation=(0, 0, 0), enabled=True):
    return {
        "version_id": version_id,
        "discipline": discipline,
        "enabled": enabled,
        "transform": {"translation": translation, "rotation_degrees": (0, 0, 0), "scale": (1, 1, 1)},
        "georeference": {"crs": "EPSG:9377", "origin": origin, "units": "m"},
    }


def _version(db, project, discipline):
    model = BimModel(proyecto_id=project.id, empresa_id=project.empresa_id, nombre=discipline, disciplina=discipline)
    db.add(model)
    db.flush()
    version = BimModelVersion(bim_model_id=model.id, version_label="P01", status="ready_for_review")
    db.add(version)
    db.flush()
    return version


def _user(db, company_id):
    user = Usuario(
        email="coordinador.bim@example.com",
        hashed_password="test",
        nombre_completo="Coordinador BIM",
        rol="usuario",
        empresa_id=company_id,
    )
    db.add(user)
    db.flush()
    return user


def test_federation_revisions_pin_multidiscipline_versions_and_report_alignment(db, sample_empresa):
    project = Proyecto(nombre="Federacion PCERT", empresa_id=sample_empresa.id)
    db.add(project)
    db.flush()
    architecture = _version(db, project, "Arquitectura")
    structure = _version(db, project, "Estructura")
    mep = _version(db, project, "MEP")
    sample_user = _user(db, sample_empresa.id)
    db.commit()

    first = save_federation_revision(
        db,
        project_id=project.id,
        company_id=sample_empresa.id,
        user_id=sample_user.id,
        payload=BimFederationSaveRequest(
            name="Coordinacion P01",
            justification="Federacion inicial del modelo coordinado.",
            members=[
                _member(architecture.id, "Arquitectura"),
                _member(structure.id, "Estructura", origin=(0.005, 0, 0)),
                _member(mep.id, "MEP", origin=(25, 0, 0)),
            ],
        ),
    )
    assert first.revision == 1
    assert first.summary == {"members": 3, "enabled": 3, "aligned": 2, "misaligned": 1}
    assert [member.alignment_status for member in first.members] == ["reference", "aligned", "misaligned"]

    second_payload = BimFederationSaveRequest(
        name="Coordinacion P01",
        justification="Se desactiva MEP mientras se corrige su origen.",
        members=[
            _member(architecture.id, "Arquitectura"),
            _member(structure.id, "Estructura", origin=(0.005, 0, 0)),
            _member(mep.id, "MEP", origin=(25, 0, 0), enabled=False),
        ],
    )
    second = save_federation_revision(db, project_id=project.id, company_id=sample_empresa.id, user_id=sample_user.id, payload=second_payload)
    assert second.revision == 2
    assert second.summary == {"members": 3, "enabled": 2, "aligned": 2, "misaligned": 0}
    assert get_active_federation(db, project_id=project.id, company_id=sample_empresa.id).id == second.id
    assert db.query(BimFederation).filter(BimFederation.id == first.id).one().status == "superseded"


def test_federation_rejects_cross_tenant_version(db, sample_empresa):
    project = Proyecto(nombre="Proyecto federado", empresa_id=sample_empresa.id)
    other = Proyecto(nombre="Proyecto externo", empresa_id=sample_empresa.id)
    db.add_all([project, other])
    db.flush()
    version = _version(db, other, "Arquitectura")
    sample_user = _user(db, sample_empresa.id)
    db.commit()

    with pytest.raises(HTTPException) as exc_info:
        save_federation_revision(
            db,
            project_id=project.id,
            company_id=sample_empresa.id,
            user_id=sample_user.id,
            payload=BimFederationSaveRequest(
                name="No permitida",
                justification="Debe fallar por alcance de proyecto.",
                members=[_member(version.id, "Arquitectura")],
            ),
        )
    assert exc_info.value.status_code == 404
