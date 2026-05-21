from __future__ import annotations

from collections import defaultdict
from decimal import Decimal
from typing import Dict, List, Optional

from sqlalchemy.orm import Session

from app.core.calculation_policy import as_decimal, calculate_apu_line_subtotal
from app.core.rounding import round_decimal
from app.models.apu import APU, APULinea
from app.models.polinomica import FormulaPolinomica, FormulaPolinomicaMonomio, CuadrillaTipo, IndiceINEC
from app.models.presupuesto import Presupuesto
from app.models.recurso import Recurso
from app.repositories.formula_polinomica import formula_polinomica_repo


class FormulaPolinomicaService:
    DEFAULT_TERMS_BY_SUBCATEGORY = {
        1: "E",  # Equipos
        4: "B",  # Mano de obra
    }

    DEFAULT_INDEX_CODES_BY_SYMBOL = {
        "B": "75",
        "C": "28",
        "D": "23",
        "E": "90",
        "M": "53",
        "P": "304",
        "R": "83",
        "X": "822",
    }

    DEFAULT_INDEX_DESCRIPTIONS_BY_SYMBOL = {
        "B": "Cuadrilla Tipo",
        "C": "Combustibles",
        "D": "Cemento Portland",
        "E": "Equipo y maquinaria de Construc. vial",
        "M": "Madera aserrada, cepillada o escuadrada",
        "P": "Petreos Azuay",
        "R": "Repuestos",
        "X": "Indice de precios al consumidor urbano",
    }

    SYMBOL_ORDER = ["B", "C", "D", "E", "M", "P", "R", "X"]
    EQUIPMENT_BREAKDOWN = {
        "B": Decimal("0.10"),
        "C": Decimal("0.10"),
        "E": Decimal("0.70"),
        "R": Decimal("0.10"),
        "X": Decimal("0.00"),
    }
    MAINTENANCE_MECHANIC_SHR = Decimal("3.80")
    MAX_TERMS = 11

    def get_formula(self, db: Session, presupuesto_id: int) -> FormulaPolinomica | None:
        return formula_polinomica_repo.get_by_presupuesto(db, presupuesto_id)

    def get_formula_resources(self, db: Session, presupuesto_id: int) -> List[dict]:
        presupuesto = db.query(Presupuesto).filter(Presupuesto.id == presupuesto_id).first()
        if not presupuesto:
            raise ValueError("Presupuesto no encontrado")

        aggregated = self._aggregate_resources(db, presupuesto)
        formula = formula_polinomica_repo.get_by_presupuesto(db, presupuesto_id)
        assignments = self._get_assignments_map(formula)

        results = []
        for recurso_id, entry in aggregated.items():
            recurso = entry["recurso"]
            if not recurso:
                continue
            sc_code = entry["subcategoria_codigo"]
            default_term = self.DEFAULT_TERMS_BY_SUBCATEGORY.get(sc_code, "")
            termino_manual = assignments.get(recurso_id)
            termino_actual = termino_manual if termino_manual is not None else default_term
            termino_actual = termino_actual or ""
            cat_nombre = entry["categoria"] or "Otros"

            results.append(
                {
                    "recurso_id": recurso_id,
                    "codigo": recurso.codigo,
                    "descripcion": recurso.descripcion,
                    "unidad": recurso.unidad.descripcion if recurso.unidad else "",
                    "precio": float(entry["precio_unitario"]),
                    "costo_total": float(entry["costo_total"]),
                    "cantidad_total": float(entry["cantidad_total"]),
                    "categoria": cat_nombre,
                    "subcategoria_codigo": sc_code,
                    "termino_actual": termino_actual,
                    "termino_sugerido": default_term or "",
                    "es_default": bool(default_term and termino_manual is None),
                }
            )

        return sorted(results, key=lambda item: (item["categoria"], item["descripcion"]))

    def save_assignments(self, db: Session, presupuesto_id: int, assignments: List[dict]):
        formula = self._get_or_create_formula(db, presupuesto_id)
        for ass in assignments:
            simbolo = (ass.get("simbolo") or "").strip().upper()
            recurso_id = ass["recurso_id"]
            if not simbolo:
                formula_polinomica_repo.delete_assignment(db, formula.id, recurso_id)
                continue
            formula_polinomica_repo.upsert_assignment(
                db,
                formula_id=formula.id,
                recurso_id=recurso_id,
                simbolo=simbolo,
            )
        return True

    def save_indices(self, db: Session, presupuesto_id: int, payload: dict) -> FormulaPolinomica:
        formula = self._get_or_create_formula(db, presupuesto_id)
        for item in payload.get("monomios", []):
            simbolo = (item.get("simbolo") or "").strip().upper()
            if simbolo:
                formula_polinomica_repo.update_monomio_index(
                    db,
                    formula_id=formula.id,
                    simbolo=simbolo,
                    indice_inec_id=item.get("indice_inec_id"),
                )
        for item in payload.get("cuadrilla", []):
            recurso_id = item.get("recurso_id")
            if recurso_id is None:
                continue
            formula_polinomica_repo.update_cuadrilla_index(
                db,
                formula_id=formula.id,
                recurso_id=recurso_id,
                indice_inec_id=item.get("indice_inec_id"),
            )
        db.refresh(formula)
        return formula

    def regenerate_formula(self, db: Session, presupuesto_id: int, tipo: str = "SIN_DESGLOSE") -> FormulaPolinomica:
        presupuesto = db.query(Presupuesto).filter(Presupuesto.id == presupuesto_id).first()
        if not presupuesto:
            raise ValueError("Presupuesto no encontrado")

        aggregated = self._aggregate_resources(db, presupuesto)
        formula = self._get_or_create_formula(db, presupuesto_id)
        existing_monomio_indices = {m.simbolo: m.indice_inec_id for m in formula.monomios if m.simbolo}
        existing_cuadrilla_indices = {item.recurso_id: item.indice_inec_id for item in formula.cuadrilla_tipo if item.recurso_id}
        assignments = self._get_assignments_map(formula)
        default_index_ids = self._load_default_index_ids(db)

        costo_directo_total = sum((entry["costo_total"] for entry in aggregated.values()), Decimal("0.0"))
        if costo_directo_total <= 0:
            costo_directo_total = as_decimal(presupuesto.subtotal, "0")
        base_formula = costo_directo_total
        coef_a = Decimal("0.000")

        symbol_totals: Dict[str, Decimal] = defaultdict(lambda: Decimal("0.0"))
        quadrilla_groups: Dict[str, dict] = {}
        pending_resources = 0

        for recurso_id, entry in aggregated.items():
            symbol = self._resolve_effective_symbol(entry["subcategoria_codigo"], assignments.get(recurso_id))
            if not symbol:
                pending_resources += 1
                continue

            costo_total = entry["costo_total"]
            if tipo == "CON_DESGLOSE" and symbol == "E":
                for split_symbol, ratio in self.EQUIPMENT_BREAKDOWN.items():
                    split_cost = costo_total * ratio
                    if split_cost <= 0:
                        continue
                    symbol_totals[split_symbol] += split_cost
                    if split_symbol == "B":
                        self._add_quadrilla_group(
                            quadrilla_groups,
                            key="maintenance_mechanic",
                            recurso_id=recurso_id,
                            descripcion="Mecanico mantenimiento",
                            codigo="B-MANT",
                            cantidad_hh=split_cost / self.MAINTENANCE_MECHANIC_SHR,
                            costo_total=split_cost,
                            precio_unitario=self.MAINTENANCE_MECHANIC_SHR,
                            indice_inec_id=existing_cuadrilla_indices.get(recurso_id),
                        )
                continue

            symbol_totals[symbol] += costo_total

            if symbol == "B":
                self._add_quadrilla_group(
                    quadrilla_groups,
                    key=f"labor:{entry['subcategoria_codigo']}:{entry['categoria']}",
                    recurso_id=recurso_id,
                    descripcion=entry["categoria"] or "Mano de obra",
                    codigo=entry["subcategoria_codigo"] or "B",
                    cantidad_hh=entry["cantidad_total"],
                    costo_total=costo_total,
                    precio_unitario=entry["precio_unitario"],
                    indice_inec_id=existing_cuadrilla_indices.get(recurso_id),
                )

        created_monomios: List[FormulaPolinomicaMonomio] = []
        sum_coeficientes = coef_a
        ordered_symbols = [symbol for symbol in self.SYMBOL_ORDER if symbol_totals.get(symbol, Decimal("0.0")) > 0]
        self._validate_normative_terms(symbol_totals, base_formula, pending_resources)

        coefficient_plan: List[dict] = []
        for symbol in ordered_symbols:
            subtotal = symbol_totals[symbol]
            coef = round_decimal(subtotal / base_formula, 3) if base_formula > 0 else Decimal("0.000")
            indice_id = existing_monomio_indices.get(symbol) or default_index_ids.get(symbol)
            coefficient_plan.append(
                {
                    "simbolo": symbol,
                    "descripcion": self._get_default_description(symbol),
                    "indice_inec_id": indice_id,
                    "coeficiente": coef,
                    "subtotal_termino": subtotal,
                }
            )
            sum_coeficientes += coef

        if coefficient_plan and sum_coeficientes != Decimal("1.000"):
            diff = Decimal("1.000") - sum_coeficientes
            adjustment_target = next(
                (item for item in reversed(coefficient_plan) if item["simbolo"] != "X"),
                coefficient_plan[-1],
            )
            adjustment_target["coeficiente"] = round_decimal(
                as_decimal(adjustment_target["coeficiente"], "0") + diff,
                3,
            )

        formula_polinomica_repo.delete_monomios(db, formula.id)
        formula_polinomica_repo.delete_cuadrilla_tipo(db, formula.id)
        formula = formula_polinomica_repo.update(
            db,
            db_obj=formula,
            obj_in={
                "costo_directo_total": costo_directo_total,
                "coeficiente_fijo": coef_a,
                "tipo": tipo,
                "config_desglose": {symbol: float(ratio) for symbol, ratio in self.EQUIPMENT_BREAKDOWN.items()} if tipo == "CON_DESGLOSE" else None,
            },
        )

        for item in coefficient_plan:
            monomio = formula_polinomica_repo.create_monomio(
                db,
                {
                    "formula_id": formula.id,
                    "simbolo": item["simbolo"],
                    "descripcion": item["descripcion"],
                    "indice_inec_id": item["indice_inec_id"],
                    "coeficiente": item["coeficiente"],
                },
            )
            setattr(monomio, "subtotal_termino", item["subtotal_termino"])
            created_monomios.append(monomio)

        costo_b = symbol_totals.get("B", Decimal("0.0"))
        for item in sorted(quadrilla_groups.values(), key=lambda group: (str(group["descripcion"]), group["recurso_id"])):
            coef_incidencia = round_decimal(item["costo_total"] / costo_b, 4) if costo_b > 0 else Decimal("0.0000")
            cuadrilla_item = formula_polinomica_repo.create_cuadrilla_item(
                db,
                {
                    "formula_id": formula.id,
                    "recurso_id": item["recurso_id"],
                    "indice_inec_id": item["indice_inec_id"],
                    "cantidad_hh": item["cantidad_hh"],
                    "coeficiente_incidencia": coef_incidencia,
                },
            )
            setattr(cuadrilla_item, "costo_directo", item["costo_total"])
            setattr(cuadrilla_item, "salario_minimo", item["precio_unitario"])
            setattr(cuadrilla_item, "trabajo", item["cantidad_hh"])
            setattr(cuadrilla_item, "recurso_descripcion", item["descripcion"])
            setattr(cuadrilla_item, "recurso_codigo", str(item["codigo"]))

        db.refresh(formula)
        return self._decorate_formula_view(
            db,
            presupuesto,
            formula,
            aggregated=aggregated,
            pending_resources=pending_resources,
            symbol_totals=symbol_totals,
        )

    def decorate_formula_view(self, db: Session, presupuesto_id: int, formula: FormulaPolinomica) -> FormulaPolinomica:
        presupuesto = db.query(Presupuesto).filter(Presupuesto.id == presupuesto_id).first()
        if not presupuesto:
            return formula
        aggregated = self._aggregate_resources(db, presupuesto)
        assignments = self._get_assignments_map(formula)
        pending_resources = 0
        symbol_totals: Dict[str, Decimal] = defaultdict(lambda: Decimal("0.0"))
        for recurso_id, entry in aggregated.items():
            symbol = self._resolve_effective_symbol(entry["subcategoria_codigo"], assignments.get(recurso_id))
            if not symbol:
                pending_resources += 1
                continue
            symbol_totals[symbol] += entry["costo_total"]
        return self._decorate_formula_view(
            db,
            presupuesto,
            formula,
            aggregated=aggregated,
            pending_resources=pending_resources,
            symbol_totals=symbol_totals,
        )

    def _decorate_formula_view(
        self,
        db: Session,
        presupuesto: Presupuesto,
        formula: FormulaPolinomica,
        *,
        aggregated: Optional[Dict[int, dict]] = None,
        pending_resources: Optional[int] = None,
        symbol_totals: Optional[Dict[str, Decimal]] = None,
    ) -> FormulaPolinomica:
        aggregated = aggregated or self._aggregate_resources(db, presupuesto)
        assignments = self._get_assignments_map(formula)
        if pending_resources is None or symbol_totals is None:
            pending_resources = 0
            symbol_totals = defaultdict(lambda: Decimal("0.0"))
            for recurso_id, entry in aggregated.items():
                symbol = self._resolve_effective_symbol(entry["subcategoria_codigo"], assignments.get(recurso_id))
                if not symbol:
                    pending_resources += 1
                    continue
                if formula.tipo == "CON_DESGLOSE" and symbol == "E":
                    for split_symbol, ratio in self.EQUIPMENT_BREAKDOWN.items():
                        split_cost = entry["costo_total"] * ratio
                        if split_cost > 0:
                            symbol_totals[split_symbol] += split_cost
                    continue
                symbol_totals[symbol] += entry["costo_total"]

        resource_count = len(aggregated)
        is_complete = resource_count > 0 and pending_resources == 0
        total_indices = sum(symbol_totals.values(), Decimal("0.0"))
        base_formula = sum((entry["costo_total"] for entry in aggregated.values()), Decimal("0.0"))
        if base_formula <= 0:
            base_formula = as_decimal(presupuesto.subtotal, "0")

        monomios_by_symbol = {m.simbolo: m for m in formula.monomios}
        ordered_monomios: List[FormulaPolinomicaMonomio] = []
        for symbol in self.SYMBOL_ORDER:
            monomio = monomios_by_symbol.get(symbol)
            if not monomio:
                continue
            subtotal = symbol_totals.get(symbol, Decimal("0.0"))
            setattr(monomio, "subtotal_termino", subtotal)
            indice = monomio.indice_inec
            fallback_code = self.DEFAULT_INDEX_CODES_BY_SYMBOL.get(symbol, "")
            fallback_description = self.DEFAULT_INDEX_DESCRIPTIONS_BY_SYMBOL.get(symbol, "")
            setattr(monomio, "indice_codigo", indice.codigo if indice else fallback_code)
            setattr(monomio, "indice_descripcion", indice.descripcion if indice else fallback_description)
            ordered_monomios.append(monomio)
        formula.monomios = ordered_monomios

        cuadrilla_group_values = self._rebuild_quadrilla_groups_for_view(aggregated, assignments, formula)
        ordered_cuadrilla = []
        for item in formula.cuadrilla_tipo:
            entry = cuadrilla_group_values.get(item.recurso_id) or aggregated.get(item.recurso_id)
            indice = item.indice_inec
            if not getattr(item, "recurso_codigo", None):
                setattr(item, "recurso_codigo", item.recurso.codigo if item.recurso else "")
            if not getattr(item, "recurso_descripcion", None):
                setattr(
                    item,
                    "recurso_descripcion",
                    entry.get("categoria") if entry else (
                        item.recurso.subcategoria_item.descripcion if item.recurso and item.recurso.subcategoria_item else (item.recurso.descripcion if item.recurso else "")
                    ),
                )
            fallback_code = self.DEFAULT_INDEX_CODES_BY_SYMBOL.get("B", "")
            fallback_description = self.DEFAULT_INDEX_DESCRIPTIONS_BY_SYMBOL.get("B", "")
            setattr(item, "indice_codigo", indice.codigo if indice else fallback_code)
            setattr(item, "indice_descripcion", indice.descripcion if indice else fallback_description)
            if not getattr(item, "salario_minimo", None):
                setattr(item, "salario_minimo", entry["precio_unitario"] if entry else Decimal("0.0"))
            if not getattr(item, "trabajo", None):
                setattr(item, "trabajo", item.cantidad_hh or Decimal("0.0"))
            if not getattr(item, "costo_directo", None):
                setattr(item, "costo_directo", entry["costo_total"] if entry else Decimal("0.0"))
            ordered_cuadrilla.append(item)
        formula.cuadrilla_tipo = ordered_cuadrilla

        setattr(formula, "resources_detected", resource_count)
        setattr(formula, "resources_pending", pending_resources)
        setattr(formula, "is_complete", is_complete)
        setattr(formula, "valor_total_indices", total_indices)
        setattr(formula, "base_formula", base_formula)
        setattr(formula, "formula_general", self._build_formula_general(formula) if is_complete else "")
        setattr(formula, "formula_cuadrilla", self._build_formula_cuadrilla(formula))
        return formula

    def _aggregate_resources(self, db: Session, presupuesto: Presupuesto) -> Dict[int, dict]:
        totals: Dict[int, dict] = {}
        for linea in presupuesto.detalle:
            if not linea.apu_id:
                continue
            apu = db.query(APU).filter(APU.id == linea.apu_id).first()
            if not apu:
                continue
            self._expand_apu_recursive(db, apu, as_decimal(linea.cantidad, "0"), totals)
        return totals

    def _resolve_operational_resource_line_cost(self, linea: APULinea, recurso: Recurso | None) -> Decimal:
        if linea.subtotal is not None:
            return as_decimal(linea.subtotal, "0")

        unit_price = linea.precio_congelado
        if unit_price is None and recurso:
            unit_price = recurso.precio

        return calculate_apu_line_subtotal(
            unit_price=unit_price,
            quantity=linea.cantidad,
            rendimiento=linea.rendimiento,
            money_decimals=4,
            calc_decimals=6,
        )

    def _expand_apu_recursive(self, db: Session, apu: APU, parent_qty: Decimal, totals: Dict[int, dict]):
        for linea in sorted(apu.lineas, key=lambda item: ((item.orden or 0), item.id or 0)):
            line_quantity = as_decimal(linea.cantidad, "0")
            line_rendimiento = as_decimal(linea.rendimiento, "1")
            qty = line_quantity * line_rendimiento * parent_qty

            if linea.recurso_id:
                recurso = db.query(Recurso).filter(Recurso.id == linea.recurso_id).first()
                if recurso:
                    costo = self._resolve_operational_resource_line_cost(linea, recurso) * parent_qty
                    entry = totals.setdefault(
                        linea.recurso_id,
                        {
                            "recurso": recurso,
                            "cantidad_total": Decimal("0.0"),
                            "costo_total": Decimal("0.0"),
                            "precio_unitario": as_decimal(recurso.precio, "0"),
                            "categoria": recurso.subcategoria_item.descripcion if recurso.subcategoria_item else "Otros",
                            "subcategoria_codigo": self._parse_subcategory_code(recurso.subcategoria_item.subcategoria_codigo if recurso.subcategoria_item else None),
                        },
                    )
                    entry["cantidad_total"] += qty
                    entry["costo_total"] += costo
            elif linea.apu_hijo_id:
                hijo = db.query(APU).filter(APU.id == linea.apu_hijo_id).first()
                if hijo:
                    self._expand_apu_recursive(db, hijo, qty, totals)

    def _get_or_create_formula(self, db: Session, presupuesto_id: int) -> FormulaPolinomica:
        formula = formula_polinomica_repo.get_by_presupuesto(db, presupuesto_id)
        if formula:
            return formula
        return formula_polinomica_repo.create(
            db,
            {
                "presupuesto_id": presupuesto_id,
                "costo_directo_total": 0,
                "coeficiente_fijo": 0,
                "tipo": "SIN_DESGLOSE",
            },
        )

    def _get_assignments_map(self, formula: Optional[FormulaPolinomica]) -> Dict[int, Optional[str]]:
        if not formula:
            return {}
        return {
            assignment.recurso_id: (assignment.simbolo.strip().upper() if assignment.simbolo else "")
            for assignment in getattr(formula, "asignaciones", [])
        }

    def _load_default_index_ids(self, db: Session) -> Dict[str, int]:
        indices = (
            db.query(IndiceINEC)
            .filter(IndiceINEC.codigo.in_(list(self.DEFAULT_INDEX_CODES_BY_SYMBOL.values())))
            .all()
        )
        by_code = {indice.codigo: indice.id for indice in indices}
        return {
            symbol: by_code[code]
            for symbol, code in self.DEFAULT_INDEX_CODES_BY_SYMBOL.items()
            if code in by_code
        }

    def _resolve_effective_symbol(self, subcategoria_codigo: Optional[int], assigned_symbol: Optional[str]) -> str:
        if assigned_symbol is not None:
            assigned_symbol = assigned_symbol.strip().upper()
            if assigned_symbol:
                return assigned_symbol
        return self.DEFAULT_TERMS_BY_SUBCATEGORY.get(subcategoria_codigo, "")

    def _add_quadrilla_group(
        self,
        groups: Dict[str, dict],
        *,
        key: str,
        recurso_id: int,
        descripcion: str,
        codigo: object,
        cantidad_hh: Decimal,
        costo_total: Decimal,
        precio_unitario: Decimal,
        indice_inec_id: Optional[int],
    ) -> None:
        group = groups.get(key)
        if not group:
            groups[key] = {
                "recurso_id": recurso_id,
                "descripcion": descripcion,
                "codigo": codigo,
                "cantidad_hh": as_decimal(cantidad_hh, "0"),
                "costo_total": as_decimal(costo_total, "0"),
                "precio_unitario": as_decimal(precio_unitario, "0"),
                "indice_inec_id": indice_inec_id,
            }
            return

        group["cantidad_hh"] += as_decimal(cantidad_hh, "0")
        group["costo_total"] += as_decimal(costo_total, "0")
        if group["cantidad_hh"] > 0:
            group["precio_unitario"] = group["costo_total"] / group["cantidad_hh"]

    def _validate_normative_terms(
        self,
        symbol_totals: Dict[str, Decimal],
        base_formula: Decimal,
        pending_resources: int,
    ) -> None:
        active_terms = [symbol for symbol, total in symbol_totals.items() if total > 0]
        if len(active_terms) > self.MAX_TERMS:
            raise ValueError("La formula polinomica no puede superar 11 terminos incluyendo X")

        if pending_resources > 0 or base_formula <= 0:
            return

    def _rebuild_quadrilla_groups_for_view(
        self,
        aggregated: Dict[int, dict],
        assignments: Dict[int, Optional[str]],
        formula: FormulaPolinomica,
    ) -> Dict[int, dict]:
        groups: Dict[str, dict] = {}
        for recurso_id, entry in aggregated.items():
            symbol = self._resolve_effective_symbol(entry["subcategoria_codigo"], assignments.get(recurso_id))
            if formula.tipo == "CON_DESGLOSE" and symbol == "E":
                mechanic_cost = entry["costo_total"] * self.EQUIPMENT_BREAKDOWN["B"]
                if mechanic_cost > 0:
                    self._add_quadrilla_group(
                        groups,
                        key="maintenance_mechanic",
                        recurso_id=recurso_id,
                        descripcion="Mecanico mantenimiento",
                        codigo="B-MANT",
                        cantidad_hh=mechanic_cost / self.MAINTENANCE_MECHANIC_SHR,
                        costo_total=mechanic_cost,
                        precio_unitario=self.MAINTENANCE_MECHANIC_SHR,
                        indice_inec_id=None,
                    )
                continue
            if symbol == "B":
                self._add_quadrilla_group(
                    groups,
                    key=f"labor:{entry['subcategoria_codigo']}:{entry['categoria']}",
                    recurso_id=recurso_id,
                    descripcion=entry["categoria"] or "Mano de obra",
                    codigo=entry["subcategoria_codigo"] or "B",
                    cantidad_hh=entry["cantidad_total"],
                    costo_total=entry["costo_total"],
                    precio_unitario=entry["precio_unitario"],
                    indice_inec_id=None,
                )

        return {
            group["recurso_id"]: {
                "precio_unitario": group["precio_unitario"],
                "cantidad_total": group["cantidad_hh"],
                "costo_total": group["costo_total"],
                "categoria": group["descripcion"],
                "subcategoria_codigo": group["codigo"],
            }
            for group in groups.values()
        }

    def _parse_subcategory_code(self, raw_code: Optional[str]) -> Optional[int]:
        try:
            return int(raw_code) if raw_code is not None else None
        except Exception:
            return None

    def _build_formula_general(self, formula: FormulaPolinomica) -> str:
        terms = [f"{monomio.coeficiente}{monomio.simbolo}1/{monomio.simbolo}0" for monomio in formula.monomios]
        if not terms:
            return ""
        return f"PR = P0 ({' + '.join(terms)})"

    def _build_formula_cuadrilla(self, formula: FormulaPolinomica) -> str:
        parts = []
        for item in formula.cuadrilla_tipo:
            desc = getattr(item, "indice_descripcion", "") or getattr(item, "recurso_descripcion", "") or "Recurso"
            parts.append(f"{item.coeficiente_incidencia}(SHR {desc})i")
        if not parts:
            return ""
        return f"Bi= {' + '.join(parts)}"

    def _get_default_description(self, simbolo: str) -> str:
        mapping = {
            "A": "Gastos Generales y Utilidad",
            "B": "Mano de Obra (Cuadrilla Tipo)",
            "C": "Combustibles",
            "D": "Cemento",
            "E": "Equipo y Herramientas",
            "M": "Materiales",
            "P": "Pétreos",
            "R": "Repuestos",
            "X": "Otros Materiales y Servicios",
        }
        return mapping.get(simbolo, "Componente de la fórmula")


formula_polinomica_service = FormulaPolinomicaService()
