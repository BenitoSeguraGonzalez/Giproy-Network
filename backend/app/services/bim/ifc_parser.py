import hashlib
import re
from collections import Counter
from dataclasses import dataclass

from app.schemas.bim_model import (
    BimImportElementPayload,
    BimImportStoreyPayload,
    BimJsonImportRequest,
)


IFC_ELEMENT_CLASSES = {
    "IFCAIRTERMINAL",
    "IFCBEAM",
    "IFCBUILDINGELEMENTPROXY",
    "IFCCOLUMN",
    "IFCCURTAINWALL",
    "IFCDOOR",
    "IFCDUCTSEGMENT",
    "IFCDISTRIBUTIONCHAMBERELEMENT",
    "IFCDISTRIBUTIONCONTROLELEMENT",
    "IFCDISTRIBUTIONELEMENT",
    "IFCDISTRIBUTIONFLOWELEMENT",
    "IFCENERGYCONVERSIONDEVICE",
    "IFCFOOTING",
    "IFCFLOWCONTROLLER",
    "IFCFLOWFITTING",
    "IFCFLOWMOVINGDEVICE",
    "IFCFLOWSEGMENT",
    "IFCFLOWSTORAGEDEVICE",
    "IFCFLOWTERMINAL",
    "IFCFLOWTREATMENTDEVICE",
    "IFCMEMBER",
    "IFCPLATE",
    "IFCRAILING",
    "IFCRAMP",
    "IFCRAMPFLIGHT",
    "IFCROOF",
    "IFCSLAB",
    "IFCSTAIR",
    "IFCSTAIRFLIGHT",
    "IFCWALL",
    "IFCWALLSTANDARDCASE",
    "IFCWINDOW",
}


@dataclass(frozen=True)
class ParsedIfcRecord:
    step_id: str
    ifc_class: str
    args: list[str]
    raw: str


@dataclass(frozen=True)
class ParsedIfcSummary:
    checksum_sha256: str
    entity_count: int
    ifc_class_counts: dict[str, int]
    storey_count: int
    element_count: int


@dataclass(frozen=True)
class ParsedIfcPackage:
    payload: BimJsonImportRequest
    summary: ParsedIfcSummary


def parse_ifc_text_to_bim_package(
    *,
    ifc_text: str,
    model_name: str,
    version_label: str,
    source_filename: str,
    discipline: str | None = None,
    description: str | None = None,
    notes: str | None = None,
    activate: bool = True,
) -> ParsedIfcPackage:
    checksum = hashlib.sha256(ifc_text.encode("utf-8")).hexdigest()
    records = _parse_ifc_records(ifc_text)
    class_counts = Counter(record.ifc_class for record in records)
    records_by_step_id = {record.step_id: record for record in records}

    storeys = _build_storeys(records)
    storey_names_by_step_id = _build_storey_names_by_step_id(records)
    element_storeys = _build_element_storey_map(records, storey_names_by_step_id)
    element_properties = _build_element_property_map(records, records_by_step_id)
    element_quantities = _build_element_quantity_map(records, records_by_step_id)
    element_materials = _build_element_material_map(records, records_by_step_id)
    element_systems = _build_element_system_map(records, records_by_step_id)
    elements = _build_elements(records, element_storeys, element_properties, element_quantities, element_materials, element_systems)
    import_notes = _merge_notes(
        notes,
        [
            "ifc_semantic_parser=step_text_v1",
            f"sha256={checksum}",
            f"ifc_entities={len(records)}",
            f"ifc_classes={len(class_counts)}",
        ],
    )

    payload = BimJsonImportRequest(
        model_name=model_name,
        discipline=discipline,
        description=description,
        source_filename=source_filename,
        version_label=version_label,
        notes=import_notes,
        activate=activate,
        storeys=storeys,
        elements=elements,
    )
    summary = ParsedIfcSummary(
        checksum_sha256=checksum,
        entity_count=len(records),
        ifc_class_counts=dict(sorted(class_counts.items())),
        storey_count=len(storeys),
        element_count=len(elements),
    )
    return ParsedIfcPackage(payload=payload, summary=summary)


def _parse_ifc_records(ifc_text: str) -> list[ParsedIfcRecord]:
    records: list[ParsedIfcRecord] = []
    for match in re.finditer(r"#(?P<id>\d+)\s*=\s*(?P<class>IFC[A-Z0-9_]+)\s*\((?P<args>.*?)\)\s*;", ifc_text, re.DOTALL):
        records.append(
            ParsedIfcRecord(
                step_id=match.group("id"),
                ifc_class=match.group("class").upper(),
                args=_split_ifc_args(match.group("args")),
                raw=match.group(0),
            )
        )
    return records


def _split_ifc_args(args_text: str) -> list[str]:
    args: list[str] = []
    current: list[str] = []
    depth = 0
    in_string = False
    index = 0
    while index < len(args_text):
        char = args_text[index]
        current.append(char)
        if char == "'":
            if index + 1 < len(args_text) and args_text[index + 1] == "'":
                current.append(args_text[index + 1])
                index += 2
                continue
            in_string = not in_string
        elif not in_string:
            if char == "(":
                depth += 1
            elif char == ")" and depth > 0:
                depth -= 1
            elif char == "," and depth == 0:
                current.pop()
                args.append("".join(current).strip())
                current = []
        index += 1
    if current:
        args.append("".join(current).strip())
    return args


def _build_storeys(records: list[ParsedIfcRecord]) -> list[BimImportStoreyPayload]:
    storeys: list[BimImportStoreyPayload] = []
    seen_names: set[str] = set()
    for record in records:
        if record.ifc_class != "IFCBUILDINGSTOREY":
            continue
        name = _ifc_string_arg(record.args, 2) or _ifc_string_arg(record.args, 7) or f"Storey #{record.step_id}"
        if name in seen_names:
            continue
        seen_names.add(name)
        storeys.append(
            BimImportStoreyPayload(
                nombre=name,
                codigo=f"IFC#{record.step_id}",
                orden=len(storeys) + 1,
            )
        )
    return storeys


def _build_storey_names_by_step_id(records: list[ParsedIfcRecord]) -> dict[str, str]:
    storey_names: dict[str, str] = {}
    for record in records:
        if record.ifc_class != "IFCBUILDINGSTOREY":
            continue
        storey_names[record.step_id] = _ifc_string_arg(record.args, 2) or _ifc_string_arg(record.args, 7) or f"Storey #{record.step_id}"
    return storey_names


def _build_element_storey_map(records: list[ParsedIfcRecord], storey_names_by_step_id: dict[str, str]) -> dict[str, str]:
    element_storeys: dict[str, str] = {}
    for record in records:
        if record.ifc_class != "IFCRELCONTAINEDINSPATIALSTRUCTURE":
            continue
        related_elements = _ifc_refs_arg(record.args, 4)
        relating_structure = _ifc_ref_arg(record.args, 5)
        storey_name = storey_names_by_step_id.get(relating_structure or "")
        if not storey_name:
            continue
        for element_step_id in related_elements:
            element_storeys[element_step_id] = storey_name
    return element_storeys


def _build_element_property_map(
    records: list[ParsedIfcRecord],
    records_by_step_id: dict[str, ParsedIfcRecord],
) -> dict[str, dict[str, str | int | float | bool]]:
    property_sets_by_step_id: dict[str, dict[str, str | int | float | bool]] = {}
    for record in records:
        if record.ifc_class != "IFCPROPERTYSET":
            continue
        properties: dict[str, str | int | float | bool] = {}
        for property_step_id in _ifc_refs_arg(record.args, 4):
            property_record = records_by_step_id.get(property_step_id)
            if not property_record or property_record.ifc_class != "IFCPROPERTYSINGLEVALUE":
                continue
            property_name = _ifc_string_arg(property_record.args, 0)
            if not property_name:
                continue
            properties[property_name] = _ifc_typed_value_arg(property_record.args, 2)
        if properties:
            property_sets_by_step_id[record.step_id] = properties

    element_properties: dict[str, dict[str, str | int | float | bool]] = {}
    for record in records:
        if record.ifc_class != "IFCRELDEFINESBYPROPERTIES":
            continue
        related_elements = _ifc_refs_arg(record.args, 4)
        property_set_id = _ifc_ref_arg(record.args, 5)
        property_set = property_sets_by_step_id.get(property_set_id or "")
        if not property_set:
            continue
        for element_step_id in related_elements:
            element_properties.setdefault(element_step_id, {}).update(property_set)
    return element_properties


def _build_element_quantity_map(
    records: list[ParsedIfcRecord],
    records_by_step_id: dict[str, ParsedIfcRecord],
) -> dict[str, dict[str, str | int | float | bool]]:
    quantity_sets_by_step_id: dict[str, dict[str, str | int | float | bool]] = {}
    for record in records:
        if record.ifc_class != "IFCELEMENTQUANTITY":
            continue
        quantity_set_name = _ifc_string_arg(record.args, 2) or f"QuantitySet #{record.step_id}"
        quantities: dict[str, str | int | float | bool] = {}
        for quantity_step_id in _ifc_refs_arg(record.args, 5):
            quantity_record = records_by_step_id.get(quantity_step_id)
            if not quantity_record or not quantity_record.ifc_class.startswith("IFCQUANTITY"):
                continue
            quantity_name = _ifc_string_arg(quantity_record.args, 0)
            if not quantity_name:
                continue
            quantities[f"{quantity_set_name}.{quantity_name}"] = _ifc_typed_value_arg(quantity_record.args, 3)
        if quantities:
            quantity_sets_by_step_id[record.step_id] = quantities

    element_quantities: dict[str, dict[str, str | int | float | bool]] = {}
    for record in records:
        if record.ifc_class != "IFCRELDEFINESBYPROPERTIES":
            continue
        related_elements = _ifc_refs_arg(record.args, 4)
        quantity_set_id = _ifc_ref_arg(record.args, 5)
        quantity_set = quantity_sets_by_step_id.get(quantity_set_id or "")
        if not quantity_set:
            continue
        for element_step_id in related_elements:
            element_quantities.setdefault(element_step_id, {}).update(quantity_set)
    return element_quantities


def _build_element_material_map(
    records: list[ParsedIfcRecord],
    records_by_step_id: dict[str, ParsedIfcRecord],
) -> dict[str, list[str]]:
    element_materials: dict[str, list[str]] = {}
    for record in records:
        if record.ifc_class != "IFCRELASSOCIATESMATERIAL":
            continue
        material_names = _resolve_material_names(_ifc_ref_arg(record.args, 5), records_by_step_id)
        if not material_names:
            continue
        for element_step_id in _ifc_refs_arg(record.args, 4):
            existing = element_materials.setdefault(element_step_id, [])
            for material_name in material_names:
                if material_name not in existing:
                    existing.append(material_name)
    return element_materials


def _build_element_system_map(
    records: list[ParsedIfcRecord],
    records_by_step_id: dict[str, ParsedIfcRecord],
) -> dict[str, str]:
    element_systems: dict[str, str] = {}
    for record in records:
        if record.ifc_class != "IFCRELASSIGNSTOGROUP":
            continue
        group_id = _ifc_ref_arg(record.args, 6)
        group_record = records_by_step_id.get(group_id or "")
        if not group_record or group_record.ifc_class != "IFCSYSTEM":
            continue
        system_name = _ifc_string_arg(group_record.args, 2) or _ifc_string_arg(group_record.args, 0)
        if not system_name:
            continue
        for element_step_id in _ifc_refs_arg(record.args, 4):
            element_systems[element_step_id] = system_name
    return element_systems


def _build_elements(
    records: list[ParsedIfcRecord],
    element_storeys: dict[str, str],
    element_properties: dict[str, dict[str, str | int | float | bool]],
    element_quantities: dict[str, dict[str, str | int | float | bool]],
    element_materials: dict[str, list[str]],
    element_systems: dict[str, str],
) -> list[BimImportElementPayload]:
    elements: list[BimImportElementPayload] = []
    seen_global_ids: set[str] = set()
    for record in records:
        if record.ifc_class not in IFC_ELEMENT_CLASSES:
            continue
        global_id = _ifc_string_arg(record.args, 0) or f"IFCSTEP-{record.step_id}"
        if global_id in seen_global_ids:
            global_id = f"{global_id}-{record.step_id}"
        seen_global_ids.add(global_id)
        name = _ifc_string_arg(record.args, 2)
        description = _ifc_string_arg(record.args, 3)
        properties = {
            "ifc_step_id": f"#{record.step_id}",
            "ifc_raw_class": record.ifc_class,
            **element_properties.get(record.step_id, {}),
            **{f"Quantity.{key}": value for key, value in element_quantities.get(record.step_id, {}).items()},
        }
        materials = element_materials.get(record.step_id, [])
        system_name = element_systems.get(record.step_id)
        elements.append(
            BimImportElementPayload(
                global_id=global_id,
                ifc_class=record.ifc_class,
                nombre=name or f"{record.ifc_class} #{record.step_id}",
                storey_name=element_storeys.get(record.step_id),
                system_name=system_name,
                descripcion=description,
                properties=properties,
                metadata_json={
                    "ifc_source": "step_text_v1",
                    "ifc_step_id": f"#{record.step_id}",
                    "ifc_property_count": len(element_properties.get(record.step_id, {})),
                    "ifc_quantity_count": len(element_quantities.get(record.step_id, {})),
                    "ifc_materials": materials,
                    "ifc_system_name": system_name,
                },
            )
        )
    return elements


def _ifc_string_arg(args: list[str], index: int) -> str | None:
    if index >= len(args):
        return None
    value = args[index].strip()
    if not (value.startswith("'") and value.endswith("'")):
        return None
    normalized = value[1:-1].replace("''", "'").strip()
    return normalized or None


def _ifc_ref_arg(args: list[str], index: int) -> str | None:
    if index >= len(args):
        return None
    match = re.fullmatch(r"#(\d+)", args[index].strip())
    return match.group(1) if match else None


def _ifc_refs_arg(args: list[str], index: int) -> list[str]:
    if index >= len(args):
        return []
    return re.findall(r"#(\d+)", args[index])


def _resolve_material_names(material_step_id: str | None, records_by_step_id: dict[str, ParsedIfcRecord]) -> list[str]:
    if not material_step_id:
        return []
    record = records_by_step_id.get(material_step_id)
    if not record:
        return []
    if record.ifc_class == "IFCMATERIAL":
        material_name = _ifc_string_arg(record.args, 0)
        return [material_name] if material_name else []
    names: list[str] = []
    for nested_step_id in _ifc_refs_arg(record.args, 0):
        for material_name in _resolve_material_names(nested_step_id, records_by_step_id):
            if material_name not in names:
                names.append(material_name)
    return names


def _ifc_typed_value_arg(args: list[str], index: int) -> str | int | float | bool:
    if index >= len(args):
        return ""
    value = args[index].strip()
    string_value = _ifc_string_arg(args, index)
    if string_value is not None:
        return string_value
    if value.upper() in {".T.", "TRUE"}:
        return True
    if value.upper() in {".F.", "FALSE"}:
        return False
    try:
        numeric = float(value)
        return int(numeric) if numeric.is_integer() else numeric
    except ValueError:
        pass
    typed_match = re.fullmatch(r"IFC[A-Z0-9_]+\((.*)\)", value, re.DOTALL)
    if typed_match:
        inner = typed_match.group(1).strip()
        if inner.upper() in {".T.", "TRUE"}:
            return True
        if inner.upper() in {".F.", "FALSE"}:
            return False
        quoted = _ifc_string_arg([inner], 0)
        if quoted is not None:
            return quoted
        try:
            numeric = float(inner)
            return int(numeric) if numeric.is_integer() else numeric
        except ValueError:
            return inner
    return value


def _merge_notes(notes: str | None, metadata_lines: list[str]) -> str:
    normalized_notes = (notes or "").strip()
    metadata = "; ".join(metadata_lines)
    return "\n".join(line for line in [normalized_notes, metadata] if line)
