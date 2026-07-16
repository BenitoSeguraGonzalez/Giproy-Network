from pathlib import Path

import pytest
from fastapi import HTTPException

from app.models.bim_element import BimElement
from app.models.bim_model import BimModel
from app.models.bim_model_version import BimModelVersion
from app.models.empresa import Empresa
from app.models.proyecto import Proyecto
from app.models.usuario import Usuario
from app.schemas.bim_commissioning import BimCommissioningAssetCreate, BimCommissioningSystemCreate
from app.services.bim.commissioning_registry_service import create_commissioning_asset, create_commissioning_system, get_commissioning_registry


def test_commissioning_registry_preserves_bim_traceability(db, sample_empresa):
    user=Usuario(email="commissioning@example.com",hashed_password="x",nombre_completo="Commissioning",empresa_id=sample_empresa.id,rol="superadministrador");project=Proyecto(nombre="Commissioning",empresa_id=sample_empresa.id);db.add_all([user,project]);db.flush()
    model=BimModel(proyecto_id=project.id,empresa_id=sample_empresa.id,nombre="MEP");db.add(model);db.flush();version=BimModelVersion(bim_model_id=model.id,version_label="AB-MEP",status="ready",is_active=True);db.add(version);db.flush();element=BimElement(bim_model_version_id=version.id,global_id="GUID-PUMP-01",ifc_class="IFCPUMP",nombre="Bomba 01",system_name="Agua helada");db.add(element);db.commit()
    system=create_commissioning_system(db,project_id=project.id,company_id=sample_empresa.id,user_id=user.id,payload=BimCommissioningSystemCreate(system_code="CHW",name="Agua helada",discipline="MEP"))
    asset=create_commissioning_asset(db,project_id=project.id,company_id=sample_empresa.id,user_id=user.id,payload=BimCommissioningAssetCreate(system_id=system["id"],version_id=version.id,element_id=element.id,asset_tag="P-001",name="Bomba primaria",asset_type="Bomba",manufacturer="Fabricante"))
    registry=get_commissioning_registry(db,project_id=project.id,company_id=sample_empresa.id)
    assert asset["global_id"]=="GUID-PUMP-01" and asset["source_system_name"]=="Agua helada"
    assert registry["systems"][0]["asset_count"]==1 and registry["assets"][0]["asset_tag"]=="P-001"


def test_commissioning_registry_rejects_cross_tenant_system(db, sample_empresa):
    second_empresa=Empresa(nombre="Empresa B",ruc="1234567890002",proy_prefijo="B",proy_periodo="2026",proy_secuencial=1,proy_secuencial_size=3);db.add(second_empresa);db.flush()
    user=Usuario(email="commissioning-tenant@example.com",hashed_password="x",nombre_completo="Tenant",empresa_id=sample_empresa.id,rol="superadministrador");project=Proyecto(nombre="Tenant A",empresa_id=sample_empresa.id);foreign_project=Proyecto(nombre="Tenant B",empresa_id=second_empresa.id);db.add_all([user,project,foreign_project]);db.flush()
    foreign_system=create_commissioning_system(db,project_id=foreign_project.id,company_id=second_empresa.id,user_id=user.id,payload=BimCommissioningSystemCreate(system_code="ELEC",name="Electrico"))
    model=BimModel(proyecto_id=project.id,empresa_id=sample_empresa.id,nombre="A");db.add(model);db.flush();version=BimModelVersion(bim_model_id=model.id,version_label="A1",status="ready",is_active=True);db.add(version);db.flush();element=BimElement(bim_model_version_id=version.id,global_id="GUID-A",nombre="Activo A");db.add(element);db.commit()
    with pytest.raises(HTTPException,match="Sistema de commissioning"):
        create_commissioning_asset(db,project_id=project.id,company_id=sample_empresa.id,user_id=user.id,payload=BimCommissioningAssetCreate(system_id=foreign_system["id"],version_id=version.id,element_id=element.id,asset_tag="A-1",name="Activo",asset_type="Equipo"))


def test_commissioning_registry_migration_is_additive():
    source=(Path(__file__).parents[2]/"alembic"/"versions"/"de2046a1b2c3_bim_commissioning_registry.py").read_text(encoding="utf-8")
    assert 'down_revision="de2045a1b2c3"' in source and 'ondelete="RESTRICT"' in source and "alter_column" not in source
