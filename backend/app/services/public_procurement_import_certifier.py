from __future__ import annotations

import re
import unicodedata
from dataclasses import dataclass
from typing import Any

from sqlalchemy.orm import Session

from app.models.apu import APU, APULinea
from app.models.presupuesto import Presupuesto, PresupuestoDetalle
from app.models.recurso import Recurso


PUBLIC_PROCUREMENT_CERTIFICATION_BLOCKED = "blocked"
PUBLIC_PROCUREMENT_CERTIFICATION_VALID = "valid"


def _clean_text(value: Any) -> str:
    return re.sub(r"\s+", " ", str(value or "")).strip()


def _normalize_text(value: Any) -> str:
    text = _clean_text(value).lower()
    text = "".join(
        char for char in unicodedata.normalize("NFD", text)
        if unicodedata.category(char) != "Mn"
    )
    return " ".join(text.split())


def is_invalid_imported_resource_description(value: Any) -> bool:
    """Detects parser drift where numeric row metrics became the resource name."""

    normalized = _normalize_text(value)
    if not normalized:
        return True

    unit_tokens = (
        "hora",
        "h",
        "u",
        "und",
        "m",
        "m2",
        "m3",
        "m3-km",
        "kg",
        "km",
        "lt",
        "l",
        "gl",
        "glb",
        "jornal",
    )
    unit_pattern = "|".join(re.escape(token) for token in sorted(unit_tokens, key=len, reverse=True))
    if re.match(rf"^(?:{unit_pattern})\s+[-+]?\d+(?:[.,]\d+)?(?:\s+[-+]?\d+(?:[.,]\d+)?)*$", normalized):
        return True
    if re.fullmatch(r"(equipo|material|mano de obra|transporte)\s+[a-z]{3}-\d{3,}", normalized):
        return True

    letters = re.findall(r"[a-z]", normalized)
    if len(letters) < 3:
        return True
    return False


@dataclass
class _GraphState:
    reachable_apus: set[int]
    reachable_resources: set[int]
    nested_apus: set[int]
    issues: list[dict[str, Any]]


class PublicProcurementImportCertifier:
    """Certifies the materialized public procurement graph for project bases."""

    def certify_materialized_project(
        self,
        db: Session,
        *,
        empresa_id: int,
        base_trabajo_id: int,
        presupuesto_id: int,
    ) -> dict[str, Any]:
        presupuesto = db.query(Presupuesto).filter(
            Presupuesto.id == presupuesto_id,
            Presupuesto.empresa_id == empresa_id,
        ).first()
        issues: list[dict[str, Any]] = []
        if not presupuesto:
            return self._build_result(
                status=PUBLIC_PROCUREMENT_CERTIFICATION_BLOCKED,
                issues=[self._issue("missing_presupuesto", "Presupuesto no encontrado para certificar.")],
            )

        apus = db.query(APU).filter(
            APU.empresa_id == empresa_id,
            APU.base_trabajo_id == base_trabajo_id,
        ).all()
        recursos = db.query(Recurso).filter(
            Recurso.empresa_id == empresa_id,
            Recurso.base_trabajo_id == base_trabajo_id,
        ).all()
        apu_map = {int(apu.id): apu for apu in apus}
        recurso_map = {int(recurso.id): recurso for recurso in recursos}
        lineas_by_apu: dict[int, list[APULinea]] = {}
        if apu_map:
            for linea in db.query(APULinea).filter(APULinea.apu_id.in_(apu_map.keys())).all():
                lineas_by_apu.setdefault(int(linea.apu_id), []).append(linea)

        rubros = db.query(PresupuestoDetalle).filter(
            PresupuestoDetalle.presupuesto_id == presupuesto_id,
            PresupuestoDetalle.tipo == "RUBRO",
        ).order_by(PresupuestoDetalle.orden.asc(), PresupuestoDetalle.id.asc()).all()
        root_apu_ids: set[int] = set()
        for rubro in rubros:
            if not rubro.apu_id:
                issues.append(self._issue(
                    "budget_line_without_apu",
                    "Linea de presupuesto sin APU asociado.",
                    presupuesto_detalle_id=rubro.id,
                    codigo_item=rubro.codigo_item,
                ))
                continue
            root_apu_ids.add(int(rubro.apu_id))
            if int(rubro.apu_id) not in apu_map:
                issues.append(self._issue(
                    "budget_line_apu_out_of_scope",
                    "El APU de una linea de presupuesto no pertenece a la base/empresa importada.",
                    presupuesto_detalle_id=rubro.id,
                    apu_id=rubro.apu_id,
                ))

        state = _GraphState(
            reachable_apus=set(),
            reachable_resources=set(),
            nested_apus=set(),
            issues=issues,
        )
        for apu_id in sorted(root_apu_ids):
            self._walk_apu(apu_id, apu_map, recurso_map, lineas_by_apu, state, path=[])

        all_apu_ids = set(apu_map.keys())
        all_resource_ids = set(recurso_map.keys())
        orphan_apus = sorted(all_apu_ids - state.reachable_apus)
        orphan_resources = sorted(all_resource_ids - state.reachable_resources)
        for apu_id in orphan_apus:
            apu = apu_map[apu_id]
            state.issues.append(self._issue(
                "orphan_apu",
                "APU no alcanzable desde lineas de presupuesto ni como APU anidado.",
                apu_id=apu.id,
                codigo=apu.codigo,
                descripcion=apu.descripcion,
            ))
        for recurso_id in orphan_resources:
            recurso = recurso_map[recurso_id]
            state.issues.append(self._issue(
                "orphan_resource",
                "Recurso no referenciado por ningun APU alcanzable.",
                recurso_id=recurso.id,
                codigo=recurso.codigo,
                descripcion=recurso.descripcion,
            ))

        for recurso_id in sorted(state.reachable_resources):
            recurso = recurso_map.get(recurso_id)
            if recurso and is_invalid_imported_resource_description(recurso.descripcion):
                state.issues.append(self._issue(
                    "invalid_resource_description",
                    "Recurso con descripcion incompatible con una importacion certificada.",
                    recurso_id=recurso.id,
                    codigo=recurso.codigo,
                    descripcion=recurso.descripcion,
                ))

        status = PUBLIC_PROCUREMENT_CERTIFICATION_BLOCKED if state.issues else PUBLIC_PROCUREMENT_CERTIFICATION_VALID
        return self._build_result(
            status=status,
            issues=state.issues,
            budget_lines_count=len(rubros),
            root_apus_count=len(root_apu_ids),
            nested_apus_count=len(state.nested_apus),
            reachable_apus_count=len(state.reachable_apus),
            reachable_resources_count=len(state.reachable_resources),
            total_apus_count=len(all_apu_ids),
            total_resources_count=len(all_resource_ids),
        )

    def _walk_apu(
        self,
        apu_id: int,
        apu_map: dict[int, APU],
        recurso_map: dict[int, Recurso],
        lineas_by_apu: dict[int, list[APULinea]],
        state: _GraphState,
        *,
        path: list[int],
    ) -> None:
        if apu_id in path:
            state.issues.append(self._issue(
                "nested_apu_cycle",
                "Ciclo detectado en APUs anidados.",
                apu_id=apu_id,
                path=[*path, apu_id],
            ))
            return
        apu = apu_map.get(apu_id)
        if not apu:
            state.issues.append(self._issue("missing_apu", "APU referenciado no existe en la base importada.", apu_id=apu_id))
            return

        state.reachable_apus.add(apu_id)
        lineas = lineas_by_apu.get(apu_id) or []
        if not lineas:
            state.issues.append(self._issue(
                "empty_apu",
                "APU alcanzable sin recursos ni APUs anidados.",
                apu_id=apu.id,
                codigo=apu.codigo,
                descripcion=apu.descripcion,
            ))
            return

        for linea in lineas:
            has_resource = linea.recurso_id is not None
            has_child = linea.apu_hijo_id is not None
            if has_resource == has_child:
                state.issues.append(self._issue(
                    "invalid_apu_line",
                    "Linea APU debe referenciar exactamente un recurso o un APU hijo.",
                    apu_linea_id=linea.id,
                    apu_id=apu_id,
                    recurso_id=linea.recurso_id,
                    apu_hijo_id=linea.apu_hijo_id,
                ))
                continue
            if has_resource:
                recurso_id = int(linea.recurso_id)
                if recurso_id not in recurso_map:
                    state.issues.append(self._issue(
                        "apu_line_resource_out_of_scope",
                        "Linea APU referencia un recurso fuera de la base/empresa importada.",
                        apu_linea_id=linea.id,
                        apu_id=apu_id,
                        recurso_id=recurso_id,
                    ))
                    continue
                state.reachable_resources.add(recurso_id)
                continue

            child_id = int(linea.apu_hijo_id)
            state.nested_apus.add(child_id)
            if child_id not in apu_map:
                state.issues.append(self._issue(
                    "apu_line_child_out_of_scope",
                    "Linea APU referencia un APU hijo fuera de la base/empresa importada.",
                    apu_linea_id=linea.id,
                    apu_id=apu_id,
                    apu_hijo_id=child_id,
                ))
                continue
            self._walk_apu(child_id, apu_map, recurso_map, lineas_by_apu, state, path=[*path, apu_id])

    @staticmethod
    def _issue(code: str, message: str, **extra: Any) -> dict[str, Any]:
        return {"code": code, "message": message, **extra}

    @staticmethod
    def _build_result(
        *,
        status: str,
        issues: list[dict[str, Any]],
        **summary: Any,
    ) -> dict[str, Any]:
        issue_counts: dict[str, int] = {}
        for issue in issues:
            code = str(issue.get("code") or "unknown")
            issue_counts[code] = issue_counts.get(code, 0) + 1
        return {
            "status": status,
            "valid": status == PUBLIC_PROCUREMENT_CERTIFICATION_VALID,
            "issue_counts": issue_counts,
            "issues": issues,
            "summary": summary,
        }


public_procurement_import_certifier = PublicProcurementImportCertifier()
