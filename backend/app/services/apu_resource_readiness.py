from decimal import Decimal
from typing import Any, Dict, List, Optional, Set

from fastapi import HTTPException, status
from sqlalchemy.orm import selectinload


class ApuResourceReadinessService:
    """Valida que los APUs usados en flujos tiempo/recursos tengan recursos hoja."""

    def _decimal_value(self, value: Any, default: str = "0") -> Decimal:
        if value in (None, ""):
            return Decimal(default)
        try:
            return Decimal(str(value))
        except Exception:
            return Decimal(default)

    def _get_apu(self, db: Any, apu_id: int, empresa_id: int) -> Any:
        from app.models.apu import APU, APULinea

        apu = (
            db.query(APU)
            .options(
                selectinload(APU.lineas).selectinload(APULinea.recurso),
                selectinload(APU.lineas).selectinload(APULinea.apu_hijo),
            )
            .filter(APU.id == int(apu_id), APU.empresa_id == int(empresa_id))
            .first()
        )
        return apu

    def _line_factor_is_usable(self, line: Any) -> bool:
        quantity = self._decimal_value(getattr(line, "cantidad", None), "0")
        rendimiento = self._decimal_value(getattr(line, "rendimiento", None), "1")
        return (quantity * rendimiento) > 0

    def _apu_has_usable_resource_leaf(
        self,
        db: Any,
        apu: Any,
        empresa_id: int,
        active_path: Optional[Set[int]] = None,
    ) -> bool:
        apu_id = int(getattr(apu, "id", 0) or 0)
        current_path = set(active_path or set())
        if apu_id and apu_id in current_path:
            return False
        if apu_id:
            current_path.add(apu_id)

        for line in sorted(
            list(getattr(apu, "lineas", []) or []),
            key=lambda item: ((getattr(item, "orden", None) or 0), getattr(item, "id", None) or 0),
        ):
            if not self._line_factor_is_usable(line):
                continue
            recurso = getattr(line, "recurso", None)
            recurso_id = getattr(line, "recurso_id", None) or getattr(recurso, "id", None)
            if recurso is not None or recurso_id:
                return True

            child_apu = getattr(line, "apu_hijo", None)
            child_id = getattr(line, "apu_hijo_id", None)
            if child_apu is None and child_id and db is not None:
                child_apu = self._get_apu(db, int(child_id), empresa_id)
            if child_apu is not None and self._apu_has_usable_resource_leaf(
                db,
                child_apu,
                empresa_id,
                current_path,
            ):
                return True
        return False

    def collect_budget_issues(self, db: Any, presupuesto: Any, empresa_id: int) -> List[Dict[str, Any]]:
        issues: List[Dict[str, Any]] = []
        apu_cache: Dict[int, Any] = {}
        checked_apus: Dict[int, bool] = {}

        for line in list(getattr(presupuesto, "detalle", []) or []):
            apu_id = getattr(line, "apu_id", None)
            if not apu_id:
                continue
            apu_id_int = int(apu_id)
            apu = getattr(line, "apu", None)
            if apu is None and db is not None:
                apu = apu_cache.get(apu_id_int)
                if apu is None:
                    apu = self._get_apu(db, apu_id_int, empresa_id)
                    apu_cache[apu_id_int] = apu
            if apu is None:
                issues.append(self._build_issue(line, None, "APU no encontrado para la linea de presupuesto."))
                continue

            if apu_id_int not in checked_apus:
                checked_apus[apu_id_int] = self._apu_has_usable_resource_leaf(db, apu, empresa_id)
            if checked_apus[apu_id_int]:
                continue
            issues.append(
                self._build_issue(
                    line,
                    apu,
                    "APU sin recursos operativos alcanzables.",
                )
            )
        return issues

    def ensure_budget_ready(self, db: Any, presupuesto: Any, empresa_id: int) -> None:
        issues = self.collect_budget_issues(db, presupuesto, empresa_id)
        if not issues:
            return
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail={
                "code": "apu_resources_incomplete",
                "message": "El presupuesto contiene APUs sin recursos completos. Complete los recursos antes de usar cronogramas, recursos o reportes dependientes.",
                "issues": issues[:20],
                "total_issues": len(issues),
            },
        )

    def _build_issue(self, budget_line: Any, apu: Any, reason: str) -> Dict[str, Any]:
        return {
            "linea_presupuesto_id": getattr(budget_line, "id", None),
            "codigo_item": getattr(budget_line, "codigo_item", None),
            "descripcion": getattr(budget_line, "descripcion", None),
            "apu_id": getattr(apu, "id", None) if apu is not None else getattr(budget_line, "apu_id", None),
            "apu_codigo": getattr(apu, "codigo", None) if apu is not None else None,
            "apu_descripcion": getattr(apu, "descripcion", None) if apu is not None else None,
            "reason": reason,
        }


apu_resource_readiness_service = ApuResourceReadinessService()
