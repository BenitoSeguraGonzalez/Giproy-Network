from decimal import Decimal

import pytest
from fastapi import HTTPException

from app.models.marketplace import MarketplaceAssetOrigin, MarketplaceProduct
from app.models.proyecto import Proyecto
from app.models.system_audit_event import SystemAuditEvent
from app.models.usuario import Usuario
from app.schemas.marketplace import MarketplaceProductCreate
from app.services.marketplace import marketplace_service
from app.services.marketplace_asset_origin import marketplace_asset_origin_service


def _create_superadmin(db, empresa_id: int) -> Usuario:
    user = Usuario(
        email="superadmin@giproy.test",
        hashed_password="x",
        nombre_completo="Super Admin",
        rol="superadministrador",
        empresa_id=empresa_id,
        activo=True,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def _create_project(db, empresa_id: int, *, purchase_bound: bool = False) -> Proyecto:
    project = Proyecto(
        nombre="Proyecto vendible",
        codigo="PRY-001",
        codigo_root="PRY-001",
        revision=0,
        estado="Planificación",
        presupuesto_estimado=Decimal("100.00"),
        moneda="USD",
        empresa_id=empresa_id,
        plantillas_config={
            "marketplace_flags": {
                "acquired": True,
                "purchase_bound": True,
            },
            "marketplace_traceability": {
                "ownership_kind": "acquired",
            },
        }
        if purchase_bound
        else {},
    )
    db.add(project)
    db.commit()
    db.refresh(project)
    return project


def _project_product_payload(project_id: int) -> MarketplaceProductCreate:
    return MarketplaceProductCreate(
        titulo="Proyecto para venta",
        resumen="Resumen",
        descripcion="Descripción",
        incluye="Proyecto",
        no_incluye="Soporte",
        product_type="proyecto",
        product_kind="referenced",
        source_type="proyecto",
        source_id=project_id,
        precio=Decimal("25.00"),
        product_meta={
            "descripcion_corta": "Resumen",
            "descripcion_larga": "Descripción larga",
            "descripcion_completa": "Descripción completa",
            "fecha_inicio_publicacion": "2026-05-18",
            "fecha_fin_publicacion": "2026-05-30",
        },
    )


def test_purchase_bound_project_flags_block_publishability_without_origin(db, sample_empresa):
    project = _create_project(db, sample_empresa.id, purchase_bound=True)

    can_publish, blocked_reason, origin = marketplace_asset_origin_service.can_publish_entity(
        db,
        empresa_id=sample_empresa.id,
        entity_type="proyecto",
        entity_id=project.id,
    )

    assert can_publish is False
    assert origin is None
    assert "no pueden republicarse" in blocked_reason


def test_purchase_bound_project_origin_blocks_create_product_and_audits(db, sample_empresa):
    user = _create_superadmin(db, sample_empresa.id)
    project = _create_project(db, sample_empresa.id)
    db.add(
        MarketplaceAssetOrigin(
            empresa_id=sample_empresa.id,
            entity_type="proyecto",
            entity_id=project.id,
            ownership_kind="acquired",
            origin_kind="marketplace",
            metadata_json={
                "usage_policy": {
                    "editable_internal": True,
                    "duplicable_internal": True,
                    "publishable_marketplace": False,
                    "export_allowed": False,
                }
            },
        )
    )
    db.commit()

    with pytest.raises(HTTPException) as exc_info:
        marketplace_service.create_product(db, _project_product_payload(project.id), user)

    assert exc_info.value.status_code == 403
    assert "no pueden republicarse" in exc_info.value.detail
    assert db.query(MarketplaceProduct).count() == 0
    audit_event = (
        db.query(SystemAuditEvent)
        .filter(SystemAuditEvent.event_type == "marketplace_publish_blocked_purchase_bound")
        .first()
    )
    assert audit_event is not None
    assert audit_event.entity_type == "proyecto"
    assert audit_event.entity_id == str(project.id)


def test_owned_project_remains_publishable(db, sample_empresa):
    user = _create_superadmin(db, sample_empresa.id)
    project = _create_project(db, sample_empresa.id)

    product = marketplace_service.create_product(db, _project_product_payload(project.id), user)

    assert product.id is not None
    assert product.product_type == "proyecto"
    assert product.source_id == project.id
