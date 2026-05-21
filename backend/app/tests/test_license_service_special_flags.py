from datetime import date, timedelta

import pytest
from fastapi import HTTPException

from app.models.empresa import Empresa
from app.models.base_trabajo import BaseTrabajo
from app.models.empresa_licencia import EmpresaLicencia
from app.models.licencia import Licencia
from app.models.marketplace import MarketplaceProduct
from app.models.usuario import Usuario
from app.services.license import license_service
from app.services.marketplace_checkout import marketplace_checkout_service


def _assign_license(db, empresa, *, limites, nombre="Academy", codigo="ACADEMY"):
    licencia = Licencia(
        nombre=nombre,
        codigo=codigo,
        descripcion="Licencia especial de prueba",
        limites=limites,
        es_especial=True,
        activo=True,
    )
    db.add(licencia)
    db.flush()

    assignment = EmpresaLicencia(
        empresa_id=empresa.id,
        licencia_id=licencia.id,
        starts_at=date.today() - timedelta(days=1),
        ends_at=date.today() + timedelta(days=30),
        activa=True,
    )
    db.add(assignment)
    db.commit()
    return licencia


def test_get_company_special_flags_defaults_to_commercial(db, sample_empresa):
    _assign_license(
        db,
        sample_empresa,
        limites={"usuarios": 5, "proyectos": 10, "almacenamiento_gb": 5},
        nombre="Profesional",
        codigo="PRO",
    )

    flags = license_service.get_company_special_flags(db, sample_empresa.id)

    assert flags == {
        "is_tester": False,
        "is_academic": False,
        "is_training": False,
        "is_commercial": True,
    }


def test_get_company_special_flags_reads_special_license_flags(db, sample_empresa):
    _assign_license(
        db,
        sample_empresa,
        limites={
            "usuarios": 5,
            "proyectos": 10,
            "almacenamiento_gb": 5,
            "is_tester": True,
            "is_academic": True,
            "is_commercial": False,
        },
        nombre="Campus",
        codigo="CAMPUS",
    )

    flags = license_service.get_company_special_flags(db, sample_empresa.id)

    assert flags["is_tester"] is True
    assert flags["is_academic"] is True
    assert flags["is_training"] is False
    assert flags["is_commercial"] is False
    assert license_service.can_use_experimental_features(db, sample_empresa.id) is True


def test_ensure_commercial_exports_allowed_blocks_non_commercial_license(db, sample_empresa):
    _assign_license(
        db,
        sample_empresa,
        limites={
            "usuarios": 5,
            "proyectos": 10,
            "almacenamiento_gb": 5,
            "is_training": True,
        },
    )

    with pytest.raises(HTTPException) as exc_info:
        license_service.ensure_commercial_exports_allowed(db, sample_empresa.id)

    assert exc_info.value.status_code == 403
    assert "no permite exportaciones comerciales" in exc_info.value.detail


def test_run_periodic_cleanup_resets_training_company_operational_state(db, sample_empresa):
    _assign_license(
        db,
        sample_empresa,
        limites={
            "usuarios": 20,
            "proyectos": 50,
            "almacenamiento_gb": 10,
            "is_training": True,
            "is_commercial": False,
            "reset_periodical": True,
        },
    )

    user = Usuario(
        email="academy@test.local",
        hashed_password="x",
        nombre_completo="Academy User",
        rol="usuario",
        activo=True,
        empresa_id=sample_empresa.id,
        current_session_id="session-1",
        current_session_device_id="device-1",
    )
    base = BaseTrabajo(
        codigo_unico="BT-2026-001",
        nombre="Base Academy",
        tipo="Base Maestra",
        empresa_id=sample_empresa.id,
        activa=True,
    )
    db.add_all([user, base])
    db.commit()

    result = license_service.run_periodic_cleanup(db, sample_empresa.id)

    db.refresh(user)
    db.refresh(base)

    assert result["empresa_id"] == sample_empresa.id
    assert result["active_bases_cleared"] == 1
    assert result["active_sessions_cleared"] == 1
    assert result["usage_recalculated"] is True
    assert user.current_session_id is None
    assert user.current_session_device_id is None
    assert base.activa is False


def test_run_periodic_cleanup_rejects_non_training_license(db, sample_empresa):
    _assign_license(
        db,
        sample_empresa,
        limites={
            "usuarios": 5,
            "proyectos": 10,
            "almacenamiento_gb": 5,
            "is_academic": True,
            "is_commercial": False,
        },
        nombre="Campus",
        codigo="CAMPUS",
    )

    with pytest.raises(HTTPException) as exc_info:
        license_service.run_periodic_cleanup(db, sample_empresa.id)

    assert exc_info.value.status_code == 400
    assert "limpieza periódica" in exc_info.value.detail


def test_run_license_housekeeping_for_all_companies_aggregates_changes(db, sample_empresa):
    second_empresa = Empresa(
        nombre="Empresa Dos",
        ruc="1234567890002",
        proy_prefijo="DOS",
        proy_periodo="2026",
        proy_secuencial=1,
        proy_secuencial_size=3,
    )
    db.add(second_empresa)
    db.flush()

    professional = Licencia(
        nombre="Profesional",
        codigo="PRO-HK",
        descripcion="Licencia SaaS Profesional",
        limites={"usuarios": 15, "proyectos": 100, "almacenamiento_gb": 80},
        activo=True,
        plan_kind="profesional",
    )
    enterprise = Licencia(
        nombre="Empresarial",
        codigo="ENT-HK",
        descripcion="Licencia SaaS Empresarial",
        limites={"usuarios": -1, "proyectos": -1, "almacenamiento_gb": 500},
        activo=True,
        plan_kind="empresarial",
    )
    db.add_all([professional, enterprise])
    db.flush()

    expired_active = EmpresaLicencia(
        empresa_id=sample_empresa.id,
        licencia_id=professional.id,
        starts_at=date.today() - timedelta(days=40),
        ends_at=date.today() - timedelta(days=1),
        status="active",
        activa=True,
    )
    queued_due = EmpresaLicencia(
        empresa_id=sample_empresa.id,
        licencia_id=enterprise.id,
        starts_at=date.today(),
        ends_at=date.today() + timedelta(days=30),
        status="queued",
        activa=True,
    )
    db.add_all([expired_active, queued_due])
    db.commit()

    result = license_service.run_license_housekeeping_for_all_companies(db)

    db.refresh(expired_active)
    db.refresh(queued_due)

    assert result["totals"]["companies_processed"] >= 2
    assert result["totals"]["companies_changed"] == 1
    assert result["totals"]["expired"] == 1
    assert result["totals"]["activated"] == 1
    assert expired_active.status == "expired"
    assert queued_due.status == "active"


def test_run_license_housekeeping_for_all_companies_reports_zero_changes_cleanly(db, sample_empresa):
    result = license_service.run_license_housekeeping_for_all_companies(db)

    assert result["totals"]["companies_processed"] >= 1
    assert result["totals"]["companies_changed"] == 0
    assert result["totals"]["expired"] == 0
    assert result["totals"]["activated"] == 0
    assert result["items"] == []


def test_marketplace_license_product_creates_company_assignment(db, sample_empresa):
    buyer = Usuario(
        email="buyer@test.local",
        hashed_password="x",
        nombre_completo="Buyer User",
        rol="administrador",
        activo=True,
        empresa_id=sample_empresa.id,
    )
    seller = Usuario(
        email="seller@test.local",
        hashed_password="x",
        nombre_completo="Seller User",
        rol="superadministrador",
        activo=True,
        empresa_id=sample_empresa.id,
    )
    db.add_all([buyer, seller])
    db.flush()

    professional = Licencia(
        nombre="Profesional",
        codigo="PRO-MKT",
        descripcion="Licencia profesional comercial",
        limites={"usuarios": 15, "proyectos": 100, "almacenamiento_gb": 80},
        activo=True,
        plan_kind="profesional",
    )
    db.add(professional)
    db.flush()

    product = MarketplaceProduct(
        titulo="Licencia Profesional Mensual",
        slug="licencia-profesional-mensual-test",
        product_type="licencia",
        product_kind="manual",
        precio=69.99,
        moneda="USD",
        estado="approved",
        activo=True,
        seller_user_id=seller.id,
        vista_previa={
            "product_meta": {
                "license_offer": {
                    "plan_kind": "profesional",
                    "billing_cycle": "monthly",
                    "duration_months": 1,
                }
            }
        },
    )
    db.add(product)
    db.commit()

    delivered_type, delivered_id = marketplace_checkout_service._fulfill_product(db, product, buyer, None)
    db.refresh(sample_empresa)

    assert delivered_type == "empresa_licencia"
    assert delivered_id is not None

    assignment = db.query(EmpresaLicencia).filter(EmpresaLicencia.id == delivered_id).first()
    assert assignment is not None
    assert assignment.empresa_id == sample_empresa.id
    assert assignment.licencia_id == professional.id
    assert assignment.source == "marketplace_purchase"
