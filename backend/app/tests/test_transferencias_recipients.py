from datetime import date, datetime, timedelta, timezone

import pytest
from fastapi.testclient import TestClient

from app.api.deps import get_current_active_user
from app.core.database import get_db
from app.main import app
from app.models.empresa import Empresa
from app.models.empresa_licencia import EmpresaLicencia
from app.models.licencia import Licencia
from app.models.transferencia import (
    TransferAllowedCompanyRecipient,
    TransferAuditEvent,
    TransferCodeAttemptGuard,
    TransferCompanyPublicCode,
    TransferExtraRecipientPack,
)
from app.models.usuario import Usuario
from app.services.transferencias import (
    CODE_FAILURES_BEFORE_BAN,
    CODE_FAILURES_BEFORE_PAUSE,
    FIXED_RECIPIENT_LIMIT,
    TransferPolicyError,
    transferencias_service,
)


def _create_company(db, name: str, *, alias: str | None = None) -> Empresa:
    empresa = Empresa(
        nombre=name,
        alias=alias,
        ruc=f"179{abs(hash(name)) % 1000000000:09d}",
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


def _client(db, current_user):
    app.dependency_overrides[get_db] = lambda: db
    app.dependency_overrides[get_current_active_user] = lambda: current_user
    return TestClient(app)


def test_company_public_code_is_generated_and_sanitized(db):
    empresa = _create_company(db, "Empresa Codigo")
    admin = _create_user(db, empresa, "admin-code@giproy.test", rol="administrador")
    regular = _create_user(db, empresa, "regular-code@giproy.test", rol="usuario")

    result = transferencias_service.sanitize_company_public_codes(db)

    code = transferencias_service.get_my_public_code(db, admin)
    assert result["scanned_companies"] == 1
    assert result["created_codes"] == 1
    assert code.empresa_id == empresa.id
    assert code.public_code[3:6] == " - "
    assert len(code.public_code) == 9
    assert transferencias_service.ensure_admin_public_code(db, regular) is None


def test_company_public_code_is_company_scoped_for_superadmin_operating_context(db):
    home_company = _create_company(db, "Administradores Generales")
    target_company = _create_company(db, "Santiago Bermeo")
    superadmin = _create_user(db, home_company, "superadmin-scope@giproy.test", rol="superadministrador")

    home_code = transferencias_service.get_my_public_code(db, superadmin, empresa_id=home_company.id)
    target_code = transferencias_service.get_my_public_code(db, superadmin, empresa_id=target_company.id)

    assert home_code.empresa_id == home_company.id
    assert target_code.empresa_id == target_company.id
    assert home_code.public_code != target_code.public_code
    assert db.query(TransferCompanyPublicCode).filter_by(empresa_id=home_company.id).count() == 1
    assert db.query(TransferCompanyPublicCode).filter_by(empresa_id=target_company.id).count() == 1


def test_non_superadmin_cannot_request_public_code_for_other_company(db):
    home_company = _create_company(db, "Empresa Administrador Propia")
    other_company = _create_company(db, "Empresa Administrador Ajena")
    admin = _create_user(db, home_company, "admin-scope@giproy.test", rol="administrador")

    with pytest.raises(TransferPolicyError) as exc:
        transferencias_service.get_my_public_code(db, admin, empresa_id=other_company.id)

    assert exc.value.code == "transfer_company_scope_forbidden"


def test_code_resolution_returns_company_preview_without_user_identity(db):
    sender = _create_company(db, "Empresa Emisora")
    receiver = _create_company(db, "Empresa Receptora Legal", alias="Receptora Alias")
    _assign_license(db, sender, "STANDARD")
    assert db.query(EmpresaLicencia).filter(EmpresaLicencia.empresa_id == sender.id).count() == 1
    assert transferencias_service.ensure_license_enabled(db, sender.id) == "STANDARD"
    _create_user(db, sender, "sender-admin@giproy.test", rol="administrador")
    receiver_admin = _create_user(db, receiver, "receiver-admin@giproy.test", rol="administrador")
    code = transferencias_service.ensure_admin_public_code(db, receiver_admin)

    resolved = transferencias_service.resolve_recipient_company(
        db,
        sender_empresa_id=sender.id,
        public_code=code.public_code.lower(),
        actor_user_id=None,
    )
    preview = transferencias_service.serialize_company_preview(resolved)

    assert preview == {
        "company_display_name": "Receptora Alias",
        "company_name": "Empresa Receptora Legal",
        "company_alias": "Receptora Alias",
        "status": "resolved",
    }
    assert "receiver-admin" not in str(preview)


def test_transfer_recipient_endpoints_resolve_create_and_list(db):
    sender = _create_company(db, "Empresa API Sender")
    receiver = _create_company(db, "Empresa API Receiver", alias="API Receiver Alias")
    _assign_license(db, sender, "STANDARD")
    sender_admin = _create_user(db, sender, "api-sender@giproy.test", rol="administrador")
    receiver_admin = _create_user(db, receiver, "api-receiver@giproy.test", rol="administrador")
    receiver_code = transferencias_service.ensure_admin_public_code(db, receiver_admin)

    try:
        with _client(db, sender_admin) as client:
            my_code_response = client.get("/api/v1/transferencias/my-code")
            resolve_response = client.post(
                "/api/v1/transferencias/recipient-code/resolve",
                json={"public_code": receiver_code.public_code},
            )
            create_response = client.post(
                "/api/v1/transferencias/recipients",
                json={
                    "public_code": receiver_code.public_code,
                    "confirm": True,
                    "confirmed_display_name": "API Receiver Alias",
                },
            )
            list_response = client.get("/api/v1/transferencias/recipients")
    finally:
        app.dependency_overrides.clear()

    assert my_code_response.status_code == 200
    assert my_code_response.json()["public_code"][3:6] == " - "
    assert resolve_response.status_code == 200
    assert resolve_response.json()["company_display_name"] == "API Receiver Alias"
    assert "api-receiver" not in str(resolve_response.json())
    assert create_response.status_code == 200
    assert create_response.json()["recipient_kind"] == "fixed"
    assert list_response.status_code == 200
    assert list_response.json()["fixed_used"] == 1
    assert list_response.json()["fixed_available"] == 2
    assert list_response.json()["additional_limit"] == 0
    assert list_response.json()["additional_used"] == 0
    assert list_response.json()["additional_available"] == 0
    assert list_response.json()["items"][0]["company_display_name"] == "API Receiver Alias"


def test_superadmin_endpoint_uses_selected_empresa_for_company_code(db):
    home_company = _create_company(db, "Administradores Generales API")
    target_company = _create_company(db, "Santiago Bermeo API")
    superadmin = _create_user(db, home_company, "superadmin-api-scope@giproy.test", rol="superadministrador")

    try:
        with _client(db, superadmin) as client:
            home_response = client.get(f"/api/v1/transferencias/my-code?empresa_id={home_company.id}")
            target_response = client.get(f"/api/v1/transferencias/my-code?empresa_id={target_company.id}")
    finally:
        app.dependency_overrides.clear()

    assert home_response.status_code == 200
    assert target_response.status_code == 200
    assert home_response.json()["empresa_id"] == home_company.id
    assert target_response.json()["empresa_id"] == target_company.id
    assert home_response.json()["scope"] == "company"
    assert target_response.json()["scope"] == "company"
    assert home_response.json()["public_code"] != target_response.json()["public_code"]


def test_transfer_recipient_list_exposes_conecta_capacity(db):
    sender = _create_company(db, "Empresa API Conecta Capacity")
    _assign_license(db, sender, "PROFESSIONAL")
    sender_admin = _create_user(db, sender, "api-conecta-capacity@giproy.test", rol="administrador")

    for index in range(FIXED_RECIPIENT_LIMIT):
        receiver = _create_company(db, f"Destino Capacity Fijo {index}")
        receiver_admin = _create_user(db, receiver, f"capacity-fixed-{index}@giproy.test", rol="administrador")
        code = transferencias_service.ensure_admin_public_code(db, receiver_admin)
        transferencias_service.create_recipient_from_code(
            db,
            sender_empresa_id=sender.id,
            public_code=code.public_code,
            actor_user_id=sender_admin.id,
            confirm=True,
            confirmed_display_name=transferencias_service.company_display_name(receiver),
        )

    pack = TransferExtraRecipientPack(
        empresa_id=sender.id,
        slots_total=3,
        slots_used=0,
        expires_at=datetime.now(timezone.utc) + timedelta(days=30),
        status="active",
    )
    db.add(pack)
    db.flush()

    extra_receiver = _create_company(db, "Destino Capacity Conecta")
    extra_admin = _create_user(db, extra_receiver, "capacity-extra@giproy.test", rol="administrador")
    extra_code = transferencias_service.ensure_admin_public_code(db, extra_admin)
    transferencias_service.create_recipient_from_code(
        db,
        sender_empresa_id=sender.id,
        public_code=extra_code.public_code,
        actor_user_id=sender_admin.id,
        confirm=True,
        confirmed_display_name=transferencias_service.company_display_name(extra_receiver),
    )

    try:
        with _client(db, sender_admin) as client:
            response = client.get("/api/v1/transferencias/recipients")
    finally:
        app.dependency_overrides.clear()

    assert response.status_code == 200
    payload = response.json()
    assert payload["fixed_limit"] == 3
    assert payload["fixed_used"] == 3
    assert payload["fixed_available"] == 0
    assert payload["additional_limit"] == 3
    assert payload["additional_used"] == 1
    assert payload["additional_available"] == 2
    assert payload["additional_active"] == 1
    assert [item for item in payload["items"] if item["recipient_kind"] == "additional"][0]["expires_at"]


def test_fixed_recipients_are_limited_to_three_without_extra_pack(db):
    sender = _create_company(db, "Empresa Fijos")
    _assign_license(db, sender, "PROFESSIONAL")
    actor = _create_user(db, sender, "fixed-sender@giproy.test", rol="administrador")

    for index in range(FIXED_RECIPIENT_LIMIT):
        receiver = _create_company(db, f"Destino Fijo {index}")
        receiver_admin = _create_user(db, receiver, f"fixed-dest-{index}@giproy.test", rol="administrador")
        code = transferencias_service.ensure_admin_public_code(db, receiver_admin)
        created = transferencias_service.create_recipient_from_code(
            db,
            sender_empresa_id=sender.id,
            public_code=code.public_code,
            actor_user_id=actor.id,
            confirm=True,
            confirmed_display_name=transferencias_service.company_display_name(receiver),
        )
        assert created.recipient_kind == "fixed"

    extra_receiver = _create_company(db, "Destino Cuarto")
    extra_admin = _create_user(db, extra_receiver, "fixed-dest-extra@giproy.test", rol="administrador")
    extra_code = transferencias_service.ensure_admin_public_code(db, extra_admin)

    with pytest.raises(TransferPolicyError) as exc:
        transferencias_service.create_recipient_from_code(
            db,
            sender_empresa_id=sender.id,
            public_code=extra_code.public_code,
            actor_user_id=actor.id,
            confirm=True,
        )

    assert exc.value.code == "transfer_recipient_slots_exhausted"
    assert db.query(TransferAllowedCompanyRecipient).filter_by(empresa_id=sender.id).count() == 3


@pytest.mark.parametrize("blocked_license", ["EXPRESS", "TESTER", "ACADEMIC", "TRAINING"])
def test_blocked_licenses_are_blocked_for_recipient_resolution(db, blocked_license):
    sender = _create_company(db, f"Empresa {blocked_license}")
    receiver = _create_company(db, f"Destino {blocked_license}")
    _assign_license(db, sender, blocked_license)
    receiver_admin = _create_user(db, receiver, f"{blocked_license.lower()}-dest@giproy.test", rol="administrador")
    code = transferencias_service.ensure_admin_public_code(db, receiver_admin)

    with pytest.raises(TransferPolicyError) as exc:
        transferencias_service.resolve_recipient_company(
            db,
            sender_empresa_id=sender.id,
            public_code=code.public_code,
            actor_user_id=None,
        )

    assert exc.value.code == "transfer_license_blocked"


def test_code_attempt_guard_pauses_and_bans_by_sender_company(db):
    sender = _create_company(db, "Empresa Abuso")
    _assign_license(db, sender, "STANDARD")

    for _ in range(CODE_FAILURES_BEFORE_PAUSE):
        with pytest.raises(TransferPolicyError):
            transferencias_service.resolve_recipient_company(
                db,
                sender_empresa_id=sender.id,
                public_code="BAD - 00X",
                actor_user_id=None,
            )
        guard = db.query(TransferCodeAttemptGuard).filter_by(empresa_id=sender.id).one()
        guard.paused_until = datetime.now(timezone.utc) - timedelta(seconds=1)
        db.add(guard)
        db.flush()

    guard = db.query(TransferCodeAttemptGuard).filter_by(empresa_id=sender.id).one()
    assert guard.consecutive_failures == CODE_FAILURES_BEFORE_PAUSE
    assert db.query(TransferAuditEvent).filter_by(empresa_id=sender.id).count() >= CODE_FAILURES_BEFORE_PAUSE

    for _ in range(CODE_FAILURES_BEFORE_BAN - CODE_FAILURES_BEFORE_PAUSE):
        with pytest.raises(TransferPolicyError):
            transferencias_service.resolve_recipient_company(
                db,
                sender_empresa_id=sender.id,
                public_code="BAD - 00X",
                actor_user_id=None,
            )
        guard = db.query(TransferCodeAttemptGuard).filter_by(empresa_id=sender.id).one()
        guard.paused_until = datetime.now(timezone.utc) - timedelta(seconds=1)
        db.add(guard)
        db.flush()

    guard = db.query(TransferCodeAttemptGuard).filter_by(empresa_id=sender.id).one()
    assert guard.window_failures == CODE_FAILURES_BEFORE_BAN
    assert guard.banned_until is not None

    with pytest.raises(TransferPolicyError) as exc:
        transferencias_service.resolve_recipient_company(
            db,
            sender_empresa_id=sender.id,
            public_code="BAD - 00X",
            actor_user_id=None,
        )

    assert exc.value.code == "transfer_code_banned"
