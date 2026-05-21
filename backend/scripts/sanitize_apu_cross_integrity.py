from __future__ import annotations

import json
import sys
from pathlib import Path

from sqlalchemy.orm import Session

BACKEND_ROOT = Path(__file__).resolve().parents[1]
if str(BACKEND_ROOT) not in sys.path:
    sys.path.insert(0, str(BACKEND_ROOT))

from app.core.database import SessionLocal
from app.models.apu import APU, APULinea
from app.models.recurso import Recurso
from app.models.subcategoria_item import SubcategoriaItem
from app.services.apu import normalize_string


def _find_matching_subcategoria(db: Session, apu: APU, source_subcat: SubcategoriaItem) -> SubcategoriaItem | None:
    return db.query(SubcategoriaItem).filter(
        SubcategoriaItem.base_trabajo_id == apu.base_trabajo_id,
        SubcategoriaItem.empresa_id == apu.empresa_id,
        SubcategoriaItem.codigo == source_subcat.codigo
    ).first()


def _find_matching_recurso(db: Session, apu: APU, recurso: Recurso) -> Recurso | None:
    return db.query(Recurso).filter(
        Recurso.base_trabajo_id == apu.base_trabajo_id,
        Recurso.empresa_id == apu.empresa_id,
        Recurso.descripcion_normalizada == recurso.descripcion_normalizada,
        Recurso.unidad == recurso.unidad
    ).first()


def _find_matching_apu(db: Session, apu: APU, apu_hijo: APU) -> APU | None:
    return db.query(APU).filter(
        APU.base_trabajo_id == apu.base_trabajo_id,
        APU.empresa_id == apu.empresa_id,
        APU.descripcion_normalizada == apu_hijo.descripcion_normalizada,
        APU.unidad == apu_hijo.unidad
    ).first()


def main() -> None:
    summary = {
        "apus_scanned": 0,
        "apus_subcategoria_realigned": 0,
        "apu_lineas_recurso_realigned": 0,
        "apu_lineas_apu_hijo_realigned": 0,
        "unresolved_subcategorias": 0,
        "unresolved_recursos": 0,
        "unresolved_apus_hijo": 0,
    }

    db = SessionLocal()
    try:
        apus = db.query(APU).order_by(APU.empresa_id.asc(), APU.base_trabajo_id.asc(), APU.id.asc()).all()
        for apu in apus:
            summary["apus_scanned"] += 1

            if apu.subcategoria_item_id:
                subcat = db.query(SubcategoriaItem).filter(SubcategoriaItem.id == apu.subcategoria_item_id).first()
                if not subcat:
                    summary["unresolved_subcategorias"] += 1
                elif subcat.base_trabajo_id != apu.base_trabajo_id or subcat.empresa_id != apu.empresa_id:
                    replacement = _find_matching_subcategoria(db, apu, subcat)
                    if replacement:
                        apu.subcategoria_item_id = replacement.id
                        summary["apus_subcategoria_realigned"] += 1
                    else:
                        summary["unresolved_subcategorias"] += 1

            for linea in apu.lineas:
                if linea.recurso_id:
                    recurso = db.query(Recurso).filter(Recurso.id == linea.recurso_id).first()
                    if not recurso:
                        summary["unresolved_recursos"] += 1
                    elif recurso.base_trabajo_id != apu.base_trabajo_id or recurso.empresa_id != apu.empresa_id:
                        replacement = _find_matching_recurso(db, apu, recurso)
                        if replacement:
                            linea.recurso_id = replacement.id
                            summary["apu_lineas_recurso_realigned"] += 1
                        else:
                            summary["unresolved_recursos"] += 1

                if linea.apu_hijo_id:
                    apu_hijo = db.query(APU).filter(APU.id == linea.apu_hijo_id).first()
                    if not apu_hijo:
                        summary["unresolved_apus_hijo"] += 1
                    elif apu_hijo.base_trabajo_id != apu.base_trabajo_id or apu_hijo.empresa_id != apu.empresa_id:
                        replacement = _find_matching_apu(db, apu, apu_hijo)
                        if replacement:
                            linea.apu_hijo_id = replacement.id
                            summary["apu_lineas_apu_hijo_realigned"] += 1
                        else:
                            summary["unresolved_apus_hijo"] += 1

            apu.descripcion_normalizada = normalize_string(apu.descripcion)

        db.commit()
        print(json.dumps(summary, ensure_ascii=False, indent=2))
    finally:
        db.close()


if __name__ == "__main__":
    main()
