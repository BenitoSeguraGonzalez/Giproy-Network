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
from app.services.apu import calculate_apu_price


EMPRESA_ID = 3
SOURCE_BASE_ID = 32
TARGET_BASE_ID = 34


def _map_target_subcategoria(db: Session, source_apu: APU) -> SubcategoriaItem | None:
    source_subcat = source_apu.subcategoria_item
    if not source_subcat:
        return None
    return db.query(SubcategoriaItem).filter(
        SubcategoriaItem.base_trabajo_id == TARGET_BASE_ID,
        SubcategoriaItem.empresa_id == EMPRESA_ID,
        SubcategoriaItem.codigo == source_subcat.codigo
    ).first()


def _map_target_recurso(db: Session, source_recurso: Recurso) -> Recurso | None:
    return db.query(Recurso).filter(
        Recurso.base_trabajo_id == TARGET_BASE_ID,
        Recurso.empresa_id == EMPRESA_ID,
        Recurso.codigo == source_recurso.codigo
    ).first()


def _map_target_apu_by_code(db: Session, codigo: str) -> APU | None:
    return db.query(APU).filter(
        APU.base_trabajo_id == TARGET_BASE_ID,
        APU.empresa_id == EMPRESA_ID,
        APU.codigo == codigo
    ).first()


def _copy_lines(db: Session, source_apu: APU, target_apu: APU, summary: dict) -> None:
    db.query(APULinea).filter(APULinea.apu_id == target_apu.id).delete(synchronize_session=False)

    for source_line in source_apu.lineas:
        recurso_id = None
        apu_hijo_id = None

        if source_line.recurso_id:
            source_recurso = db.query(Recurso).filter(Recurso.id == source_line.recurso_id).first()
            target_recurso = _map_target_recurso(db, source_recurso) if source_recurso else None
            if not target_recurso:
                summary["unresolved_resource_lines"] += 1
                continue
            recurso_id = target_recurso.id

        if source_line.apu_hijo_id:
            source_hijo = db.query(APU).filter(APU.id == source_line.apu_hijo_id).first()
            target_hijo = _map_target_apu_by_code(db, source_hijo.codigo) if source_hijo else None
            if not target_hijo:
                summary["unresolved_child_apu_lines"] += 1
                continue
            apu_hijo_id = target_hijo.id

        db.add(APULinea(
            apu_id=target_apu.id,
            recurso_id=recurso_id,
            apu_hijo_id=apu_hijo_id,
            cantidad=source_line.cantidad,
            rendimiento=source_line.rendimiento,
            precio_congelado=source_line.precio_congelado,
            subtotal=source_line.subtotal
        ))
        summary["lines_restored"] += 1

    db.flush()
    calculate_apu_price(db, target_apu)


def main() -> None:
    summary = {
        "created_apus": 0,
        "restored_empty_apus": 0,
        "synced_existing_apus": 0,
        "lines_restored": 0,
        "skipped_divergent_codes": 0,
        "unresolved_subcategorias": 0,
        "unresolved_resource_lines": 0,
        "unresolved_child_apu_lines": 0,
    }

    db = SessionLocal()
    try:
        source_apus = db.query(APU).filter(
            APU.empresa_id == EMPRESA_ID,
            APU.base_trabajo_id == SOURCE_BASE_ID
        ).order_by(APU.codigo.asc()).all()

        for source_apu in source_apus:
            target_apu = _map_target_apu_by_code(db, source_apu.codigo)

            if target_apu and target_apu.descripcion != source_apu.descripcion:
                summary["skipped_divergent_codes"] += 1
                continue

            if not target_apu:
                target_subcat = _map_target_subcategoria(db, source_apu)
                if not target_subcat:
                    summary["unresolved_subcategorias"] += 1
                    continue

                target_apu = APU(
                    codigo=source_apu.codigo,
                    descripcion=source_apu.descripcion,
                    descripcion_normalizada=source_apu.descripcion_normalizada,
                    unidad=source_apu.unidad,
                    rendimiento_estandar=source_apu.rendimiento_estandar,
                    costo_directo=source_apu.costo_directo,
                    costo_indirecto=source_apu.costo_indirecto,
                    precio_unitario_total=source_apu.precio_unitario_total,
                    moneda=source_apu.moneda,
                    estado_revision=source_apu.estado_revision,
                    revision=source_apu.revision,
                    categoria_id=source_apu.categoria_id,
                    subcategoria_item_id=target_subcat.id,
                    empresa_id=EMPRESA_ID,
                    base_trabajo_id=TARGET_BASE_ID,
                    omniclass_codigo=source_apu.omniclass_codigo,
                    omniclass_titulo=source_apu.omniclass_titulo
                )
                db.add(target_apu)
                db.flush()
                _copy_lines(db, source_apu, target_apu, summary)
                summary["created_apus"] += 1
                continue

            target_line_count = db.query(APULinea).filter(APULinea.apu_id == target_apu.id).count()
            source_line_count = db.query(APULinea).filter(APULinea.apu_id == source_apu.id).count()

            if source_line_count > 0 and target_line_count != source_line_count:
                _copy_lines(db, source_apu, target_apu, summary)
                if target_line_count == 0:
                    summary["restored_empty_apus"] += 1
                else:
                    summary["synced_existing_apus"] += 1

        db.commit()
        print(json.dumps(summary, ensure_ascii=False, indent=2))
    finally:
        db.close()


if __name__ == "__main__":
    main()
