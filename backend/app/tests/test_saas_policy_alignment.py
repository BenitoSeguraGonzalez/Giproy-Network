from datetime import date, timedelta

from app.models.empresa_licencia import EmpresaLicencia
from app.models.licencia import Licencia
from app.models.license_event import LicenseEvent
from scripts.align_companies_to_saas_policy import align_companies_to_saas_policy


def test_saas_policy_alignment_updates_catalog_and_enterprise_assignments(db, sample_empresa):
    enterprise = Licencia(
        nombre="Empresarial",
        codigo="ENTERPRISE",
        descripcion="Legacy",
        plan_kind="empresarial",
        precio_mensual=199.99,
        precio_anual=2159.99,
        limites={"usuarios": -1, "proyectos": -1, "almacenamiento_gb": 500},
        activo=True,
    )
    db.add(enterprise)
    db.flush()
    assignment = EmpresaLicencia(
        empresa_id=sample_empresa.id,
        licencia_id=enterprise.id,
        starts_at=date.today(),
        ends_at=date.today() + timedelta(days=365),
        status="active",
        source="manual_admin",
        activa=True,
    )
    db.add(assignment)
    db.commit()

    result = align_companies_to_saas_policy(db)

    db.refresh(assignment)
    professional = db.query(Licencia).filter(Licencia.codigo == "PROFESSIONAL").one()
    standard = db.query(Licencia).filter(Licencia.codigo == "STANDARD").one()
    express = db.query(Licencia).filter(Licencia.codigo == "EXPRESS").one()

    assert result["enterprise_assignments_aligned"] == 1
    assert assignment.licencia_id == professional.id
    assert assignment.detalles["saas_policy_alignment"]["previous_license_code"] == "ENTERPRISE"
    assert professional.precio_mensual == 40
    assert professional.precio_anual == 400
    assert professional.limites["packs_incluidos"] == ["PACK_PLANIFICA", "PACK_LICITA"]
    assert standard.precio_mensual == 25
    assert standard.precio_anual == 250
    assert standard.limites["packs_opcionales"] == ["PACK_PLANIFICA", "PACK_LICITA", "PACK_CONECTA"]
    assert express.is_default_express is True
    assert express.limites["trial_days"] == 30

    event = (
        db.query(LicenseEvent)
        .filter(
            LicenseEvent.empresa_licencia_id == assignment.id,
            LicenseEvent.event_type == "license_saas_policy_alignment",
        )
        .one()
    )
    assert event.payload["previous_license_code"] == "ENTERPRISE"
    assert event.payload["new_license_code"] == "PROFESSIONAL"
