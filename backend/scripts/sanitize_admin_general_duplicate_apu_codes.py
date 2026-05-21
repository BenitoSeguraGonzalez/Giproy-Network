from __future__ import annotations

import json
import sys
from pathlib import Path

BACKEND_ROOT = Path(__file__).resolve().parents[1]
if str(BACKEND_ROOT) not in sys.path:
    sys.path.insert(0, str(BACKEND_ROOT))

from app.core.database import SessionLocal
from app.models.apu import APU


EMPRESA_ID = 1
BASE_ID = 1
TARGET_APU_IDS = (454, 461, 462)
PREFIX = "5-001"


def _existing_codes_by_company(db) -> set[str]:
    rows = db.query(APU.codigo).filter(
        APU.empresa_id == EMPRESA_ID,
        APU.codigo.like(f"{PREFIX}-%")
    ).all()
    return {row[0] for row in rows}


def _next_company_wide_code(existing_codes: set[str]) -> str:
    max_seq = 0
    for code in existing_codes:
        parts = str(code).split("-")
        if len(parts) != 3:
            continue
        if f"{parts[0]}-{parts[1]}" != PREFIX:
            continue
        try:
            max_seq = max(max_seq, int(parts[2]))
        except ValueError:
            continue
    return f"{PREFIX}-{max_seq + 1:04d}"


def main() -> None:
    db = SessionLocal()
    summary = {
        "updated": [],
        "skipped_missing": [],
    }

    try:
        existing_codes = _existing_codes_by_company(db)

        for apu_id in TARGET_APU_IDS:
            apu = db.query(APU).filter(
                APU.id == apu_id,
                APU.empresa_id == EMPRESA_ID,
                APU.base_trabajo_id == BASE_ID
            ).first()
            if not apu:
                summary["skipped_missing"].append(apu_id)
                continue

            old_code = apu.codigo
            new_code = _next_company_wide_code(existing_codes)
            apu.codigo = new_code
            existing_codes.add(new_code)

            summary["updated"].append({
                "apu_id": apu.id,
                "descripcion": apu.descripcion,
                "old_codigo": old_code,
                "new_codigo": new_code,
            })

        db.commit()
        print(json.dumps(summary, ensure_ascii=False, indent=2))
    finally:
        db.close()


if __name__ == "__main__":
    main()
