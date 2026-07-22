import pytest
from fastapi import HTTPException
from app.models.usuario import Usuario
from app.services.bim.capability_service import require_bim_capability, resolve_bim_capabilities, save_bim_grant

def test_bim_capabilities_are_composable_tenant_scoped_and_company_operators_complete(db,sample_empresa):
    user=Usuario(email="review@example.com",hashed_password="x",nombre_completo="Reviewer",empresa_id=sample_empresa.id,rol="usuario");db.add(user);db.commit()
    assert resolve_bim_capabilities(db,user_id=user.id,company_id=sample_empresa.id,role=user.rol)=={"bim.view","bim.review","bim.schedule.view"}
    with pytest.raises(HTTPException) as exc: require_bim_capability(db,user_id=user.id,company_id=sample_empresa.id,role=user.rol,capability="bim.coordinate")
    assert exc.value.status_code==403
    save_bim_grant(db,company_id=sample_empresa.id,user_id=user.id,capabilities=["bim.view","bim.review","bim.coordinate"],granted_by=user.id)
    granted = resolve_bim_capabilities(db,user_id=user.id,company_id=sample_empresa.id,role=user.rol)
    assert "bim.coordinate" in granted and "bim.schedule.link" in granted
    assert resolve_bim_capabilities(db,user_id=user.id,company_id=sample_empresa.id,role="administrador")=={"bim.view","bim.review","bim.coordinate","bim.publish","bim.admin","bim.schedule.view","bim.schedule.link","bim.progress.report"}
    assert resolve_bim_capabilities(db,user_id=user.id,company_id=sample_empresa.id,role="superadministrador")=={"bim.view","bim.review","bim.coordinate","bim.publish","bim.admin","bim.schedule.view","bim.schedule.link","bim.progress.report"}
    with pytest.raises(HTTPException) as cross: save_bim_grant(db,company_id=sample_empresa.id+99,user_id=user.id,capabilities=["bim.view"],granted_by=user.id)
    assert cross.value.status_code==404
