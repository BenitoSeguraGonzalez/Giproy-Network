import argparse
import json
import os
import sys
import unicodedata
from datetime import datetime, timezone
from pathlib import Path

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import text

from app.core.database import SessionLocal


PILOT_COMPANIES = {
    1: {"administradores generales"},
    3: {"santiago bermeo", "bermeo quinde hernan santiago"},
}


def _normalize(value: str | None) -> str:
    text = unicodedata.normalize("NFKD", value or "")
    return " ".join("".join(char for char in text if not unicodedata.combining(char)).lower().split())


def _matches_pilot_company(company: dict) -> bool:
    candidates = {_normalize(company["nombre"]), _normalize(company["alias"])}
    expected = PILOT_COMPANIES[company["id"]]
    return any(candidate in expected for candidate in candidates if candidate)


def _serialize_assignment(company: dict, assignment: dict) -> dict:
    return {
        "empresa_id": company["id"],
        "empresa_nombre": company["nombre"],
        "empresa_alias": company["alias"],
        "assignment_id": assignment["assignment_id"],
        "license_id": assignment["license_id"],
        "license_code": assignment["license_code"],
        "starts_at": assignment["starts_at"].isoformat(),
        "ends_at": assignment["ends_at"].isoformat() if assignment["ends_at"] else None,
        "status": assignment["status"],
        "activa": assignment["activa"],
    }


def main() -> None:
    parser = argparse.ArgumentParser(description="Convierte las empresas piloto BIM a licencia Enterprise.")
    parser.add_argument("--apply", action="store_true", help="Aplica la conversión; sin este flag sólo muestra el plan.")
    parser.add_argument("--backup-file", type=Path, help="Ruta JSON obligatoria al aplicar la conversión.")
    args = parser.parse_args()

    if args.apply and not args.backup_file:
        parser.error("--backup-file es obligatorio junto con --apply")
    if args.backup_file and args.backup_file.exists():
        parser.error(f"el respaldo ya existe: {args.backup_file}")

    db = SessionLocal()
    try:
        enterprise = db.execute(
            text("SELECT id, codigo FROM licencias WHERE codigo = :code AND activo = true"),
            {"code": "ENTERPRISE"},
        ).mappings().one()
        changes = []
        for company_id in PILOT_COMPANIES:
            company = db.execute(
                text("SELECT id, nombre, alias FROM empresas WHERE id = :company_id"),
                {"company_id": company_id},
            ).mappings().one()
            if not _matches_pilot_company(company):
                raise RuntimeError(
                    f"empresa {company_id} no coincide con el piloto esperado: "
                    f"nombre={company['nombre']!r}, alias={company['alias']!r}"
                )
            assignment = db.execute(
                text(
                    "SELECT el.id AS assignment_id, el.licencia_id AS license_id, l.codigo AS license_code, "
                    "el.starts_at, el.ends_at, el.status, el.activa "
                    "FROM empresa_licencias el JOIN licencias l ON l.id = el.licencia_id "
                    "WHERE el.empresa_id = :company_id AND el.status = :status AND el.activa = true"
                ),
                {"company_id": company_id, "status": "active"},
            ).mappings().one()
            changes.append((company, assignment))

        backup = {
            "schema": "giproy_bim_pilot_license_backup_v1",
            "generated_at": datetime.now(timezone.utc).isoformat(),
            "target_license": {"id": enterprise["id"], "code": enterprise["codigo"]},
            "assignments": [
                _serialize_assignment(company, assignment)
                for company, assignment in changes
            ],
        }
        print(json.dumps(backup, ensure_ascii=False, indent=2))

        if not args.apply:
            print("Dry-run completado; no se modificaron datos.")
            return

        args.backup_file.parent.mkdir(parents=True, exist_ok=True)
        args.backup_file.write_text(json.dumps(backup, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

        for company, assignment in changes:
            if assignment["license_id"] == enterprise["id"]:
                continue
            db.execute(
                text("UPDATE empresa_licencias SET licencia_id = :license_id WHERE id = :assignment_id"),
                {"license_id": enterprise["id"], "assignment_id": assignment["assignment_id"]},
            )
            payload = {
                "previous_license_id": assignment["license_id"],
                "previous_license_code": assignment["license_code"],
                "new_license_id": enterprise["id"],
                "new_license_code": enterprise["codigo"],
                "starts_at": assignment["starts_at"].isoformat(),
                "ends_at": assignment["ends_at"].isoformat() if assignment["ends_at"] else None,
            }
            db.execute(
                text(
                    "INSERT INTO license_events "
                    "(empresa_id, empresa_licencia_id, licencia_id, event_type, notes, payload) "
                    "VALUES (:empresa_id, :assignment_id, :license_id, :event_type, :notes, CAST(:payload AS JSON))"
                ),
                {
                    "empresa_id": company["id"],
                    "assignment_id": assignment["assignment_id"],
                    "license_id": enterprise["id"],
                    "event_type": "bim_pilot_license_changed",
                    "notes": "Conversión controlada a Enterprise para piloto BIM; vigencia preservada.",
                    "payload": json.dumps(payload),
                },
            )
        db.commit()
        print(f"Conversión aplicada. Respaldo: {args.backup_file}")
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    main()
