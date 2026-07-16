from fastapi import HTTPException
import smtplib
from fastapi.testclient import TestClient

from app.api.deps import get_current_active_user
from app.api.endpoints import admin_config
from app.core.database import get_db
from app.main import app
from app.models.empresa import Empresa
from app.models.system_config import SystemConfig
from app.models.usuario import Usuario


def _superadmin(db):
    empresa = Empresa(
        nombre="SaaS Admin",
        ruc="9999999990001",
        proy_prefijo="SAAS",
        proy_periodo="2026",
        proy_secuencial=1,
        proy_secuencial_size=3,
    )
    db.add(empresa)
    db.commit()
    db.refresh(empresa)

    user = Usuario(
        email="root@example.com",
        hashed_password="x",
        nombre_completo="Root",
        rol="superadministrador",
        empresa_id=empresa.id,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def test_email_settings_are_persisted_mask_secret_and_preserve_empty_password(db, monkeypatch):
    current_user = _superadmin(db)
    monkeypatch.setattr(
        admin_config,
        "get_effective_email_config",
        lambda: {
            "EMAIL_BACKEND": "mock",
            "EMAIL_FROM_EMAIL": "noreply@example.com",
            "EMAIL_FROM_NAME": "GiProy",
            "FRONTEND_PUBLIC_URL": "https://giproy-network.excompc.dpdns.org",
            "SMTP_HOST": "",
            "SMTP_PORT": 587,
            "SMTP_USERNAME": "",
            "SMTP_PASSWORD": "",
            "SMTP_USE_TLS": True,
            "SMTP_USE_SSL": False,
        },
    )

    payload = admin_config.update_email_settings(
        body={
            "values": {
                "EMAIL_BACKEND": "smtp",
                "EMAIL_FROM_EMAIL": "corporativo@example.com",
                "FRONTEND_PUBLIC_URL": "https://giproy-network.excompc.dpdns.org",
                "SMTP_HOST": "smtp.gmail.com",
                "SMTP_PORT": "587",
                "SMTP_USERNAME": "corporativo@gmail.com",
                "SMTP_PASSWORD": "abcd efgh ijkl mnop",
                "SMTP_USE_TLS": "true",
                "SMTP_USE_SSL": "false",
                "GMAIL_2SV_CONFIRMED": "true",
                "GMAIL_APP_PASSWORD_CONFIRMED": "true",
                "IGNORED_KEY": "ignored",
            }
        },
        db=db,
        current_user=current_user,
    )

    assert payload["SMTP_PASSWORD"]["configured"] is True
    assert payload["SMTP_PASSWORD"]["valor"] == "ab****op"
    assert db.query(SystemConfig).filter_by(clave="IGNORED_KEY").count() == 0
    assert db.query(SystemConfig).filter_by(clave="SMTP_HOST").one().valor == "smtp.gmail.com"
    assert db.query(SystemConfig).filter_by(clave="SMTP_PASSWORD").one().valor == "abcdefghijklmnop"
    assert db.query(SystemConfig).filter_by(clave="GMAIL_2SV_CONFIRMED").one().valor == "true"
    assert db.query(SystemConfig).filter_by(clave="GMAIL_APP_PASSWORD_CONFIRMED").one().valor == "true"

    admin_config.update_email_settings(
        body={"values": {"SMTP_PASSWORD": "", "SMTP_HOST": "mail.example.com"}},
        db=db,
        current_user=current_user,
    )

    assert db.query(SystemConfig).filter_by(clave="SMTP_PASSWORD").one().valor == "abcdefghijklmnop"
    assert db.query(SystemConfig).filter_by(clave="SMTP_HOST").one().valor == "mail.example.com"


def test_email_settings_require_superadmin(db):
    user = _superadmin(db)
    user.rol = "administrador"

    try:
        admin_config.get_email_settings(db=db, current_user=user)
    except HTTPException as exc:
        assert exc.status_code == 403
    else:
        raise AssertionError("Expected HTTPException for non-superadmin user")


def test_email_settings_test_endpoint_uses_effective_smtp_config(db, monkeypatch):
    current_user = _superadmin(db)
    sent = {}

    monkeypatch.setattr(
        admin_config,
        "get_effective_email_config",
        lambda: {
            "EMAIL_BACKEND": "smtp",
            "SMTP_HOST": "smtp.gmail.com",
        },
    )

    def fake_send_transactional_email(**kwargs):
        sent.update(kwargs)
        return {"success": True, "backend": "smtp"}

    monkeypatch.setattr(admin_config, "send_transactional_email", fake_send_transactional_email)

    result = admin_config.test_email_settings(
        body={"to_email": "qa@example.com"},
        db=db,
        current_user=current_user,
    )

    assert result == {"success": True, "backend": "smtp", "to_email": "qa@example.com"}
    assert sent["to_email"] == "qa@example.com"
    assert "Prueba de email corporativo" in sent["subject"]


def test_email_settings_test_endpoint_rejects_mock_backend(db, monkeypatch):
    current_user = _superadmin(db)
    monkeypatch.setattr(
        admin_config,
        "get_effective_email_config",
        lambda: {
            "EMAIL_BACKEND": "mock",
            "SMTP_HOST": "",
        },
    )

    try:
        admin_config.test_email_settings(body={"to_email": "qa@example.com"}, db=db, current_user=current_user)
    except HTTPException as exc:
        assert exc.status_code == 400
        assert "smtp" in exc.detail
    else:
        raise AssertionError("Expected HTTPException for mock backend")


def test_email_settings_test_endpoint_translates_gmail_bad_credentials(db, monkeypatch):
    current_user = _superadmin(db)
    monkeypatch.setattr(
        admin_config,
        "get_effective_email_config",
        lambda: {
            "EMAIL_BACKEND": "smtp",
            "EMAIL_FROM_EMAIL": "excomconsultores@gmail.com",
            "SMTP_HOST": "smtp.gmail.com",
            "SMTP_USERNAME": "excomconsultores@gmail.com",
        },
    )

    def fake_send_transactional_email(**kwargs):
        raise smtplib.SMTPAuthenticationError(
            535,
            b"5.7.8 Username and Password not accepted",
        )

    monkeypatch.setattr(admin_config, "send_transactional_email", fake_send_transactional_email)

    try:
        admin_config.test_email_settings(body={"to_email": "qa@example.com"}, db=db, current_user=current_user)
    except HTTPException as exc:
        assert exc.status_code == 400
        assert "Gmail" in exc.detail
        assert "contrasena de aplicacion" in exc.detail
        assert "contrasena normal" in exc.detail
        assert "535" not in exc.detail
    else:
        raise AssertionError("Expected HTTPException for Gmail bad credentials")


def test_email_settings_http_flow_persists_masks_and_tests_smtp(db, monkeypatch):
    current_user = _superadmin(db)
    sent = {}

    app.dependency_overrides[get_db] = lambda: db
    app.dependency_overrides[get_current_active_user] = lambda: current_user
    monkeypatch.setattr(
        admin_config,
        "get_effective_email_config",
        lambda: {
            "EMAIL_BACKEND": "smtp",
            "EMAIL_FROM_EMAIL": "corporativo@example.com",
            "EMAIL_FROM_NAME": "GiProy",
            "FRONTEND_PUBLIC_URL": "https://giproy-network.excompc.dpdns.org",
            "SMTP_HOST": "smtp.gmail.com",
            "SMTP_PORT": 587,
            "SMTP_USERNAME": "corporativo@gmail.com",
            "SMTP_PASSWORD": "app-password",
            "SMTP_USE_TLS": True,
            "SMTP_USE_SSL": False,
        },
    )

    def fake_send_transactional_email(**kwargs):
        sent.update(kwargs)
        return {"success": True, "backend": "smtp"}

    monkeypatch.setattr(admin_config, "send_transactional_email", fake_send_transactional_email)

    try:
        with TestClient(app) as client:
            update_response = client.put(
                "/api/v1/admin-config/email-settings",
                json={
                    "values": {
                        "EMAIL_BACKEND": "smtp",
                        "EMAIL_FROM_EMAIL": "corporativo@example.com",
                        "EMAIL_FROM_NAME": "GiProy",
                        "FRONTEND_PUBLIC_URL": "https://giproy-network.excompc.dpdns.org",
                        "SMTP_HOST": "smtp.gmail.com",
                        "SMTP_PORT": "587",
                        "SMTP_USERNAME": "corporativo@gmail.com",
                        "SMTP_PASSWORD": "app-password",
                        "SMTP_USE_TLS": "true",
                        "SMTP_USE_SSL": "false",
                    }
                },
            )
            assert update_response.status_code == 200
            payload = update_response.json()
            assert payload["SMTP_PASSWORD"]["configured"] is True
            assert payload["SMTP_PASSWORD"]["valor"] == "ap****rd"
            assert payload["SMTP_HOST"]["valor"] == "smtp.gmail.com"
            assert payload["FRONTEND_PUBLIC_URL"]["valor"] == "https://giproy-network.excompc.dpdns.org"

            get_response = client.get("/api/v1/admin-config/email-settings")
            assert get_response.status_code == 200
            assert get_response.json()["SMTP_USERNAME"]["valor"] == "corporativo@gmail.com"

            test_response = client.post(
                "/api/v1/admin-config/email-settings/test",
                json={"to_email": "qa@example.com"},
            )
            assert test_response.status_code == 200
            assert test_response.json() == {
                "success": True,
                "backend": "smtp",
                "to_email": "qa@example.com",
            }
            assert sent["to_email"] == "qa@example.com"
    finally:
        app.dependency_overrides.clear()


def test_email_settings_http_flow_blocks_non_superadmin(db):
    current_user = _superadmin(db)
    current_user.rol = "administrador"

    app.dependency_overrides[get_db] = lambda: db
    app.dependency_overrides[get_current_active_user] = lambda: current_user
    try:
        with TestClient(app) as client:
            response = client.get("/api/v1/admin-config/email-settings")
            assert response.status_code == 403
    finally:
        app.dependency_overrides.clear()
