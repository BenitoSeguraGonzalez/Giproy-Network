from datetime import datetime, timedelta, timezone

import pytest
from fastapi import HTTPException

from app.api.endpoints import auth
from app.models.empresa import Empresa
from app.models.empresa_licencia import EmpresaLicencia
from app.models.registration_verification import RegistrationVerificationToken
from app.models.usuario import Usuario
from app.schemas.usuario import UsuarioRegister
from app.models.sri_ruc import SriRucDatasetVersion, SriRucRecord


def _register_payload(email="admin@example.com", ruc="1790012345001") -> UsuarioRegister:
    return UsuarioRegister(
        email=email,
        password="SuperSecret123",
        nombre_completo="Empresa Registro",
        empresa_alias="Alias Registro",
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
    )


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

    response = auth.register_user(db=db, user_in=_register_payload())

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
    auth.register_user(db=db, user_in=_register_payload(email="first@example.com", ruc="1790012345002"))

    with pytest.raises(HTTPException) as exc:
        auth.register_user(db=db, user_in=_register_payload(email="second@example.com", ruc="1790012345002"))

    assert exc.value.status_code == 400
    assert "RUC" not in exc.value.detail
    assert db.query(Usuario).filter(Usuario.ruc == "1790012345002").count() == 0
    assert db.query(Empresa).filter(Empresa.ruc == "1790012345002").count() == 1


def test_public_register_purges_expired_pending_registration_before_reuse(db, monkeypatch):
    _seed_valid_ruc(db, "1790012345003")
    monkeypatch.setattr(auth, "send_registration_verification_email", lambda **kwargs: True)
    auth.register_user(db=db, user_in=_register_payload(email="old@example.com", ruc="1790012345003"))
    token = db.query(RegistrationVerificationToken).one()
    token.expires_at = datetime.now(timezone.utc) - timedelta(minutes=1)
    db.add(token)
    db.commit()

    response = auth.register_user(db=db, user_in=_register_payload(email="new@example.com", ruc="1790012345003"))

    assert response["status"] == "pending_email_verification"
    assert db.query(Usuario).filter(Usuario.email == "old@example.com").count() == 0
    assert db.query(Empresa).filter(Empresa.email == "old@example.com").count() == 0
    assert db.query(Usuario).filter(Usuario.email == "new@example.com").count() == 1
    assert db.query(Empresa).filter(Empresa.ruc == "1790012345003").count() == 1
    assert db.query(EmpresaLicencia).count() == 1
