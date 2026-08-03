import pytest
from fastapi import HTTPException

from app.models.bim_coordination import BimClassificationResolution, ProjectCoordinationSet
from app.models.bim_element import BimElement
from app.models.bim_model import BimModel
from app.models.bim_model_version import BimModelVersion
from app.models.proyecto import Proyecto
from app.models.system_audit_event import SystemAuditEvent
from app.models.usuario import Usuario
from app.schemas.empresa import EmpresaUpdate
from app.services.empresa import empresa_service


def test_disabling_omniclass_with_bim_requires_informed_acknowledgement(db, sample_empresa):
    sample_empresa.use_omniclass = True
    admin = Usuario(email="omni-admin@example.com", hashed_password="x", nombre_completo="Admin", empresa_id=sample_empresa.id, rol="administrador")
    project = Proyecto(nombre="Omni", codigo="OMNI-1", codigo_root="OMNI-1", revision=0, empresa_id=sample_empresa.id)
    db.add_all([admin, project]); db.commit(); db.refresh(admin); db.refresh(project)
    model = BimModel(proyecto_id=project.id, empresa_id=sample_empresa.id, nombre="Model")
    db.add(model); db.commit(); db.refresh(model)
    version = BimModelVersion(bim_model_id=model.id, version_label="v1", status="ready", is_active=True)
    db.add(version); db.commit(); db.refresh(version)
    element = BimElement(bim_model_version_id=version.id, global_id="OMNI-E1", classification="23-10")
    db.add(element); db.commit(); db.refresh(element)
    resolution = BimClassificationResolution(empresa_id=sample_empresa.id, proyecto_id=project.id, bim_element_id=element.id, bim_model_version_id=version.id, system="OmniClass", edition="source", source_code="23-10", resolution_status="suggested")
    coordination = ProjectCoordinationSet(empresa_id=sample_empresa.id, proyecto_id=project.id, proyecto_codigo_root=project.codigo_root, proyecto_revision=0, revision=1, bim_version_ids_json=[version.id], omniclass_status="unresolved")
    db.add_all([resolution, coordination]); db.commit()

    with pytest.raises(HTTPException) as blocked:
        empresa_service.update_empresa(db, sample_empresa.id, EmpresaUpdate(use_omniclass=False), admin)
    assert blocked.value.status_code == 409

    updated = empresa_service.update_empresa(db, sample_empresa.id, EmpresaUpdate(use_omniclass=False, omniclass_change_acknowledged=True, omniclass_change_reason="Contrato externo sin clasificación común"), admin)
    db.refresh(resolution); db.refresh(coordination)
    assert updated.use_omniclass is False
    assert resolution.resolution_status == "disabled"
    assert resolution.source_code == "23-10"
    assert coordination.omniclass_status == "disabled"
    event = db.query(SystemAuditEvent).filter(SystemAuditEvent.event_type == "tenant_omniclass_policy_changed").one()
    assert event.operation_status == "structural_break_acknowledged"
