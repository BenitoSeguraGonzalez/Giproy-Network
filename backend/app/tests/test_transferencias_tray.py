from datetime import date, datetime, timedelta, timezone

from fastapi.testclient import TestClient

from app.api.deps import get_current_active_user
from app.core.database import get_db
from app.main import app
from app.models.empresa import Empresa
from app.models.empresa_licencia import EmpresaLicencia
from app.models.licencia import Licencia
from app.models.transferencia import TransferAuditEvent, TransferShipment, TransferShipmentItem
from app.models.usuario import Usuario


def _create_company(db, name: str, *, alias: str | None = None) -> Empresa:
    empresa = Empresa(
        nombre=name,
        alias=alias,
        ruc=f"188{abs(hash(name)) % 1000000000:09d}",
        proy_prefijo="TRB",
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


def _create_shipment(
    db,
    *,
    sender: Empresa,
    receiver: Empresa,
    status: str,
    description: str,
    asset_name: str,
    activity_at: datetime,
    asset_type: str = "proyecto",
) -> TransferShipment:
    shipment = TransferShipment(
        sender_empresa_id=sender.id,
        receiver_empresa_id=receiver.id,
        status=status,
        asset_type=asset_type,
        asset_id=1000 + abs(hash(asset_name)) % 1000,
        description=description,
        contract_version="transfer-v1",
        snapshot_hash=f"hash-{abs(hash(description))}",
        marketplace_blocked=status == "bloqueado_marketplace",
        created_at=activity_at - timedelta(minutes=2),
        sent_at=activity_at - timedelta(minutes=1),
        received_at=activity_at,
        opened_at=None,
        imported_at=activity_at if status == "importado" else None,
        expires_at=activity_at + timedelta(days=60),
        metadata_json={"test": "tray"},
    )
    db.add(shipment)
    db.flush()
    db.add(
        TransferShipmentItem(
            shipment_id=shipment.id,
            asset_type=asset_type,
            asset_id=shipment.asset_id,
            asset_name_snapshot=asset_name,
            contract_version="transfer-v1",
            payload_hash=shipment.snapshot_hash,
            payload_json={"asset_name": asset_name},
        )
    )
    db.add(
        TransferAuditEvent(
            shipment_id=shipment.id,
            empresa_id=sender.id,
            event_type="transfer_shipment_created",
            actor_scope="company_admin",
            payload_json={"shipment_id": shipment.id},
            created_at=activity_at - timedelta(minutes=2),
        )
    )
    db.flush()
    return shipment


def test_transfer_tray_filters_omni_search_default_range_and_metrics(db):
    sender = _create_company(db, "Constructora Legal Sender", alias="Sender Alias")
    receiver = _create_company(db, "Receptora Legal Tray", alias="Receptora Alias")
    third = _create_company(db, "Destino Salida Tray")
    _assign_license(db, receiver, "STANDARD")
    receiver_admin = _create_user(db, receiver, "tray-receiver@giproy.test")
    now = datetime.now(timezone.utc) - timedelta(minutes=5)

    incoming = _create_shipment(
        db,
        sender=sender,
        receiver=receiver,
        status="enviado",
        description="Entrega puente norte",
        asset_name="Proyecto Alfa Transferible",
        activity_at=now,
    )
    _create_shipment(
        db,
        sender=receiver,
        receiver=third,
        status="importado",
        description="Base vial enviada",
        asset_name="Base Vial 2026",
        activity_at=now - timedelta(days=2),
        asset_type="base_trabajo",
    )
    _create_shipment(
        db,
        sender=sender,
        receiver=receiver,
        status="fallo_importacion",
        description="Historico fuera de rango",
        asset_name="Proyecto Antiguo",
        activity_at=now - timedelta(days=45),
    )

    try:
        with _client(db, receiver_admin) as client:
            incoming_response = client.get("/api/v1/transferencias/tray", params={"direction": "entrada", "q": "sender alias"})
            status_response = client.get("/api/v1/transferencias/tray", params={"direction": "todos", "status": "importado"})
            wide_response = client.get(
                "/api/v1/transferencias/tray",
                params={
                    "direction": "entrada",
                    "date_from": (now - timedelta(days=50)).date().isoformat(),
                    "date_to": now.date().isoformat(),
                    "q": "proyecto antiguo",
                },
            )
            timeline_response = client.get(f"/api/v1/transferencias/shipments/{incoming.id}/timeline")
            summary_response = client.get("/api/v1/transferencias/tray-summary")
    finally:
        app.dependency_overrides.clear()

    assert incoming_response.status_code == 200
    incoming_payload = incoming_response.json()
    assert incoming_payload["total"] == 1
    assert incoming_payload["metrics"]["recibidos"] == 1
    assert incoming_payload["metrics"]["nuevos"] == 1
    assert incoming_payload["items"][0]["company_display_name"] == "Sender Alias"
    assert incoming_payload["items"][0]["company_name"] == "Constructora Legal Sender"
    assert incoming_payload["items"][0]["asset_name"] == "Proyecto Alfa Transferible"
    assert incoming_payload["items"][0]["status_label"] == "Recibido"
    assert incoming_payload["items"][0]["status_color"] == "cyan"

    assert status_response.status_code == 200
    assert status_response.json()["total"] == 1
    assert status_response.json()["items"][0]["direction"] == "salida"

    assert wide_response.status_code == 200
    assert wide_response.json()["total"] == 1
    assert wide_response.json()["items"][0]["status_recoverable"] is True

    assert timeline_response.status_code == 200
    timeline_types = [item["type"] for item in timeline_response.json()["items"]]
    assert "enviado" in timeline_types
    assert "transfer_shipment_created" in timeline_types

    assert summary_response.status_code == 200
    assert summary_response.json()["metrics"]["nuevos"] == 1


def test_superadmin_tray_uses_selected_company_not_user_company(db):
    sender = _create_company(db, "Administradores Generales")
    receiver = _create_company(db, "Santiago Bermeo")
    _assign_license(db, sender, "STANDARD")
    _assign_license(db, receiver, "STANDARD")
    superadmin = _create_user(db, sender, "superadmin-transfer-scope@giproy.test", rol="superadministrador")
    now = datetime.now(timezone.utc) - timedelta(minutes=5)

    _create_shipment(
        db,
        sender=sender,
        receiver=receiver,
        status="enviado",
        description="Envio prueba multiempresa",
        asset_name="Proyecto Administradores a Santiago",
        activity_at=now,
    )

    try:
        with _client(db, superadmin) as client:
            sender_response = client.get(
                "/api/v1/transferencias/tray",
                params={"empresa_id": sender.id, "direction": "todos"},
            )
            receiver_response = client.get(
                "/api/v1/transferencias/tray",
                params={"empresa_id": receiver.id, "direction": "todos"},
            )
            receiver_summary = client.get(
                "/api/v1/transferencias/tray-summary",
                params={"empresa_id": receiver.id},
            )
    finally:
        app.dependency_overrides.clear()

    assert sender_response.status_code == 200
    assert receiver_response.status_code == 200
    assert receiver_summary.status_code == 200

    sender_payload = sender_response.json()
    receiver_payload = receiver_response.json()
    assert sender_payload["total"] == 1
    assert receiver_payload["total"] == 1
    assert sender_payload["items"][0]["direction"] == "salida"
    assert sender_payload["items"][0]["company_display_name"] == "Santiago Bermeo"
    assert sender_payload["items"][0]["status"] == "enviado"
    assert sender_payload["items"][0]["status_label"] == "Enviado"
    assert receiver_payload["items"][0]["direction"] == "entrada"
    assert receiver_payload["items"][0]["company_display_name"] == "Administradores Generales"
    assert receiver_payload["items"][0]["status"] == "enviado"
    assert receiver_payload["items"][0]["status_label"] == "Recibido"
    assert receiver_summary.json()["metrics"]["nuevos"] == 1
