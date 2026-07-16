from decimal import Decimal
from typing import Any, Callable, Dict, Optional, Set


PERFORMANCE_RESOURCE_CATEGORY_IDS = {1, 4}
DEFAULT_CATEGORY_LABELS = {
    1: "equipos_herramientas",
    2: "materiales",
    3: "transporte",
    4: "mano_obra",
    5: "apu_hijo",
}


def as_decimal(value: Any, default: str = "0") -> Decimal:
    if value in (None, ""):
        return Decimal(default)
    try:
        return Decimal(str(value))
    except Exception:
        return Decimal(default)


def resolve_resource_category_id(line: Any, resource: Any = None) -> int:
    if getattr(line, "apu_hijo_id", None):
        return 5

    subcategory = getattr(resource, "subcategoria_item", None) if resource is not None else None
    category_id = getattr(subcategory, "subcategoria_codigo", None) if subcategory is not None else None
    if category_id is None and resource is not None:
        try:
            category_id = int(str(getattr(resource, "codigo", "") or "").split("-")[0])
        except (ValueError, IndexError):
            category_id = None
    if category_id is None:
        category_id = getattr(line, "categoria_id", None)
    try:
        return int(category_id or 1)
    except (TypeError, ValueError):
        return 1


def resolve_resource_unit_label(resource: Any = None) -> str:
    unit = getattr(resource, "unidad", None) if resource is not None else None
    return str(
        getattr(unit, "simbolo", None)
        or getattr(unit, "descripcion", None)
        or ""
    ).strip()


def resolve_resource_subcategory_label(resource: Any = None) -> str:
    subcategory = getattr(resource, "subcategoria_item", None) if resource is not None else None
    if subcategory is None:
        return "-"
    code = str(getattr(subcategory, "codigo", "") or "").strip()
    description = str(getattr(subcategory, "descripcion", "") or "").strip()
    if code and description:
        return f"{code} - {description}"
    return description or code or "-"


def resolve_resource_price(line: Any, resource: Any = None) -> Decimal:
    frozen_price = as_decimal(getattr(line, "precio_congelado", None), "0")
    if frozen_price > 0:
        return frozen_price
    return as_decimal(getattr(resource, "precio", None), "0")


def build_operational_resource_key(
    *,
    resource_id: int,
    category_id: int,
    unit_label: str,
    price: Decimal,
) -> str:
    return "|".join(
        [
            str(int(resource_id)),
            str(int(category_id)),
            unit_label.strip().lower(),
            str(price.normalize() if price else Decimal("0")),
        ]
    )


def resolve_exploded_resource_quantities(
    *,
    native_quantity: Decimal,
    rendimiento: Decimal,
    inherited_factor: Decimal,
    nested: bool,
    category_id: int,
) -> tuple[Decimal, Decimal]:
    if nested and int(category_id) in PERFORMANCE_RESOURCE_CATEGORY_IDS:
        equivalent_quantity = native_quantity
        relative_work = native_quantity * rendimiento * inherited_factor
        return equivalent_quantity, relative_work

    equivalent_quantity = inherited_factor * native_quantity
    relative_work = equivalent_quantity * rendimiento
    return equivalent_quantity, relative_work


def collect_apu_exploded_resources(
    apu: Any,
    *,
    inherited_factor: Decimal = Decimal("1"),
    nested: bool = False,
    accumulator: Optional[Dict[str, Dict[str, Any]]] = None,
    active_path: Optional[Set[int]] = None,
    child_loader: Optional[Callable[[int], Any]] = None,
    category_labels: Optional[Dict[int, str]] = None,
) -> Dict[str, Dict[str, Any]]:
    accumulator = accumulator if accumulator is not None else {}
    if not apu:
        return accumulator

    labels = category_labels or DEFAULT_CATEGORY_LABELS
    apu_id = int(getattr(apu, "id", 0) or 0)
    current_path = set(active_path or set())
    if apu_id and apu_id in current_path:
        return accumulator
    if apu_id:
        current_path.add(apu_id)

    ordered_lines = sorted(
        list(getattr(apu, "lineas", []) or []),
        key=lambda item: ((getattr(item, "orden", None) or 0), getattr(item, "id", None) or 0),
    )
    for line in ordered_lines:
        quantity = as_decimal(getattr(line, "cantidad", None), "0")
        rendimiento = as_decimal(getattr(line, "rendimiento", None), "1")
        line_factor = inherited_factor * quantity * rendimiento
        if line_factor == 0:
            continue

        child_id = getattr(line, "apu_hijo_id", None)
        child_apu = getattr(line, "apu_hijo", None)
        if child_id or child_apu is not None:
            if child_apu is None and child_loader is not None and child_id:
                child_apu = child_loader(int(child_id))
            if child_apu is not None:
                collect_apu_exploded_resources(
                    child_apu,
                    inherited_factor=line_factor,
                    nested=True,
                    accumulator=accumulator,
                    active_path=current_path,
                    child_loader=child_loader,
                    category_labels=labels,
                )
            continue

        resource = getattr(line, "recurso", None)
        resource_id = getattr(line, "recurso_id", None) or getattr(resource, "id", None)
        if resource is None or resource_id is None:
            continue

        category_id = resolve_resource_category_id(line, resource)
        category_label = labels.get(category_id, "materiales")
        unit_label = resolve_resource_unit_label(resource)
        price = resolve_resource_price(line, resource)
        key = build_operational_resource_key(
            resource_id=int(resource_id),
            category_id=category_id,
            unit_label=unit_label,
            price=price,
        )
        entry = accumulator.setdefault(
            key,
            {
                "key": key,
                "recurso_id": int(resource_id),
                "codigo": str(getattr(resource, "codigo", "") or "").strip(),
                "descripcion": str(getattr(resource, "descripcion", "") or "").strip(),
                "categoria_id": category_id,
                "categoria": category_label,
                "subcategoria": resolve_resource_subcategory_label(resource),
                "unidad": unit_label,
                "precio_unitario": price,
                "cantidad": Decimal("0"),
                "trabajo_relativo": Decimal("0"),
                "direct_sources": 0,
                "nested_sources": 0,
                "source_lines": [],
            },
        )
        equivalent_quantity, relative_work = resolve_exploded_resource_quantities(
            native_quantity=quantity,
            rendimiento=rendimiento,
            inherited_factor=inherited_factor,
            nested=bool(nested),
            category_id=category_id,
        )
        entry["cantidad"] += equivalent_quantity
        entry["trabajo_relativo"] += relative_work
        if nested:
            entry["nested_sources"] += 1
        else:
            entry["direct_sources"] += 1
        entry["source_lines"].append(
            {
                "linea_id": getattr(line, "id", None),
                "apu_id": getattr(line, "apu_id", None),
                "apu_codigo": str(getattr(apu, "codigo", "") or "").strip(),
                "apu_descripcion": str(getattr(apu, "descripcion", "") or "").strip(),
                "apu_unidad": str(getattr(apu, "unidad", "") or "").strip(),
                "nested": bool(nested),
                "inherited_factor": round(float(inherited_factor), 6),
                "native_cantidad": round(float(quantity), 6),
                "original_cantidad": round(float(equivalent_quantity), 6),
                "cantidad": round(float(equivalent_quantity), 6),
                "rendimiento": round(float(rendimiento), 6),
                "trabajo_relativo": round(float(relative_work), 6),
            }
        )

    return accumulator
