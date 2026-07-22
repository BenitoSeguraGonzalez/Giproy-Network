from fastapi import HTTPException
from app.models.bim_access_grant import BimAccessGrant
from app.models.usuario import Usuario
from app.services.bim.role_policy import is_bim_company_operator

ALL_BIM_CAPABILITIES={"bim.view","bim.review","bim.coordinate","bim.publish","bim.admin","bim.schedule.view","bim.schedule.link","bim.progress.report"}
DEFAULT_BIM_CAPABILITIES={"bim.view","bim.review"}

def resolve_bim_capabilities(db, *, user_id, company_id, role):
    if is_bim_company_operator(role): return set(ALL_BIM_CAPABILITIES)
    grant=db.query(BimAccessGrant).filter(BimAccessGrant.usuario_id==user_id,BimAccessGrant.empresa_id==company_id,BimAccessGrant.active.is_(True)).first()
    capabilities = set(grant.capabilities_json or []) & ALL_BIM_CAPABILITIES if grant else set(DEFAULT_BIM_CAPABILITIES)
    if "bim.view" in capabilities:
        capabilities.add("bim.schedule.view")
    if "bim.coordinate" in capabilities:
        capabilities.add("bim.schedule.link")
    return capabilities

def require_bim_capability(db, *, user_id, company_id, role, capability):
    capabilities=resolve_bim_capabilities(db,user_id=user_id,company_id=company_id,role=role)
    if capability not in capabilities: raise HTTPException(status_code=403,detail=f"Capacidad BIM requerida: {capability}.")
    return capabilities

def save_bim_grant(db, *, company_id, user_id, capabilities, granted_by):
    user=db.query(Usuario).filter(Usuario.id==user_id,Usuario.empresa_id==company_id).first()
    if not user: raise HTTPException(status_code=404,detail="Usuario fuera de la empresa activa.")
    invalid=set(capabilities)-ALL_BIM_CAPABILITIES
    if invalid: raise HTTPException(status_code=400,detail=f"Capacidades BIM invalidas: {sorted(invalid)}")
    grant=db.query(BimAccessGrant).filter(BimAccessGrant.usuario_id==user_id,BimAccessGrant.empresa_id==company_id).first()
    if not grant: grant=BimAccessGrant(empresa_id=company_id,usuario_id=user_id,granted_by=granted_by);db.add(grant)
    grant.capabilities_json=sorted(set(capabilities));grant.active=True;db.commit();db.refresh(grant);return grant
