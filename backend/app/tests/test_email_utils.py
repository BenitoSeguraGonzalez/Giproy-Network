from app.utils import email_utils


class FakeSMTP:
    calls = []

    def __init__(self, host, port, timeout=None):
        self.host = host
        self.port = port
        self.timeout = timeout
        FakeSMTP.calls.append(("connect", host, port, timeout))

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc, tb):
        FakeSMTP.calls.append(("close",))

    def starttls(self):
        FakeSMTP.calls.append(("starttls",))

    def login(self, username, password):
        FakeSMTP.calls.append(("login", username, password))

    def send_message(self, message):
        FakeSMTP.calls.append(("send_message", message["To"], message["Subject"], message.get_content()))


def test_send_transactional_email_uses_smtp_tls_login_and_message(monkeypatch):
    FakeSMTP.calls = []
    monkeypatch.setattr(email_utils.smtplib, "SMTP", FakeSMTP)
    monkeypatch.setattr(
        email_utils,
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

    result = email_utils.send_transactional_email(
        to_email="destino@example.com",
        subject="Prueba",
        body="Contenido",
    )

    assert result["success"] is True
    assert result["backend"] == "smtp"
    assert ("connect", "smtp.gmail.com", 587, 20) in FakeSMTP.calls
    assert ("starttls",) in FakeSMTP.calls
    assert ("login", "corporativo@gmail.com", "app-password") in FakeSMTP.calls
    assert any(call[0] == "send_message" and call[1] == "destino@example.com" for call in FakeSMTP.calls)


def test_registration_verification_email_requires_real_smtp_backend(monkeypatch):
    sent = {}

    monkeypatch.setattr(
        email_utils,
        "get_effective_email_config",
        lambda: {
            "EMAIL_BACKEND": "mock",
            "FRONTEND_PUBLIC_URL": "https://public.example.com",
        },
    )

    def fake_send_transactional_email(**kwargs):
        sent.update(kwargs)
        return {"success": True, "backend": "mock"}

    monkeypatch.setattr(email_utils, "send_transactional_email", fake_send_transactional_email)

    delivered = email_utils.send_registration_verification_email(
        email="admin@example.com",
        token="abc123",
        empresa_nombre="Alias Empresa",
        valid_hours=5,
    )

    assert delivered is False
    assert "https://public.example.com/verify-registration?token=abc123" in sent["body"]
    assert "Alias Empresa" in sent["body"]


def test_registration_verification_email_accepts_smtp_backend(monkeypatch):
    monkeypatch.setattr(
        email_utils,
        "get_effective_email_config",
        lambda: {
            "EMAIL_BACKEND": "smtp",
            "FRONTEND_PUBLIC_URL": "https://public.example.com/",
        },
    )
    monkeypatch.setattr(
        email_utils,
        "send_transactional_email",
        lambda **kwargs: {"success": True, "backend": "smtp"},
    )

    delivered = email_utils.send_registration_verification_email(
        email="admin@example.com",
        token="abc123",
        empresa_nombre="Empresa",
    )

    assert delivered is True
