import os
import sys
from datetime import datetime, timezone

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import func
from sqlalchemy.orm import Session

from app.core.database import SessionLocal
from app.models.empresa import Empresa
from app.models.empresa_licencia import EmpresaLicencia
from app.models.licencia import Licencia
from app.models.license_event import LicenseEvent
from app.services.license import DEFAULT_LICENSE_CATALOG, license_service


APPROVED_SPECIAL_LICENSES = [
    {
        "nombre": "Tester",
        "codigo": "TESTER",
        "legacy_codes": ["COMMUNITY_TESTER"],
        "plan_kind": "tester",
        "descripcion": "Licencia especial de feedback con canal directo y acceso controlado.",
        "precio_mensual": None,
        "precio_anual": None,
        "sort_order": 30,
        "limites": {
            "usuarios": 5,
            "proyectos": -1,
            "almacenamiento_gb": 0.2,
            "modulos_permitidos": ["*"],
            "is_tester": True,
            "is_commercial": False,
            "direct_feedback_channel": True,
        },
    },
    {
        "nombre": "Académica",
        "codigo": "ACADEMIC",
        "legacy_codes": ["CAMPUS_ACADEMIC"],
        "plan_kind": "academic",
        "descripcion": "Licencia especial para educación con restricciones comerciales.",
        "precio_mensual": None,
        "precio_anual": None,
        "sort_order": 40,
        "limites": {
            "usuarios": 50,
            "proyectos": 5,
            "almacenamiento_gb": 0.1,
            "modulos_permitidos": ["apus", "presupuestos", "cronogramas", "polinomica", "desagregacion"],
            "is_academic": True,
            "is_commercial": False,
            "watermark_reports": True,
            "excel_exports": False,
        },
    },
    {
        "nombre": "Capacitación",
        "codigo": "TRAINING",
        "legacy_codes": ["ACADEMY_TRAINING"],
        "plan_kind": "training",
        "descripcion": "Licencia especial de capacitación para alumnos y cursos guiados.",
        "precio_mensual": None,
        "precio_anual": None,
        "sort_order": 50,
        "limites": {
            "usuarios": 20,
            "proyectos": 2,
            "almacenamiento_gb": 0.05,
            "modulos_permitidos": ["apus", "presupuestos", "cronogramas", "polinomica", "desagregacion"],
            "is_training": True,
            "is_commercial": False,
            "watermark_reports": True,
            "excel_exports": False,
            "reset_periodical": True,
            "duration_days": 30,
        },
    },
]

LEGACY_LICENSE_CODES_TO_DISABLE = {"EXPRES", "ENTERPRISE"}


def _find_license(db: Session, codes: list[str], names: list[str] | None = None) -> Licencia | None:
    normalized_codes = [code.upper() for code in codes if code]
    query = db.query(Licencia)
    for code in normalized_codes:
        found = query.filter(func.upper(Licencia.codigo) == code).order_by(Licencia.id.asc()).first()
        if found:
            return found
    for name in names or []:
        found = query.filter(func.lower(Licencia.nombre) == name.lower()).order_by(Licencia.id.asc()).first()
        if found:
            return found
    return None


def _upsert_license(db: Session, seed: dict, *, legacy_codes: list[str] | None = None, es_especial: bool = False) -> Licencia:
    license_row = _find_license(db, [seed["codigo"], *(legacy_codes or [])], [seed["nombre"]])
    if license_row is None:
        license_row = Licencia(codigo=seed["codigo"], nombre=seed["nombre"], limites={})
        db.add(license_row)
        db.flush()

    license_row.nombre = seed["nombre"]
    license_row.codigo = seed["codigo"]
    license_row.descripcion = seed["descripcion"]
    license_row.plan_kind = seed.get("plan_kind")
    license_row.precio_mensual = seed.get("precio_mensual")
    license_row.precio_anual = seed.get("precio_anual")
    license_row.sort_order = seed.get("sort_order", license_row.sort_order or 0)
    license_row.is_default_express = bool(seed.get("is_default_express", False))
    license_row.es_especial = bool(es_especial)
    license_row.limites = dict(seed.get("limites") or {})
    license_row.activo = True
    db.add(license_row)
    db.flush()
    return license_row


def _disable_legacy_licenses(db: Session, official_ids: set[int]) -> int:
    disabled = 0
    legacy_rows = (
        db.query(Licencia)
        .filter(func.upper(Licencia.codigo).in_(LEGACY_LICENSE_CODES_TO_DISABLE))
        .order_by(Licencia.id.asc())
        .all()
    )
    for license_row in legacy_rows:
        if license_row.id in official_ids:
            continue
        if license_row.activo:
            disabled += 1
        license_row.activo = False
        license_row.plan_kind = license_row.plan_kind or "legacy"
        db.add(license_row)
    return disabled


def _record_alignment_event(
    db: Session,
    *,
    assignment: EmpresaLicencia,
    previous_license: Licencia,
    new_license: Licencia,
) -> None:
    db.add(
        LicenseEvent(
            empresa_id=assignment.empresa_id,
            empresa_licencia_id=assignment.id,
            licencia_id=new_license.id,
            event_type="license_saas_policy_alignment",
            notes="Asignación actual alineada al plan SaaS Marketplace aprobado.",
            payload={
                "previous_license_id": previous_license.id,
                "previous_license_code": previous_license.codigo,
                "previous_license_name": previous_license.nombre,
                "new_license_id": new_license.id,
                "new_license_code": new_license.codigo,
                "new_license_name": new_license.nombre,
                "aligned_at": datetime.now(timezone.utc).isoformat(),
            },
        )
    )


def _align_enterprise_assignments(db: Session, professional: Licencia) -> int:
    changed = 0
    assignments = (
        db.query(EmpresaLicencia)
        .join(Licencia, Licencia.id == EmpresaLicencia.licencia_id)
        .filter(
            EmpresaLicencia.activa == True,
            EmpresaLicencia.status.in_(["active", "queued"]),
            (func.upper(Licencia.codigo) == "ENTERPRISE") | (func.lower(Licencia.plan_kind) == "empresarial"),
        )
        .all()
    )
    for assignment in assignments:
        previous_license = assignment.licencia
        if previous_license and previous_license.id == professional.id:
            continue

        details = dict(assignment.detalles or {})
        details.setdefault("saas_policy_alignment", {})
        if not details["saas_policy_alignment"].get("previous_license_id"):
            details["saas_policy_alignment"] = {
                "previous_license_id": previous_license.id if previous_license else None,
                "previous_license_code": previous_license.codigo if previous_license else None,
                "previous_license_name": previous_license.nombre if previous_license else None,
                "aligned_to": professional.codigo,
                "reason": "ENTERPRISE sale del catalogo vendible aprobado; se alinea a PROFESSIONAL.",
                "aligned_at": datetime.now(timezone.utc).isoformat(),
            }
        assignment.licencia_id = professional.id
        assignment.detalles = details
        db.add(assignment)
        if previous_license:
            _record_alignment_event(db, assignment=assignment, previous_license=previous_license, new_license=professional)
        changed += 1
    return changed


def align_companies_to_saas_policy(db: Session | None = None) -> dict:
    owns_session = db is None
    db = db or SessionLocal()
    try:
        official: dict[str, Licencia] = {}
        for seed in DEFAULT_LICENSE_CATALOG:
            legacy_codes = []
            if seed["codigo"] == "EXPRESS":
                legacy_codes = ["EXPRES"]
            if seed["codigo"] == "PROFESSIONAL":
                legacy_codes = ["PRO"]
            official[seed["codigo"]] = _upsert_license(db, seed, legacy_codes=legacy_codes)

        for seed in APPROVED_SPECIAL_LICENSES:
            official[seed["codigo"]] = _upsert_license(
                db,
                seed,
                legacy_codes=seed.get("legacy_codes") or [],
                es_especial=True,
            )

        disabled_legacy = _disable_legacy_licenses(db, {item.id for item in official.values()})
        enterprise_aligned = _align_enterprise_assignments(db, official["PROFESSIONAL"])

        db.flush()
        companies = db.query(Empresa).order_by(Empresa.id.asc()).all()
        for company in companies:
            license_service.run_license_housekeeping_for_company(db, company.id, commit=False)
            license_service.update_usage_metrics(db, company.id)

        if owns_session:
            db.commit()
        return {
            "official_license_ids": {code: license_row.id for code, license_row in official.items()},
            "disabled_legacy": disabled_legacy,
            "enterprise_assignments_aligned": enterprise_aligned,
            "companies_recalculated": len(companies),
        }
    except Exception:
        if owns_session:
            db.rollback()
        raise
    finally:
        if owns_session:
            db.close()


def main() -> None:
    result = align_companies_to_saas_policy()
    print("Alineacion SaaS de empresas/licencias completada.")
    print(result)


if __name__ == "__main__":
    main()
