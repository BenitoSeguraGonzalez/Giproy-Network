from app.models.usuario import Usuario
from app.schemas.empresa import EmpresaCreate
from app.services.empresa import empresa_service


def _superadmin(db, sample_empresa):
    user = Usuario(
        email="company-creator@example.com",
        hashed_password="not-used",
        nombre_completo="Company Creator",
        rol="superadministrador",
        empresa_id=sample_empresa.id,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def test_admin_create_spain_company_skips_sri_and_keeps_declared_name(db, sample_empresa, monkeypatch):
    import app.services.sri_ruc as sri_ruc

    monkeypatch.setattr(sri_ruc, "lookup_ruc", lambda *args, **kwargs: (_ for _ in ()).throw(AssertionError("España no debe consultar SRI")))
    company = empresa_service.create_empresa(
        db,
        EmpresaCreate(nombre="Ingeniería Madrid SL", ruc="b87654321", pais="España"),
        _superadmin(db, sample_empresa),
    )

    assert company.nombre == "Ingeniería Madrid SL"
    assert company.ruc == "B87654321"
    assert company.pais == "España"
    assert company.fiscal_source == "self_declared"
    assert company.fiscal_verified_at is None
