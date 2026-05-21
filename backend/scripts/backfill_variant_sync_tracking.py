from __future__ import annotations

import json
import sys
from datetime import datetime
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from app.core.database import SessionLocal
from app.core.unit_normalization import canonicalize_unit_symbol
from app.models.apu import APU
from app.models.base_trabajo import BaseTrabajo
from app.models.recurso import Recurso
from app.models.unidad import Unidad


def _resource_signature(item: Recurso) -> tuple:
    unit_desc = item.unidad.descripcion if item.unidad else ""
    return (
        item.descripcion_normalizada or "",
        canonicalize_unit_symbol(unit_desc),
        str(item.precio or 0),
        (item.especificaciones or "").strip(),
    )


def _apu_signature(item: APU) -> tuple:
    lines = tuple(
        (
            linea.recurso.codigo if getattr(linea, "recurso", None) else None,
            linea.apu_hijo.codigo if getattr(linea, "apu_hijo", None) else None,
            str(linea.cantidad or 0),
            str(linea.rendimiento or 0),
            int(linea.orden or 0),
        )
        for linea in sorted(item.lineas or [], key=lambda row: ((row.orden or 0), row.id or 0))
    )
    return (
        item.descripcion_normalizada or "",
        canonicalize_unit_symbol(item.unidad),
        str(item.precio_unitario_total or 0),
        lines,
    )


def main() -> int:
    db = SessionLocal()
    report = {
        "generated_at": datetime.utcnow().isoformat() + "Z",
        "bases": [],
    }
    try:
        bases = db.query(BaseTrabajo).order_by(BaseTrabajo.empresa_id.asc(), BaseTrabajo.id.asc()).all()
        for base in bases:
            base_item = {
                "base_id": base.id,
                "empresa_id": base.empresa_id,
                "source_base_id": base.source_base_id,
                "apus": {"native": 0, "inherited_synced": 0, "inherited_diverged": 0, "local": 0},
                "recursos": {"native": 0, "inherited_synced": 0, "inherited_diverged": 0, "local": 0},
            }

            apus = (
                db.query(APU)
                .filter(APU.base_trabajo_id == base.id, APU.empresa_id == base.empresa_id)
                .all()
            )
            recursos = (
                db.query(Recurso)
                .filter(Recurso.base_trabajo_id == base.id, Recurso.empresa_id == base.empresa_id)
                .all()
            )

            if not base.source_base_id:
                for apu in apus:
                    apu.source_apu_id = None
                    apu.content_origin = "native"
                    apu.sync_status = "not_applicable"
                    apu.last_sync_at = None
                    base_item["apus"]["native"] += 1
                for recurso in recursos:
                    recurso.source_recurso_id = None
                    recurso.content_origin = "native"
                    recurso.sync_status = "not_applicable"
                    recurso.last_sync_at = None
                    base_item["recursos"]["native"] += 1
                report["bases"].append(base_item)
                continue

            source_apus = {
                item.codigo: item
                for item in db.query(APU).filter(
                    APU.base_trabajo_id == base.source_base_id,
                    APU.empresa_id == base.empresa_id,
                ).all()
            }
            source_recursos = {
                item.codigo: item
                for item in db.query(Recurso).filter(
                    Recurso.base_trabajo_id == base.source_base_id,
                    Recurso.empresa_id == base.empresa_id,
                ).all()
            }

            for apu in apus:
                source_apu = source_apus.get(apu.codigo)
                if not source_apu:
                    apu.source_apu_id = None
                    apu.content_origin = "local"
                    apu.sync_status = "local_only"
                    apu.last_sync_at = None
                    base_item["apus"]["local"] += 1
                    continue

                apu.source_apu_id = source_apu.id
                apu.content_origin = "inherited"
                if _apu_signature(apu) == _apu_signature(source_apu):
                    apu.sync_status = "synced"
                    apu.last_sync_at = datetime.utcnow()
                    base_item["apus"]["inherited_synced"] += 1
                else:
                    apu.sync_status = "diverged"
                    apu.last_sync_at = None
                    base_item["apus"]["inherited_diverged"] += 1

            for recurso in recursos:
                source_recurso = source_recursos.get(recurso.codigo)
                if not source_recurso:
                    recurso.source_recurso_id = None
                    recurso.content_origin = "local"
                    recurso.sync_status = "local_only"
                    recurso.last_sync_at = None
                    base_item["recursos"]["local"] += 1
                    continue

                recurso.source_recurso_id = source_recurso.id
                recurso.content_origin = "inherited"
                if _resource_signature(recurso) == _resource_signature(source_recurso):
                    recurso.sync_status = "synced"
                    recurso.last_sync_at = datetime.utcnow()
                    base_item["recursos"]["inherited_synced"] += 1
                else:
                    recurso.sync_status = "diverged"
                    recurso.last_sync_at = None
                    base_item["recursos"]["inherited_diverged"] += 1

            report["bases"].append(base_item)

        db.commit()

        report_dir = ROOT.parent / "docs" / "reportes"
        report_dir.mkdir(parents=True, exist_ok=True)
        report_path = report_dir / f"variant_sync_backfill_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}.json"
        report_path.write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")
        print(str(report_path))
        return 0
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    raise SystemExit(main())
