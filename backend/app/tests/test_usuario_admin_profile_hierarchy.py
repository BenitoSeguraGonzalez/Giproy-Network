import pytest
from datetime import date, timedelta
from fastapi import HTTPException

from app.models.empresa_licencia import EmpresaLicencia
from app.models.empresa_uso import EmpresaUso
from app.models.licencia import Licencia
from app.models.usuario import Usuario
from app.schemas.usuario import UsuarioCreate, UsuarioResponse, UsuarioUpdate
from app.services.marketplace_profile import (
    evaluate_marketplace_profile,
    seed_admin_marketplace_profile_from_company,
)
from app.services.usuario import usuario_service


def _add_usage(db, empresa_id: int, max_usuarios: int = 10) -> None:
    db.add(
        EmpresaUso(
            empresa_id=empresa_id,
            usuarios_count=0,
            proyectos_count=0,
            almacenamiento_bytes=0,
            max_usuarios=max_usuarios,
            max_proyectos=10,
            max_almacenamiento_bytes=1024 * 1024 * 1024,
        )
    )
    db.commit()


def _assign_license(db, empresa_id: int, limites: dict) -> None:
    licencia = Licencia(
        nombre=f"Plan Test {empresa_id}",
        codigo=f"TEST-{empresa_id}",
        limites=limites,
        activo=True,
    )
    db.add(licencia)
    db.flush()
    db.add(
        EmpresaLicencia(
            empresa_id=empresa_id,
            licencia_id=licencia.id,
            starts_at=date.today() - timedelta(days=1),
            ends_at=date.today() + timedelta(days=30),
            status="active",
            activa=True,
        )
    )
    db.commit()


def _user(db, empresa_id: int, email: str, rol: str) -> Usuario:
    user = Usuario(
        email=email,
        hashed_password="hash",
        nombre_completo=email.split("@")[0],
        rol=rol,
        empresa_id=empresa_id,
        activo=True,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def test_seed_admin_marketplace_profile_uses_company_location(db, sample_empresa):
    sample_empresa.nombre = "Santiago Bermeo"
    sample_empresa.ruc = "0102964756001"
    sample_empresa.telefono = "+593984487622"
    sample_empresa.email = "santibq81@msn.com"
    sample_empresa.pais = "Ecuador"
    sample_empresa.provincia = "Azuay"
    sample_empresa.canton = "Cuenca"
    sample_empresa.localidad = "Cuenca"
    admin = Usuario(
        email="santibq81@msn.com",
        hashed_password="hash",
        nombre_completo="Santiago Bermeo",
        rol="administrador",
        empresa_id=sample_empresa.id,
        activo=True,
        ruc="0102964756001",
        nombres="Santiago",
        apellidos="Bermeo",
        alias="Santiago Bermeo",
        nacionalidad="Ecuatoriana",
        profesion="Ingeniero",
        ciudad="Cuenca",
        provincia="Azuay",
        pais="Ecuador",
        movil="+593984487622",
        acepta_politica_privacidad=True,
    )
    db.add(admin)
    db.commit()
    db.refresh(admin)

    assert evaluate_marketplace_profile(admin)["missing_fields"] == ["canton"]

    seed_admin_marketplace_profile_from_company(db, admin)

    assert admin.canton == "Cuenca"
    assert evaluate_marketplace_profile(admin)["complete"] is True


def test_administrator_can_create_equal_role_inside_own_company(db, sample_empresa):
    sample_empresa.limite_administradores = 2
    db.add(sample_empresa)
    db.commit()
    _assign_license(db, sample_empresa.id, {"administradores": 2, "usuarios_normales": 10, "usuarios": 12})
    _add_usage(db, sample_empresa.id)
    admin = _user(db, sample_empresa.id, "admin@example.com", "administrador")

    created = usuario_service.create_usuario(
        db=db,
        current_user=admin,
        user_in=UsuarioCreate(
            email="admin2@example.com",
            password="secret123",
            nombre_completo="Admin Dos",
            rol="administrador",
            empresa_id=sample_empresa.id,
        ),
    )

    assert created.rol == "administrador"
    assert created.empresa_id == sample_empresa.id


def test_license_blocks_second_administrator_when_plan_allows_only_one(db, sample_empresa):
    sample_empresa.limite_administradores = 1
    db.add(sample_empresa)
    db.commit()
    _assign_license(db, sample_empresa.id, {"administradores": 1, "usuarios_normales": 10, "usuarios": 11})
    _add_usage(db, sample_empresa.id)
    admin = _user(db, sample_empresa.id, "admin@example.com", "administrador")

    with pytest.raises(HTTPException) as exc:
        usuario_service.create_usuario(
            db=db,
            current_user=admin,
            user_in=UsuarioCreate(
                email="admin2@example.com",
                password="secret123",
                nombre_completo="Admin Dos",
                rol="administrador",
                empresa_id=sample_empresa.id,
            ),
        )

    assert exc.value.status_code == 400
    assert "cuota de administradores" in exc.value.detail


def test_standard_user_cannot_update_administrator(db, sample_empresa):
    _add_usage(db, sample_empresa.id)
    admin = _user(db, sample_empresa.id, "admin@example.com", "administrador")
    standard = _user(db, sample_empresa.id, "user@example.com", "usuario")

    with pytest.raises(HTTPException) as exc:
        usuario_service.update_usuario(
            db=db,
            current_user=standard,
            user_id=admin.id,
            user_in=UsuarioUpdate(nombre_completo="Intento indebido"),
        )

    assert exc.value.status_code == 403


def test_administrator_can_update_own_profile_but_not_remove_last_admin(db, sample_empresa):
    _assign_license(db, sample_empresa.id, {"administradores": 1, "usuarios_normales": 10, "usuarios": 11})
    _add_usage(db, sample_empresa.id)
    admin = _user(db, sample_empresa.id, "admin@example.com", "administrador")

    updated = usuario_service.update_usuario(
        db=db,
        current_user=admin,
        user_id=admin.id,
        user_in=UsuarioUpdate(alias="Admin operativo"),
    )

    assert updated.alias == "Admin operativo"

    with pytest.raises(HTTPException) as exc:
        usuario_service.update_usuario(
            db=db,
            current_user=admin,
            user_id=admin.id,
            user_in=UsuarioUpdate(rol="usuario"),
        )

    assert exc.value.status_code == 400
    assert "último administrador" in exc.value.detail


def test_user_listing_scopes_admin_and_superadmin(db, sample_empresa):
    other_empresa = type(sample_empresa)(
        nombre="Empresa Ajena",
        ruc="9999999990001",
        proy_prefijo="OTR",
        proy_periodo="2026",
        proy_secuencial=1,
        proy_secuencial_size=3,
    )
    db.add(other_empresa)
    db.commit()
    db.refresh(other_empresa)

    admin = _user(db, sample_empresa.id, "admin@example.com", "administrador")
    standard = _user(db, sample_empresa.id, "user@example.com", "usuario")
    superadmin = _user(db, other_empresa.id, "root@example.com", "Superadministrador")
    outsider = _user(db, other_empresa.id, "outsider@example.com", "usuario")

    admin_users = usuario_service.get_users(db, current_user=admin)
    assert {item.id for item in admin_users} == {admin.id, standard.id}

    scoped_users = usuario_service.get_users(db, current_user=superadmin, target_empresa_id=sample_empresa.id)
    assert {item.id for item in scoped_users} == {admin.id, standard.id}
    assert outsider.id not in {item.id for item in scoped_users}


def test_update_user_rejects_duplicate_email_inside_company(db, sample_empresa):
    _add_usage(db, sample_empresa.id)
    admin = _user(db, sample_empresa.id, "admin@example.com", "administrador")
    first = _user(db, sample_empresa.id, "first@example.com", "usuario")
    second = _user(db, sample_empresa.id, "second@example.com", "usuario")

    with pytest.raises(HTTPException) as exc:
        usuario_service.update_usuario(
            db=db,
            current_user=admin,
            user_id=second.id,
            user_in=UsuarioUpdate(email=first.email),
        )

    assert exc.value.status_code == 400
    assert "ya está registrado" in exc.value.detail


def test_superadmin_can_delete_community_user_in_target_company(db, sample_empresa):
    _add_usage(db, sample_empresa.id)
    superadmin = _user(db, sample_empresa.id, "root@example.com", "Superadministrador")
    community = _user(db, sample_empresa.id, "community@example.com", "usuario_comunidad")

    deleted = usuario_service.delete_usuario(
        db=db,
        current_user=superadmin,
        user_id=community.id,
        target_empresa_id=sample_empresa.id,
    )

    assert deleted.id == community.id
    assert db.query(Usuario).filter(Usuario.id == community.id).first() is None


def test_usuario_response_tolerates_null_marketplace_permissions(db, sample_empresa):
    user = _user(db, sample_empresa.id, "legacy@example.com", "usuario")
    user.marketplace_permissions = None
    db.add(user)
    db.commit()
    db.refresh(user)

    response = UsuarioResponse.model_validate(user)

    assert response.marketplace_permissions == []
