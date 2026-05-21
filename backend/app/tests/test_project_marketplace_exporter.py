from decimal import Decimal

import pytest

from app.models.marketplace import MarketplaceProduct
from app.models.presupuesto import Presupuesto
from app.models.proyecto import Proyecto
from app.models.usuario import Usuario
from app.services.project_marketplace_exporter import project_marketplace_exporter
from app.services.proyecto import proyecto_service


def _create_superadmin(db, empresa_id: int) -> Usuario:
    user = Usuario(
        email="exporter-superadmin@giproy.test",
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


def _create_project(db, empresa_id: int, *, total: Decimal = Decimal("1000.00")) -> Proyecto:
    project = Proyecto(
        nombre="Proyecto exportable",
        codigo="EXP-001",
        codigo_root="EXP-001",
        revision=0,
        descripcion="Proyecto clasico exportable.",
        estado="Planificación",
        presupuesto_estimado=Decimal("100.00"),
        moneda="USD",
        empresa_id=empresa_id,
        plantillas_config={
            "public_procurement_import": {
                "origin": "public_procurement_import",
                "technical_validation_status": "valid",
                "empty_apus_count": 0,
            }
        },
    )
    db.add(project)
    db.flush()
    db.add(
        Presupuesto(
            descripcion="Presupuesto operativo",
            proyecto_id=project.id,
            empresa_id=empresa_id,
            subtotal=total,
            total=total,
            moneda="USD",
        )
    )
    db.commit()
    db.refresh(project)
    return project


def test_project_marketplace_exporter_replaces_pending_product_with_current_budget(db, sample_empresa):
    user = _create_superadmin(db, sample_empresa.id)
    project = _create_project(db, sample_empresa.id, total=Decimal("200000.00"))
    existing = MarketplaceProduct(
        titulo="Titulo anterior",
        slug="titulo-anterior",
        resumen="Anterior",
        descripcion="Anterior",
        vista_previa={"product_meta": {"descripcion_corta": "Anterior"}},
        etiquetas=["antiguo"],
        product_type="proyecto",
        product_kind="referenced",
        source_type="proyecto",
        source_id=project.id,
        precio=Decimal("11.50"),
        moneda="USD",
        estado="pending",
        activo=False,
        requiere_aprobacion=True,
        seller_user_id=user.id,
    )
    db.add(existing)
    db.commit()
    existing_id = existing.id

    result = project_marketplace_exporter.export_project(
        db,
        project_id=project.id,
        empresa_id=sample_empresa.id,
        current_user=user,
    )

    assert result["already_exists"] is True
    assert result["replaced_existing_product_id"] == existing_id
    assert result["technical_total"] == "200000.0000"
    assert result["technical_total_source"] == "presupuesto_total"
    replacement = db.query(MarketplaceProduct).filter(MarketplaceProduct.id == result["product_id"]).one()
    assert replacement.titulo == project.nombre
    assert replacement.slug != "titulo-anterior"
    assert replacement.estado == "pending"
    assert replacement.activo is False
    assert replacement.approved_by_user_id is None
    assert replacement.precio == Decimal("19.99")
    assert replacement.vista_previa["project_export"]["technical_total"] == "200000.00"
    assert replacement.vista_previa["product_meta"]["import_traceability"]["origin"] == "public_procurement_import"


def test_project_marketplace_exporter_blocks_republishing_approved_product(db, sample_empresa):
    user = _create_superadmin(db, sample_empresa.id)
    project = _create_project(db, sample_empresa.id, total=Decimal("200000.00"))
    existing = MarketplaceProduct(
        titulo="Titulo publicado",
        slug="titulo-publicado",
        resumen="Publicado",
        descripcion="Publicado",
        vista_previa={"product_meta": {"descripcion_corta": "Publicado"}},
        etiquetas=["publicado"],
        product_type="proyecto",
        product_kind="referenced",
        source_type="proyecto",
        source_id=project.id,
        precio=Decimal("19.99"),
        moneda="USD",
        estado="approved",
        activo=True,
        requiere_aprobacion=True,
        seller_user_id=user.id,
        approved_by_user_id=user.id,
    )
    db.add(existing)
    db.commit()

    with pytest.raises(Exception, match="ya fue publicado"):
        project_marketplace_exporter.export_project(
            db,
            project_id=project.id,
            empresa_id=sample_empresa.id,
            current_user=user,
        )


def test_delete_project_retires_pending_marketplace_product_without_sales(db, sample_empresa):
    user = _create_superadmin(db, sample_empresa.id)
    project = _create_project(db, sample_empresa.id)
    project_id = project.id
    product = MarketplaceProduct(
        titulo="Proyecto pendiente",
        slug="proyecto-pendiente",
        product_type="proyecto",
        product_kind="referenced",
        source_type="proyecto",
        source_id=project.id,
        precio=Decimal("11.50"),
        moneda="USD",
        estado="pending",
        activo=False,
        requiere_aprobacion=True,
        seller_user_id=user.id,
    )
    db.add(product)
    db.commit()

    assert proyecto_service.delete_full_project(db, project_id, sample_empresa.id) is True

    db.refresh(product)
    assert product.estado == "rejected"
    assert product.activo is False
    assert "proyecto origen fue eliminado" in product.admin_notes


def test_delete_project_blocks_approved_active_marketplace_product(db, sample_empresa):
    user = _create_superadmin(db, sample_empresa.id)
    project = _create_project(db, sample_empresa.id)
    project_id = project.id
    product = MarketplaceProduct(
        titulo="Proyecto aprobado",
        slug="proyecto-aprobado",
        product_type="proyecto",
        product_kind="referenced",
        source_type="proyecto",
        source_id=project.id,
        precio=Decimal("11.50"),
        moneda="USD",
        estado="approved",
        activo=True,
        requiere_aprobacion=True,
        seller_user_id=user.id,
        approved_by_user_id=user.id,
    )
    db.add(product)
    db.commit()

    with pytest.raises(ValueError, match="producto Marketplace aprobado"):
        proyecto_service.delete_full_project(db, project_id, sample_empresa.id)
