from datetime import datetime, timezone
from pathlib import Path

from app.models.bim_element import BimElement
from app.models.bim_model import BimModel
from app.models.bim_model_version import BimModelVersion
from app.models.proyecto import Proyecto
from app.models.usuario import Usuario
from app.schemas.bim_4d import Bim4dActivitySnapshotCreate
from app.schemas.bim_4d_productivity import Bim4dProductivityProposalCreate
from app.schemas.bim_quantity import BimQuantityCandidate
from app.services.bim.productivity_4d_service import create_productivity_proposal, decide_productivity_proposal, list_productivity_proposals
from app.services.bim.quantity_proposal_service import quantity_candidates
from app.services.bim.schedule_4d_service import create_activity_snapshot


def test_productivity_proposal_uses_verified_quantity_and_stays_latent(db, sample_empresa):
    user = Usuario(email="productivity4d@example.com", hashed_password="x", nombre_completo="Productivity 4D", empresa_id=sample_empresa.id, rol="superadministrador")
    project = Proyecto(nombre="Productivity Project", empresa_id=sample_empresa.id)
    db.add_all([user, project]); db.flush()
    model = BimModel(proyecto_id=project.id, empresa_id=sample_empresa.id, nombre="Productivity Model")
    db.add(model); db.flush()
    version = BimModelVersion(bim_model_id=model.id, version_label="v1", status="published", is_active=True)
    db.add(version); db.flush()
    element = BimElement(bim_model_version_id=version.id, global_id="GUID-PROD-001", ifc_class="IfcWall", nombre="Wall", properties={"Quantity.Volume": 10})
    db.add(element); db.commit()
    activity = create_activity_snapshot(db, project_id=project.id, company_id=sample_empresa.id, user_id=user.id, payload=Bim4dActivitySnapshotCreate(source_ref="task-prod", snapshot_revision="R1", activity_code="A-PROD", activity_name="Construir muro", planned_start=datetime(2026, 8, 3, tzinfo=timezone.utc), planned_finish=datetime(2026, 8, 7, tzinfo=timezone.utc)))
    candidate = quantity_candidates(db, element_id=element.id, project_id=project.id, company_id=sample_empresa.id)[1][0]
    proposal = create_productivity_proposal(db, project_id=project.id, company_id=sample_empresa.id, user_id=user.id, payload=Bim4dProductivityProposalCreate(element_id=element.id, activity_snapshot_id=activity["id"], target_type="apu", target_id=99, candidate=BimQuantityCandidate(**candidate), productivity_value=2, crew_size=2, resource_code="MO-01", resource_name="Cuadrilla mamposteria"))
    assert proposal["calculated_duration_days"] == 2.5
    assert proposal["status"] == "pending" and proposal["target_type"] == "apu"
    assert list_productivity_proposals(db, project_id=project.id, company_id=sample_empresa.id, element_id=element.id)[0]["candidate"] == candidate
    decided = decide_productivity_proposal(db, proposal_id=proposal["id"], project_id=project.id, company_id=sample_empresa.id, user_id=user.id, decision="approved", reason="Lista para conciliacion controlada")
    assert decided["status"] == "approved"


def test_bim_4d_productivity_migration_is_additive():
    path = Path(__file__).parents[2] / "alembic" / "versions" / "de2015a1b2c3_bim_4d_productivity.py"
    source = path.read_text(encoding="utf-8")
    assert 'down_revision = "de2014a1b2c3"' in source
    assert '"bim_4d_productivity_proposals"' in source
    assert "alter_column" not in source
