from decimal import Decimal
from typing import Any, Dict, Optional, Set

from fastapi import HTTPException, status
from sqlalchemy.orm import selectinload

from app.services.apu_explosion import collect_apu_exploded_resources
from app.services.apu_resource_readiness import apu_resource_readiness_service

APU_OPERATIONAL_RESOURCES_METADATA_KEY = "apu_operational_resources_v1"


class CronogramaRecursosService:
    CATEGORY_LABELS = {
        1: "1. Equipo/Herramientas",
        2: "2. Materiales",
        3: "3. Transporte",
        4: "4. Mano de Obra",
    }

    def _decimal_value(self, value: Any, default: str = "0") -> Decimal:
        if value in (None, ""):
            return Decimal(default)
        try:
            return Decimal(str(value))
        except Exception:
            return Decimal(default)

    def _serialize_state(self, state: Any) -> Dict[str, Any]:
        return {
            "source": "cronograma_recursos_state",
            "mode": "persistent_state",
            "presupuesto_id": int(getattr(state, "presupuesto_id", 0) or 0),
            "proyecto_id": int(getattr(state, "proyecto_id", 0) or 0),
            "empresa_id": int(getattr(state, "empresa_id", 0) or 0),
            "version": int(getattr(state, "version", 1) or 1),
            "adjustments": dict(getattr(state, "adjustments", None) or {}),
            "updated_by_id": getattr(state, "updated_by_id", None),
            "updated_at": getattr(state, "updated_at", None),
        }

    def _ensure_state(self, db: Any, presupuesto: Any) -> Any:
        from app.models.cronograma_recursos import CronogramaRecursosState

        state = (
            db.query(CronogramaRecursosState)
            .filter(CronogramaRecursosState.presupuesto_id == presupuesto.id)
            .first()
        )
        if state is not None:
            return state
        state = CronogramaRecursosState(
            empresa_id=presupuesto.empresa_id,
            proyecto_id=presupuesto.proyecto_id,
            presupuesto_id=presupuesto.id,
            version=1,
            adjustments={},
        )
        db.add(state)
        db.commit()
        db.refresh(state)
        return state

    def get_resource_state(self, db: Any, presupuesto: Any) -> Dict[str, Any]:
        return self._serialize_state(self._ensure_state(db, presupuesto))

    def update_resource_state(
        self,
        db: Any,
        presupuesto: Any,
        adjustments: Dict[str, Any],
        expected_version: Optional[int],
        updated_by_id: Optional[int] = None,
    ) -> Dict[str, Any]:
        state = self._ensure_state(db, presupuesto)
        current_version = int(getattr(state, "version", 1) or 1)
        if expected_version is not None and int(expected_version) != current_version:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="El estado de recursos fue actualizado por otro usuario. Recargue antes de guardar.",
            )
        state.adjustments = dict(adjustments or {})
        state.version = current_version + 1
        state.updated_by_id = updated_by_id
        db.add(state)
        db.commit()
        db.refresh(state)
        return self._serialize_state(state)

    def _get_apu(self, db: Any, apu_id: int, empresa_id: int) -> Any:
        from app.models.apu import APU, APULinea
        from app.models.recurso import Recurso

        apu = (
            db.query(APU)
            .options(
                selectinload(APU.subcategoria_item),
                selectinload(APU.lineas)
                .selectinload(APULinea.recurso)
                .selectinload(Recurso.unidad),
                selectinload(APU.lineas)
                .selectinload(APULinea.recurso)
                .selectinload(Recurso.subcategoria_item),
                selectinload(APU.lineas).selectinload(APULinea.apu_hijo),
            )
            .filter(APU.id == apu_id, APU.empresa_id == empresa_id)
            .first()
        )
        if not apu:
            raise ValueError(f"APU no encontrado: {apu_id}")
        return apu

    def _resolve_category(self, recurso: Any, linea: Any = None) -> tuple[int, str]:
        category_id = None
        subcategory = getattr(recurso, "subcategoria_item", None) if recurso else None
        if subcategory is not None:
            category_id = getattr(subcategory, "subcategoria_codigo", None)
        if category_id is None and recurso is not None:
            try:
                category_id = int(str(getattr(recurso, "codigo", "") or "").split("-")[0])
            except (ValueError, IndexError):
                category_id = None
        if category_id is None and linea is not None:
            category_id = getattr(linea, "categoria_id", None)
        try:
            category_id = int(category_id or 1)
        except (TypeError, ValueError):
            category_id = 1
        return category_id, self.CATEGORY_LABELS.get(category_id, f"{category_id}. Recursos")

    def _resolve_subcategory(self, recurso: Any) -> str:
        subcategory = getattr(recurso, "subcategoria_item", None) if recurso else None
        if subcategory is None:
            return "-"
        code = str(getattr(subcategory, "codigo", "") or "").strip()
        description = str(getattr(subcategory, "descripcion", "") or "").strip()
        if code and description:
            return f"{code} - {description}"
        return description or code or "-"

    def _collect_apu_resources(
        self,
        db: Any,
        apu: Any,
        empresa_id: int,
        factor: Decimal,
        accumulator: Dict[int, Dict[str, Any]],
        active_path: Optional[Set[int]] = None,
    ) -> None:
        exploded = collect_apu_exploded_resources(
            apu,
            inherited_factor=factor,
            accumulator={},
            active_path=active_path,
            child_loader=(
                (lambda child_id: self._get_apu(db, int(child_id), empresa_id))
                if db is not None
                else None
            ),
            category_labels=self.CATEGORY_LABELS,
        )
        for item in exploded.values():
            recurso_id = int(item.get("recurso_id") or 0)
            if recurso_id <= 0:
                continue
            category_id = int(item.get("categoria_id") or 1)
            entry = accumulator.setdefault(recurso_id, {
                "recurso_id": recurso_id,
                "categoria_id": category_id,
                "categoria": str(
                    item.get("categoria")
                    or self.CATEGORY_LABELS.get(category_id, f"{category_id}. Recursos")
                ),
                "subcategoria": str(item.get("subcategoria") or "-"),
                "codigo": str(item.get("codigo") or "").strip(),
                "recurso": str(item.get("descripcion") or "").strip(),
                "unidad": str(item.get("unidad") or "").strip(),
                "precio_unitario": self._decimal_value(item.get("precio_unitario")),
                "cantidad_base": Decimal("0"),
            })
            entry["cantidad_base"] += self._decimal_value(item.get("cantidad"))

    def _collect_operational_snapshot_resources(
        self,
        snapshot: Dict[str, Any],
        row_quantity: Decimal,
        accumulator: Dict[int, Dict[str, Any]],
    ) -> bool:
        resources = snapshot.get("resources") if isinstance(snapshot, dict) else None
        if not isinstance(resources, list) or not resources:
            return False

        for item in resources:
            if not isinstance(item, dict):
                continue
            recurso_id = item.get("recurso_id")
            try:
                recurso_id_int = int(recurso_id)
            except (TypeError, ValueError):
                continue

            unit_quantity = self._decimal_value(item.get("cantidad"))
            if unit_quantity == 0:
                continue
            category_id = item.get("categoria_id")
            try:
                category_id = int(category_id or 1)
            except (TypeError, ValueError):
                category_id = 1
            entry = accumulator.setdefault(recurso_id_int, {
                "recurso_id": recurso_id_int,
                "categoria_id": category_id,
                "categoria": str(
                    item.get("categoria")
                    or self.CATEGORY_LABELS.get(category_id, f"{category_id}. Recursos")
                ),
                "subcategoria": str(item.get("subcategoria") or "-"),
                "codigo": str(item.get("codigo") or "").strip(),
                "recurso": str(item.get("descripcion") or item.get("recurso") or "").strip(),
                "unidad": str(item.get("unidad") or "").strip(),
                "precio_unitario": self._decimal_value(item.get("precio_unitario")),
                "cantidad_base": Decimal("0"),
            })
            entry["cantidad_base"] += row_quantity * unit_quantity
        return True

    def build_resource_demand(self, db: Any, presupuesto: Any, cronograma: Any, empresa_id: int) -> Dict[str, Any]:
        apu_resource_readiness_service.ensure_budget_ready(db, presupuesto, empresa_id)
        periods = list(getattr(cronograma, "periods", []) or [])
        period_count = len(periods)
        lines_by_id = {
            int(getattr(line, "id", 0)): line
            for line in list(getattr(presupuesto, "detalle", []) or [])
            if getattr(line, "id", None) is not None
        }
        apu_cache: Dict[int, Any] = {}
        resources: Dict[int, Dict[str, Any]] = {}

        for row in list(getattr(cronograma, "rows", []) or []):
            source_line = lines_by_id.get(int(getattr(row, "linea_id", 0) or 0))
            apu = getattr(source_line, "apu", None) if source_line is not None else None
            apu_id = getattr(row, "apu_id", None) or getattr(source_line, "apu_id", None)
            if apu is None and apu_id:
                apu_id_int = int(apu_id)
                apu = apu_cache.get(apu_id_int)
                if apu is None:
                    apu = self._get_apu(db, apu_id_int, empresa_id)
                    apu_cache[apu_id_int] = apu
            if apu is None:
                continue

            row_resources: Dict[int, Dict[str, Any]] = {}
            row_quantity = self._decimal_value(getattr(row, "cantidad", None) or getattr(source_line, "cantidad", None))
            row_metadata = getattr(row, "metadata", None) or {}
            operational_snapshot = (
                row_metadata.get(APU_OPERATIONAL_RESOURCES_METADATA_KEY)
                if isinstance(row_metadata, dict)
                else None
            )
            consumed_snapshot = self._collect_operational_snapshot_resources(
                operational_snapshot or {},
                row_quantity,
                row_resources,
            )
            if not consumed_snapshot:
                self._collect_apu_resources(db, apu, empresa_id, row_quantity, row_resources)

            distribution = list(getattr(row, "distribution", []) or [])
            distribution = (distribution + [0] * period_count)[:period_count] if period_count else []
            for resource_id, row_resource in row_resources.items():
                target = resources.setdefault(resource_id, {
                    **{key: row_resource[key] for key in (
                        "recurso_id",
                        "categoria_id",
                        "categoria",
                        "subcategoria",
                        "codigo",
                        "recurso",
                        "unidad",
                        "precio_unitario",
                    )},
                    "periodos": [
                        {
                            "periodo_id": str(getattr(period, "id", None) or f"P{index + 1}"),
                            "label": str(getattr(period, "label", None) or f"P{index + 1}"),
                            "cantidad": Decimal("0"),
                            "costo": Decimal("0"),
                        }
                        for index, period in enumerate(periods)
                    ],
                    "cantidad_total": Decimal("0"),
                    "costo_total": Decimal("0"),
                })
                quantity_base = self._decimal_value(row_resource.get("cantidad_base"))
                price = self._decimal_value(row_resource.get("precio_unitario"))
                if period_count:
                    for index, pct in enumerate(distribution):
                        period_quantity = quantity_base * self._decimal_value(pct) / Decimal("100")
                        target["periodos"][index]["cantidad"] += period_quantity
                        target["periodos"][index]["costo"] += period_quantity * price
                target["cantidad_total"] += quantity_base
                target["costo_total"] += quantity_base * price

        rows = [
            {
                **resource,
                "precio_unitario": float(resource["precio_unitario"]),
                "periodos": [
                    {
                        **period,
                        "cantidad": float(period["cantidad"]),
                        "costo": float(period["costo"]),
                    }
                    for period in resource["periodos"]
                ],
                "cantidad_total": float(resource["cantidad_total"]),
                "costo_total": float(resource["costo_total"]),
            }
            for resource in resources.values()
            if resource["cantidad_total"] > 0
        ]
        rows.sort(key=lambda item: (
            int(item.get("categoria_id") or 0),
            str(item.get("subcategoria") or ""),
            str(item.get("recurso") or ""),
            str(item.get("codigo") or ""),
        ))

        period_totals = []
        for index, period in enumerate(periods):
            period_totals.append({
                "periodo_id": str(getattr(period, "id", None) or f"P{index + 1}"),
                "label": str(getattr(period, "label", None) or f"P{index + 1}"),
                "cantidad": sum(float(row["periodos"][index]["cantidad"]) for row in rows),
                "costo": sum(float(row["periodos"][index]["costo"]) for row in rows),
            })

        return {
            "source": "cronograma_valorado",
            "mode": "read_only",
            "presupuesto_id": getattr(presupuesto, "id", None),
            "empresa_id": empresa_id,
            "period_type": getattr(cronograma, "period_type", None),
            "distribution_mode": getattr(cronograma, "distribution_mode", None),
            "periodos": period_totals,
            "recursos": rows,
            "summary": {
                "recursos": len(rows),
                "periodos": len(periods),
                "cantidad_total": sum(float(row.get("cantidad_total") or 0) for row in rows),
                "costo_total": sum(float(row.get("costo_total") or 0) for row in rows),
            },
        }


cronograma_recursos_service = CronogramaRecursosService()
