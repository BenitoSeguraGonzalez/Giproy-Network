from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timezone
from decimal import Decimal
from typing import Any, Dict, List, Optional, Set, Tuple

from sqlalchemy.orm import Session, joinedload

from app.models.apu import APU, APULinea
from app.models.base_trabajo import BaseTrabajo
from app.models.presupuesto import Presupuesto, PresupuestoDetalle
from app.models.proyecto import Proyecto
from app.models.recurso import Recurso
from app.models.subcategoria_item import SubcategoriaItem
from app.core.unit_normalization import canonicalize_unit_symbol
from app.core.apu_status import normalize_apu_revision_status
from app.services.apu import calculate_apu_price, normalize_string, update_apu_operational_price
from app.services.presupuesto import refresh_presupuesto_prices


@dataclass
class InferredSource:
    source_base_id: int
    reason: str
    score: int


class ProjectBaseReconciliationService:
    def _resolve_project_sync_context(
        self,
        db: Session,
        target_base_id: int,
        empresa_id: int,
    ) -> tuple[BaseTrabajo, int, int]:
        target_base = (
            db.query(BaseTrabajo)
            .filter(BaseTrabajo.id == target_base_id, BaseTrabajo.empresa_id == empresa_id)
            .first()
        )
        if not target_base:
            raise ValueError("Base de proyecto no encontrada.")
        if target_base.tipo != "Base de Proyecto":
            raise ValueError("La sincronización solo está disponible para bases de proyecto.")

        inferred = self.infer_source_base(db, target_base_id, empresa_id)
        if not inferred or not inferred.source_base_id:
            raise ValueError("La base de proyecto no tiene una base maestra de origen identificable.")

        return target_base, inferred.source_base_id, self._get_target_revision(db, target_base_id, empresa_id)

    def _build_sync_missing_plan(
        self,
        db: Session,
        source_base_id: int,
        target_base_id: int,
        empresa_id: int,
    ) -> Dict[str, object]:
        comparison_before = self.compare_bases(db, source_base_id, target_base_id, empresa_id)
        repairable_empty_apus = []
        repairable_codes = set()
        for candidate in comparison_before["empty_apus"]:
            code = candidate["codigo"]
            source_apu = (
                db.query(APU)
                .options(joinedload(APU.lineas))
                .filter(
                    APU.base_trabajo_id == source_base_id,
                    APU.empresa_id == empresa_id,
                    APU.codigo == code,
                )
                .first()
            )
            target_apu = (
                db.query(APU)
                .options(joinedload(APU.lineas))
                .filter(
                    APU.base_trabajo_id == target_base_id,
                    APU.empresa_id == empresa_id,
                    APU.codigo == code,
                )
                .first()
            )
            if source_apu and target_apu and self._is_safe_inherited_repair_candidate(source_apu, target_apu):
                repairable_empty_apus.append(candidate)
                repairable_codes.add(code)

        return {
            "before": comparison_before,
            "repairable_empty_apus": repairable_empty_apus,
            "repairable_codes": repairable_codes,
            "summary": {
                "missing_subcategories": len(comparison_before["missing_subcategories"]),
                "missing_resources": len(comparison_before["missing_resources"]),
                "missing_apus": len(comparison_before["missing_apus"]),
                "repairable_empty_apus": len(repairable_empty_apus),
                "divergent_apus_untouched": len(comparison_before["divergent_apus"]),
            },
        }

    def preview_sync_missing(
        self,
        db: Session,
        target_base_id: int,
        empresa_id: int,
    ) -> Dict[str, object]:
        target_base, source_base_id, _ = self._resolve_project_sync_context(db, target_base_id, empresa_id)
        plan = self._build_sync_missing_plan(db, source_base_id, target_base_id, empresa_id)
        return {
            "source_base_id": source_base_id,
            "target_base_id": target_base.id,
            "empresa_id": empresa_id,
            "mode": "preview_missing_only",
            "summary": plan["summary"],
            "before": plan["before"],
            "repairable_empty_apus": plan["repairable_empty_apus"],
        }

    def _is_safe_inherited_repair_candidate(self, source_apu: APU, target_apu: APU) -> bool:
        source_line_count = len(source_apu.lineas or [])
        target_line_count = len(target_apu.lineas or [])
        source_total = Decimal(str(source_apu.precio_unitario_total or 0))
        target_total = Decimal(str(target_apu.precio_unitario_total or 0))
        target_direct = Decimal(str(target_apu.costo_directo or 0))

        if source_line_count <= 0:
            return False

        inherited_candidate = (
            target_apu.source_apu_id == source_apu.id
            or getattr(target_apu, "content_origin", None) == "inherited"
        )
        if not inherited_candidate:
            return False

        has_empty_structure = target_line_count == 0 and target_total == 0 and target_direct == 0
        has_zeroed_totals = target_total == 0 and source_total > 0 and target_line_count <= source_line_count
        has_truncated_structure = target_line_count == 0 and source_line_count > 0

        return has_empty_structure or has_zeroed_totals or has_truncated_structure

    def _get_project_for_base(self, db: Session, base_id: int, empresa_id: int) -> Optional[Proyecto]:
        return (
            db.query(Proyecto)
            .filter(Proyecto.base_trabajo_id == base_id, Proyecto.empresa_id == empresa_id)
            .first()
        )

    def _get_target_revision(self, db: Session, target_base_id: int, empresa_id: int) -> int:
        project = self._get_project_for_base(db, target_base_id, empresa_id)
        return int(project.revision or 0) if project else 0

    def infer_source_base(self, db: Session, project_base_id: int, empresa_id: int) -> Optional[InferredSource]:
        target_base = (
            db.query(BaseTrabajo)
            .filter(BaseTrabajo.id == project_base_id, BaseTrabajo.empresa_id == empresa_id)
            .first()
        )
        if not target_base:
            return None

        if target_base.source_base_id:
            return InferredSource(
                source_base_id=target_base.source_base_id,
                reason="persisted_source_base_id",
                score=10**9,
            )

        project = self._get_project_for_base(db, project_base_id, empresa_id)
        if project and int(project.revision or 0) > 0 and project.codigo_root:
            previous_revision = (
                db.query(Proyecto)
                .filter(
                    Proyecto.codigo_root == project.codigo_root,
                    Proyecto.empresa_id == empresa_id,
                    Proyecto.revision < project.revision,
                    Proyecto.base_trabajo_id.isnot(None),
                )
                .order_by(Proyecto.revision.desc(), Proyecto.id.desc())
                .first()
            )
            if previous_revision and previous_revision.base_trabajo_id and previous_revision.base_trabajo_id != project_base_id:
                return InferredSource(
                    source_base_id=previous_revision.base_trabajo_id,
                    reason="previous_project_revision_base",
                    score=10**8 + int(previous_revision.revision or 0),
                )

        target_apu_codes = {
            row[0]
            for row in db.query(APU.codigo)
            .filter(APU.base_trabajo_id == project_base_id, APU.empresa_id == empresa_id)
            .all()
        }
        target_resource_codes = {
            row[0]
            for row in db.query(Recurso.codigo)
            .filter(Recurso.base_trabajo_id == project_base_id, Recurso.empresa_id == empresa_id)
            .all()
        }
        target_sub_keys = {
            (row.subcategoria_codigo, row.codigo)
            for row in db.query(SubcategoriaItem.subcategoria_codigo, SubcategoriaItem.codigo)
            .filter(SubcategoriaItem.base_trabajo_id == project_base_id, SubcategoriaItem.empresa_id == empresa_id)
            .all()
        }

        candidate_query = db.query(BaseTrabajo).filter(
            BaseTrabajo.empresa_id == empresa_id,
            BaseTrabajo.id != project_base_id,
        )
        if project and int(project.revision or 0) == 0:
            candidate_query = candidate_query.filter(BaseTrabajo.tipo == "Base Maestra")
        elif project and int(project.revision or 0) > 0 and project.codigo_root:
            candidate_query = candidate_query.filter(BaseTrabajo.id != project_base_id)

        candidates = candidate_query.all()
        if not candidates:
            return None

        best: Optional[InferredSource] = None
        second_score = -1
        for candidate in candidates:
            source_apu_codes = {
                row[0]
                for row in db.query(APU.codigo)
                .filter(APU.base_trabajo_id == candidate.id, APU.empresa_id == empresa_id)
                .all()
            }
            source_resource_codes = {
                row[0]
                for row in db.query(Recurso.codigo)
                .filter(Recurso.base_trabajo_id == candidate.id, Recurso.empresa_id == empresa_id)
                .all()
            }
            source_sub_keys = {
                (row.subcategoria_codigo, row.codigo)
                for row in db.query(SubcategoriaItem.subcategoria_codigo, SubcategoriaItem.codigo)
                .filter(SubcategoriaItem.base_trabajo_id == candidate.id, SubcategoriaItem.empresa_id == empresa_id)
                .all()
            }

            apu_overlap = len(target_apu_codes & source_apu_codes)
            resource_overlap = len(target_resource_codes & source_resource_codes)
            sub_overlap = len(target_sub_keys & source_sub_keys)
            score = apu_overlap * 100000 + resource_overlap * 100 + sub_overlap

            if not best or score > best.score:
                if best:
                    second_score = best.score
                best = InferredSource(candidate.id, "overlap_match", score)
            elif score > second_score:
                second_score = score

        if not best or best.score <= 0:
            return None

        if second_score > 0 and best.score < int(second_score * 1.2):
            return None

        return best

    def compare_bases(self, db: Session, source_base_id: int, target_base_id: int, empresa_id: int) -> Dict[str, List[dict]]:
        source_subcats = {
            (item.subcategoria_codigo, item.codigo): item
            for item in db.query(SubcategoriaItem)
            .filter(SubcategoriaItem.base_trabajo_id == source_base_id, SubcategoriaItem.empresa_id == empresa_id)
            .all()
        }
        target_subcats = {
            (item.subcategoria_codigo, item.codigo): item
            for item in db.query(SubcategoriaItem)
            .filter(SubcategoriaItem.base_trabajo_id == target_base_id, SubcategoriaItem.empresa_id == empresa_id)
            .all()
        }
        source_resources = {
            item.codigo: item
            for item in db.query(Recurso)
            .filter(Recurso.base_trabajo_id == source_base_id, Recurso.empresa_id == empresa_id)
            .all()
        }
        target_resources = {
            item.codigo: item
            for item in db.query(Recurso)
            .filter(Recurso.base_trabajo_id == target_base_id, Recurso.empresa_id == empresa_id)
            .all()
        }
        source_apus = {
            item.codigo: item
            for item in db.query(APU)
            .options(joinedload(APU.lineas))
            .filter(APU.base_trabajo_id == source_base_id, APU.empresa_id == empresa_id)
            .all()
        }
        target_apus = {
            item.codigo: item
            for item in db.query(APU)
            .options(joinedload(APU.lineas))
            .filter(APU.base_trabajo_id == target_base_id, APU.empresa_id == empresa_id)
            .all()
        }

        missing_subcategories = [
            {
                "codigo": item.codigo,
                "subcategoria_codigo": item.subcategoria_codigo,
                "descripcion": item.descripcion,
            }
            for key, item in source_subcats.items()
            if key not in target_subcats
        ]
        missing_resources = [
            {"codigo": item.codigo, "descripcion": item.descripcion}
            for code, item in source_resources.items()
            if code not in target_resources
        ]
        missing_apus = [
            {"codigo": item.codigo, "descripcion": item.descripcion}
            for code, item in source_apus.items()
            if code not in target_apus
        ]

        empty_apus: List[dict] = []
        divergent_apus: List[dict] = []
        for code, source_apu in source_apus.items():
            target_apu = target_apus.get(code)
            if not target_apu:
                continue
            source_line_count = len(source_apu.lineas or [])
            target_line_count = len(target_apu.lineas or [])
            source_total = Decimal(str(source_apu.precio_unitario_total or 0))
            target_total = Decimal(str(target_apu.precio_unitario_total or 0))
            target_direct = Decimal(str(target_apu.costo_directo or 0))
            if source_line_count > 0 and target_line_count == 0 and target_total == 0 and target_direct == 0:
                empty_apus.append(
                    {
                        "codigo": code,
                        "descripcion": target_apu.descripcion,
                        "source_line_count": source_line_count,
                    }
                )
                continue

            if (
                normalize_string(source_apu.descripcion) != normalize_string(target_apu.descripcion)
                or canonicalize_unit_symbol(source_apu.unidad) != canonicalize_unit_symbol(target_apu.unidad)
                or source_line_count != target_line_count
                or source_total != target_total
            ):
                divergent_apus.append(
                    {
                        "codigo": code,
                        "source_descripcion": source_apu.descripcion,
                        "target_descripcion": target_apu.descripcion,
                        "source_line_count": source_line_count,
                        "target_line_count": target_line_count,
                        "source_total": float(source_total),
                        "target_total": float(target_total),
                    }
                )

        return {
            "missing_subcategories": missing_subcategories,
            "missing_resources": missing_resources,
            "missing_apus": missing_apus,
            "empty_apus": empty_apus,
            "divergent_apus": divergent_apus,
        }

    def _line_reference_key(self, line: APULinea) -> Optional[tuple[str, str]]:
        if line.recurso_id and line.recurso and line.recurso.codigo:
            return ("recurso", str(line.recurso.codigo))
        if line.apu_hijo_id and line.apu_hijo and line.apu_hijo.codigo:
            return ("apu_hijo", str(line.apu_hijo.codigo))
        return None

    def _apu_value_signature(self, apu: APU) -> tuple:
        line_signatures: List[tuple] = []
        for line in sorted(apu.lineas or [], key=lambda item: ((item.orden or 0), item.id or 0)):
            key = self._line_reference_key(line)
            resource_price = Decimal(str(line.recurso.precio or 0)) if line.recurso_id and line.recurso else Decimal("0")
            resource_unit = (
                canonicalize_unit_symbol(line.recurso.unidad.descripcion)
                if line.recurso_id and line.recurso and line.recurso.unidad
                else ""
            )
            line_signatures.append(
                (
                    key,
                    Decimal(str(line.cantidad or 0)),
                    Decimal(str(line.rendimiento or 0)),
                    resource_price,
                    resource_unit,
                )
            )
        return (
            Decimal(str(apu.rendimiento_estandar or 0)),
            Decimal(str(apu.costo_directo or 0)),
            Decimal(str(apu.precio_unitario_total or 0)),
            tuple(line_signatures),
        )

    def _apu_needs_value_sync(self, source_apu: APU, target_apu: APU) -> bool:
        return self._apu_value_signature(source_apu) != self._apu_value_signature(target_apu)

    def _get_sync_revision_targets(
        self,
        db: Session,
        target_base_id: int,
        empresa_id: int,
    ) -> List[dict]:
        target_project = self._get_project_for_base(db, target_base_id, empresa_id)
        if not target_project or not target_project.codigo_root:
            return []

        revisions = (
            db.query(Proyecto)
            .filter(
                Proyecto.codigo_root == target_project.codigo_root,
                Proyecto.empresa_id == empresa_id,
                Proyecto.base_trabajo_id.isnot(None),
            )
            .order_by(Proyecto.revision.desc(), Proyecto.id.desc())
            .all()
        )
        if not revisions:
            return []

        budget_rows = {
            proyecto_id: {"presupuestos": 0, "lineas": 0}
            for (proyecto_id,) in db.query(Proyecto.id)
            .filter(Proyecto.id.in_([revision.id for revision in revisions]))
            .all()
        }
        budget_stats = (
            db.query(
                Presupuesto.proyecto_id,
                Presupuesto.id,
                PresupuestoDetalle.id,
            )
            .outerjoin(PresupuestoDetalle, PresupuestoDetalle.presupuesto_id == Presupuesto.id)
            .filter(
                Presupuesto.empresa_id == empresa_id,
                Presupuesto.proyecto_id.in_([revision.id for revision in revisions]),
            )
            .all()
        )
        for proyecto_id, presupuesto_id, detalle_id in budget_stats:
            bucket = budget_rows.setdefault(proyecto_id, {"presupuestos": 0, "lineas": 0, "_seen": set()})
            seen = bucket.setdefault("_seen", set())
            if presupuesto_id and presupuesto_id not in seen:
                bucket["presupuestos"] += 1
                seen.add(presupuesto_id)
            if detalle_id:
                bucket["lineas"] += 1
        result = []
        for revision in revisions:
            stats = budget_rows.get(revision.id, {"presupuestos": 0, "lineas": 0})
            result.append(
                {
                    "project_id": revision.id,
                    "base_id": revision.base_trabajo_id,
                    "revision": int(revision.revision or 0),
                    "label": f"Rev {str(int(revision.revision or 0)).zfill(3)}",
                    "presupuestos": int(stats.get("presupuestos") or 0),
                    "lineas_presupuesto": int(stats.get("lineas") or 0),
                    "is_current": revision.base_trabajo_id == target_base_id,
                }
            )
        return result

    def _build_sync_operation_plan(
        self,
        db: Session,
        source_base_id: int,
        target_base_id: int,
        empresa_id: int,
        mode: str,
    ) -> Dict[str, Any]:
        comparison_before = self.compare_bases(db, source_base_id, target_base_id, empresa_id)
        source_apus = (
            db.query(APU)
            .options(
                joinedload(APU.lineas).joinedload(APULinea.recurso),
                joinedload(APU.lineas).joinedload(APULinea.apu_hijo),
            )
            .filter(APU.base_trabajo_id == source_base_id, APU.empresa_id == empresa_id)
            .all()
        )
        target_apus = (
            db.query(APU)
            .options(
                joinedload(APU.lineas).joinedload(APULinea.recurso),
                joinedload(APU.lineas).joinedload(APULinea.apu_hijo),
            )
            .filter(APU.base_trabajo_id == target_base_id, APU.empresa_id == empresa_id)
            .all()
        )
        source_by_code = {apu.codigo: apu for apu in source_apus}
        target_by_code = {apu.codigo: apu for apu in target_apus}
        shared_codes = sorted(set(source_by_code.keys()) & set(target_by_code.keys()))
        value_sync_candidates = []
        for code in shared_codes:
            if self._apu_needs_value_sync(source_by_code[code], target_by_code[code]):
                value_sync_candidates.append(
                    {
                        "codigo": code,
                        "descripcion": target_by_code[code].descripcion,
                    }
                )

        target_project = self._get_project_for_base(db, target_base_id, empresa_id)
        presupuestos = []
        if target_project:
            presupuestos = (
                db.query(Presupuesto)
                .options(joinedload(Presupuesto.detalle))
                .filter(Presupuesto.proyecto_id == target_project.id, Presupuesto.empresa_id == empresa_id)
                .all()
            )

        presupuestos_con_lineas = sum(1 for presupuesto in presupuestos if any(line.apu_id for line in (presupuesto.detalle or [])))
        lineas_presupuesto = sum(
            1 for presupuesto in presupuestos for line in (presupuesto.detalle or []) if line.apu_id
        )

        return {
            "mode": mode,
            "before": comparison_before,
            "value_sync_candidates": value_sync_candidates,
            "summary": {
                "missing_subcategories": len(comparison_before["missing_subcategories"]) if mode in {"new_apus", "integral"} else 0,
                "missing_resources": len(comparison_before["missing_resources"]) if mode in {"new_apus", "integral"} else 0,
                "missing_apus": len(comparison_before["missing_apus"]) if mode in {"new_apus", "integral"} else 0,
                "value_apus": len(value_sync_candidates) if mode in {"apu_values", "integral"} else 0,
                "divergent_apus_untouched": len(comparison_before["divergent_apus"]) if mode == "new_apus" else 0,
                "presupuestos_afectables": len(presupuestos),
                "presupuestos_con_lineas": presupuestos_con_lineas,
                "lineas_presupuesto": lineas_presupuesto,
            },
        }

    def _snapshot_resource(self, recurso: Recurso) -> Dict[str, Any]:
        return {
            "id": recurso.id,
            "codigo": recurso.codigo,
            "descripcion": recurso.descripcion,
            "descripcion_normalizada": recurso.descripcion_normalizada,
            "precio": str(recurso.precio or 0),
            "unidad_id": recurso.unidad_id,
            "cod_cpc_id": recurso.cod_cpc_id,
            "especificaciones": recurso.especificaciones,
            "subcategoria_item_id": recurso.subcategoria_item_id,
            "revisado": recurso.revisado,
            "revision": recurso.revision,
            "tanteo_activo": recurso.tanteo_activo,
            "precio_original": str(recurso.precio_original) if recurso.precio_original is not None else None,
            "precio_tanteo": str(recurso.precio_tanteo) if recurso.precio_tanteo is not None else None,
            "omniclass_codigo": recurso.omniclass_codigo,
            "omniclass_titulo": recurso.omniclass_titulo,
            "source_recurso_id": recurso.source_recurso_id,
            "content_origin": recurso.content_origin,
            "sync_status": recurso.sync_status,
            "last_sync_at": recurso.last_sync_at.isoformat() if recurso.last_sync_at else None,
        }

    def _snapshot_apu(self, apu: APU) -> Dict[str, Any]:
        return {
            "id": apu.id,
            "codigo": apu.codigo,
            "descripcion": apu.descripcion,
            "descripcion_normalizada": apu.descripcion_normalizada,
            "unidad": apu.unidad,
            "rendimiento_estandar": str(apu.rendimiento_estandar or 0),
            "costo_directo": str(apu.costo_directo or 0),
            "costo_indirecto": str(apu.costo_indirecto or 0),
            "precio_unitario_total": str(apu.precio_unitario_total or 0),
            "moneda": apu.moneda,
            "estado_revision": apu.estado_revision,
            "revision": apu.revision,
            "categoria_id": apu.categoria_id,
            "subcategoria_item_id": apu.subcategoria_item_id,
            "omniclass_codigo": apu.omniclass_codigo,
            "omniclass_titulo": apu.omniclass_titulo,
            "source_apu_id": apu.source_apu_id,
            "content_origin": apu.content_origin,
            "sync_status": apu.sync_status,
            "last_sync_at": apu.last_sync_at.isoformat() if apu.last_sync_at else None,
            "lineas": [
                {
                    "recurso_id": line.recurso_id,
                    "apu_hijo_id": line.apu_hijo_id,
                    "cantidad": str(line.cantidad or 0),
                    "rendimiento": str(line.rendimiento or 0) if line.rendimiento is not None else None,
                    "orden": line.orden,
                    "tanteo_activo": line.tanteo_activo,
                    "rendimiento_original": str(line.rendimiento_original) if line.rendimiento_original is not None else None,
                    "rendimiento_tanteo": str(line.rendimiento_tanteo) if line.rendimiento_tanteo is not None else None,
                    "precio_congelado": str(line.precio_congelado) if line.precio_congelado is not None else None,
                    "subtotal": str(line.subtotal) if line.subtotal is not None else None,
                }
                for line in sorted(apu.lineas or [], key=lambda item: ((item.orden or 0), item.id or 0))
            ],
        }

    def _snapshot_presupuesto(self, presupuesto: Presupuesto) -> Dict[str, Any]:
        return {
            "id": presupuesto.id,
            "subtotal": str(presupuesto.subtotal or 0),
            "indirectos_total": str(presupuesto.indirectos_total or 0),
            "impuestos": str(presupuesto.impuestos or 0),
            "total": str(presupuesto.total or 0),
            "detalle": [
                {
                    "id": line.id,
                    "precio_unitario": str(line.precio_unitario or 0),
                    "precio_total": str(line.precio_total or 0),
                    "tanteo_activo": line.tanteo_activo,
                }
                for line in presupuesto.detalle or []
            ],
        }

    def _restore_resource_snapshot(self, db: Session, snapshot: Dict[str, Any]) -> None:
        recurso = db.query(Recurso).filter(Recurso.id == snapshot["id"]).first()
        if not recurso:
            return
        recurso.descripcion = snapshot["descripcion"]
        recurso.descripcion_normalizada = snapshot["descripcion_normalizada"]
        recurso.precio = Decimal(str(snapshot["precio"] or 0))
        recurso.unidad_id = snapshot["unidad_id"]
        recurso.cod_cpc_id = snapshot["cod_cpc_id"]
        recurso.especificaciones = snapshot["especificaciones"]
        recurso.subcategoria_item_id = snapshot["subcategoria_item_id"]
        recurso.revisado = snapshot["revisado"]
        recurso.revision = snapshot["revision"]
        recurso.tanteo_activo = snapshot["tanteo_activo"]
        recurso.precio_original = Decimal(str(snapshot["precio_original"])) if snapshot["precio_original"] is not None else None
        recurso.precio_tanteo = Decimal(str(snapshot["precio_tanteo"])) if snapshot["precio_tanteo"] is not None else None
        recurso.omniclass_codigo = snapshot["omniclass_codigo"]
        recurso.omniclass_titulo = snapshot["omniclass_titulo"]
        recurso.source_recurso_id = snapshot["source_recurso_id"]
        recurso.content_origin = snapshot["content_origin"]
        recurso.sync_status = snapshot["sync_status"]
        recurso.last_sync_at = datetime.fromisoformat(snapshot["last_sync_at"]) if snapshot["last_sync_at"] else None
        db.add(recurso)

    def _restore_apu_snapshot(self, db: Session, snapshot: Dict[str, Any]) -> None:
        apu = (
            db.query(APU)
            .options(joinedload(APU.lineas))
            .filter(APU.id == snapshot["id"])
            .first()
        )
        if not apu:
            return
        apu.descripcion = snapshot["descripcion"]
        apu.descripcion_normalizada = snapshot["descripcion_normalizada"]
        apu.unidad = snapshot["unidad"]
        apu.rendimiento_estandar = Decimal(str(snapshot["rendimiento_estandar"] or 0))
        apu.costo_directo = Decimal(str(snapshot["costo_directo"] or 0))
        apu.costo_indirecto = Decimal(str(snapshot["costo_indirecto"] or 0))
        apu.precio_unitario_total = Decimal(str(snapshot["precio_unitario_total"] or 0))
        apu.moneda = snapshot["moneda"]
        apu.estado_revision = snapshot["estado_revision"]
        apu.revision = snapshot["revision"]
        apu.categoria_id = snapshot["categoria_id"]
        apu.subcategoria_item_id = snapshot["subcategoria_item_id"]
        apu.omniclass_codigo = snapshot["omniclass_codigo"]
        apu.omniclass_titulo = snapshot["omniclass_titulo"]
        apu.source_apu_id = snapshot["source_apu_id"]
        apu.content_origin = snapshot["content_origin"]
        apu.sync_status = snapshot["sync_status"]
        apu.last_sync_at = datetime.fromisoformat(snapshot["last_sync_at"]) if snapshot["last_sync_at"] else None
        db.query(APULinea).filter(APULinea.apu_id == apu.id).delete(synchronize_session=False)
        db.flush()
        for line in snapshot["lineas"]:
            db.add(
                APULinea(
                    apu_id=apu.id,
                    recurso_id=line["recurso_id"],
                    apu_hijo_id=line["apu_hijo_id"],
                    cantidad=Decimal(str(line["cantidad"] or 0)),
                    rendimiento=Decimal(str(line["rendimiento"])) if line["rendimiento"] is not None else None,
                    orden=line["orden"],
                    tanteo_activo=bool(line["tanteo_activo"]),
                    rendimiento_original=Decimal(str(line["rendimiento_original"])) if line["rendimiento_original"] is not None else None,
                    rendimiento_tanteo=Decimal(str(line["rendimiento_tanteo"])) if line["rendimiento_tanteo"] is not None else None,
                    precio_congelado=Decimal(str(line["precio_congelado"])) if line["precio_congelado"] is not None else None,
                    subtotal=Decimal(str(line["subtotal"])) if line["subtotal"] is not None else None,
                )
            )
        db.flush()
        db.expire(apu, ["lineas"])
        db.add(apu)

    def _restore_presupuesto_snapshot(self, db: Session, snapshot: Dict[str, Any]) -> None:
        presupuesto = (
            db.query(Presupuesto)
            .options(joinedload(Presupuesto.detalle))
            .filter(Presupuesto.id == snapshot["id"])
            .first()
        )
        if not presupuesto:
            return
        presupuesto.subtotal = Decimal(str(snapshot["subtotal"] or 0))
        presupuesto.indirectos_total = Decimal(str(snapshot["indirectos_total"] or 0))
        presupuesto.impuestos = Decimal(str(snapshot["impuestos"] or 0))
        presupuesto.total = Decimal(str(snapshot["total"] or 0))
        lines_by_id = {line.id: line for line in presupuesto.detalle or []}
        for line_snapshot in snapshot["detalle"]:
            line = lines_by_id.get(line_snapshot["id"])
            if not line:
                continue
            line.precio_unitario = Decimal(str(line_snapshot["precio_unitario"] or 0))
            line.precio_total = Decimal(str(line_snapshot["precio_total"] or 0))
            line.tanteo_activo = bool(line_snapshot["tanteo_activo"])
            db.add(line)
        db.add(presupuesto)

    def _collect_presupuestos_for_project(self, db: Session, project_id: Optional[int], empresa_id: int) -> List[Presupuesto]:
        if not project_id:
            return []
        return (
            db.query(Presupuesto)
            .options(joinedload(Presupuesto.detalle))
            .filter(Presupuesto.proyecto_id == project_id, Presupuesto.empresa_id == empresa_id)
            .all()
        )

    def _sync_resource_prices(
        self,
        db: Session,
        source_resources_by_code: Dict[str, Recurso],
        resource_codes: Set[str],
        target_base_id: int,
        empresa_id: int,
        snapshot: Dict[str, Any],
        affected_apu_ids: Set[int],
    ) -> int:
        updated_resources = 0
        if not resource_codes:
            return updated_resources
        target_resources = {
            resource.codigo: resource
            for resource in db.query(Recurso)
            .filter(
                Recurso.base_trabajo_id == target_base_id,
                Recurso.empresa_id == empresa_id,
                Recurso.codigo.in_(list(resource_codes)),
            )
            .all()
        }
        for code in resource_codes:
            source_resource = source_resources_by_code.get(code)
            target_resource = target_resources.get(code)
            if not source_resource or not target_resource:
                continue
            source_price = Decimal(str(source_resource.precio or 0))
            target_price = Decimal(str(target_resource.precio or 0))
            needs_sync = any([
                source_price != target_price,
                int(source_resource.unidad_id or 0) != int(target_resource.unidad_id or 0),
                (source_resource.descripcion or "") != (target_resource.descripcion or ""),
                (source_resource.descripcion_normalizada or "") != (target_resource.descripcion_normalizada or ""),
                int(source_resource.cod_cpc_id or 0) != int(target_resource.cod_cpc_id or 0),
                (source_resource.especificaciones or "") != (target_resource.especificaciones or ""),
                (source_resource.omniclass_codigo or "") != (target_resource.omniclass_codigo or ""),
                (source_resource.omniclass_titulo or "") != (target_resource.omniclass_titulo or ""),
            ])
            if not needs_sync:
                continue
            if target_resource.id not in snapshot["resource_before_by_id"]:
                snapshot["resource_before_by_id"][target_resource.id] = self._snapshot_resource(target_resource)
            target_resource.precio = source_resource.precio
            target_resource.unidad_id = source_resource.unidad_id
            target_resource.descripcion = source_resource.descripcion
            target_resource.descripcion_normalizada = source_resource.descripcion_normalizada
            target_resource.cod_cpc_id = source_resource.cod_cpc_id
            target_resource.especificaciones = source_resource.especificaciones
            target_resource.omniclass_codigo = source_resource.omniclass_codigo
            target_resource.omniclass_titulo = source_resource.omniclass_titulo
            target_resource.source_recurso_id = source_resource.id
            target_resource.content_origin = "inherited"
            target_resource.sync_status = "synced"
            target_resource.last_sync_at = datetime.now(timezone.utc)
            db.add(target_resource)
            updated_resources += 1
            impacted = db.query(APULinea.apu_id).filter(APULinea.recurso_id == target_resource.id).all()
            affected_apu_ids.update(int(apu_id) for (apu_id,) in impacted if apu_id)
        db.flush()
        return updated_resources

    def _sync_existing_apu_values_from_source(
        self,
        db: Session,
        source_apu: APU,
        target_apu: APU,
        source_base_id: int,
        target_base_id: int,
        empresa_id: int,
        target_revision: int,
        created_apus_by_code: Dict[str, APU],
        created_resource_ids: Optional[List[int]] = None,
        created_subcategory_ids: Optional[List[int]] = None,
        created_apu_ids: Optional[List[int]] = None,
    ) -> APU:
        target_subcat = self._ensure_target_subcategory(
            db,
            source_apu.subcategoria_item,
            target_base_id,
            empresa_id,
        )
        target_apu.rendimiento_estandar = source_apu.rendimiento_estandar
        target_apu.moneda = source_apu.moneda
        target_apu.estado_revision = normalize_apu_revision_status(source_apu.estado_revision)
        target_apu.revision = target_revision
        target_apu.categoria_id = source_apu.categoria_id
        target_apu.subcategoria_item_id = target_subcat.id
        target_apu.omniclass_codigo = source_apu.omniclass_codigo
        target_apu.omniclass_titulo = source_apu.omniclass_titulo
        target_apu.source_apu_id = source_apu.id
        target_apu.content_origin = "inherited"
        target_apu.sync_status = "synced"
        target_apu.last_sync_at = datetime.now(timezone.utc)
        db.add(target_apu)
        db.flush()
        self._clone_apu_lines(
            db,
            source_apu,
            target_apu,
            source_base_id,
            target_base_id,
            empresa_id,
            target_revision,
            created_apus_by_code,
            preserve_tanteos=True,
            created_resource_ids=created_resource_ids,
            created_subcategory_ids=created_subcategory_ids,
            created_apu_ids=created_apu_ids,
        )
        return target_apu

    def _apply_budget_refreshes(
        self,
        db: Session,
        project_id: Optional[int],
        empresa_id: int,
        snapshot: Dict[str, Any],
        affected_apu_ids: Set[int],
    ) -> Dict[str, int]:
        presupuestos = self._collect_presupuestos_for_project(db, project_id, empresa_id)
        for presupuesto in presupuestos:
            if presupuesto.id not in snapshot["presupuesto_before_by_id"]:
                snapshot["presupuesto_before_by_id"][presupuesto.id] = self._snapshot_presupuesto(presupuesto)

        refreshed_ids: Set[int] = set()
        for presupuesto in presupuestos:
            refresh_presupuesto_prices(db, presupuesto.id)
            refreshed_ids.add(presupuesto.id)

        return {
            "presupuestos": len(refreshed_ids),
            "lineas_presupuesto": sum(
                1
                for presupuesto in presupuestos
                for line in (presupuesto.detalle or [])
                if line.apu_id
            ),
            "apus_afectados": len(affected_apu_ids),
        }

    def _ensure_target_subcategory(
        self,
        db: Session,
        source_subcat: SubcategoriaItem,
        target_base_id: int,
        empresa_id: int,
        created_subcategory_ids: Optional[List[int]] = None,
    ) -> SubcategoriaItem:
        target = (
            db.query(SubcategoriaItem)
            .filter(
                SubcategoriaItem.base_trabajo_id == target_base_id,
                SubcategoriaItem.empresa_id == empresa_id,
                SubcategoriaItem.subcategoria_codigo == source_subcat.subcategoria_codigo,
                SubcategoriaItem.codigo == source_subcat.codigo,
            )
            .first()
        )
        if target:
            return target

        target = (
            db.query(SubcategoriaItem)
            .filter(
                SubcategoriaItem.base_trabajo_id == target_base_id,
                SubcategoriaItem.empresa_id == empresa_id,
                SubcategoriaItem.subcategoria_codigo == source_subcat.subcategoria_codigo,
                SubcategoriaItem.descripcion == source_subcat.descripcion,
            )
            .first()
        )
        if target:
            return target

        target = SubcategoriaItem(
            codigo=source_subcat.codigo,
            descripcion=source_subcat.descripcion,
            observaciones=source_subcat.observaciones,
            subcategoria_codigo=source_subcat.subcategoria_codigo,
            orden=source_subcat.orden,
            base_trabajo_id=target_base_id,
            empresa_id=empresa_id,
            revisado=source_subcat.revisado,
            omniclass_codigo=source_subcat.omniclass_codigo,
            omniclass_titulo=source_subcat.omniclass_titulo,
        )
        db.add(target)
        db.flush()
        if created_subcategory_ids is not None and target.id not in created_subcategory_ids:
            created_subcategory_ids.append(target.id)
        return target

    def _create_missing_apu_recursive(
        self,
        db: Session,
        source_apu: APU,
        source_base_id: int,
        target_base_id: int,
        empresa_id: int,
        target_revision: int,
        created_apus_by_code: Dict[str, APU],
        created_resource_ids: Optional[List[int]] = None,
        created_subcategory_ids: Optional[List[int]] = None,
        created_apu_ids: Optional[List[int]] = None,
    ) -> APU:
        if source_apu.codigo in created_apus_by_code:
            return created_apus_by_code[source_apu.codigo]

        existing = (
            db.query(APU)
            .filter(
                APU.base_trabajo_id == target_base_id,
                APU.empresa_id == empresa_id,
                APU.codigo == source_apu.codigo,
            )
            .first()
        )
        if existing:
            created_apus_by_code[source_apu.codigo] = existing
            return existing

        target_subcat = self._ensure_target_subcategory(
            db,
            source_apu.subcategoria_item,
            target_base_id,
            empresa_id,
            created_subcategory_ids,
        )
        target = APU(
            codigo=source_apu.codigo,
            descripcion=source_apu.descripcion,
            descripcion_normalizada=source_apu.descripcion_normalizada,
            unidad=canonicalize_unit_symbol(source_apu.unidad),
            rendimiento_estandar=source_apu.rendimiento_estandar,
            costo_directo=source_apu.costo_directo,
            costo_indirecto=source_apu.costo_indirecto,
            precio_unitario_total=source_apu.precio_unitario_total,
            moneda=source_apu.moneda,
            estado_revision=normalize_apu_revision_status(source_apu.estado_revision),
            revision=target_revision,
            categoria_id=source_apu.categoria_id,
            subcategoria_item_id=target_subcat.id,
            empresa_id=empresa_id,
            base_trabajo_id=target_base_id,
            omniclass_codigo=source_apu.omniclass_codigo,
            omniclass_titulo=source_apu.omniclass_titulo,
            source_apu_id=source_apu.id,
            content_origin="inherited",
            sync_status="synced",
            last_sync_at=datetime.now(timezone.utc),
        )
        db.add(target)
        db.flush()
        if created_apu_ids is not None and target.id not in created_apu_ids:
            created_apu_ids.append(target.id)
        created_apus_by_code[source_apu.codigo] = target

        ordered_lines = sorted(source_apu.lineas or [], key=lambda item: ((item.orden or 0), item.id or 0))
        for source_line in ordered_lines:
            target_resource_id = None
            target_child_apu_id = None
            if source_line.recurso_id and source_line.recurso:
                target_resource = self._ensure_target_resource(
                    db,
                    source_line.recurso,
                    target_base_id,
                    empresa_id,
                    target_revision,
                    created_resource_ids,
                    created_subcategory_ids,
                )
                target_resource_id = target_resource.id
            elif source_line.apu_hijo_id and source_line.apu_hijo:
                target_child = self._create_missing_apu_recursive(
                    db,
                    source_line.apu_hijo,
                    source_base_id,
                    target_base_id,
                    empresa_id,
                    target_revision,
                    created_apus_by_code,
                    created_resource_ids,
                    created_subcategory_ids,
                    created_apu_ids,
                )
                target_child_apu_id = target_child.id

            db.add(
                APULinea(
                    apu_id=target.id,
                    recurso_id=target_resource_id,
                    apu_hijo_id=target_child_apu_id,
                    cantidad=source_line.cantidad,
                    rendimiento=source_line.rendimiento,
                    orden=source_line.orden,
                    precio_congelado=source_line.precio_congelado,
                    subtotal=source_line.subtotal,
                    tanteo_activo=False,
                    rendimiento_original=None,
                    rendimiento_tanteo=None,
                )
            )
        db.flush()
        db.expire(target, ["lineas"])
        calculate_apu_price(db, target)
        db.flush()
        return target

    def _ensure_target_resource(
        self,
        db: Session,
        source_resource: Recurso,
        target_base_id: int,
        empresa_id: int,
        target_revision: int,
        created_resource_ids: Optional[List[int]] = None,
        created_subcategory_ids: Optional[List[int]] = None,
    ) -> Recurso:
        target = (
            db.query(Recurso)
            .filter(
                Recurso.base_trabajo_id == target_base_id,
                Recurso.empresa_id == empresa_id,
                Recurso.codigo == source_resource.codigo,
            )
            .first()
        )
        if target:
            return target

        target_subcat = self._ensure_target_subcategory(
            db,
            source_resource.subcategoria_item,
            target_base_id,
            empresa_id,
            created_subcategory_ids,
        )
        target = Recurso(
            codigo=source_resource.codigo,
            descripcion=source_resource.descripcion,
            descripcion_normalizada=source_resource.descripcion_normalizada,
            precio=source_resource.precio,
            unidad_id=source_resource.unidad_id,
            cod_cpc_id=source_resource.cod_cpc_id,
            especificaciones=source_resource.especificaciones,
            subcategoria_item_id=target_subcat.id,
            base_trabajo_id=target_base_id,
            empresa_id=empresa_id,
            revisado=source_resource.revisado,
            revision=target_revision,
            tanteo_activo=False,
            precio_original=None,
            precio_tanteo=None,
            omniclass_codigo=source_resource.omniclass_codigo,
            omniclass_titulo=source_resource.omniclass_titulo,
            source_recurso_id=source_resource.id,
            content_origin="inherited",
            sync_status="synced",
            last_sync_at=datetime.now(timezone.utc),
        )
        db.add(target)
        db.flush()
        if created_resource_ids is not None and target.id not in created_resource_ids:
            created_resource_ids.append(target.id)
        return target

    def _clone_apu_lines(
        self,
        db: Session,
        source_apu: APU,
        target_apu: APU,
        source_base_id: int,
        target_base_id: int,
        empresa_id: int,
        target_revision: int,
        created_apus_by_code: Dict[str, APU],
        preserve_tanteos: bool = False,
        created_resource_ids: Optional[List[int]] = None,
        created_subcategory_ids: Optional[List[int]] = None,
        created_apu_ids: Optional[List[int]] = None,
    ) -> None:
        existing_line_overrides: Dict[tuple[str, str], Dict[str, Any]] = {}
        if preserve_tanteos:
            for existing_line in sorted(target_apu.lineas or [], key=lambda item: ((item.orden or 0), item.id or 0)):
                key = self._line_reference_key(existing_line)
                if not key:
                    continue
                existing_line_overrides[key] = {
                    "tanteo_activo": bool(existing_line.tanteo_activo),
                    "rendimiento": existing_line.rendimiento,
                    "rendimiento_original": existing_line.rendimiento_original,
                    "rendimiento_tanteo": existing_line.rendimiento_tanteo,
                }
        db.query(APULinea).filter(APULinea.apu_id == target_apu.id).delete(synchronize_session=False)
        db.flush()

        ordered_lines = sorted(source_apu.lineas or [], key=lambda item: ((item.orden or 0), item.id or 0))
        for source_line in ordered_lines:
            target_resource_id = None
            target_child_apu_id = None
            if source_line.recurso_id and source_line.recurso:
                target_resource = self._ensure_target_resource(
                    db,
                    source_line.recurso,
                    target_base_id,
                    empresa_id,
                    target_revision,
                    created_resource_ids,
                    created_subcategory_ids,
                )
                target_resource_id = target_resource.id
            elif source_line.apu_hijo_id and source_line.apu_hijo:
                target_child = self._ensure_target_apu(
                    db,
                    source_line.apu_hijo,
                    source_base_id,
                    target_base_id,
                    empresa_id,
                    target_revision,
                    created_apus_by_code,
                    allow_repair=True,
                    created_resource_ids=created_resource_ids,
                    created_subcategory_ids=created_subcategory_ids,
                    created_apu_ids=created_apu_ids,
                )
                target_child_apu_id = target_child.id

            source_key = self._line_reference_key(source_line)
            override = existing_line_overrides.get(source_key) if preserve_tanteos and source_key else None
            target_rendimiento = source_line.rendimiento
            tanteo_activo = False
            rendimiento_original = None
            rendimiento_tanteo = None
            if override and override["tanteo_activo"]:
                tanteo_activo = True
                rendimiento_original = source_line.rendimiento
                rendimiento_tanteo = override["rendimiento_tanteo"] or override["rendimiento"]
                target_rendimiento = rendimiento_tanteo if rendimiento_tanteo is not None else source_line.rendimiento

            db.add(
                APULinea(
                    apu_id=target_apu.id,
                    recurso_id=target_resource_id,
                    apu_hijo_id=target_child_apu_id,
                    cantidad=source_line.cantidad,
                    rendimiento=target_rendimiento,
                    orden=source_line.orden,
                    precio_congelado=source_line.precio_congelado,
                    subtotal=source_line.subtotal,
                    tanteo_activo=tanteo_activo,
                    rendimiento_original=rendimiento_original,
                    rendimiento_tanteo=rendimiento_tanteo,
                )
            )
        db.flush()
        db.expire(target_apu, ["lineas"])
        calculate_apu_price(db, target_apu)
        db.flush()

    def _ensure_target_apu(
        self,
        db: Session,
        source_apu: APU,
        source_base_id: int,
        target_base_id: int,
        empresa_id: int,
        target_revision: int,
        created_apus_by_code: Dict[str, APU],
        allow_repair: bool,
        created_resource_ids: Optional[List[int]] = None,
        created_subcategory_ids: Optional[List[int]] = None,
        created_apu_ids: Optional[List[int]] = None,
    ) -> APU:
        if source_apu.codigo in created_apus_by_code:
            return created_apus_by_code[source_apu.codigo]

        target = (
            db.query(APU)
            .options(joinedload(APU.lineas))
            .filter(
                APU.base_trabajo_id == target_base_id,
                APU.empresa_id == empresa_id,
                APU.codigo == source_apu.codigo,
            )
            .first()
        )

        if not target:
            target_subcat = self._ensure_target_subcategory(
                db,
                source_apu.subcategoria_item,
                target_base_id,
                empresa_id,
                created_subcategory_ids,
            )
            target = APU(
                codigo=source_apu.codigo,
                descripcion=source_apu.descripcion,
                descripcion_normalizada=source_apu.descripcion_normalizada,
                unidad=canonicalize_unit_symbol(source_apu.unidad),
                rendimiento_estandar=source_apu.rendimiento_estandar,
                costo_directo=source_apu.costo_directo,
                costo_indirecto=source_apu.costo_indirecto,
                precio_unitario_total=source_apu.precio_unitario_total,
                moneda=source_apu.moneda,
                estado_revision=normalize_apu_revision_status(source_apu.estado_revision),
                revision=target_revision,
                categoria_id=source_apu.categoria_id,
                subcategoria_item_id=target_subcat.id,
                empresa_id=empresa_id,
                base_trabajo_id=target_base_id,
                omniclass_codigo=source_apu.omniclass_codigo,
                omniclass_titulo=source_apu.omniclass_titulo,
                source_apu_id=source_apu.id,
                content_origin="inherited",
                sync_status="synced",
                last_sync_at=datetime.now(timezone.utc),
            )
            db.add(target)
            db.flush()
            if created_apu_ids is not None and target.id not in created_apu_ids:
                created_apu_ids.append(target.id)
            created_apus_by_code[source_apu.codigo] = target
            self._clone_apu_lines(
                db,
                source_apu,
                target,
                source_base_id,
                target_base_id,
                empresa_id,
                target_revision,
                created_apus_by_code,
                preserve_tanteos=False,
                created_resource_ids=created_resource_ids,
                created_subcategory_ids=created_subcategory_ids,
                created_apu_ids=created_apu_ids,
            )
            return target

        created_apus_by_code[source_apu.codigo] = target
        target_line_count = len(target.lineas or [])
        target_total = Decimal(str(target.precio_unitario_total or 0))
        target_direct = Decimal(str(target.costo_directo or 0))
        target.source_apu_id = source_apu.id
        if target_line_count == len(source_apu.lineas or []) and target_total == Decimal(str(source_apu.precio_unitario_total or 0)):
            target.content_origin = "inherited"
            target.sync_status = "synced"
            target.last_sync_at = datetime.now(timezone.utc)
        elif allow_repair:
            target.content_origin = "inherited"
            target.sync_status = "diverged"
        db.add(target)
        db.flush()

        if allow_repair and self._is_safe_inherited_repair_candidate(source_apu, target):
            target_subcat = self._ensure_target_subcategory(
                db,
                source_apu.subcategoria_item,
                target_base_id,
                empresa_id,
                created_subcategory_ids,
            )
            target.descripcion = source_apu.descripcion
            target.descripcion_normalizada = source_apu.descripcion_normalizada
            target.unidad = canonicalize_unit_symbol(source_apu.unidad)
            target.rendimiento_estandar = source_apu.rendimiento_estandar
            target.moneda = source_apu.moneda
            target.estado_revision = normalize_apu_revision_status(source_apu.estado_revision)
            target.revision = target_revision
            target.categoria_id = source_apu.categoria_id
            target.subcategoria_item_id = target_subcat.id
            target.omniclass_codigo = source_apu.omniclass_codigo
            target.omniclass_titulo = source_apu.omniclass_titulo
            target.source_apu_id = source_apu.id
            target.content_origin = "inherited"
            target.sync_status = "synced"
            target.last_sync_at = datetime.now(timezone.utc)
            db.flush()
            self._clone_apu_lines(
                db,
                source_apu,
                target,
                source_base_id,
                target_base_id,
                empresa_id,
                target_revision,
                created_apus_by_code,
                preserve_tanteos=False,
                created_resource_ids=created_resource_ids,
                created_subcategory_ids=created_subcategory_ids,
                created_apu_ids=created_apu_ids,
            )

        return target

    def reconcile_base(
        self,
        db: Session,
        source_base_id: int,
        target_base_id: int,
        empresa_id: int,
        repair_empty_apus: bool = True,
    ) -> Dict[str, object]:
        target_base = (
            db.query(BaseTrabajo)
            .filter(BaseTrabajo.id == target_base_id, BaseTrabajo.empresa_id == empresa_id)
            .first()
        )
        if not target_base:
            raise ValueError("Base de proyecto no encontrada.")

        comparison_before = self.compare_bases(db, source_base_id, target_base_id, empresa_id)
        target_revision = self._get_target_revision(db, target_base_id, empresa_id)

        source_subcats = (
            db.query(SubcategoriaItem)
            .filter(SubcategoriaItem.base_trabajo_id == source_base_id, SubcategoriaItem.empresa_id == empresa_id)
            .all()
        )
        for source_subcat in source_subcats:
            self._ensure_target_subcategory(db, source_subcat, target_base_id, empresa_id)

        source_resources = (
            db.query(Recurso)
            .options(joinedload(Recurso.subcategoria_item))
            .filter(Recurso.base_trabajo_id == source_base_id, Recurso.empresa_id == empresa_id)
            .all()
        )
        for source_resource in source_resources:
            self._ensure_target_resource(db, source_resource, target_base_id, empresa_id, target_revision)

        created_apus_by_code: Dict[str, APU] = {}
        source_apus = (
            db.query(APU)
            .options(
                joinedload(APU.subcategoria_item),
                joinedload(APU.lineas).joinedload(APULinea.recurso),
                joinedload(APU.lineas).joinedload(APULinea.apu_hijo).joinedload(APU.subcategoria_item),
                joinedload(APU.lineas).joinedload(APULinea.apu_hijo).joinedload(APU.lineas).joinedload(APULinea.recurso),
            )
            .filter(APU.base_trabajo_id == source_base_id, APU.empresa_id == empresa_id)
            .order_by(APU.codigo.asc())
            .all()
        )
        for source_apu in source_apus:
            self._ensure_target_apu(
                db,
                source_apu,
                source_base_id,
                target_base_id,
                empresa_id,
                target_revision,
                created_apus_by_code,
                allow_repair=repair_empty_apus,
            )

        target_base.source_base_id = source_base_id
        if target_base.clone_created_at is None:
            project = self._get_project_for_base(db, target_base_id, empresa_id)
            target_base.clone_created_at = (
                project.fecha_creacion if project and project.fecha_creacion else target_base.fecha_creacion
            )
        target_base.last_reconciled_at = datetime.now(timezone.utc)
        if not target_base.sync_mode:
            target_base.sync_mode = "manual_sync"
        db.add(target_base)
        db.commit()

        target_apu_ids = [
            row[0]
            for row in db.query(APU.id)
            .filter(APU.base_trabajo_id == target_base_id, APU.empresa_id == empresa_id)
            .order_by(APU.id.asc())
            .all()
        ]
        for target_apu_id in target_apu_ids:
            update_apu_operational_price(db, target_apu_id)

        db.refresh(target_base)

        comparison_after = self.compare_bases(db, source_base_id, target_base_id, empresa_id)
        return {
            "source_base_id": source_base_id,
            "target_base_id": target_base_id,
            "empresa_id": empresa_id,
            "before": comparison_before,
            "after": comparison_after,
        }

    def sync_missing_only(
        self,
        db: Session,
        target_base_id: int,
        empresa_id: int,
    ) -> Dict[str, object]:
        target_base, source_base_id, target_revision = self._resolve_project_sync_context(db, target_base_id, empresa_id)
        plan = self._build_sync_missing_plan(db, source_base_id, target_base_id, empresa_id)
        comparison_before = plan["before"]
        target_revision = self._get_target_revision(db, target_base_id, empresa_id)

        source_subcategories = {
            (item.subcategoria_codigo, item.codigo): item
            for item in db.query(SubcategoriaItem)
            .filter(SubcategoriaItem.base_trabajo_id == source_base_id, SubcategoriaItem.empresa_id == empresa_id)
            .all()
        }
        existing_subcategories = {
            (item.subcategoria_codigo, item.codigo)
            for item in db.query(SubcategoriaItem.subcategoria_codigo, SubcategoriaItem.codigo)
            .filter(SubcategoriaItem.base_trabajo_id == target_base_id, SubcategoriaItem.empresa_id == empresa_id)
            .all()
        }
        added_subcategories = 0
        for key, source_subcat in source_subcategories.items():
            if key in existing_subcategories:
                continue
            self._ensure_target_subcategory(db, source_subcat, target_base_id, empresa_id)
            added_subcategories += 1

        source_resources = {
            item.codigo: item
            for item in db.query(Recurso)
            .options(joinedload(Recurso.subcategoria_item))
            .filter(Recurso.base_trabajo_id == source_base_id, Recurso.empresa_id == empresa_id)
            .all()
        }
        existing_resources = {
            row[0]
            for row in db.query(Recurso.codigo)
            .filter(Recurso.base_trabajo_id == target_base_id, Recurso.empresa_id == empresa_id)
            .all()
        }
        added_resources = 0
        for code, source_resource in source_resources.items():
            if code in existing_resources:
                continue
            self._ensure_target_resource(db, source_resource, target_base_id, empresa_id, target_revision)
            added_resources += 1

        source_apus = (
            db.query(APU)
            .options(
                joinedload(APU.subcategoria_item),
                joinedload(APU.lineas).joinedload(APULinea.recurso),
                joinedload(APU.lineas).joinedload(APULinea.apu_hijo).joinedload(APU.subcategoria_item),
                joinedload(APU.lineas).joinedload(APULinea.apu_hijo).joinedload(APU.lineas).joinedload(APULinea.recurso),
            )
            .filter(APU.base_trabajo_id == source_base_id, APU.empresa_id == empresa_id)
            .order_by(APU.codigo.asc())
            .all()
        )
        existing_apus = {
            row[0]: row[1]
            for row in db.query(APU.codigo, APU.id)
            .filter(APU.base_trabajo_id == target_base_id, APU.empresa_id == empresa_id)
            .all()
        }
        created_apus_by_code: Dict[str, APU] = {}
        added_apus = 0
        repaired_apus = 0
        repairable_codes = set(plan["repairable_codes"])
        for source_apu in source_apus:
            existing_apu_id = existing_apus.get(source_apu.codigo)
            if existing_apu_id:
                existing_apu = (
                    db.query(APU)
                    .options(joinedload(APU.lineas))
                    .filter(APU.id == existing_apu_id)
                    .first()
                )
                if existing_apu and source_apu.codigo in repairable_codes:
                    self._ensure_target_apu(
                        db,
                        source_apu,
                        source_base_id,
                        target_base_id,
                        empresa_id,
                        target_revision,
                        created_apus_by_code,
                        allow_repair=True,
                    )
                    repaired_apus += 1
                continue
            self._create_missing_apu_recursive(
                db,
                source_apu,
                source_base_id,
                target_base_id,
                empresa_id,
                target_revision,
                created_apus_by_code,
            )
            added_apus += 1

        target_base.source_base_id = source_base_id
        target_base.last_reconciled_at = datetime.now(timezone.utc)
        if not target_base.sync_mode:
            target_base.sync_mode = "manual_sync"
        db.add(target_base)
        db.commit()
        db.refresh(target_base)

        comparison_after = self.compare_bases(db, source_base_id, target_base_id, empresa_id)
        return {
            "source_base_id": source_base_id,
            "target_base_id": target_base_id,
            "empresa_id": empresa_id,
            "mode": "missing_only",
            "added": {
                "subcategories": added_subcategories,
                "resources": added_resources,
                "apus": added_apus,
            },
            "repaired": {
                "apus": repaired_apus,
            },
            "untouched": {
                "divergent_apus": len(comparison_before["divergent_apus"]),
            },
            "before": comparison_before,
            "after": comparison_after,
        }

    def repair_inherited_only(
        self,
        db: Session,
        target_base_id: int,
        empresa_id: int,
    ) -> Dict[str, object]:
        target_base, source_base_id, target_revision = self._resolve_project_sync_context(db, target_base_id, empresa_id)
        plan = self._build_sync_missing_plan(db, source_base_id, target_base_id, empresa_id)
        comparison_before = plan["before"]
        repairable_codes = set(plan["repairable_codes"])

        source_apus = (
            db.query(APU)
            .options(
                joinedload(APU.subcategoria_item),
                joinedload(APU.lineas).joinedload(APULinea.recurso),
                joinedload(APU.lineas).joinedload(APULinea.apu_hijo).joinedload(APU.subcategoria_item),
                joinedload(APU.lineas).joinedload(APULinea.apu_hijo).joinedload(APU.lineas).joinedload(APULinea.recurso),
            )
            .filter(APU.base_trabajo_id == source_base_id, APU.empresa_id == empresa_id)
            .order_by(APU.codigo.asc())
            .all()
        )
        created_apus_by_code: Dict[str, APU] = {}
        repaired_apus = 0
        for source_apu in source_apus:
            if source_apu.codigo not in repairable_codes:
                continue
            self._ensure_target_apu(
                db,
                source_apu,
                source_base_id,
                target_base_id,
                empresa_id,
                target_revision,
                created_apus_by_code,
                allow_repair=True,
            )
            repaired_apus += 1

        target_base.source_base_id = source_base_id
        target_base.last_reconciled_at = datetime.now(timezone.utc)
        db.add(target_base)
        db.commit()
        db.refresh(target_base)

        comparison_after = self.compare_bases(db, source_base_id, target_base_id, empresa_id)
        return {
            "source_base_id": source_base_id,
            "target_base_id": target_base.id,
            "empresa_id": empresa_id,
            "mode": "repair_inherited_only",
            "repaired": {
                "apus": repaired_apus,
            },
            "before": comparison_before,
            "after": comparison_after,
        }

    def preview_sync_operation(
        self,
        db: Session,
        target_base_id: int,
        empresa_id: int,
        mode: str,
    ) -> Dict[str, Any]:
        if mode not in {"new_apus", "apu_values", "integral"}:
            raise ValueError("Modo de sincronización no válido.")

        target_base, source_base_id, _ = self._resolve_project_sync_context(db, target_base_id, empresa_id)
        target_project = self._get_project_for_base(db, target_base.id, empresa_id)
        plan = self._build_sync_operation_plan(db, source_base_id, target_base.id, empresa_id, mode)

        return {
            "source_base_id": source_base_id,
            "target_base_id": target_base.id,
            "empresa_id": empresa_id,
            "mode": mode,
            "target_revision": int(target_project.revision or 0) if target_project else 0,
            "summary": plan["summary"],
            "before": plan["before"],
            "value_sync_candidates": plan["value_sync_candidates"],
            "revision_targets": self._get_sync_revision_targets(db, target_base.id, empresa_id),
        }

    def execute_sync_operation(
        self,
        db: Session,
        target_base_id: int,
        empresa_id: int,
        mode: str,
    ) -> Dict[str, Any]:
        if mode not in {"new_apus", "apu_values", "integral"}:
            raise ValueError("Modo de sincronización no válido.")

        target_base, source_base_id, target_revision = self._resolve_project_sync_context(db, target_base_id, empresa_id)
        target_project = self._get_project_for_base(db, target_base.id, empresa_id)
        plan = self._build_sync_operation_plan(db, source_base_id, target_base.id, empresa_id, mode)
        comparison_before = plan["before"]

        snapshot: Dict[str, Any] = {
            "resource_before_by_id": {},
            "apu_before_by_id": {},
            "presupuesto_before_by_id": {},
            "created_subcategory_ids": [],
            "created_resource_ids": [],
            "created_apu_ids": [],
            "target_base_before": {
                "last_reconciled_at": target_base.last_reconciled_at.isoformat() if target_base.last_reconciled_at else None,
                "sync_mode": target_base.sync_mode,
            },
        }

        affected_apu_ids: Set[int] = set()
        updated_resources = 0
        added_subcategories = 0
        added_resources = 0
        added_apus = 0
        value_synced_apus = 0

        source_resources_by_code = {
            item.codigo: item
            for item in db.query(Recurso)
            .options(joinedload(Recurso.subcategoria_item))
            .filter(Recurso.base_trabajo_id == source_base_id, Recurso.empresa_id == empresa_id)
            .all()
        }
        target_resource_codes = {
            item.codigo
            for item in db.query(Recurso.codigo)
            .filter(Recurso.base_trabajo_id == target_base.id, Recurso.empresa_id == empresa_id)
            .all()
        }

        source_apus = (
            db.query(APU)
            .options(
                joinedload(APU.subcategoria_item),
                joinedload(APU.lineas).joinedload(APULinea.recurso),
                joinedload(APU.lineas).joinedload(APULinea.apu_hijo).joinedload(APU.subcategoria_item),
                joinedload(APU.lineas).joinedload(APULinea.apu_hijo).joinedload(APU.lineas).joinedload(APULinea.recurso),
            )
            .filter(APU.base_trabajo_id == source_base_id, APU.empresa_id == empresa_id)
            .order_by(APU.codigo.asc())
            .all()
        )
        existing_apus = {
            item.codigo: item
            for item in db.query(APU)
            .options(joinedload(APU.lineas).joinedload(APULinea.recurso), joinedload(APU.lineas).joinedload(APULinea.apu_hijo))
            .filter(APU.base_trabajo_id == target_base.id, APU.empresa_id == empresa_id)
            .all()
        }
        created_apus_by_code: Dict[str, APU] = {}
        synced_resource_codes: Set[str] = set()

        for source_apu in source_apus:
            target_apu = existing_apus.get(source_apu.codigo)
            if not target_apu and mode in {"new_apus", "integral"}:
                created_apu = self._create_missing_apu_recursive(
                    db,
                    source_apu,
                    source_base_id,
                    target_base.id,
                    empresa_id,
                    target_revision,
                    created_apus_by_code,
                    snapshot["created_resource_ids"],
                    snapshot["created_subcategory_ids"],
                    snapshot["created_apu_ids"],
                )
                created_apus_by_code[source_apu.codigo] = created_apu
                affected_apu_ids.add(created_apu.id)
                for line in source_apu.lineas or []:
                    if line.recurso and line.recurso.codigo:
                        synced_resource_codes.add(line.recurso.codigo)
                continue

            if target_apu and mode in {"apu_values", "integral"} and self._apu_needs_value_sync(source_apu, target_apu):
                if target_apu.id not in snapshot["apu_before_by_id"]:
                    snapshot["apu_before_by_id"][target_apu.id] = self._snapshot_apu(target_apu)
                self._sync_existing_apu_values_from_source(
                    db,
                    source_apu,
                    target_apu,
                    source_base_id,
                    target_base.id,
                    empresa_id,
                    target_revision,
                    created_apus_by_code,
                    created_resource_ids=snapshot["created_resource_ids"],
                    created_subcategory_ids=snapshot["created_subcategory_ids"],
                    created_apu_ids=snapshot["created_apu_ids"],
                )
                created_apus_by_code[source_apu.codigo] = target_apu
                affected_apu_ids.add(target_apu.id)
                value_synced_apus += 1
                for line in source_apu.lineas or []:
                    if line.recurso and line.recurso.codigo:
                        synced_resource_codes.add(line.recurso.codigo)

        if mode in {"apu_values", "integral"}:
            synced_resource_codes.update(set(source_resources_by_code.keys()) & target_resource_codes)

        added_subcategories = len(snapshot["created_subcategory_ids"])
        added_resources = len(snapshot["created_resource_ids"])
        added_apus = len(snapshot["created_apu_ids"])

        updated_resources += self._sync_resource_prices(
            db,
            source_resources_by_code,
            synced_resource_codes,
            target_base.id,
            empresa_id,
            snapshot,
            affected_apu_ids,
        )

        for apu_id in sorted(affected_apu_ids):
            update_apu_operational_price(db, apu_id)

        budget_stats = self._apply_budget_refreshes(
            db,
            target_project.id if target_project else None,
            empresa_id,
            snapshot,
            affected_apu_ids,
        )

        target_base.source_base_id = source_base_id
        target_base.last_reconciled_at = datetime.now(timezone.utc)
        target_base.sync_mode = mode
        db.add(target_base)
        db.commit()
        db.refresh(target_base)

        comparison_after = self.compare_bases(db, source_base_id, target_base.id, empresa_id)
        return {
            "source_base_id": source_base_id,
            "target_base_id": target_base.id,
            "empresa_id": empresa_id,
            "mode": mode,
            "target_revision": int(target_project.revision or 0) if target_project else 0,
            "project_id": target_project.id if target_project else None,
            "added": {
                "subcategories": added_subcategories,
                "resources": added_resources,
                "apus": added_apus,
            },
            "updated": {
                "resource_values": updated_resources,
                "apu_values": value_synced_apus,
            },
            "impacts": budget_stats,
            "before": comparison_before,
            "after": comparison_after,
            "undo_snapshot": {
                "created_subcategory_ids": snapshot["created_subcategory_ids"],
                "created_resource_ids": snapshot["created_resource_ids"],
                "created_apu_ids": snapshot["created_apu_ids"],
                "resource_before": list(snapshot["resource_before_by_id"].values()),
                "apu_before": list(snapshot["apu_before_by_id"].values()),
                "presupuesto_before": list(snapshot["presupuesto_before_by_id"].values()),
                "target_base_before": snapshot["target_base_before"],
            },
        }

    def revert_sync_operation(
        self,
        db: Session,
        target_base_id: int,
        empresa_id: int,
        snapshot: Dict[str, Any],
    ) -> Dict[str, Any]:
        target_base = (
            db.query(BaseTrabajo)
            .filter(BaseTrabajo.id == target_base_id, BaseTrabajo.empresa_id == empresa_id)
            .first()
        )
        if not target_base:
            raise ValueError("Base de proyecto no encontrada.")

        target_project = self._get_project_for_base(db, target_base_id, empresa_id)
        affected_apu_ids: Set[int] = set()

        for apu_snapshot in snapshot.get("apu_before", []):
            self._restore_apu_snapshot(db, apu_snapshot)
            affected_apu_ids.add(int(apu_snapshot["id"]))

        created_apu_ids = snapshot.get("created_apu_ids", [])
        if created_apu_ids:
            db.query(APU).filter(
                APU.base_trabajo_id == target_base_id,
                APU.empresa_id == empresa_id,
                APU.id.in_(created_apu_ids),
            ).delete(synchronize_session=False)
            db.flush()

        for resource_snapshot in snapshot.get("resource_before", []):
            self._restore_resource_snapshot(db, resource_snapshot)
            impacted = db.query(APULinea.apu_id).filter(APULinea.recurso_id == resource_snapshot["id"]).all()
            affected_apu_ids.update(int(apu_id) for (apu_id,) in impacted if apu_id)

        created_resource_ids = snapshot.get("created_resource_ids", [])
        if created_resource_ids:
            db.query(Recurso).filter(
                Recurso.base_trabajo_id == target_base_id,
                Recurso.empresa_id == empresa_id,
                Recurso.id.in_(created_resource_ids),
            ).delete(synchronize_session=False)
            db.flush()

        created_subcategory_ids = snapshot.get("created_subcategory_ids", [])
        if created_subcategory_ids:
            db.query(SubcategoriaItem).filter(
                SubcategoriaItem.base_trabajo_id == target_base_id,
                SubcategoriaItem.empresa_id == empresa_id,
                SubcategoriaItem.id.in_(created_subcategory_ids),
            ).delete(synchronize_session=False)
            db.flush()

        for presupuesto_snapshot in snapshot.get("presupuesto_before", []):
            self._restore_presupuesto_snapshot(db, presupuesto_snapshot)

        base_before = snapshot.get("target_base_before") or {}
        target_base.last_reconciled_at = (
            datetime.fromisoformat(base_before["last_reconciled_at"])
            if base_before.get("last_reconciled_at")
            else None
        )
        if base_before.get("sync_mode"):
            target_base.sync_mode = base_before["sync_mode"]
        db.add(target_base)
        db.flush()

        for apu_id in sorted(affected_apu_ids):
            update_apu_operational_price(db, apu_id)

        for presupuesto in self._collect_presupuestos_for_project(db, target_project.id if target_project else None, empresa_id):
            refresh_presupuesto_prices(db, presupuesto.id)

        db.commit()
        db.refresh(target_base)

        return {
            "target_base_id": target_base.id,
            "empresa_id": empresa_id,
            "reverted": {
                "apus_created": len(created_apu_ids),
                "resources_created": len(created_resource_ids),
                "subcategories_created": len(created_subcategory_ids),
                "apus_restored": len(snapshot.get("apu_before", [])),
                "resources_restored": len(snapshot.get("resource_before", [])),
                "presupuestos_restored": len(snapshot.get("presupuesto_before", [])),
            },
        }


project_base_reconciliation_service = ProjectBaseReconciliationService()
