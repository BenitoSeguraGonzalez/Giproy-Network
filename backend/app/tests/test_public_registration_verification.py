from datetime import datetime, timedelta, timezone

import pytest
from fastapi import HTTPException
from starlette.requests import Request

from app.api.endpoints import auth
from app.models.empresa import Empresa
from app.models.empresa_licencia import EmpresaLicencia
from app.models.registration_verification import RegistrationVerificationToken
from app.models.usuario import Usuario
from app.schemas.usuario import UsuarioRegister
from app.models.sri_ruc import SriRucDatasetVersion, SriRucRecord
from app.models.legal_acceptance import LegalAcceptance
from app.core.legal_documents import PRIVACY_VERSION, TERMS_VERSION


def _register_payload(email="admin@example.com", ruc="1790012345001") -> UsuarioRegister:
    return UsuarioRegister(
        email=email,
        password="SuperSecret123",
        nombre_completo="Empresa Registro",
        empresa_alias="Alias Registro",
        empresa_nombre="Empresa Registro Internacional",
        ruc=ruc,
        nombres="Admin",
        apellidos="Empresa",
        nacionalidad="Ecuatoriana",
        profesion="Administrador",
        pais="Ecuador",
        provincia="Pichincha",
        canton="Quito",
        ciudad="Quito",
        movil="+593987654321",
        acepta_politica_privacidad=True,
        acepta_politicas_comunicacion=True,
        autoriza_publicidad=False,
        acepta_terminos=True,
        terminos_version=TERMS_VERSION,
        privacidad_version=PRIVACY_VERSION,
    )


def _request() -> Request:
    return Request({"type": "http", "method": "POST", "path": "/api/v1/register", "headers": [(b"user-agent", b"pytest")], "client": ("127.0.0.1", 1234)})


def _seed_valid_ruc(db, ruc):
    version = SriRucDatasetVersion(
        province_code=ruc[:2],
        province_name="Prueba",
        source_url="https://descargas.sri.gob.ec/test.csv",
        checksum_sha256=ruc.zfill(64),
        status="active",
        is_active=True,
        row_count=1,
        accepted_count=1,
        activated_at=datetime.now(timezone.utc),
    )
    db.add(version)
    db.flush()
    db.add(SriRucRecord(version_id=version.id, ruc=ruc, business_name=f"RAZON SOCIAL {ruc}", establishment_number="001"))
    db.commit()


def test_public_register_creates_pending_company_until_email_verification(db, monkeypatch):
    sent = {}

    def fake_send_registration_verification_email(**kwargs):
        sent.update(kwargs)
        return True

    _seed_valid_ruc(db, "1790012345001")
    monkeypatch.setattr(auth, "send_registration_verification_email", fake_send_registration_verification_email)

    response = auth.register_user(request=_request(), db=db, user_in=_register_payload())

    assert response["status"] == "pending_email_verification"
    empresa = db.query(Empresa).filter(Empresa.id == response["empresa_id"]).one()
    user = db.query(Usuario).filter(Usuario.email == "admin@example.com").one()
    token = db.query(RegistrationVerificationToken).filter_by(usuario_id=user.id).one()

    assert empresa.activa is False
    assert empresa.alias == "Alias Registro"
    assert empresa.ruc == "1790012345001"
    assert empresa.email == "admin@example.com"
    assert user.activo is False
    assert empresa.nombre == "RAZON SOCIAL 1790012345001"
    assert user.ruc is None
    assert user.acepta_terminos is True
    assert user.terminos_version == TERMS_VERSION
    assert user.privacidad_version == PRIVACY_VERSION
    acceptances = db.query(LegalAcceptance).filter_by(usuario_id=user.id).all()
    assert {item.document_type for item in acceptances} == {"terms", "privacy", "communications", "advertising"}
    assert next(item for item in acceptances if item.document_type == "advertising").accepted is False
    assert all(item.request_ip_hmac != "127.0.0.1" for item in acceptances)
    assert sent["email"] == "admin@example.com"
    assert sent["empresa_nombre"] == "Alias Registro"
    assert sent["token"] == token.token
    expires_at = token.expires_at
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    assert expires_at <= datetime.now(timezone.utc) + timedelta(hours=auth.REGISTRATION_VERIFICATION_HOURS, seconds=5)

    verified = auth.verify_registration(token=token.token, db=db)
    db.refresh(empresa)
    db.refresh(user)

    assert verified["status"] == "verified"
    assert empresa.activa is True
    assert user.activo is True


def test_public_register_rejects_duplicate_admin_ruc(db, monkeypatch):
    _seed_valid_ruc(db, "1790012345002")
    monkeypatch.setattr(auth, "send_registration_verification_email", lambda **kwargs: True)
    auth.register_user(request=_request(), db=db, user_in=_register_payload(email="first@example.com", ruc="1790012345002"))

    with pytest.raises(HTTPException) as exc:
        auth.register_user(request=_request(), db=db, user_in=_register_payload(email="second@example.com", ruc="1790012345002"))

    assert exc.value.status_code == 400
    assert "RUC" not in exc.value.detail
    assert db.query(Usuario).filter(Usuario.ruc == "1790012345002").count() == 0
    assert db.query(Empresa).filter(Empresa.ruc == "1790012345002").count() == 1


def test_public_register_purges_expired_pending_registration_before_reuse(db, monkeypatch):
    _seed_valid_ruc(db, "1790012345003")
    monkeypatch.setattr(auth, "send_registration_verification_email", lambda **kwargs: True)
    auth.register_user(request=_request(), db=db, user_in=_register_payload(email="old@example.com", ruc="1790012345003"))
    token = db.query(RegistrationVerificationToken).one()
    token.expires_at = datetime.now(timezone.utc) - timedelta(minutes=1)
    db.add(token)
    db.commit()

    response = auth.register_user(request=_request(), db=db, user_in=_register_payload(email="new@example.com", ruc="1790012345003"))

    assert response["status"] == "pending_email_verification"
    assert db.query(Usuario).filter(Usuario.email == "old@example.com").count() == 0
    assert db.query(Empresa).filter(Empresa.email == "old@example.com").count() == 0
    assert db.query(Usuario).filter(Usuario.email == "new@example.com").count() == 1
    assert db.query(Empresa).filter(Empresa.ruc == "1790012345003").count() == 1
    assert db.query(EmpresaLicencia).count() == 1


def test_public_register_spain_skips_sri_and_uses_declared_company_name(db, monkeypatch):
    sent = {}
    lookup_calls = []
    monkeypatch.setattr(auth, "lookup_ruc", lambda *args, **kwargs: lookup_calls.append((args, kwargs)))
    monkeypatch.setattr(auth, "send_registration_verification_email", lambda **kwargs: sent.update(kwargs) or True)
    payload = _register_payload(email="admin.es@example.com", ruc="B12345678")
    payload.pais = "España"
    payload.empresa_nombre = "Construcciones España SL"
    payload.empresa_alias = "Construcciones ES"
    payload.provincia = "Madrid"
    payload.canton = "Madrid"
    payload.ciudad = "Madrid"
    payload.movil = "+34612345678"

    response = auth.register_user(request=_request(), db=db, user_in=payload)

    empresa = db.query(Empresa).filter(Empresa.id == response["empresa_id"]).one()
    assert response["status"] == "pending_email_verification"
    assert lookup_calls == []
    assert empresa.nombre == "Construcciones España SL"
    assert empresa.ruc == "B12345678"
    assert empresa.pais == "España"
    assert empresa.provincia == "Madrid"
    assert empresa.localidad == "Madrid"
    assert empresa.fiscal_source == "self_declared"
    assert empresa.fiscal_verified_at is None
    assert empresa.contacto_nombre == "Empresa Registro"
    assert sent["empresa_nombre"] == "Construcciones ES"


def test_public_register_spain_requires_declared_company_name(db, monkeypatch):
    monkeypatch.setattr(auth, "lookup_ruc", lambda *args, **kwargs: pytest.fail("España no debe consultar SRI"))
    payload = _register_payload(email="missing-name@example.com", ruc="Y1234567X")
    payload.pais = "España"
    payload.empresa_nombre = ""

    with pytest.raises(HTTPException) as exc:
        auth.register_user(request=_request(), db=db, user_in=payload)

    assert exc.value.status_code == 400
    assert "razón social" in exc.value.detail.lower()
