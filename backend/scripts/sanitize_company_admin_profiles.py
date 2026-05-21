from __future__ import annotations

import argparse
import json
import secrets
from datetime import datetime, timezone
from pathlib import Path

from sqlalchemy import func
from sqlalchemy.orm import joinedload

from app.core.database import SessionLocal
from app.core.security import get_password_hash
from app.models.empresa import Empresa
from app.models.usuario import Usuario
from app.services.license import license_service
from app.services.marketplace_profile import evaluate_marketplace_profile


REPORT_DIR = Path(__file__).resolve().parents[2] / "tmp"


def _text(value) -> str | None:
    if value is None:
        return None
    value = str(value).strip()
    return value or None


def _split_name(value: str | None) -> tuple[str, str]:
    clean = _text(value) or "Administrador Empresa"
    parts = clean.split()
    if len(parts) == 1:
        return parts[0], "Administrador"
    return " ".join(parts[:-1]), parts[-1]


def _company_contact_name(empresa: Empresa) -> str:
    return (
        _text(getattr(empresa, "contacto_nombre", None))
        or _text(getattr(empresa, "nombre", None))
        or f"Empresa {empresa.id}"
    )


def _company_email(db, empresa: Empresa) -> str:
    candidates = [
        _text(getattr(empresa, "contacto_email", None)),
        _text(getattr(empresa, "email", None)),
    ]
    for candidate in candidates:
        if not candidate or "@" not in candidate:
            continue
        existing_admin_elsewhere = (
            db.query(Usuario)
            .filter(
                func.lower(Usuario.email) == candidate.lower(),
                Usuario.empresa_id != empresa.id,
                func.lower(Usuario.rol) == "administrador",
            )
            .first()
        )
        if not existing_admin_elsewhere:
            return candidate
    return f"admin.empresa{empresa.id}@giproy.local"


def _can_promote_to_admin(db, user: Usuario) -> bool:
    return not (
        db.query(Usuario)
        .filter(
            func.lower(Usuario.email) == user.email.lower(),
            Usuario.empresa_id != user.empresa_id,
            func.lower(Usuario.rol) == "administrador",
        )
        .first()
    )


def _profile_patch(admin: Usuario, empresa: Empresa) -> dict:
    contact_name = _company_contact_name(empresa)
    nombres, apellidos = _split_name(_text(admin.nombre_completo) or contact_name)
    pais = _text(admin.pais) or _text(empresa.pais) or "Ecuador"
    provincia = _text(admin.provincia) or _text(empresa.provincia) or "No especificada"
    canton = _text(admin.canton) or _text(empresa.canton) or _text(empresa.localidad)
    ciudad = _text(admin.ciudad) or _text(empresa.localidad) or canton or provincia
    movil = _text(admin.movil) or _text(empresa.contacto_telefono) or _text(empresa.telefono) or "0000000000"

    patch = {
        "nombre_completo": _text(admin.nombre_completo) or contact_name,
        "ruc": _text(admin.ruc) or _text(empresa.ruc) or f"SIN-RUC-{empresa.id}",
        "nombres": _text(admin.nombres) or nombres,
        "apellidos": _text(admin.apellidos) or apellidos,
        "alias": _text(admin.alias) or _text(empresa.nombre) or contact_name,
        "nacionalidad": _text(admin.nacionalidad) or ("Ecuatoriana" if pais.lower() == "ecuador" else pais),
        "profesion": _text(admin.profesion) or "Administrador de empresa",
        "ciudad": ciudad or "No especificada",
        "provincia": provincia,
        "pais": pais,
        "movil": movil,
        "acepta_politica_privacidad": bool(admin.acepta_politica_privacidad) or True,
    }
    if pais.lower() == "ecuador":
        patch["canton"] = canton or "No especificado"
    elif canton:
        patch["canton"] = canton
    return {key: value for key, value in patch.items() if getattr(admin, key, None) != value}


def _serialize_user(user: Usuario | None) -> dict | None:
    if not user:
        return None
    return {
        "id": user.id,
        "email": user.email,
        "rol": user.rol,
        "activo": user.activo,
        "empresa_id": user.empresa_id,
        "nombre_completo": user.nombre_completo,
        "ruc": user.ruc,
        "nombres": user.nombres,
        "apellidos": user.apellidos,
        "alias": user.alias,
        "nacionalidad": user.nacionalidad,
        "profesion": user.profesion,
        "ciudad": user.ciudad,
        "provincia": user.provincia,
        "canton": user.canton,
        "pais": user.pais,
        "movil": user.movil,
        "acepta_politica_privacidad": user.acepta_politica_privacidad,
    }


def _serialize_empresa(empresa: Empresa) -> dict:
    return {
        "id": empresa.id,
        "nombre": empresa.nombre,
        "activa": empresa.activa,
        "ruc": empresa.ruc,
        "email": empresa.email,
        "contacto_email": empresa.contacto_email,
        "telefono": empresa.telefono,
        "contacto_telefono": empresa.contacto_telefono,
        "localidad": empresa.localidad,
        "canton": empresa.canton,
        "provincia": empresa.provincia,
        "pais": empresa.pais,
        "limite_administradores": empresa.limite_administradores,
        "limite_usuarios": empresa.limite_usuarios,
    }


def sanitize(apply: bool) -> dict:
    db = SessionLocal()
    now = datetime.now(timezone.utc)
    report = {
        "generated_at": now.isoformat(),
        "apply": apply,
        "companies_total": 0,
        "companies_changed": 0,
        "created_admins": [],
        "promoted_admins": [],
        "completed_admins": [],
        "already_complete": [],
        "backup": [],
    }
    try:
        empresas = (
            db.query(Empresa)
            .options(joinedload(Empresa.usuarios))
            .order_by(Empresa.id.asc())
            .all()
        )
        report["companies_total"] = len(empresas)
        for empresa in empresas:
            users = sorted(list(empresa.usuarios or []), key=lambda item: item.id or 0)
            admins = [u for u in users if (u.rol or "").strip().lower() == "administrador"]
            report["backup"].append({
                "empresa": _serialize_empresa(empresa),
                "usuarios": [_serialize_user(user) for user in users],
            })

            action = None
            admin = admins[0] if admins else None
            temporary_password = None
            if admin is None:
                candidate = next(
                    (
                        u
                        for u in users
                        if (u.rol or "").strip().lower() != "superadministrador"
                        and _can_promote_to_admin(db, u)
                    ),
                    None,
                )
                if candidate is not None:
                    admin = candidate
                    action = "promoted"
                    if apply:
                        admin.rol = "administrador"
                        admin.activo = True
                else:
                    action = "created"
                    temporary_password = secrets.token_urlsafe(18)
                    admin = Usuario(
                        email=_company_email(db, empresa),
                        hashed_password=get_password_hash(temporary_password),
                        nombre_completo=_company_contact_name(empresa),
                        rol="administrador",
                        empresa_id=empresa.id,
                        activo=True,
                    )
                    if apply:
                        db.add(admin)
                        db.flush()

            if empresa.limite_administradores is not None and empresa.limite_administradores < 1:
                if apply:
                    empresa.limite_administradores = 1

            patch = _profile_patch(admin, empresa)
            if patch and apply:
                for field, value in patch.items():
                    setattr(admin, field, value)
                if patch.get("acepta_politica_privacidad"):
                    admin.fecha_aceptacion_politica_privacidad = (
                        admin.fecha_aceptacion_politica_privacidad or now
                    )
                admin.activo = True
                db.add(admin)
                db.add(empresa)

            if apply:
                db.flush()
                license_service.update_usage_metrics(db, empresa.id)
                db.refresh(admin)

            if not apply and patch:
                original_values = {field: getattr(admin, field, None) for field in patch}
                for field, value in patch.items():
                    setattr(admin, field, value)
                status = evaluate_marketplace_profile(admin)
                for field, value in original_values.items():
                    setattr(admin, field, value)
            else:
                status = evaluate_marketplace_profile(admin)

            result = {
                "empresa_id": empresa.id,
                "empresa_nombre": empresa.nombre,
                "admin_id": admin.id,
                "admin_email": admin.email,
                "action": action or ("completed" if patch else "already_complete"),
                "patch_fields": sorted(patch.keys()),
                "profile_complete_after": status["complete"],
                "missing_after": status["missing_fields"],
            }
            if temporary_password:
                result["temporary_password"] = temporary_password

            if action == "created":
                report["created_admins"].append(result)
            elif action == "promoted":
                report["promoted_admins"].append(result)
            elif patch:
                report["completed_admins"].append(result)
            else:
                report["already_complete"].append(result)

        if apply:
            db.commit()
        else:
            db.rollback()
        report["companies_changed"] = (
            len(report["created_admins"]) + len(report["promoted_admins"]) + len(report["completed_admins"])
        )
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()
    return report


def main() -> None:
    parser = argparse.ArgumentParser(description="Sanea administradores de empresa para Marketplace/Adicionales.")
    parser.add_argument("--apply", action="store_true", help="Aplica cambios. Sin este flag solo audita.")
    args = parser.parse_args()

    REPORT_DIR.mkdir(parents=True, exist_ok=True)
    report = sanitize(apply=args.apply)
    suffix = "apply" if args.apply else "dry_run"
    stamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    report_path = REPORT_DIR / f"company_admin_sanitize_{suffix}_{stamp}.json"
    report_path.write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")
    print(json.dumps({
        "report": str(report_path),
        "apply": args.apply,
        "companies_total": report["companies_total"],
        "companies_changed": report["companies_changed"],
        "created_admins": len(report["created_admins"]),
        "promoted_admins": len(report["promoted_admins"]),
        "completed_admins": len(report["completed_admins"]),
        "already_complete": len(report["already_complete"]),
    }, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
