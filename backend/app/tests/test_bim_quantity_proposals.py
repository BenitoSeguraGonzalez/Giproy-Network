from app.models.bim_element import BimElement
from app.models.bim_model import BimModel
from app.models.bim_model_version import BimModelVersion
from app.models.proyecto import Proyecto
from app.models.usuario import Usuario
from app.schemas.bim_quantity import BimQuantityProposalCreate
from app.services.bim.quantity_proposal_service import create_proposal, decide_proposal, quantity_candidates

def test_quantity_proposal_preserves_source_units_version_and_decision_without_classic_write(db,sample_empresa):
    project=Proyecto(nombre="5D",empresa_id=sample_empresa.id); user=Usuario(email="5d@example.com",hashed_password="x",nombre_completo="5D",empresa_id=sample_empresa.id); db.add_all([project,user]);db.flush()
    model=BimModel(proyecto_id=project.id,empresa_id=sample_empresa.id,nombre="Architecture");db.add(model);db.flush();version=BimModelVersion(bim_model_id=model.id,version_label="P01");db.add(version);db.flush()
    element=BimElement(bim_model_version_id=version.id,global_id="WALL-5D",ifc_class="IFCWALL",properties={"Quantity.Qto_WallBaseQuantities.NetVolume":12.34567},metadata_json={});db.add(element);db.commit()
    _,candidates=quantity_candidates(db,element_id=element.id,project_id=project.id,company_id=sample_empresa.id)
    assert candidates[0]["source_kind"]=="ifc_element_quantity"; assert candidates[0]["original_unit"]=="m3"; assert candidates[0]["presented_value"]==12.346
    proposal=create_proposal(db,project_id=project.id,company_id=sample_empresa.id,user_id=user.id,payload=BimQuantityProposalCreate(element_id=element.id,target_type="edt",target_id=77,candidate=candidates[0]))
    assert proposal["version_id"]==version.id and proposal["global_id"]=="WALL-5D" and proposal["status"]=="pending"
    approved=decide_proposal(db,proposal_id=proposal["id"],project_id=project.id,company_id=sample_empresa.id,user_id=user.id,decision="approved",reason="Reviewed against measurement sheet")
    assert approved["status"]=="approved" and approved["decided_by"]==user.id
