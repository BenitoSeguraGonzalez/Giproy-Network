from __future__ import annotations

import json
import sys
from pathlib import Path

from sqlalchemy.orm import Session

BACKEND_ROOT = Path(__file__).resolve().parents[1]
if str(BACKEND_ROOT) not in sys.path:
    sys.path.insert(0, str(BACKEND_ROOT))

from app.core.database import SessionLocal
from app.models.apu import APU
from app.models.subcategoria_item import SubcategoriaItem


EMPRESA_ID = 3
APU_DESCRIPTION = "MATERIAL FILTRANTE PARA DRENES, SUMINISTRO Y COLOCACIÓN"
SOURCE_CODE = "5-001-0002"
TARGET_CODE = "5-003-0002"
TARGET_SUBCAT_CODE = "5-003"
TARGET_BASE_IDS = (32, 34)


def _get_target_subcategoria(db: Session, base_id: int) -> SubcategoriaItem | None:
    return db.query(SubcategoriaItem).filter(
        SubcategoriaItem.empresa_id == EMPRESA_ID,
        SubcategoriaItem.base_trabajo_id == base_id,
        SubcategoriaItem.codigo == TARGET_SUBCAT_CODE
    ).first()


def main() -> None:
    db = SessionLocal()
    summary = {
        "updated_apus": [],
        "skipped_missing_apus": [],
        "skipped_existing_target_code": [],
        "skipped_missing_target_subcategoria": [],
    }

    try:
        for base_id in TARGET_BASE_IDS:
            apu = db.query(APU).filter(
                APU.empresa_id == EMPRESA_ID,
                APU.base_trabajo_id == base_id,
                APU.codigo == SOURCE_CODE,
                APU.descripcion == APU_DESCRIPTION
            ).first()

            if not apu:
                summary["skipped_missing_apus"].append(base_id)
                continue

            existing_target = db.query(APU).filter(
                APU.empresa_id == EMPRESA_ID,
                APU.base_trabajo_id == base_id,
                APU.codigo == TARGET_CODE,
                APU.id != apu.id
            ).first()
            if existing_target:
                summary["skipped_existing_target_code"].append({
                    "base_id": base_id,
                    "existing_apu_id": existing_target.id,
                })
                continue

            target_subcat = _get_target_subcategoria(db, base_id)
            if not target_subcat:
                summary["skipped_missing_target_subcategoria"].append(base_id)
                continue

            old_codigo = apu.codigo
            old_subcategoria_item_id = apu.subcategoria_item_id
            apu.codigo = TARGET_CODE
            apu.subcategoria_item_id = target_subcat.id
            db.flush()

            summary["updated_apus"].append({
                "apu_id": apu.id,
                "base_id": base_id,
                "old_codigo": old_codigo,
                "new_codigo": apu.codigo,
                "old_subcategoria_item_id": old_subcategoria_item_id,
                "new_subcategoria_item_id": apu.subcategoria_item_id,
            })

        db.commit()
        print(json.dumps(summary, ensure_ascii=False, indent=2))
    finally:
        db.close()


if __name__ == "__main__":
    main()
