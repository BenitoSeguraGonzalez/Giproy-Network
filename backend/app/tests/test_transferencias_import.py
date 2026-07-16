from datetime import date, datetime, timedelta, timezone
from decimal import Decimal

import pytest
from fastapi.testclient import TestClient

from app.api.deps import get_current_active_user
from app.core.database import get_db
from app.main import app
from app.models.apu import APU, APULinea
from app.models.base_trabajo import BaseTrabajo
from app.models.edt import EdtNode
from app.models.empresa import Empresa
from app.models.empresa_licencia import EmpresaLicencia
from app.models.licencia import Licencia
from app.models.presupuesto import Presupuesto, PresupuestoDetalle
from app.models.proyecto import Proyecto
from app.models.recurso import CategoriaRecurso, Recurso
from app.models.subcategoria_item import SubcategoriaItem
from app.models.transferencia import (
    TransferAuditEvent,
    TransferImportReference,
    TransferImportResult,
    TransferMarketplaceRequirement,
    TransferShipment,
    TransferShipmentItem,
)
from app.models.unidad import Unidad
from app.models.usuario import Usuario
from app.services.transferencias import transferencias_service


def _create_company(db, name: str, *, alias: str | None = None) -> Empresa:
    empresa = Empresa(
        nombre=name,
        alias=alias,
        ruc=f"199{abs(hash(name)) % 1000000000:09d}",
        proy_prefijo="TRI",
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


def _client(db, current_user):
    app.dependency_overrides[get_db] = lambda: db
    app.dependency_overrides[get_current_active_user] = lambda: current_user
    return TestClient(app)


def _project_payload() -> dict:
    return {
        "contract_version": "transfer-v1",
        "asset_type": "proyecto",
        "project": {
            "id": 77,
            "nombre": "Proyecto Recibible",
            "codigo": "PRJ",
            "codigo_root": "PRJ",
            "revision": 0,
            "descripcion": "Proyecto de prueba",
            "estado": "Apto",
            "fecha_inicio": None,
            "fecha_fin_estimada": None,
            "presupuesto_estimado": "100.00",
            "moneda": "USD",
            "base_trabajo_id": None,
            "plantillas_config": {},
        },
        "edt_nodes": [
            {
                "id": 501,
                "parent_id": None,
                "tipo_nodo": "CUENTA_PAQUETE",
                "orden": 0,
                "codigo": "1",
                "nombre": "Raiz",
                "definicion": None,
                "stakeholder_id": None,
                "rol_id": None,
                "actividades_claves": None,
            }
        ],
        "presupuestos": [
            {
                "id": 601,
                "codigo": "P-001",
                "revision": 1,
                "descripcion": "Presupuesto recibido",
                "subtotal": "100.00",
                "indirectos_total": "0",
                "impuestos": "0",
                "total": "100.00",
                "estado": "En Elaboración",
                "moneda": "USD",
                "iva_aplicado": "15",
                "dec_moneda": 2,
                "dec_calculos": 4,
                "detalles": [],
                "indirectos": [],
            }
        ],
    }


def _base_payload() -> dict:
    return {
        "contract_version": "transfer-v1",
        "asset_type": "base_trabajo",
        "base_trabajo": {
            "id": 88,
            "codigo_unico": "BASE-ORIGEN",
            "nombre": "Base Recibible",
            "tipo": "Base Maestra",
            "descripcion": "Base de prueba",
            "porcentaje_indirectos": "12.5",
            "activa": False,
            "tipo_rendimiento": "Rendimiento Unitario",
            "unidad_tiempo": "Horas",
            "pais_id": None,
            "moneda": "USD",
            "observaciones": None,
            "sync_mode": "snapshot_locked",
        },
        "categorias": [],
        "subcategorias": [],
        "recursos": [],
        "apus": [],
    }


def _create_project_with_base_budget_apu(db, empresa: Empresa) -> Proyecto:
    base = BaseTrabajo(
        codigo_unico=f"BASE-{empresa.id}",
        nombre=f"Base Proyecto {empresa.id}",
        tipo="Base de Proyecto",
        descripcion="Base origen con APU para transferencia.",
        empresa_id=empresa.id,
    )
    db.add(base)
    db.flush()
    unidad = Unidad(
        descripcion="u",
        descripcion_completa="Unidad",
        subcategoria_codigo=2,
        es_global=False,
        base_trabajo_id=base.id,
        empresa_id=empresa.id,
    )
    db.add(unidad)
    db.flush()
    categoria = CategoriaRecurso(nombre="Materiales", descripcion="Cat", base_trabajo_id=base.id, empresa_id=empresa.id)
    subcategoria = SubcategoriaItem(
        codigo="2-001",
        descripcion="Hormigones",
        subcategoria_codigo=2,
        base_trabajo_id=base.id,
        empresa_id=empresa.id,
        revisado=True,
    )
    db.add_all([categoria, subcategoria])
    db.flush()
    recurso = Recurso(
        codigo="2-0001-00001",
        descripcion="Cemento",
        descripcion_normalizada="cemento",
        precio=Decimal("5.00"),
        unidad_id=unidad.id,
        subcategoria_item_id=subcategoria.id,
        base_trabajo_id=base.id,
        empresa_id=empresa.id,
        revisado=True,
    )
    db.add(recurso)
    db.flush()
    apu = APU(
        codigo="APU-TRF-001",
        descripcion="Hormigon transferible",
        descripcion_normalizada="hormigon transferible",
        unidad="m3",
        costo_directo=Decimal("5.00"),
        precio_unitario_total=Decimal("5.00"),
        base_trabajo_id=base.id,
        empresa_id=empresa.id,
        categoria_id=categoria.id,
        subcategoria_item_id=subcategoria.id,
    )
    db.add(apu)
    db.flush()
    db.add(APULinea(apu_id=apu.id, recurso_id=recurso.id, cantidad=Decimal("1.000000"), orden=1))
    db.flush()

    project = Proyecto(
        nombre=f"Proyecto con APU {empresa.id}",
        codigo=f"PRJ-{empresa.id}",
        codigo_root=f"PRJ-{empresa.id}",
        descripcion="Proyecto origen con presupuesto enlazado a APU.",
        estado="Planificacion",
        presupuesto_estimado=Decimal("10.00"),
        moneda="USD",
        empresa_id=empresa.id,
        base_trabajo_id=base.id,
    )
    db.add(project)
    db.flush()
    edt = EdtNode(
        proyecto_id=project.id,
        parent_id=None,
        tipo_nodo="CUENTA_PAQUETE",
        orden=1,
        codigo="1",
        nombre="Obra",
        empresa_id=empresa.id,
    )
    db.add(edt)
    db.flush()
    presupuesto = Presupuesto(
        proyecto_id=project.id,
        empresa_id=empresa.id,
        descripcion="Presupuesto transferible",
        revision=1,
        estado="En Elaboracion",
        moneda="USD",
    )
    db.add(presupuesto)
    db.flush()
    db.add(
        PresupuestoDetalle(
            presupuesto_id=presupuesto.id,
            apu_id=apu.id,
            edt_id=edt.id,
            parent_id=None,
            tipo="RUBRO",
            codigo_item="1.1",
            descripcion="Hormigon transferible",
            unidad="m3",
            cantidad=Decimal("2.000000"),
            precio_unitario=Decimal("5.000000"),
            precio_total=Decimal("10.000000"),
            orden=1,
        )
    )
    db.flush()
    return project


def _add_nested_and_unused_base_content(db, project: Proyecto, empresa: Empresa) -> None:
    base_id = project.base_trabajo_id
    parent_apu = db.query(APU).filter(APU.base_trabajo_id == base_id, APU.empresa_id == empresa.id, APU.codigo == "APU-TRF-001").one()
    used_category = CategoriaRecurso(nombre="Precios Unitarios", descripcion="Cat PU", base_trabajo_id=base_id, empresa_id=empresa.id)
    unused_category = CategoriaRecurso(nombre="No usado", descripcion="Cat no usada", base_trabajo_id=base_id, empresa_id=empresa.id)
    child_subcategory = SubcategoriaItem(
        codigo="4-001",
        descripcion="Mano de obra especializada",
        subcategoria_codigo=4,
        base_trabajo_id=base_id,
        empresa_id=empresa.id,
        revisado=True,
    )
    unused_subcategory = SubcategoriaItem(
        codigo="3-001",
        descripcion="Transporte no usado",
        subcategoria_codigo=3,
        base_trabajo_id=base_id,
        empresa_id=empresa.id,
        revisado=True,
    )
    child_unit = Unidad(
        descripcion="h",
        descripcion_completa="Hora",
        subcategoria_codigo=4,
        es_global=False,
        base_trabajo_id=base_id,
        empresa_id=empresa.id,
    )
    unused_unit = Unidad(
        descripcion="km",
        descripcion_completa="Kilometro",
        subcategoria_codigo=3,
        es_global=False,
        base_trabajo_id=base_id,
        empresa_id=empresa.id,
    )
    db.add_all([used_category, unused_category, child_subcategory, unused_subcategory, child_unit, unused_unit])
    db.flush()
    child_resource = Recurso(
        codigo="4-0001-00001",
        descripcion="Maestro especializado",
        descripcion_normalizada="maestro especializado",
        precio=Decimal("8.00"),
        unidad_id=child_unit.id,
        subcategoria_item_id=child_subcategory.id,
        base_trabajo_id=base_id,
        empresa_id=empresa.id,
        revisado=True,
    )
    unused_resource = Recurso(
        codigo="3-0001-00001",
        descripcion="Camion no usado",
        descripcion_normalizada="camion no usado",
        precio=Decimal("11.00"),
        unidad_id=unused_unit.id,
        subcategoria_item_id=unused_subcategory.id,
        base_trabajo_id=base_id,
        empresa_id=empresa.id,
        revisado=True,
    )
    db.add_all([child_resource, unused_resource])
    db.flush()
    child_apu = APU(
        codigo="APU-TRF-HIJO",
        descripcion="Acabado anidado",
        descripcion_normalizada="acabado anidado",
        unidad="m2",
        costo_directo=Decimal("8.00"),
        precio_unitario_total=Decimal("8.00"),
        base_trabajo_id=base_id,
        empresa_id=empresa.id,
        categoria_id=used_category.id,
        subcategoria_item_id=child_subcategory.id,
    )
    unused_apu = APU(
        codigo="APU-TRF-NO-USADO",
        descripcion="APU no usado",
        descripcion_normalizada="apu no usado",
        unidad="km",
        costo_directo=Decimal("11.00"),
        precio_unitario_total=Decimal("11.00"),
        base_trabajo_id=base_id,
        empresa_id=empresa.id,
        categoria_id=unused_category.id,
        subcategoria_item_id=unused_subcategory.id,
    )
    db.add_all([child_apu, unused_apu])
    db.flush()
    db.add_all(
        [
            APULinea(apu_id=parent_apu.id, apu_hijo_id=child_apu.id, cantidad=Decimal("0.500000"), orden=2),
            APULinea(apu_id=child_apu.id, recurso_id=child_resource.id, cantidad=Decimal("1.000000"), orden=1),
            APULinea(apu_id=unused_apu.id, recurso_id=unused_resource.id, cantidad=Decimal("1.000000"), orden=1),
        ]
    )
    db.flush()


def _expand_project_to_five_budget_apus_and_177_base_apus(db, project: Proyecto, empresa: Empresa) -> set[str]:
    base_id = project.base_trabajo_id
    budget = db.query(Presupuesto).filter(Presupuesto.proyecto_id == project.id, Presupuesto.empresa_id == empresa.id).one()
    edt = db.query(EdtNode).filter(EdtNode.proyecto_id == project.id, EdtNode.empresa_id == empresa.id).first()
    base_subcategory = (
        db.query(SubcategoriaItem)
        .filter(SubcategoriaItem.base_trabajo_id == base_id, SubcategoriaItem.empresa_id == empresa.id)
        .order_by(SubcategoriaItem.id.asc())
        .first()
    )
    base_unit = (
        db.query(Unidad)
        .filter(Unidad.base_trabajo_id == base_id, Unidad.empresa_id == empresa.id)
        .order_by(Unidad.id.asc())
        .first()
    )
    base_category = (
        db.query(CategoriaRecurso)
        .filter(CategoriaRecurso.base_trabajo_id == base_id, CategoriaRecurso.empresa_id == empresa.id)
        .order_by(CategoriaRecurso.id.asc())
        .first()
    )
    first_detail = (
        db.query(PresupuestoDetalle)
        .filter(PresupuestoDetalle.presupuesto_id == budget.id, PresupuestoDetalle.apu_id.isnot(None))
        .order_by(PresupuestoDetalle.id.asc())
        .one()
    )
    first_detail.tipo = None
    db.add(first_detail)

    used_codes = {"APU-TRF-001"}
    for index in range(2, 6):
        recurso = Recurso(
            codigo=f"2-0001-{index:05d}",
            descripcion=f"Recurso usado {index}",
            descripcion_normalizada=f"recurso usado {index}",
            precio=Decimal("3.00"),
            unidad_id=base_unit.id,
            subcategoria_item_id=base_subcategory.id,
            base_trabajo_id=base_id,
            empresa_id=empresa.id,
            revisado=True,
        )
        db.add(recurso)
        db.flush()
        apu = APU(
            codigo=f"APU-USADO-{index:03d}",
            descripcion=f"APU usado {index}",
            descripcion_normalizada=f"apu usado {index}",
            unidad="u",
            costo_directo=Decimal("3.00"),
            precio_unitario_total=Decimal("3.00"),
            base_trabajo_id=base_id,
            empresa_id=empresa.id,
            categoria_id=base_category.id,
            subcategoria_item_id=base_subcategory.id,
        )
        db.add(apu)
        db.flush()
        db.add(APULinea(apu_id=apu.id, recurso_id=recurso.id, cantidad=Decimal("1.000000"), orden=1))
        db.add(
            PresupuestoDetalle(
                presupuesto_id=budget.id,
                apu_id=apu.id,
                edt_id=edt.id,
                parent_id=None,
                tipo=None,
                codigo_item=f"1.{index}",
                descripcion=apu.descripcion,
                unidad="u",
                cantidad=Decimal("1.000000"),
                precio_unitario=Decimal("3.000000"),
                precio_total=Decimal("3.000000"),
                orden=index,
            )
        )
        used_codes.add(apu.codigo)

    for index in range(6, 178):
        db.add(
            APU(
                codigo=f"APU-NO-USADO-{index:03d}",
                descripcion=f"APU no usado {index}",
                descripcion_normalizada=f"apu no usado {index}",
                unidad="u",
                costo_directo=Decimal("1.00"),
                precio_unitario_total=Decimal("1.00"),
                base_trabajo_id=base_id,
                empresa_id=empresa.id,
                categoria_id=base_category.id,
                subcategoria_item_id=base_subcategory.id,
            )
        )
    db.flush()
    return used_codes


def _append_budget_apu_after_snapshot(db, project: Proyecto, empresa: Empresa, code: str) -> None:
    base_id = project.base_trabajo_id
    budget = db.query(Presupuesto).filter(Presupuesto.proyecto_id == project.id, Presupuesto.empresa_id == empresa.id).one()
    edt = db.query(EdtNode).filter(EdtNode.proyecto_id == project.id, EdtNode.empresa_id == empresa.id).first()
    subcategory = (
        db.query(SubcategoriaItem)
        .filter(SubcategoriaItem.base_trabajo_id == base_id, SubcategoriaItem.empresa_id == empresa.id)
        .order_by(SubcategoriaItem.id.asc())
        .first()
    )
    unit = (
        db.query(Unidad)
        .filter(Unidad.base_trabajo_id == base_id, Unidad.empresa_id == empresa.id)
        .order_by(Unidad.id.asc())
        .first()
    )
    category = (
        db.query(CategoriaRecurso)
        .filter(CategoriaRecurso.base_trabajo_id == base_id, CategoriaRecurso.empresa_id == empresa.id)
        .order_by(CategoriaRecurso.id.asc())
        .first()
    )
    recurso = Recurso(
        codigo=f"2-0001-{abs(hash(code)) % 100000:05d}",
        descripcion=f"Recurso posterior {code}",
        descripcion_normalizada=f"recurso posterior {code.lower()}",
        precio=Decimal("4.00"),
        unidad_id=unit.id,
        subcategoria_item_id=subcategory.id,
        base_trabajo_id=base_id,
        empresa_id=empresa.id,
        revisado=True,
    )
    db.add(recurso)
    db.flush()
    apu = APU(
        codigo=code,
        descripcion=f"APU posterior {code}",
        descripcion_normalizada=f"apu posterior {code.lower()}",
        unidad="u",
        costo_directo=Decimal("4.00"),
        precio_unitario_total=Decimal("4.00"),
        base_trabajo_id=base_id,
        empresa_id=empresa.id,
        categoria_id=category.id,
        subcategoria_item_id=subcategory.id,
    )
    db.add(apu)
    db.flush()
    db.add(APULinea(apu_id=apu.id, recurso_id=recurso.id, cantidad=Decimal("1.000000"), orden=1))
    db.add(
        PresupuestoDetalle(
            presupuesto_id=budget.id,
            apu_id=apu.id,
            edt_id=edt.id,
            parent_id=None,
            tipo=None,
            codigo_item="1.99",
            descripcion=apu.descripcion,
            unidad="u",
            cantidad=Decimal("1.000000"),
            precio_unitario=Decimal("4.000000"),
            precio_total=Decimal("4.000000"),
            orden=99,
        )
    )
    db.flush()


def _create_shipment(db, *, sender: Empresa, receiver: Empresa, payload: dict, status: str = "enviado", marketplace_blocked: bool = False) -> TransferShipment:
    now = datetime.now(timezone.utc) - timedelta(minutes=5)
    shipment = TransferShipment(
        sender_empresa_id=sender.id,
        receiver_empresa_id=receiver.id,
        status=status,
        asset_type=payload.get("asset_type") or "proyecto",
        asset_id=(payload.get("project") or payload.get("base_trabajo") or {}).get("id") or 1,
        description=(payload.get("project") or payload.get("base_trabajo") or {}).get("nombre") or "Transferencia",
        contract_version="transfer-v1",
        snapshot_hash=f"hash-{abs(hash(str(payload)))}",
        marketplace_blocked=marketplace_blocked,
        created_at=now,
        sent_at=now,
        received_at=now,
        expires_at=now + timedelta(days=60),
    )
    db.add(shipment)
    db.flush()
    db.add(
        TransferShipmentItem(
            shipment_id=shipment.id,
            asset_type=shipment.asset_type,
            asset_id=shipment.asset_id,
            asset_name_snapshot=shipment.description,
            contract_version="transfer-v1",
            payload_hash=shipment.snapshot_hash,
            payload_json=payload,
        )
    )
    db.flush()
    return shipment


def test_transfer_import_project_uses_common_portability_engine_and_preserves_apu_scope(db):
    sender = _create_company(db, "Common Engine Sender")
    receiver = _create_company(db, "Common Engine Receiver")
    _assign_license(db, receiver)
    receiver_admin = _create_user(db, receiver, "common-engine-receiver@giproy.test")
    source_project = _create_project_with_base_budget_apu(db, sender)
    payload = _project_payload()
    payload["project"]["id"] = source_project.id
    payload["project"]["nombre"] = source_project.nombre
    shipment = _create_shipment(db, sender=sender, receiver=receiver, payload=payload)

    try:
        with _client(db, receiver_admin) as client:
            response = client.post(f"/api/v1/transferencias/shipments/{shipment.id}/import")
    finally:
        app.dependency_overrides.clear()

    assert response.status_code == 200
    assert response.json()["import_status"] == "completed", response.json().get("last_error")
    imported_project = db.query(Proyecto).filter(Proyecto.empresa_id == receiver.id).one()
    assert imported_project.base_trabajo_id is not None
    imported_apu = db.query(APU).filter(APU.empresa_id == receiver.id, APU.base_trabajo_id == imported_project.base_trabajo_id).one()
    assert imported_apu.source_apu_id is not None
    imported_line = (
        db.query(PresupuestoDetalle)
        .join(Presupuesto, PresupuestoDetalle.presupuesto_id == Presupuesto.id)
        .filter(Presupuesto.proyecto_id == imported_project.id, PresupuestoDetalle.tipo == "RUBRO")
        .one()
    )
    assert imported_line.apu_id == imported_apu.id
    imported_resource = db.query(Recurso).filter(Recurso.empresa_id == receiver.id, Recurso.base_trabajo_id == imported_project.base_trabajo_id).one()
    imported_unit = db.query(Unidad).filter(Unidad.id == imported_resource.unidad_id).one()
    assert imported_unit.empresa_id == receiver.id
    assert imported_unit.base_trabajo_id == imported_project.base_trabajo_id


def test_transfer_import_project_common_engine_clones_only_budget_dependency_graph(db):
    sender = _create_company(db, "Scoped Common Sender")
    receiver = _create_company(db, "Scoped Common Receiver")
    _assign_license(db, receiver)
    receiver_admin = _create_user(db, receiver, "scoped-common-receiver@giproy.test")
    source_project = _create_project_with_base_budget_apu(db, sender)
    _add_nested_and_unused_base_content(db, source_project, sender)
    payload = _project_payload()
    payload["project"]["id"] = source_project.id
    payload["project"]["nombre"] = source_project.nombre
    shipment = _create_shipment(db, sender=sender, receiver=receiver, payload=payload)

    try:
        with _client(db, receiver_admin) as client:
            response = client.post(f"/api/v1/transferencias/shipments/{shipment.id}/import")
    finally:
        app.dependency_overrides.clear()

    assert response.status_code == 200
    assert response.json()["import_status"] == "completed", response.json().get("last_error")
    imported_project = db.query(Proyecto).filter(Proyecto.empresa_id == receiver.id).one()
    imported_base_id = imported_project.base_trabajo_id
    imported_apu_codes = {
        item.codigo
        for item in db.query(APU).filter(APU.empresa_id == receiver.id, APU.base_trabajo_id == imported_base_id).all()
    }
    imported_resource_names = {
        item.descripcion
        for item in db.query(Recurso).filter(Recurso.empresa_id == receiver.id, Recurso.base_trabajo_id == imported_base_id).all()
    }
    imported_subcategory_names = {
        item.descripcion
        for item in db.query(SubcategoriaItem).filter(SubcategoriaItem.empresa_id == receiver.id, SubcategoriaItem.base_trabajo_id == imported_base_id).all()
    }
    imported_category_names = {
        item.nombre
        for item in db.query(CategoriaRecurso).filter(CategoriaRecurso.empresa_id == receiver.id, CategoriaRecurso.base_trabajo_id == imported_base_id).all()
    }

    assert imported_apu_codes == {"APU-TRF-001", "APU-TRF-HIJO"}
    assert imported_resource_names == {"Cemento", "Maestro especializado"}
    assert "Transporte no usado" not in imported_subcategory_names
    assert "No usado" not in imported_category_names


def test_transfer_import_project_snapshot_fallback_preserves_apu_scope(db):
    sender = _create_company(db, "Snapshot Engine Sender")
    receiver = _create_company(db, "Snapshot Engine Receiver")
    _assign_license(db, receiver)
    receiver_admin = _create_user(db, receiver, "snapshot-engine-receiver@giproy.test")
    source_project = _create_project_with_base_budget_apu(db, sender)
    snapshot = transferencias_service._build_project_snapshot(db, empresa_id=sender.id, project_id=source_project.id)
    shipment = _create_shipment(db, sender=sender, receiver=receiver, payload=snapshot["payload"])
    shipment.asset_id = 999999
    db.add(shipment)
    db.flush()

    try:
        with _client(db, receiver_admin) as client:
            response = client.post(f"/api/v1/transferencias/shipments/{shipment.id}/import")
    finally:
        app.dependency_overrides.clear()

    assert response.status_code == 200
    assert response.json()["import_status"] == "completed", response.json().get("last_error")
    imported_project = db.query(Proyecto).filter(Proyecto.empresa_id == receiver.id).one()
    imported_apu = db.query(APU).filter(APU.empresa_id == receiver.id, APU.base_trabajo_id == imported_project.base_trabajo_id).one()
    imported_line = (
        db.query(PresupuestoDetalle)
        .join(Presupuesto, PresupuestoDetalle.presupuesto_id == Presupuesto.id)
        .filter(Presupuesto.proyecto_id == imported_project.id, PresupuestoDetalle.tipo == "RUBRO")
        .one()
    )
    assert imported_line.apu_id == imported_apu.id


def test_transfer_project_snapshot_exports_only_budget_dependency_graph(db):
    sender = _create_company(db, "Scoped Snapshot Sender")
    source_project = _create_project_with_base_budget_apu(db, sender)
    _add_nested_and_unused_base_content(db, source_project, sender)

    snapshot = transferencias_service._build_project_snapshot(db, empresa_id=sender.id, project_id=source_project.id)
    payload = snapshot["payload"]

    assert snapshot["blockers"] == []
    assert snapshot["content_summary"]["apus"] == 2
    assert snapshot["content_summary"]["recursos"] == 2
    assert {item["codigo"] for item in payload["apus"]} == {"APU-TRF-001", "APU-TRF-HIJO"}
    assert {item["descripcion"] for item in payload["recursos"]} == {"Cemento", "Maestro especializado"}
    assert "Transporte no usado" not in {item["descripcion"] for item in payload["subcategorias"]}
    assert "No usado" not in {item["nombre"] for item in payload["categorias"]}
    parent = next(item for item in payload["apus"] if item["codigo"] == "APU-TRF-001")
    child = next(item for item in payload["apus"] if item["codigo"] == "APU-TRF-HIJO")
    assert any(line["apu_hijo_id"] == child["id"] for line in parent["lineas"])


def test_transfer_project_snapshot_does_not_export_full_project_base_when_budget_has_five_apus(db):
    sender = _create_company(db, "Scoped Snapshot Five Apus")
    source_project = _create_project_with_base_budget_apu(db, sender)
    used_codes = _expand_project_to_five_budget_apus_and_177_base_apus(db, source_project, sender)

    total_base_apus = (
        db.query(APU)
        .filter(APU.empresa_id == sender.id, APU.base_trabajo_id == source_project.base_trabajo_id)
        .count()
    )
    snapshot = transferencias_service._build_project_snapshot(db, empresa_id=sender.id, project_id=source_project.id)

    assert total_base_apus == 177
    assert snapshot["blockers"] == []
    assert snapshot["content_summary"]["apus"] == 5
    assert {item["codigo"] for item in snapshot["payload"]["apus"]} == used_codes
    assert not any(str(item["codigo"]).startswith("APU-NO-USADO-") for item in snapshot["payload"]["apus"])


def test_transfer_import_project_does_not_clone_full_live_base_when_budget_has_five_apus(db):
    sender = _create_company(db, "Scoped Live Five Sender")
    receiver = _create_company(db, "Scoped Live Five Receiver")
    _assign_license(db, receiver)
    receiver_admin = _create_user(db, receiver, "scoped-live-five-receiver@giproy.test")
    source_project = _create_project_with_base_budget_apu(db, sender)
    used_codes = _expand_project_to_five_budget_apus_and_177_base_apus(db, source_project, sender)
    snapshot = transferencias_service._build_project_snapshot(db, empresa_id=sender.id, project_id=source_project.id)
    shipment = _create_shipment(db, sender=sender, receiver=receiver, payload=snapshot["payload"])

    try:
        with _client(db, receiver_admin) as client:
            response = client.post(f"/api/v1/transferencias/shipments/{shipment.id}/import")
    finally:
        app.dependency_overrides.clear()

    assert response.status_code == 200
    assert response.json()["import_status"] == "completed", response.json().get("last_error")
    imported_project = db.query(Proyecto).filter(Proyecto.empresa_id == receiver.id).one()
    imported_apu_codes = {
        item.codigo
        for item in db.query(APU)
        .filter(APU.empresa_id == receiver.id, APU.base_trabajo_id == imported_project.base_trabajo_id)
        .all()
    }
    assert imported_apu_codes == used_codes


def test_transfer_import_project_uses_immutable_snapshot_even_if_source_project_changes_after_send(db):
    sender = _create_company(db, "Immutable Snapshot Sender")
    receiver = _create_company(db, "Immutable Snapshot Receiver")
    _assign_license(db, receiver)
    receiver_admin = _create_user(db, receiver, "immutable-snapshot-receiver@giproy.test")
    source_project = _create_project_with_base_budget_apu(db, sender)
    used_codes = _expand_project_to_five_budget_apus_and_177_base_apus(db, source_project, sender)
    snapshot = transferencias_service._build_project_snapshot(db, empresa_id=sender.id, project_id=source_project.id)
    shipment = _create_shipment(db, sender=sender, receiver=receiver, payload=snapshot["payload"])

    _append_budget_apu_after_snapshot(db, source_project, sender, "APU-POST-SNAPSHOT")

    try:
        with _client(db, receiver_admin) as client:
            response = client.post(f"/api/v1/transferencias/shipments/{shipment.id}/import")
    finally:
        app.dependency_overrides.clear()

    assert response.status_code == 200
    assert response.json()["import_status"] == "completed", response.json().get("last_error")
    imported_project = db.query(Proyecto).filter(Proyecto.empresa_id == receiver.id).one()
    imported_apu_codes = {
        item.codigo
        for item in db.query(APU)
        .filter(APU.empresa_id == receiver.id, APU.base_trabajo_id == imported_project.base_trabajo_id)
        .all()
    }
    assert imported_apu_codes == used_codes
    assert "APU-POST-SNAPSHOT" not in imported_apu_codes


def test_transfer_import_project_is_idempotent_and_traceable(db):
    sender = _create_company(db, "Import Sender")
    receiver = _create_company(db, "Import Receiver")
    _assign_license(db, receiver)
    receiver_admin = _create_user(db, receiver, "import-receiver@giproy.test")
    source_project = _create_project_with_base_budget_apu(db, sender)
    snapshot = transferencias_service._build_project_snapshot(db, empresa_id=sender.id, project_id=source_project.id)
    shipment = _create_shipment(db, sender=sender, receiver=receiver, payload=snapshot["payload"])

    try:
        with _client(db, receiver_admin) as client:
            first = client.post(f"/api/v1/transferencias/shipments/{shipment.id}/import")
            second = client.post(f"/api/v1/transferencias/shipments/{shipment.id}/import")
    finally:
        app.dependency_overrides.clear()

    assert first.status_code == 200
    assert first.json()["import_status"] == "completed"
    assert first.json()["imported_entity_type"] == "proyecto"
    assert first.json()["idempotent"] is False
    assert second.status_code == 200
    assert second.json()["idempotent"] is True
    assert second.json()["imported_entity_id"] == first.json()["imported_entity_id"]
    assert db.query(Proyecto).filter(Proyecto.empresa_id == receiver.id).count() == 1
    assert db.query(EdtNode).filter(EdtNode.empresa_id == receiver.id).count() == 1
    assert db.query(Presupuesto).filter(Presupuesto.empresa_id == receiver.id).count() == 1
    assert db.query(TransferImportResult).filter_by(shipment_id=shipment.id, status="completed").count() == 1
    assert db.query(TransferImportReference).filter_by(shipment_id=shipment.id, target_empresa_id=receiver.id).count() == 1
    item = db.query(TransferShipmentItem).filter_by(shipment_id=shipment.id).one()
    assert item.payload_json["sanitized"] is True
    assert item.payload_json["reason"] == "import_completed"
    assert item.payload_json["payload_hash"] == shipment.snapshot_hash
    assert item.payload_json["source_shipment_id"] == shipment.id
    assert item.payload_json["target_empresa_id"] == receiver.id
    assert item.payload_json["imported_entity_id"] == first.json()["imported_entity_id"]
    assert "project" not in item.payload_json
    assert "edt_nodes" not in item.payload_json
    assert "presupuestos" not in item.payload_json


def test_transfer_import_base_creates_new_copy(db):
    sender = _create_company(db, "Base Sender")
    receiver = _create_company(db, "Base Receiver")
    _assign_license(db, receiver)
    receiver_admin = _create_user(db, receiver, "base-receiver@giproy.test")
    shipment = _create_shipment(db, sender=sender, receiver=receiver, payload=_base_payload())

    try:
        with _client(db, receiver_admin) as client:
            response = client.post(f"/api/v1/transferencias/shipments/{shipment.id}/import")
    finally:
        app.dependency_overrides.clear()

    assert response.status_code == 200
    assert response.json()["imported_entity_type"] == "base_trabajo"
    base = db.query(BaseTrabajo).filter(BaseTrabajo.empresa_id == receiver.id).one()
    assert base.nombre.startswith("Base Recibible - recibida")
    assert base.activa is False
    assert base.sync_mode == "snapshot_locked"


def test_transfer_import_base_snapshot_preserves_units_resources_and_apus(db):
    sender = _create_company(db, "Base Snapshot Sender")
    receiver = _create_company(db, "Base Snapshot Receiver")
    _assign_license(db, receiver)
    receiver_admin = _create_user(db, receiver, "base-snapshot-receiver@giproy.test")
    source_project = _create_project_with_base_budget_apu(db, sender)
    snapshot = transferencias_service._build_base_snapshot(db, empresa_id=sender.id, base_id=source_project.base_trabajo_id)
    shipment = _create_shipment(db, sender=sender, receiver=receiver, payload=snapshot["payload"])

    try:
        with _client(db, receiver_admin) as client:
            response = client.post(f"/api/v1/transferencias/shipments/{shipment.id}/import")
    finally:
        app.dependency_overrides.clear()

    assert response.status_code == 200
    assert response.json()["import_status"] == "completed", response.json().get("last_error")
    imported_base = db.query(BaseTrabajo).filter(BaseTrabajo.empresa_id == receiver.id).one()
    imported_unit = db.query(Unidad).filter(Unidad.empresa_id == receiver.id, Unidad.base_trabajo_id == imported_base.id).one()
    imported_resource = db.query(Recurso).filter(Recurso.empresa_id == receiver.id, Recurso.base_trabajo_id == imported_base.id).one()
    imported_apu = db.query(APU).filter(APU.empresa_id == receiver.id, APU.base_trabajo_id == imported_base.id).one()
    imported_line = db.query(APULinea).filter(APULinea.apu_id == imported_apu.id).one()

    assert imported_resource.unidad_id == imported_unit.id
    assert imported_line.recurso_id == imported_resource.id
    assert imported_base.snapshot_resources_count == 1
    assert imported_base.snapshot_apus_count == 1


def test_transfer_reject_requires_reason_and_notifies_sender(db):
    sender = _create_company(db, "Reject Sender")
    receiver = _create_company(db, "Reject Receiver")
    _assign_license(db, receiver)
    receiver_admin = _create_user(db, receiver, "reject-receiver@giproy.test")
    shipment = _create_shipment(db, sender=sender, receiver=receiver, payload=_project_payload())

    try:
        with _client(db, receiver_admin) as client:
            bad = client.post(f"/api/v1/transferencias/shipments/{shipment.id}/reject", json={"reason": "no"})
            ok = client.post(f"/api/v1/transferencias/shipments/{shipment.id}/reject", json={"reason": "No corresponde a esta empresa"})
    finally:
        app.dependency_overrides.clear()

    assert bad.status_code == 422
    assert ok.status_code == 200
    assert ok.json()["status"] == "rechazado"
    assert db.query(TransferAuditEvent).filter_by(shipment_id=shipment.id, empresa_id=sender.id, event_type="transfer_shipment_rejected_notification").count() == 1


def test_transfer_sender_can_cancel_until_imported(db):
    sender = _create_company(db, "Cancel Sender")
    receiver = _create_company(db, "Cancel Receiver")
    _assign_license(db, sender)
    sender_admin = _create_user(db, sender, "cancel-sender@giproy.test")
    shipment = _create_shipment(db, sender=sender, receiver=receiver, payload=_project_payload())

    try:
        with _client(db, sender_admin) as client:
            response = client.post(f"/api/v1/transferencias/shipments/{shipment.id}/cancel", json={"reason": "Error de destinatario"})
    finally:
        app.dependency_overrides.clear()

    assert response.status_code == 200
    assert response.json()["status"] == "cancelado"
    assert db.query(TransferAuditEvent).filter_by(shipment_id=shipment.id, empresa_id=sender.id, event_type="transfer_shipment_cancelled").count() == 1
    timeline_event = next(item for item in transferencias_service.shipment_timeline(shipment) if item["type"] == "transfer_shipment_cancelled")
    assert timeline_event["label"] == "Envio cancelado por el emisor"
    assert timeline_event["type_label"] == "Envio cancelado por el emisor"
    assert "transfer_shipment" not in timeline_event["label"]


def test_transfer_sender_cannot_cancel_after_import(db):
    sender = _create_company(db, "Imported Cancel Sender")
    receiver = _create_company(db, "Imported Cancel Receiver")
    _assign_license(db, receiver)
    receiver_admin = _create_user(db, receiver, "imported-cancel-receiver@giproy.test")
    sender_admin = _create_user(db, sender, "imported-cancel-sender@giproy.test")
    source_project = _create_project_with_base_budget_apu(db, sender)
    snapshot = transferencias_service._build_project_snapshot(db, empresa_id=sender.id, project_id=source_project.id)
    shipment = _create_shipment(db, sender=sender, receiver=receiver, payload=snapshot["payload"])

    try:
        with _client(db, receiver_admin) as client:
            imported = client.post(f"/api/v1/transferencias/shipments/{shipment.id}/import")
        with _client(db, sender_admin) as client:
            cancelled = client.post(f"/api/v1/transferencias/shipments/{shipment.id}/cancel", json={"reason": "Ya no corresponde"})
    finally:
        app.dependency_overrides.clear()

    assert imported.status_code == 200
    assert imported.json()["import_status"] == "completed"
    assert cancelled.status_code == 403
    assert cancelled.json()["detail"]["code"] == "transfer_cancel_after_import_forbidden"


def test_transfer_marketplace_block_blocks_import_and_open_endpoint_is_not_available(db):
    sender = _create_company(db, "Blocked Sender")
    receiver = _create_company(db, "Blocked Receiver")
    _assign_license(db, receiver)
    receiver_admin = _create_user(db, receiver, "blocked-receiver@giproy.test")
    shipment = _create_shipment(
        db,
        sender=sender,
        receiver=receiver,
        payload=_project_payload(),
        status="bloqueado_marketplace",
        marketplace_blocked=True,
    )
    db.add(
        TransferMarketplaceRequirement(
            shipment_id=shipment.id,
            product_id=None,
            product_title_snapshot="Producto requerido",
            status="pending_purchase",
            required=True,
            price_snapshot="10.00",
            currency="USD",
        )
    )
    db.flush()

    try:
        with _client(db, receiver_admin) as client:
            open_response = client.post(f"/api/v1/transferencias/shipments/{shipment.id}/open")
            import_response = client.post(f"/api/v1/transferencias/shipments/{shipment.id}/import")
    finally:
        app.dependency_overrides.clear()

    assert open_response.status_code == 404
    assert import_response.status_code == 403
    assert db.query(Proyecto).filter(Proyecto.empresa_id == receiver.id).count() == 0


@pytest.mark.parametrize("blocked_license", ["EXPRESS", "TESTER", "ACADEMIC", "TRAINING"])
def test_blocked_receiver_licenses_cannot_import_and_open_endpoint_is_not_available(db, blocked_license):
    sender = _create_company(db, f"Blocked License Sender {blocked_license}")
    receiver = _create_company(db, f"Blocked License Receiver {blocked_license}")
    _assign_license(db, receiver, blocked_license)
    receiver_admin = _create_user(db, receiver, f"blocked-{blocked_license.lower()}@giproy.test")
    shipment = _create_shipment(db, sender=sender, receiver=receiver, payload=_project_payload())

    try:
        with _client(db, receiver_admin) as client:
            open_response = client.post(f"/api/v1/transferencias/shipments/{shipment.id}/open")
            import_response = client.post(f"/api/v1/transferencias/shipments/{shipment.id}/import")
    finally:
        app.dependency_overrides.clear()

    assert open_response.status_code == 404
    assert import_response.status_code == 403
    assert import_response.json()["detail"]["code"] == "transfer_license_blocked"
    assert db.query(Proyecto).filter(Proyecto.empresa_id == receiver.id).count() == 0


def test_transfer_import_failure_is_retryable_without_duplicate(db):
    sender = _create_company(db, "Retry Sender")
    receiver = _create_company(db, "Retry Receiver")
    _assign_license(db, receiver)
    receiver_admin = _create_user(db, receiver, "retry-receiver@giproy.test")
    source_project = _create_project_with_base_budget_apu(db, sender)
    snapshot = transferencias_service._build_project_snapshot(db, empresa_id=sender.id, project_id=source_project.id)
    bad_payload = {"asset_type": "tipo_no_soportado"}
    shipment = _create_shipment(db, sender=sender, receiver=receiver, payload=bad_payload)

    try:
        with _client(db, receiver_admin) as client:
            failed = client.post(f"/api/v1/transferencias/shipments/{shipment.id}/import")
            item = db.query(TransferShipmentItem).filter_by(shipment_id=shipment.id).one()
            item.payload_json = snapshot["payload"]
            item.asset_type = "proyecto"
            item.asset_id = source_project.id
            shipment.asset_type = "proyecto"
            shipment.asset_id = source_project.id
            db.add(item)
            db.add(shipment)
            db.flush()
            retried = client.post(f"/api/v1/transferencias/shipments/{shipment.id}/import")
    finally:
        app.dependency_overrides.clear()

    assert failed.status_code == 200
    assert failed.json()["import_status"] == "failed"
    assert failed.json()["status"] == "fallo_importacion"
    assert retried.status_code == 200
    assert retried.json()["import_status"] == "completed"
    assert retried.json()["attempts_count"] == 2
    assert db.query(Proyecto).filter(Proyecto.empresa_id == receiver.id).count() == 1
