from datetime import date, datetime, timezone, timedelta
from decimal import Decimal

import pytest
from fastapi.testclient import TestClient

from app.api.deps import get_current_active_user
from app.core.database import get_db
from app.main import app
from app.models.apu import APU, APULinea
from app.models.base_trabajo import BaseTrabajo
from app.models.cronograma_trabajo import CronogramaTrabajo
from app.models.edt import EdtNode, TipoNodoEdt
from app.models.empresa import Empresa
from app.models.empresa_licencia import EmpresaLicencia
from app.models.licencia import Licencia
from app.models.marketplace import MarketplaceAssetOrigin, MarketplaceOrder, MarketplaceOrderItem, MarketplaceProduct
from app.models.presupuesto import Presupuesto, PresupuestoDetalle
from app.models.proyecto import Proyecto
from app.models.proyecto_documento import ProyectoDocumento
from app.models.recurso import CategoriaRecurso, Recurso
from app.models.subcategoria_item import SubcategoriaItem
from app.models.transferencia import TransferShipment, TransferShipmentItem
from app.models.unidad import Unidad
from app.models.usuario import Usuario
from app.services.transferencias import TransferPolicyError, transferencias_service


_RUC_SEQ = 700000


def _create_company(db, name: str, *, alias: str | None = None) -> Empresa:
    global _RUC_SEQ
    _RUC_SEQ += 1
    empresa = Empresa(
        nombre=name,
        alias=alias,
        ruc=f"179{_RUC_SEQ:010d}",
        proy_prefijo="TRF",
        proy_periodo="2026",
        proy_secuencial=1,
        proy_secuencial_size=3,
    )
    db.add(empresa)
    db.flush()
    return empresa


def _create_user(db, empresa: Empresa, email: str, *, rol: str = "administrador") -> Usuario:
    user = Usuario(
        email=email,
        hashed_password="x",
        nombre_completo=email.split("@")[0],
        rol=rol,
        empresa_id=empresa.id,
        activo=True,
    )
    db.add(user)
    db.flush()
    return user


def _assign_license(db, empresa: Empresa, codigo: str = "STANDARD") -> None:
    licencia = db.query(Licencia).filter(Licencia.codigo == codigo).first()
    if not licencia:
        licencia = Licencia(
            nombre=f"{codigo} {empresa.id}",
            codigo=codigo,
            plan_kind="estandar" if codigo == "STANDARD" else codigo.lower(),
            limites={"usuarios": 5},
            activo=True,
        )
        db.add(licencia)
        db.flush()
    db.add(
        EmpresaLicencia(
            empresa_id=empresa.id,
            licencia_id=licencia.id,
            starts_at=date.today() - timedelta(days=1),
            ends_at=date.today() + timedelta(days=30),
            status="active",
            activa=True,
        )
    )
    db.flush()


def _create_recipient(db, sender: Empresa, receiver: Empresa, actor: Usuario):
    receiver_admin = _create_user(db, receiver, f"receiver-{receiver.id}@giproy.test", rol="administrador")
    code = transferencias_service.ensure_admin_public_code(db, receiver_admin)
    return transferencias_service.create_recipient_from_code(
        db,
        sender_empresa_id=sender.id,
        public_code=code.public_code,
        actor_user_id=actor.id,
        confirm=True,
        confirmed_display_name=transferencias_service.company_display_name(receiver),
    )


def _create_exportable_project(db, empresa: Empresa, actor: Usuario) -> Proyecto:
    base = _create_base_trabajo(db, empresa)
    apu = db.query(APU).filter(APU.base_trabajo_id == base.id, APU.empresa_id == empresa.id).one()
    project = Proyecto(
        nombre="Proyecto Transferible",
        codigo="TRF-PRJ-001",
        codigo_root="TRF-PRJ-001",
        descripcion="Proyecto apto para snapshot.",
        estado="Planificación",
        presupuesto_estimado=Decimal("1000.00"),
        moneda="USD",
        empresa_id=empresa.id,
        base_trabajo_id=base.id,
    )
    db.add(project)
    db.flush()
    edt = EdtNode(
        proyecto_id=project.id,
        empresa_id=empresa.id,
        tipo_nodo=TipoNodoEdt.CUENTA_PAQUETE,
        orden=1,
        codigo="1",
        nombre="Capitulo 1",
        definicion="Alcance base",
    )
    db.add(edt)
    db.flush()
    budget = Presupuesto(
        codigo="P-001",
        descripcion="Presupuesto Transferible",
        proyecto_id=project.id,
        empresa_id=empresa.id,
        subtotal=Decimal("100.00"),
        total=Decimal("112.00"),
        moneda="USD",
    )
    db.add(budget)
    db.flush()
    db.add(
        PresupuestoDetalle(
            presupuesto_id=budget.id,
            edt_id=edt.id,
            apu_id=apu.id,
            tipo="RUBRO",
            descripcion="Rubro transferible",
            unidad="u",
            cantidad=Decimal("2"),
            precio_unitario=Decimal("50"),
            precio_total=Decimal("100"),
            orden=1,
        )
    )
    db.flush()
    db.add(
        CronogramaTrabajo(
            empresa_id=empresa.id,
            proyecto_id=project.id,
            presupuesto_id=budget.id,
            schedule_data={"must_not_be_exported": True},
        )
    )
    db.add(
        ProyectoDocumento(
            codigo_root=project.codigo_root,
            empresa_id=empresa.id,
            uploaded_by_user_id=actor.id,
            file_name="contrato.pdf",
            storage_path="/uploads/private/contrato.pdf",
            content_type="application/pdf",
            size_bytes=123,
        )
    )
    db.flush()
    return project


def _create_base_trabajo(db, empresa: Empresa) -> BaseTrabajo:
    base = BaseTrabajo(
        codigo_unico="BASE-TRF",
        nombre="Base Transferible",
        tipo="Base Maestra",
        descripcion="Base completa para transferencia.",
        empresa_id=empresa.id,
    )
    db.add(base)
    db.flush()
    unidad = Unidad(descripcion="u", descripcion_completa="Unidad", subcategoria_codigo=2, es_global=False, base_trabajo_id=base.id, empresa_id=empresa.id)
    db.add(unidad)
    db.flush()
    categoria = CategoriaRecurso(nombre="Materiales", descripcion="Cat", base_trabajo_id=base.id, empresa_id=empresa.id)
    subcat = SubcategoriaItem(codigo="2-001", descripcion="Cemento", subcategoria_codigo=2, base_trabajo_id=base.id, empresa_id=empresa.id)
    db.add_all([categoria, subcat])
    db.flush()
    recurso = Recurso(
        codigo="2-0001-00001",
        descripcion="Cemento Portland",
        descripcion_normalizada="cemento portland",
        precio=Decimal("7.50"),
        unidad_id=unidad.id,
        subcategoria_item_id=subcat.id,
        base_trabajo_id=base.id,
        empresa_id=empresa.id,
    )
    db.add(recurso)
    db.flush()
    apu = APU(
        codigo="APU-001",
        descripcion="Hormigon simple",
        descripcion_normalizada="hormigon simple",
        unidad="m3",
        base_trabajo_id=base.id,
        empresa_id=empresa.id,
        categoria_id=categoria.id,
        subcategoria_item_id=subcat.id,
    )
    db.add(apu)
    db.flush()
    db.add(APULinea(apu_id=apu.id, recurso_id=recurso.id, cantidad=Decimal("1.5"), orden=1))
    db.flush()
    return base


def _client(db, current_user):
    app.dependency_overrides[get_db] = lambda: db
    app.dependency_overrides[get_current_active_user] = lambda: current_user
    return TestClient(app)


def test_preflight_dry_run_builds_project_snapshot_without_creating_shipment(db):
    sender = _create_company(db, "Empresa Preflight")
    receiver = _create_company(db, "Empresa Destino", alias="Destino Alias")
    _assign_license(db, sender, "STANDARD")
    actor = _create_user(db, sender, "preflight-sender@giproy.test")
    recipient = _create_recipient(db, sender, receiver, actor)
    project = _create_exportable_project(db, sender, actor)

    preflight = transferencias_service.build_preflight(
        db,
        sender_empresa_id=sender.id,
        recipient_id=recipient.id,
        asset_type="proyecto",
        asset_id=project.id,
        actor_user_id=actor.id,
        description=None,
        dry_run=True,
    )

    assert preflight["dry_run"] is True
    assert preflight["exportable"] is True
    assert preflight["description"] == "Proyecto Transferible"
    assert len(preflight["snapshot_hash"]) == 64
    assert preflight["content_summary"]["edt_nodes"] == 1
    assert preflight["content_summary"]["presupuestos"] == 1
    assert "cronogramas" in preflight["excluded_sections"]
    snapshot_text = str(preflight["payload"]).lower()
    assert "cronograma" not in snapshot_text
    assert "gantt" not in snapshot_text
    assert "storage_path" not in snapshot_text
    assert db.query(TransferShipment).count() == 0


def test_project_without_base_and_apu_is_not_exportable(db):
    sender = _create_company(db, "Empresa Proyecto Sin APU")
    receiver = _create_company(db, "Empresa Destino Sin APU")
    _assign_license(db, sender, "STANDARD")
    actor = _create_user(db, sender, "no-apu-sender@giproy.test")
    recipient = _create_recipient(db, sender, receiver, actor)
    project = Proyecto(
        nombre="Proyecto sin APU",
        codigo="NO-APU",
        codigo_root="NO-APU",
        descripcion="Proyecto incompleto para transferencia.",
        estado="Planificación",
        moneda="USD",
        empresa_id=sender.id,
    )
    db.add(project)
    db.flush()
    edt = EdtNode(
        proyecto_id=project.id,
        empresa_id=sender.id,
        tipo_nodo=TipoNodoEdt.CUENTA_PAQUETE,
        orden=1,
        codigo="1",
        nombre="Capitulo sin APU",
    )
    db.add(edt)
    db.flush()
    budget = Presupuesto(
        codigo="P-SIN-APU",
        descripcion="Presupuesto sin APU",
        proyecto_id=project.id,
        empresa_id=sender.id,
        moneda="USD",
    )
    db.add(budget)
    db.flush()
    db.add(
        PresupuestoDetalle(
            presupuesto_id=budget.id,
            edt_id=edt.id,
            tipo="RUBRO",
            descripcion="Rubro sin APU",
            unidad="u",
            cantidad=Decimal("1"),
            precio_unitario=Decimal("10"),
            precio_total=Decimal("10"),
            orden=1,
        )
    )
    db.flush()

    preflight = transferencias_service.build_preflight(
        db,
        sender_empresa_id=sender.id,
        recipient_id=recipient.id,
        asset_type="proyecto",
        asset_id=project.id,
        actor_user_id=actor.id,
        dry_run=True,
    )

    assert preflight["exportable"] is False
    assert "project_without_base_trabajo" in preflight["blockers"]
    assert "project_budget_line_without_apu" in preflight["blockers"]
    assert "project_budget_without_apu" in preflight["blockers"]


def test_create_shipment_persists_immutable_snapshot_item_and_cancel_before_open(db):
    sender = _create_company(db, "Empresa Shipment")
    receiver = _create_company(db, "Empresa Shipment Destino")
    _assign_license(db, sender, "PROFESSIONAL")
    actor = _create_user(db, sender, "shipment-sender@giproy.test")
    recipient = _create_recipient(db, sender, receiver, actor)
    project = _create_exportable_project(db, sender, actor)

    shipment = transferencias_service.create_shipment(
        db,
        sender_empresa_id=sender.id,
        recipient_id=recipient.id,
        asset_type="proyecto",
        asset_id=project.id,
        actor_user_id=actor.id,
        description="Envio confirmado",
    )
    item = db.query(TransferShipmentItem).filter_by(shipment_id=shipment.id).one()

    assert shipment.status == "enviado"
    assert shipment.snapshot_hash == item.payload_hash
    assert item.contract_version == "transfer-v1"
    assert item.payload_json["asset_type"] == "proyecto"

    cancelled = transferencias_service.cancel_shipment(
        db,
        shipment_id=shipment.id,
        sender_empresa_id=sender.id,
        actor_user_id=actor.id,
        reason="Error operativo.",
    )
    assert cancelled.status == "cancelado"

    cancelled.imported_at = datetime.now(timezone.utc)
    cancelled.status = "importado"
    db.add(cancelled)
    db.flush()
    with pytest.raises(TransferPolicyError) as exc:
        transferencias_service.cancel_shipment(
            db,
            shipment_id=shipment.id,
            sender_empresa_id=sender.id,
            actor_user_id=actor.id,
        )
    assert exc.value.code == "transfer_cancel_after_import_forbidden"


def test_base_trabajo_snapshot_includes_catalog_content(db):
    sender = _create_company(db, "Empresa Base")
    receiver = _create_company(db, "Empresa Base Destino")
    _assign_license(db, sender, "STANDARD")
    actor = _create_user(db, sender, "base-sender@giproy.test")
    recipient = _create_recipient(db, sender, receiver, actor)
    base = _create_base_trabajo(db, sender)

    preflight = transferencias_service.build_preflight(
        db,
        sender_empresa_id=sender.id,
        recipient_id=recipient.id,
        asset_type="base_trabajo",
        asset_id=base.id,
        actor_user_id=actor.id,
        dry_run=True,
    )

    assert preflight["exportable"] is True
    assert preflight["asset_name"] == "Base Transferible"
    assert preflight["content_summary"]["subcategorias"] == 1
    assert preflight["content_summary"]["unidades"] == 1
    assert preflight["content_summary"]["recursos"] == 1
    assert preflight["content_summary"]["apus"] == 1
    assert preflight["payload"]["unidades"][0]["descripcion"] == "u"
    assert preflight["payload"]["apus"][0]["lineas"][0]["cantidad"] == "1.500000"


def test_project_snapshot_includes_project_base_catalog_and_budget_apu(db):
    sender = _create_company(db, "Empresa Proyecto Base")
    receiver = _create_company(db, "Empresa Proyecto Base Destino")
    _assign_license(db, sender, "STANDARD")
    actor = _create_user(db, sender, "project-base-sender@giproy.test")
    recipient = _create_recipient(db, sender, receiver, actor)
    project = _create_exportable_project(db, sender, actor)
    base = db.query(BaseTrabajo).filter(BaseTrabajo.id == project.base_trabajo_id, BaseTrabajo.empresa_id == sender.id).one()
    apu = db.query(APU).filter(APU.base_trabajo_id == base.id, APU.empresa_id == sender.id).one()

    preflight = transferencias_service.build_preflight(
        db,
        sender_empresa_id=sender.id,
        recipient_id=recipient.id,
        asset_type="proyecto",
        asset_id=project.id,
        actor_user_id=actor.id,
        description=None,
        dry_run=True,
    )

    assert preflight["exportable"] is True
    assert preflight["content_summary"]["base_trabajo"] == 1
    assert preflight["content_summary"]["unidades"] == 1
    assert preflight["content_summary"]["apus"] == 1
    assert preflight["payload"]["base_trabajo"]["id"] == base.id
    assert preflight["payload"]["presupuestos"][0]["detalles"][0]["apu_id"] == apu.id


def test_marketplace_dependency_requires_confirmation_before_create(db):
    sender = _create_company(db, "Empresa Marketplace")
    receiver = _create_company(db, "Empresa Marketplace Destino")
    _assign_license(db, sender, "STANDARD")
    actor = _create_user(db, sender, "market-sender@giproy.test")
    recipient = _create_recipient(db, sender, receiver, actor)
    project = _create_exportable_project(db, sender, actor)
    product = MarketplaceProduct(
        titulo="Proyecto comprado requerido",
        slug="proyecto-comprado-requerido",
        product_type="proyecto",
        product_kind="referenced",
        source_type="proyecto",
        source_id=project.id,
        precio=Decimal("24.99"),
        moneda="USD",
        estado="approved",
        activo=True,
        seller_user_id=actor.id,
    )
    db.add(product)
    db.flush()
    db.add(
        MarketplaceAssetOrigin(
            empresa_id=sender.id,
            entity_type="proyecto",
            entity_id=project.id,
            ownership_kind="acquired",
            origin_kind="marketplace",
            origin_label="Proyecto comprado requerido",
            marketplace_product_id=product.id,
        )
    )
    db.flush()

    dry_run = transferencias_service.build_preflight(
        db,
        sender_empresa_id=sender.id,
        recipient_id=recipient.id,
        asset_type="proyecto",
        asset_id=project.id,
        actor_user_id=actor.id,
        dry_run=True,
    )
    assert dry_run["marketplace_blocked"] is True
    assert dry_run["requires_marketplace_confirmation"] is True
    assert dry_run["marketplace_requirements"][0]["product_title"] == "Proyecto comprado requerido"

    with pytest.raises(TransferPolicyError) as exc:
        transferencias_service.create_shipment(
            db,
            sender_empresa_id=sender.id,
            recipient_id=recipient.id,
            asset_type="proyecto",
            asset_id=project.id,
            actor_user_id=actor.id,
        )
    assert exc.value.code == "transfer_preflight_blocked"

    shipment = transferencias_service.create_shipment(
        db,
        sender_empresa_id=sender.id,
        recipient_id=recipient.id,
        asset_type="proyecto",
        asset_id=project.id,
        actor_user_id=actor.id,
        marketplace_confirmed=True,
    )
    assert shipment.status == "bloqueado_marketplace"


def test_preflight_endpoint_does_not_create_shipment(db):
    sender = _create_company(db, "Empresa API Preflight")
    receiver = _create_company(db, "Empresa API Preflight Destino")
    _assign_license(db, sender, "STANDARD")
    actor = _create_user(db, sender, "api-preflight@giproy.test")
    recipient = _create_recipient(db, sender, receiver, actor)
    project = _create_exportable_project(db, sender, actor)

    try:
        with _client(db, actor) as client:
            response = client.post(
                "/api/v1/transferencias/preflight",
                json={
                    "recipient_id": recipient.id,
                    "asset_type": "proyecto",
                    "asset_id": project.id,
                    "dry_run": True,
                },
            )
    finally:
        app.dependency_overrides.clear()

    assert response.status_code == 200
    payload = response.json()
    assert payload["dry_run"] is True
    assert payload["exportable"] is True
    assert payload["shipment_id"] is None
    assert db.query(TransferShipment).count() == 0


def test_marketplace_requirements_use_receiver_purchase_and_current_price(db):
    sender = _create_company(db, "Empresa Req Market")
    receiver = _create_company(db, "Empresa Req Receiver")
    _assign_license(db, sender, "STANDARD")
    _assign_license(db, receiver, "STANDARD")
    actor = _create_user(db, sender, "req-sender@giproy.test")
    receiver_admin = _create_user(db, receiver, "req-receiver@giproy.test")
    recipient = _create_recipient(db, sender, receiver, actor)
    project = _create_exportable_project(db, sender, actor)
    product = MarketplaceProduct(
        titulo="Producto requerido vigente",
        slug="producto-requerido-vigente",
        product_type="proyecto",
        product_kind="referenced",
        source_type="proyecto",
        source_id=project.id,
        precio=Decimal("24.99"),
        moneda="USD",
        estado="approved",
        activo=True,
        seller_user_id=actor.id,
    )
    db.add(product)
    db.flush()
    db.add(
        MarketplaceAssetOrigin(
            empresa_id=sender.id,
            entity_type="proyecto",
            entity_id=project.id,
            ownership_kind="acquired",
            origin_kind="marketplace",
            marketplace_product_id=product.id,
            origin_label="Producto requerido vigente",
        )
    )
    db.flush()
    shipment = transferencias_service.create_shipment(
        db,
        sender_empresa_id=sender.id,
        recipient_id=recipient.id,
        asset_type="proyecto",
        asset_id=project.id,
        actor_user_id=actor.id,
        marketplace_confirmed=True,
    )

    product.precio = Decimal("29.99")
    db.add(product)
    db.flush()
    pending = transferencias_service.evaluate_marketplace_requirements(
        db,
        shipment_id=shipment.id,
        empresa_id=receiver.id,
        actor_user_id=receiver_admin.id,
        revalidate=False,
    )

    assert pending["all_required_purchased"] is False
    assert pending["can_import_or_use"] is False
    assert pending["total_pending_price"] == "29.99"
    assert pending["requirements"][0]["current_price"] == "29.99"
    assert pending["requirements"][0]["purchase_url"] == f"/marketplace/products/{product.id}"
    assert pending["checkout_items"] == [
        {
            "product_id": product.id,
            "quantity": 1,
            "source": "transfer_marketplace_requirement",
            "shipment_id": shipment.id,
            "requirement_id": pending["requirements"][0]["requirement_id"],
        }
    ]

    order = MarketplaceOrder(buyer_user_id=receiver_admin.id, total=Decimal("29.99"), currency="USD", status="completed")
    db.add(order)
    db.flush()
    order_item = MarketplaceOrderItem(
        order_id=order.id,
        product_id=product.id,
        seller_user_id=actor.id,
        product_title_snapshot=product.titulo,
        product_type_snapshot=product.product_type,
        source_type_snapshot=product.source_type,
        source_id_snapshot=product.source_id,
        price=Decimal("29.99"),
    )
    db.add(order_item)
    db.flush()

    completed = transferencias_service.evaluate_marketplace_requirements(
        db,
        shipment_id=shipment.id,
        empresa_id=receiver.id,
        actor_user_id=receiver_admin.id,
        revalidate=True,
    )
    db.refresh(shipment)

    assert completed["all_required_purchased"] is True
    assert completed["can_import_or_use"] is True
    assert completed["total_pending_price"] == "0"
    assert completed["requirements"][0]["receiver_order_item_id"] == order_item.id
    assert shipment.status == "listo_para_importar"
    assert shipment.marketplace_blocked is False


def test_marketplace_requirements_endpoint_is_scoped_to_receiver_company(db):
    sender = _create_company(db, "Empresa Req API")
    receiver = _create_company(db, "Empresa Req API Receiver")
    outsider = _create_company(db, "Empresa Req API Outsider")
    _assign_license(db, sender, "STANDARD")
    _assign_license(db, receiver, "STANDARD")
    _assign_license(db, outsider, "STANDARD")
    actor = _create_user(db, sender, "req-api-sender@giproy.test")
    receiver_admin = _create_user(db, receiver, "req-api-receiver@giproy.test")
    outsider_admin = _create_user(db, outsider, "req-api-outsider@giproy.test")
    recipient = _create_recipient(db, sender, receiver, actor)
    project = _create_exportable_project(db, sender, actor)
    product = MarketplaceProduct(
        titulo="Producto requerido API",
        slug="producto-requerido-api",
        product_type="proyecto",
        product_kind="referenced",
        source_type="proyecto",
        source_id=project.id,
        precio=Decimal("9.99"),
        moneda="USD",
        estado="approved",
        activo=True,
        seller_user_id=actor.id,
    )
    db.add(product)
    db.flush()
    db.add(
        MarketplaceAssetOrigin(
            empresa_id=sender.id,
            entity_type="proyecto",
            entity_id=project.id,
            ownership_kind="acquired",
            origin_kind="marketplace",
            marketplace_product_id=product.id,
        )
    )
    db.flush()
    shipment = transferencias_service.create_shipment(
        db,
        sender_empresa_id=sender.id,
        recipient_id=recipient.id,
        asset_type="proyecto",
        asset_id=project.id,
        actor_user_id=actor.id,
        marketplace_confirmed=True,
    )

    try:
        with _client(db, receiver_admin) as client:
            ok_response = client.get(f"/api/v1/transferencias/shipments/{shipment.id}/marketplace-requirements")
        app.dependency_overrides.clear()
        with _client(db, outsider_admin) as client:
            forbidden_response = client.get(f"/api/v1/transferencias/shipments/{shipment.id}/marketplace-requirements")
    finally:
        app.dependency_overrides.clear()

    assert ok_response.status_code == 200
    assert ok_response.json()["requirements"][0]["product_title"] == "Producto requerido API"
    assert forbidden_response.status_code == 403
