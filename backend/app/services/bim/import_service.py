from sqlalchemy.orm import Session

from app.models.bim_element import BimElement
from app.models.bim_model import BimModel
from app.models.bim_model_version import BimModelVersion
from app.models.bim_storey import BimStorey
from app.schemas.bim_model import (
    BimJsonGeometrySummary,
    BimJsonImportBatchResponse,
    BimJsonImportRequest,
    BimJsonImportResponse,
    BimJsonValidationBatchResponse,
    BimJsonValidationIssue,
    BimJsonValidationSummary,
)
from app.services.bim.model_registry import ensure_bim_domain_tables


def _extract_geometry_bounds(geometry: dict | None):
    geometry = geometry or {}
    points = geometry.get("points")
    if isinstance(points, list) and len(points) >= 2:
        normalized_points = []
        for point in points:
            x = point.get("x") if isinstance(point, dict) else None
            y = point.get("y") if isinstance(point, dict) else None
            if not isinstance(x, (int, float)) or not isinstance(y, (int, float)):
                continue
            normalized_points.append((float(x), float(y)))
        if len(normalized_points) >= 2:
            xs = [point[0] for point in normalized_points]
            ys = [point[1] for point in normalized_points]
            return {
                "type": "polygon" if len(normalized_points) >= 3 else "line",
                "min_x": min(xs),
                "min_y": min(ys),
                "max_x": max(xs),
                "max_y": max(ys),
            }

    rect_keys = ("x", "y", "width", "height")
    if all(isinstance(geometry.get(key), (int, float)) for key in rect_keys):
        x = float(geometry["x"])
        y = float(geometry["y"])
        width = float(geometry["width"])
        height = float(geometry["height"])
        return {
            "type": "rect",
            "min_x": x,
            "min_y": y,
            "max_x": x + width,
            "max_y": y + height,
        }

    return None


def _boxes_overlap(left: dict, right: dict) -> bool:
    return not (
        left["max_x"] <= right["min_x"]
        or right["max_x"] <= left["min_x"]
        or left["max_y"] <= right["min_y"]
        or right["max_y"] <= left["min_y"]
    )


def _supports_overlap_detection(bounds: dict) -> bool:
    return bounds.get("type") in {"rect", "polygon"}


def import_json_bim_package(
    db: Session,
    *,
    project_id: int,
    company_id: int,
    payload: BimJsonImportRequest,
) -> BimJsonImportResponse:
    ensure_bim_domain_tables(db)

    normalized_name = payload.model_name.strip()
    normalized_discipline = (payload.discipline or "").strip() or None

    model = (
        db.query(BimModel)
        .filter(
            BimModel.proyecto_id == project_id,
            BimModel.empresa_id == company_id,
            BimModel.nombre == normalized_name,
            BimModel.disciplina == normalized_discipline,
        )
        .first()
    )

    if not model:
        model = BimModel(
            proyecto_id=project_id,
            empresa_id=company_id,
            nombre=normalized_name,
            descripcion=payload.description,
            disciplina=normalized_discipline,
            archivo_fuente=payload.source_filename,
            activo=True,
        )
        db.add(model)
        db.flush()
    else:
        model.descripcion = payload.description or model.descripcion
        model.archivo_fuente = payload.source_filename or model.archivo_fuente
        model.activo = True

    if payload.activate:
        (
            db.query(BimModelVersion)
            .filter(BimModelVersion.bim_model_id == model.id, BimModelVersion.is_active.is_(True))
            .update({BimModelVersion.is_active: False}, synchronize_session=False)
        )

    version = BimModelVersion(
        bim_model_id=model.id,
        version_label=payload.version_label.strip(),
        source_filename=payload.source_filename,
        artifact_path=None,
        status="ready",
        is_active=payload.activate,
        element_count=len(payload.elements),
        storey_count=len(payload.storeys),
        notes=payload.notes,
    )
    db.add(version)
    db.flush()

    created_storeys = 0
    for index, storey in enumerate(payload.storeys):
        db.add(
            BimStorey(
                bim_model_version_id=version.id,
                nombre=storey.nombre.strip(),
                codigo=storey.codigo,
                orden=storey.orden if storey.orden is not None else index + 1,
            )
        )
        created_storeys += 1

    created_elements = 0
    for element in payload.elements:
        merged_metadata = dict(element.metadata_json or {})
        if element.geometry_2d:
            merged_metadata["geometry_2d"] = element.geometry_2d
        db.add(
            BimElement(
                bim_model_version_id=version.id,
                global_id=element.global_id.strip(),
                ifc_class=element.ifc_class,
                nombre=element.nombre,
                storey_name=element.storey_name,
                system_name=element.system_name,
                classification=element.classification,
                properties=element.properties,
                metadata_json=merged_metadata or None,
                descripcion=element.descripcion,
            )
        )
        created_elements += 1

    db.commit()
    db.refresh(model)
    db.refresh(version)

    return BimJsonImportResponse(
        model_id=model.id,
        version_id=version.id,
        model_name=model.nombre,
        version_label=version.version_label,
        created_storeys=created_storeys,
        created_elements=created_elements,
        activated=version.is_active,
    )


def import_json_bim_batch(
    db: Session,
    *,
    project_id: int,
    company_id: int,
    packages: list[BimJsonImportRequest],
) -> BimJsonImportBatchResponse:
    results = [
        import_json_bim_package(
            db,
            project_id=project_id,
            company_id=company_id,
            payload=payload,
        )
        for payload in packages
    ]
    return BimJsonImportBatchResponse(results=results, imported_count=len(results))


def validate_json_bim_package(payload: BimJsonImportRequest) -> BimJsonValidationSummary:
    issues: list[BimJsonValidationIssue] = []
    storey_names = {storey.nombre.strip() for storey in payload.storeys if storey.nombre.strip()}
    seen_global_ids: set[str] = set()
    spatial_elements: list[tuple[int, str, dict]] = []
    geometry_summary = BimJsonGeometrySummary()

    if not payload.storeys:
        issues.append(
            BimJsonValidationIssue(
                severity="warning",
                code="no_storeys",
                message="El paquete BIM no define niveles; el workspace quedará sin agrupación por storey.",
                path="storeys",
            )
        )

    if not payload.elements:
        issues.append(
            BimJsonValidationIssue(
                severity="error",
                code="no_elements",
                message="El paquete BIM no contiene elementos.",
                path="elements",
            )
        )

    for index, element in enumerate(payload.elements):
        element_path = f"elements[{index}]"
        normalized_global_id = element.global_id.strip()
        if normalized_global_id in seen_global_ids:
            issues.append(
                BimJsonValidationIssue(
                    severity="error",
                    code="duplicate_global_id",
                    message=f"GlobalId duplicado detectado: {normalized_global_id}.",
                    path=f"{element_path}.global_id",
                )
            )
        else:
            seen_global_ids.add(normalized_global_id)

        if element.storey_name and element.storey_name not in storey_names:
            issues.append(
                BimJsonValidationIssue(
                    severity="warning",
                    code="unknown_storey",
                    message=f"El elemento referencia un nivel no declarado: {element.storey_name}.",
                    path=f"{element_path}.storey_name",
                )
            )

        geometry = element.geometry_2d or {}
        has_rect_geometry = all(key in geometry for key in ("x", "y", "width", "height"))
        has_line_geometry = isinstance(geometry.get("points"), list) and len(geometry.get("points") or []) == 2
        has_polygon_geometry = isinstance(geometry.get("points"), list) and len(geometry.get("points") or []) >= 3

        if has_rect_geometry:
            geometry_summary.rect_count += 1
        elif has_line_geometry:
            geometry_summary.line_count += 1
        elif has_polygon_geometry:
            geometry_summary.polygon_count += 1
        else:
            geometry_summary.derived_count += 1

        if geometry and not has_rect_geometry and not has_line_geometry and not has_polygon_geometry:
            issues.append(
                BimJsonValidationIssue(
                    severity="warning",
                    code="unsupported_geometry",
                    message="La geometría 2D del elemento no es rectangular, lineal ni poligonal válida; se usará layout derivado.",
                    path=f"{element_path}.geometry_2d",
                )
            )

        bounds = _extract_geometry_bounds(geometry)
        if bounds:
            span_x = bounds["max_x"] - bounds["min_x"]
            span_y = bounds["max_y"] - bounds["min_y"]
            is_line_geometry = bounds["type"] == "line"
            if bounds["min_x"] < 0 or bounds["min_y"] < 0:
                issues.append(
                    BimJsonValidationIssue(
                        severity="warning",
                        code="negative_geometry_origin",
                        message="La geometría 2D del elemento empieza fuera del cuadrante positivo.",
                        path=f"{element_path}.geometry_2d",
                    )
                )
            if is_line_geometry and span_x <= 0 and span_y <= 0:
                issues.append(
                    BimJsonValidationIssue(
                        severity="error",
                        code="invalid_geometry_size",
                        message="La geometría lineal 2D del elemento no define una longitud válida.",
                        path=f"{element_path}.geometry_2d",
                    )
                )
            if not is_line_geometry and (span_x <= 0 or span_y <= 0):
                issues.append(
                    BimJsonValidationIssue(
                        severity="error",
                        code="invalid_geometry_size",
                        message="La geometría 2D del elemento no tiene área válida.",
                        path=f"{element_path}.geometry_2d",
                    )
                )
            if span_x > 5000 or span_y > 5000:
                issues.append(
                    BimJsonValidationIssue(
                        severity="warning",
                        code="geometry_out_of_range",
                        message="La geometría 2D del elemento supera el rango esperado del viewer técnico.",
                        path=f"{element_path}.geometry_2d",
                    )
                )
            spatial_elements.append((index, normalized_global_id, bounds))

        if not element.ifc_class:
            issues.append(
                BimJsonValidationIssue(
                    severity="warning",
                    code="missing_ifc_class",
                    message="El elemento no define IFC Class.",
                    path=f"{element_path}.ifc_class",
                )
            )

    for left_index, left_global_id, left_bounds in spatial_elements:
        for right_index, right_global_id, right_bounds in spatial_elements:
            if right_index <= left_index:
                continue
            if not _supports_overlap_detection(left_bounds) or not _supports_overlap_detection(right_bounds):
                continue
            if _boxes_overlap(left_bounds, right_bounds):
                issues.append(
                    BimJsonValidationIssue(
                        severity="warning",
                        code="geometry_overlap",
                        message=f"Posible solape entre {left_global_id} y {right_global_id} en el canvas BIM.",
                        path=f"elements[{left_index}].geometry_2d",
                    )
                )

    error_count = sum(1 for issue in issues if issue.severity == "error")
    warning_count = sum(1 for issue in issues if issue.severity == "warning")

    return BimJsonValidationSummary(
        model_name=payload.model_name,
        version_label=payload.version_label,
        storey_count=len(payload.storeys),
        element_count=len(payload.elements),
        issue_count=len(issues),
        error_count=error_count,
        warning_count=warning_count,
        geometry_summary=geometry_summary,
        issues=issues,
    )


def validate_json_bim_batch(packages: list[BimJsonImportRequest]) -> BimJsonValidationBatchResponse:
    results = [validate_json_bim_package(payload) for payload in packages]
    return BimJsonValidationBatchResponse(
        results=results,
        package_count=len(results),
        total_issues=sum(result.issue_count for result in results),
        total_errors=sum(result.error_count for result in results),
        total_warnings=sum(result.warning_count for result in results),
    )
