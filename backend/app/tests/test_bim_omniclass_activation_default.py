from app.api.endpoints.admin_bim import update_admin_bim_config
from app.models.empresa import Empresa
from app.models.usuario import Usuario
from app.schemas.system_bim_setting import SystemBimSettingUpdate


def test_first_bim_enablement_turns_on_omniclass_but_does_not_override_later_company_choice(db, sample_empresa):
    sample_empresa.use_omniclass = False
    admin = Usuario(
        email="bim-default-admin@example.com",
        hashed_password="x",
        nombre_completo="BIM default admin",
        empresa_id=sample_empresa.id,
        rol="superadministrador",
    )
    db.add(admin); db.commit(); db.refresh(admin)
    payload = SystemBimSettingUpdate(
        titulo="BIM",
        descripcion="Activation",
        is_enabled=True,
        superadmin_only=False,
        allowed_company_ids=str(sample_empresa.id),
    )

    update_admin_bim_config(payload=payload, db=db, current_user=admin)
    db.refresh(sample_empresa)
    assert sample_empresa.use_omniclass is True

    sample_empresa.use_omniclass = False
    db.commit()
    update_admin_bim_config(payload=payload, db=db, current_user=admin)
    db.refresh(sample_empresa)
    assert sample_empresa.use_omniclass is False


def test_adding_a_new_tenant_enables_only_that_tenants_omniclass(db, sample_empresa):
    second = Empresa(
        nombre="Second BIM tenant", ruc="8888888880001", use_omniclass=False,
        proy_prefijo="SBT", proy_periodo="2026", proy_secuencial=1, proy_secuencial_size=3,
    )
    admin = Usuario(
        email="bim-second-admin@example.com", hashed_password="x", nombre_completo="BIM second admin",
        empresa_id=sample_empresa.id, rol="superadministrador",
    )
    db.add_all([second, admin]); db.commit(); db.refresh(second); db.refresh(admin)
    initial = SystemBimSettingUpdate(titulo="BIM", is_enabled=True, superadmin_only=False, allowed_company_ids=str(sample_empresa.id))
    update_admin_bim_config(payload=initial, db=db, current_user=admin)
    sample_empresa.use_omniclass = False
    db.commit()

    expanded = initial.model_copy(update={"allowed_company_ids": f"{sample_empresa.id},{second.id}"})
    update_admin_bim_config(payload=expanded, db=db, current_user=admin)
    db.refresh(sample_empresa); db.refresh(second)
    assert sample_empresa.use_omniclass is False
    assert second.use_omniclass is True
