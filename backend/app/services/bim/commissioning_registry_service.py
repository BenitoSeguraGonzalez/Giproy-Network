from fastapi import HTTPException

from app.models.bim_commissioning import BimCommissioningAsset, BimCommissioningSystem
from app.models.bim_element import BimElement
from app.models.bim_model import BimModel
from app.models.bim_model_version import BimModelVersion


def _serialize_system(value, asset_count=0):
    return {"id": value.id, "system_code": value.system_code, "name": value.name, "discipline": value.discipline, "description": value.description, "status": value.status, "asset_count": asset_count, "created_by": value.created_by, "created_at": value.created_at}


def _serialize_asset(value):
    return {"id": value.id, "system_id": value.system_id, "version_id": value.bim_model_version_id, "element_id": value.bim_element_id, "asset_tag": value.asset_tag, "name": value.name, "asset_type": value.asset_type, "global_id": value.global_id, "source_system_name": value.source_system_name, "manufacturer": value.manufacturer, "model_reference": value.model_reference, "serial_number": value.serial_number, "status": value.status, "created_by": value.created_by, "created_at": value.created_at}


def get_commissioning_registry(db, *, project_id, company_id):
    systems = db.query(BimCommissioningSystem).filter(BimCommissioningSystem.proyecto_id == project_id, BimCommissioningSystem.empresa_id == company_id).order_by(BimCommissioningSystem.system_code).all()
    assets = db.query(BimCommissioningAsset).filter(BimCommissioningAsset.proyecto_id == project_id, BimCommissioningAsset.empresa_id == company_id).order_by(BimCommissioningAsset.asset_tag).all()
    counts = {}
    for asset in assets:
        counts[asset.system_id] = counts.get(asset.system_id, 0) + 1
    return {"project_id": project_id, "company_id": company_id, "systems": [_serialize_system(value, counts.get(value.id, 0)) for value in systems], "assets": [_serialize_asset(value) for value in assets]}


def create_commissioning_system(db, *, project_id, company_id, user_id, payload):
    code = payload.system_code.strip().upper()
    if db.query(BimCommissioningSystem.id).filter(BimCommissioningSystem.proyecto_id == project_id, BimCommissioningSystem.empresa_id == company_id, BimCommissioningSystem.system_code == code).first():
        raise HTTPException(status_code=409, detail="El codigo de sistema de commissioning ya existe.")
    value = BimCommissioningSystem(empresa_id=company_id, proyecto_id=project_id, system_code=code, name=payload.name.strip(), discipline=payload.discipline.strip() if payload.discipline else None, description=payload.description.strip() if payload.description else None, created_by=user_id)
    db.add(value); db.commit(); db.refresh(value)
    return _serialize_system(value)


def create_commissioning_asset(db, *, project_id, company_id, user_id, payload):
    system = db.query(BimCommissioningSystem).filter(BimCommissioningSystem.id == payload.system_id, BimCommissioningSystem.proyecto_id == project_id, BimCommissioningSystem.empresa_id == company_id, BimCommissioningSystem.status != "retired").first()
    if not system:
        raise HTTPException(status_code=404, detail="Sistema de commissioning fuera del proyecto activo.")
    element = db.query(BimElement).join(BimModelVersion, BimModelVersion.id == BimElement.bim_model_version_id).join(BimModel, BimModel.id == BimModelVersion.bim_model_id).filter(BimElement.id == payload.element_id, BimElement.bim_model_version_id == payload.version_id, BimModelVersion.status == "ready", BimModel.proyecto_id == project_id, BimModel.empresa_id == company_id).first()
    if not element:
        raise HTTPException(status_code=404, detail="Elemento BIM listo fuera del proyecto o version activa.")
    tag = payload.asset_tag.strip().upper()
    if db.query(BimCommissioningAsset.id).filter(BimCommissioningAsset.proyecto_id == project_id, BimCommissioningAsset.empresa_id == company_id, BimCommissioningAsset.asset_tag == tag).first():
        raise HTTPException(status_code=409, detail="El tag de activo de commissioning ya existe.")
    value = BimCommissioningAsset(empresa_id=company_id, proyecto_id=project_id, system_id=system.id, bim_model_version_id=payload.version_id, bim_element_id=element.id, asset_tag=tag, name=payload.name.strip(), asset_type=payload.asset_type.strip(), global_id=element.global_id, source_system_name=element.system_name, manufacturer=payload.manufacturer.strip() if payload.manufacturer else None, model_reference=payload.model_reference.strip() if payload.model_reference else None, serial_number=payload.serial_number.strip() if payload.serial_number else None, created_by=user_id)
    db.add(value); db.commit(); db.refresh(value)
    return _serialize_asset(value)
