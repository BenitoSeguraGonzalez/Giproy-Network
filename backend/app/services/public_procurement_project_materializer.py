from __future__ import annotations

from decimal import Decimal, InvalidOperation
from typing import Any
import unicodedata

from sqlalchemy import func
from sqlalchemy.orm import Session

from app.constants.indirectos import FIXED_INDIRECTOS
from app.models.apu import APU, APULinea
from app.models.base_trabajo import BaseTrabajo
from app.models.codcpc import CodCPC
from app.models.edt import EdtNode, TipoNodoEdt
from app.models.empresa import Empresa
from app.models.presupuesto import Presupuesto, PresupuestoDetalle, PresupuestoIndirecto
from app.models.proyecto import Proyecto
from app.models.proyecto_apu_cpc import ProyectoApuCpc
from app.models.recurso import Recurso
from app.models.subcategoria_item import SubcategoriaItem
from app.models.unidad import Unidad
from app.repositories.base_trabajo import base_trabajo_repo
from app.services.public_procurement_import_certifier import public_procurement_import_certifier
from app.services.presupuesto import calculate_presupuesto_totals


RESOURCE_TYPE_TO_CATEGORY = {
    "equipo": 1,
    "equipment": 1,
    "material": 2,
    "materiales": 2,
    "transporte": 3,
    "transport": 3,
    "mano_obra": 4,
    "mano de obra": 4,
    "labor": 4,
}

PUBLIC_PROCUREMENT_CONTENT_ORIGIN = "public_proc_import"


def _clean_text(value: Any, fallback: str = "") -> str:
    text = str(value or "").strip()
    return text or fallback


def _normalize_text(value: Any) -> str:
    text = _clean_text(value).lower()
    text = "".join(
        char for char in unicodedata.normalize("NFD", text)
        if unicodedata.category(char) != "Mn"
    )
    return " ".join(text.split())


def _to_decimal(value: Any, fallback: str = "0") -> Decimal:
    if value is None or value == "":
        return Decimal(fallback)
    try:
        return Decimal(str(value).replace(",", "."))
    except (InvalidOperation, ValueError):
        return Decimal(fallback)


def _safe_code(value: Any, fallback: str, *, max_length: int = 100) -> str:
    code = _clean_text(value)
    if not code:
        code = fallback
    return code[:max_length]


def _build_signature(*parts: Any) -> str:
    return "|".join(_normalize_text(part) for part in parts if _clean_text(part))


def _resolve_resource_category_code(resource_payload: dict[str, Any]) -> int:
    resource_type = _normalize_text(resource_payload.get("resource_type") or resource_payload.get("tipo"))
    return RESOURCE_TYPE_TO_CATEGORY.get(resource_type, 2)


def _resolve_line_rendimiento(resource_payload: dict[str, Any]) -> Decimal:
    category_code = _resolve_resource_category_code(resource_payload)
    if category_code not in (1, 4):
        return Decimal("1")
    rendimiento = _to_decimal(resource_payload.get("rendimiento"), "1")
    return rendimiento if rendimiento > 0 else Decimal("1")


class PublicProcurementProjectMaterializer:
    def materialize(
        self,
        db: Session,
        *,
        analysis: dict[str, Any],
        empresa_id: int,
        project_name: str | None = None,
        current_user_id: int | None = None,
        superadmin_incident_consent: bool = False,
    ) -> dict[str, Any]:
        if not isinstance(analysis, dict):
            raise ValueError("El analisis de importacion no es valido.")

        budget_rows = list(analysis.get("rubros") or analysis.get("analysis_bundle", {}).get("budget_items") or [])
        if not budget_rows:
            raise ValueError("El analisis no contiene rubros de presupuesto para materializar.")

        summary = dict((analysis.get("analysis_bundle") or {}).get("summary") or analysis.get("summary") or {})
        blocking_incidents = list(summary.get("blocking_incidents") or [])
        diagnostics = dict(summary.get("import_diagnostics") or {})
        diagnostic_issue_codes = {
            _clean_text(issue.get("code"))
            for issue in diagnostics.get("issues", [])
            if isinstance(issue, dict)
        }
        if "format_not_supported" in diagnostic_issue_codes:
            raise ValueError("Formato no recogido para importacion. Ajuste o active un modelo antes de crear el proyecto.")
        if blocking_incidents and not superadmin_incident_consent:
            raise ValueError("La importacion tiene incidencias bloqueantes. Requiere consentimiento expreso del superadministrador.")

        empresa = db.query(Empresa).filter(Empresa.id == empresa_id).first()
        if not empresa:
            raise ValueError("Empresa no encontrada para materializar la compra publica.")

        analysis_bundle = dict(analysis.get("analysis_bundle") or {})
        bundle_apus = list(analysis_bundle.get("apus") or analysis_bundle.get("sample_reconciled_apus") or analysis_bundle.get("sample_apus") or [])
        generated_apus = list(analysis.get("generated_apus") or [])
        bundle_resources = list(analysis_bundle.get("resources") or analysis.get("sample_resources") or [])
        materialization_scope = self._collect_materialization_scope(budget_rows, bundle_apus, generated_apus, bundle_resources)

        project_title = (
            _clean_text(project_name)
            or _clean_text(analysis.get("title"))
            or _clean_text(analysis.get("source_filename"))
            or "Compra publica importada"
        )
        total_amount = sum((_to_decimal(row.get("precio_total")) for row in budget_rows), Decimal("0"))

        try:
            base = self._create_base(db, empresa, project_title)
            subcategories = self._ensure_default_subcategories(db, base.id, empresa.id)
            import_traceability = self._build_project_import_traceability(
                analysis=analysis,
                materialization_scope=materialization_scope,
                blocking_incidents=blocking_incidents,
                superadmin_incident_consent=superadmin_incident_consent,
            )
            proyecto = self._create_project(db, empresa, base, project_title, total_amount, import_traceability)
            presupuesto = self._create_budget(db, proyecto, empresa)
            resource_map = self._create_resources(db, materialization_scope["resources"], base, empresa, subcategories)
            apu_map = self._create_apus(
                db,
                budget_rows,
                materialization_scope["apus"],
                materialization_scope["apu_resources"],
                resource_map,
                base,
                empresa,
                subcategories,
            )
            chapter_nodes, chapter_details = self._create_edt_chapters(db, budget_rows, proyecto, empresa, presupuesto)
            self._create_budget_lines(db, budget_rows, presupuesto, chapter_nodes, chapter_details, apu_map)
            cpc_assignments = self._assign_project_apu_cpc(db, budget_rows, proyecto, empresa, apu_map, current_user_id)
            self._ensure_indirectos(db, presupuesto, empresa)
            calculate_presupuesto_totals(db, presupuesto)
            certification = public_procurement_import_certifier.certify_materialized_project(
                db,
                empresa_id=empresa.id,
                base_trabajo_id=base.id,
                presupuesto_id=presupuesto.id,
            )
            if not certification.get("valid"):
                raise ValueError(self._format_certification_error(certification))
            self._store_certification_trace(proyecto, certification)
            db.commit()
        except Exception:
            db.rollback()
            raise

        db.refresh(proyecto)
        db.refresh(base)
        db.refresh(presupuesto)

        return {
            "proyecto_id": proyecto.id,
            "codigo": proyecto.codigo,
            "codigo_root": proyecto.codigo_root,
            "base_trabajo_id": base.id,
            "presupuesto_id": presupuesto.id,
            "created_by_user_id": current_user_id,
            "summary": {
                "rubros_count": len(budget_rows),
                "chapters_count": len(chapter_nodes),
                "apus_count": len({apu.id for apu in apu_map.values()}),
                "resources_count": len({resource.id for resource in resource_map.values()}),
                "empty_apus_count": int(materialization_scope.get("empty_apus_count") or 0),
                "apu_cpc_assignments_count": cpc_assignments,
                "blocking_incidents_accepted": bool(blocking_incidents and superadmin_incident_consent),
                "certification_status": certification.get("status"),
                "presupuesto_total": float(presupuesto.total or 0),
                "presupuesto_subtotal": float(presupuesto.subtotal or 0),
            },
        }

    def _create_base(self, db: Session, empresa: Empresa, project_title: str) -> BaseTrabajo:
        base = BaseTrabajo(
            codigo_unico=base_trabajo_repo.get_next_code(db, empresa.id),
            nombre=f"Base: {project_title}"[:255],
            tipo="Base de Proyecto",
            descripcion=f"Base importada desde compra publica para el proyecto {project_title}"[:500],
            porcentaje_indirectos=Decimal("0"),
            activa=False,
            tipo_rendimiento="Rendimiento Unitario (Tiempo/Unidad)",
            unidad_tiempo="Hora",
            pais_id=getattr(empresa, "pais_id", None),
            moneda="USD",
            empresa_id=empresa.id,
        )
        db.add(base)
        db.flush()
        return base

    def _ensure_default_subcategories(self, db: Session, base_id: int, empresa_id: int) -> dict[int, SubcategoriaItem]:
        result: dict[int, SubcategoriaItem] = {}
        for category_code in range(1, 6):
            subcategory = db.query(SubcategoriaItem).filter(
                SubcategoriaItem.base_trabajo_id == base_id,
                SubcategoriaItem.empresa_id == empresa_id,
                SubcategoriaItem.subcategoria_codigo == category_code,
                SubcategoriaItem.descripcion == "General",
            ).first()
            if not subcategory:
                subcategory = SubcategoriaItem(
                    codigo=f"{category_code}-001",
                    descripcion="General",
                    subcategoria_codigo=category_code,
                    base_trabajo_id=base_id,
                    empresa_id=empresa_id,
                    revisado=True,
                )
                db.add(subcategory)
                db.flush()
            result[category_code] = subcategory
        return result

    def _build_project_import_traceability(
        self,
        *,
        analysis: dict[str, Any],
        materialization_scope: dict[str, Any],
        blocking_incidents: list[Any],
        superadmin_incident_consent: bool,
    ) -> dict[str, Any]:
        contract = dict(analysis.get("technical_import_contract") or {})
        summary = dict((analysis.get("analysis_bundle") or {}).get("summary") or analysis.get("summary") or {})
        return {
            "origin": "public_procurement_import",
            "source_filename": _clean_text(analysis.get("source_filename")),
            "parser_profile": _clean_text(contract.get("parser_profile") or summary.get("parser_profile")),
            "profile_id": _clean_text(contract.get("profile_id") or (summary.get("import_model") or {}).get("profile_id")),
            "profile_name": _clean_text(contract.get("profile_name") or (summary.get("import_model") or {}).get("profile_name")),
            "profile_version": _clean_text(contract.get("profile_version") or summary.get("profile_version")),
            "document_kind": _clean_text(contract.get("document_kind") or summary.get("document_kind")),
            "technical_validation_status": "accepted_with_incidents" if blocking_incidents and superadmin_incident_consent else "valid",
            "economic_validation": summary.get("economic_validation"),
            "export_readiness": summary.get("export_readiness"),
            "import_diagnostics": summary.get("import_diagnostics"),
            "blocking_incidents_count": len(blocking_incidents),
            "blocking_incidents_accepted": bool(blocking_incidents and superadmin_incident_consent),
            "empty_apus_count": int(materialization_scope.get("empty_apus_count") or 0),
            "materialized_apus_count": len(materialization_scope.get("apus") or []),
            "materialized_resources_count": len(materialization_scope.get("resources") or []),
        }

    def _create_project(
        self,
        db: Session,
        empresa: Empresa,
        base: BaseTrabajo,
        project_title: str,
        total_amount: Decimal,
        import_traceability: dict[str, Any],
    ) -> Proyecto:
        prefix = empresa.proy_prefijo or empresa.nombre.replace(" ", "")[:20]
        period = empresa.proy_periodo or "2026"
        current_sequence = int(empresa.proy_secuencial or 1)
        sequence_size = int(empresa.proy_secuencial_size or 9)

        while True:
            code = f"{prefix}-{period}-{str(current_sequence).zfill(sequence_size)}"
            exists = db.query(Proyecto.id).filter(
                Proyecto.codigo == code,
                Proyecto.empresa_id == empresa.id,
            ).first()
            if not exists:
                break
            current_sequence += 1

        empresa.proy_secuencial = current_sequence + 1
        db.add(empresa)

        project_config = dict(empresa.plantillas_config or {})
        project_config["public_procurement_import"] = import_traceability

        proyecto = Proyecto(
            codigo=code,
            codigo_root=code,
            revision=0,
            nombre=project_title[:255],
            descripcion="Proyecto creado desde importador de compras publicas.",
            estado="Planificación",
            presupuesto_estimado=total_amount,
            moneda="USD",
            empresa_id=empresa.id,
            base_trabajo_id=base.id,
            plantillas_config=project_config,
        )
        db.add(proyecto)
        db.flush()
        return proyecto

    def _create_budget(self, db: Session, proyecto: Proyecto, empresa: Empresa) -> Presupuesto:
        presupuesto = Presupuesto(
            proyecto_id=proyecto.id,
            empresa_id=empresa.id,
            descripcion="Presupuesto importado de compra publica",
            revision=0,
            estado="En Elaboración",
            moneda=proyecto.moneda or "USD",
        )
        db.add(presupuesto)
        db.flush()
        return presupuesto

    def _resolve_unit_id(self, db: Session, unit_label: Any, category_code: int, empresa_id: int, base_id: int) -> int:
        unit_text = _clean_text(unit_label, "u")
        normalized = _normalize_text(unit_text)
        query = db.query(Unidad).filter(Unidad.subcategoria_codigo == category_code)
        units = query.filter(
            (Unidad.es_global == True) |
            (Unidad.empresa_id == empresa_id) |
            (Unidad.base_trabajo_id == base_id)
        ).all()
        for unit in units:
            if _normalize_text(unit.descripcion) == normalized or _normalize_text(unit.descripcion_completa) == normalized:
                return unit.id
        if units:
            return units[0].id

        any_unit = db.query(Unidad).first()
        if any_unit:
            return any_unit.id
        raise ValueError("No existen unidades disponibles para crear recursos importados.")

    def _build_unit_cache(self, db: Session, empresa_id: int, base_id: int) -> tuple[dict[int, dict[str, int]], int | None]:
        units = db.query(Unidad).filter(
            (Unidad.es_global == True) |
            (Unidad.empresa_id == empresa_id) |
            (Unidad.base_trabajo_id == base_id)
        ).all()
        cache: dict[int, dict[str, int]] = {}
        fallback_id = getattr(units[0], "id", None) if units else getattr(db.query(Unidad).first(), "id", None)
        for unit in units:
            category = int(unit.subcategoria_codigo or 0)
            bucket = cache.setdefault(category, {})
            for value in (unit.descripcion, unit.descripcion_completa):
                normalized = _normalize_text(value)
                if normalized and normalized not in bucket:
                    bucket[normalized] = unit.id
        return cache, fallback_id

    def _resolve_unit_id_cached(
        self,
        unit_label: Any,
        category_code: int,
        unit_cache: dict[int, dict[str, int]],
        fallback_unit_id: int | None,
    ) -> int:
        normalized = _normalize_text(_clean_text(unit_label, "u"))
        bucket = unit_cache.get(category_code) or {}
        if normalized in bucket:
            return bucket[normalized]
        if bucket:
            return next(iter(bucket.values()))
        if fallback_unit_id:
            return fallback_unit_id
        raise ValueError("No existen unidades disponibles para crear recursos importados.")

    def _build_cpc_cache(self, db: Session, codes: set[str]) -> dict[str, int]:
        normalized_codes = {_clean_text(code) for code in codes if _clean_text(code)}
        if not normalized_codes:
            return {}
        rows = db.query(CodCPC).filter(CodCPC.codCPC.in_(normalized_codes)).all()
        return {_clean_text(row.codCPC): row.id for row in rows}

    def _generate_resource_code(self, db: Session, base_id: int, category_code: int, subcategory_id: int) -> str:
        count = db.query(Recurso.id).filter(
            Recurso.base_trabajo_id == base_id,
            Recurso.subcategoria_item_id == subcategory_id,
        ).count() + 1
        return f"{category_code}-{str(1).zfill(4)}-{str(count).zfill(5)}"[:20]

    def _next_resource_code(
        self,
        counters: dict[tuple[int, int], int],
        used_codes: set[str],
        category_code: int,
        subcategory_id: int,
    ) -> str:
        key = (category_code, subcategory_id)
        while True:
            counters[key] = counters.get(key, 0) + 1
            code = f"{category_code}-{str(1).zfill(4)}-{str(counters[key]).zfill(5)}"[:20]
            if code not in used_codes:
                used_codes.add(code)
                return code

    def _next_apu_code(self, used_codes: set[str], index: int) -> str:
        sequence = index
        while True:
            code = f"IMP-{sequence:05d}"[:100]
            if code not in used_codes:
                used_codes.add(code)
                return code
            sequence += 1

    def _create_resources(
        self,
        db: Session,
        resources: list[dict[str, Any]],
        base: BaseTrabajo,
        empresa: Empresa,
        subcategories: dict[int, SubcategoriaItem],
    ) -> dict[str, Recurso]:
        resource_map: dict[str, Recurso] = {}
        seen: set[str] = set()
        used_codes: set[str] = set()
        generated_code_counters: dict[tuple[int, int], int] = {}
        unit_cache, fallback_unit_id = self._build_unit_cache(db, empresa.id, base.id)
        cpc_codes = {
            _clean_text(resource.get("cod_cpc_codigo") or resource.get("cpc_code"))
            for resource in resources
            if _clean_text(resource.get("cod_cpc_codigo") or resource.get("cpc_code"))
        }
        cpc_cache = self._build_cpc_cache(db, cpc_codes)
        pending_objects: list[tuple[Recurso, dict[str, Any], str]] = []
        pending_by_description: dict[str, tuple[Recurso, dict[str, Any], str]] = {}
        duplicate_aliases: list[tuple[dict[str, Any], str, Recurso]] = []

        for index, resource in enumerate(resources, start=1):
            description = _clean_text(resource.get("descripcion") or resource.get("description") or resource.get("nombre"), f"Recurso importado {index}")
            signature = _build_signature(description, resource.get("unidad"), resource.get("resource_type"))
            normalized_description = _normalize_text(description)
            if normalized_description in pending_by_description:
                duplicate_aliases.append((resource, signature, pending_by_description[normalized_description][0]))
                continue
            if signature in seen:
                continue
            seen.add(signature)

            resource_type = _normalize_text(resource.get("resource_type") or resource.get("tipo"))
            category_code = RESOURCE_TYPE_TO_CATEGORY.get(resource_type, 2)
            subcategory = subcategories[category_code]
            unit_id = self._resolve_unit_id_cached(resource.get("unidad"), category_code, unit_cache, fallback_unit_id)
            raw_code = _safe_code(resource.get("codigo"), "", max_length=20)
            if raw_code and raw_code not in used_codes:
                code = raw_code
                used_codes.add(code)
            else:
                code = self._next_resource_code(generated_code_counters, used_codes, category_code, subcategory.id)

            db_obj = Recurso(
                codigo=code,
                descripcion=description[:500],
                descripcion_normalizada=normalized_description,
                precio=_to_decimal(resource.get("precio") or resource.get("precio_unitario") or resource.get("costo_unitario")),
                unidad_id=unit_id,
                cod_cpc_id=cpc_cache.get(_clean_text(resource.get("cod_cpc_codigo") or resource.get("cpc_code"))),
                especificaciones=_clean_text(resource.get("especificaciones")),
                subcategoria_item_id=subcategory.id,
                base_trabajo_id=base.id,
                empresa_id=empresa.id,
                revisado=True,
                revision=0,
                content_origin=PUBLIC_PROCUREMENT_CONTENT_ORIGIN,
                sync_status="not_applicable",
            )
            pending_objects.append((db_obj, resource, signature))
            pending_by_description[normalized_description] = (db_obj, resource, signature)

        if pending_objects:
            db.add_all([item[0] for item in pending_objects])
            db.flush()

        for db_obj, resource, signature in pending_objects:
            self._register_resource_aliases(resource_map, db_obj, resource, signature)

        for resource, signature, db_obj in duplicate_aliases:
            self._register_resource_aliases(resource_map, db_obj, resource, signature)

        return resource_map

    def _register_resource_aliases(
        self,
        resource_map: dict[str, Recurso],
        db_obj: Recurso,
        resource: dict[str, Any],
        signature: str,
    ) -> None:
        for key in {
            resource.get("temp_id"),
            resource.get("codigo"),
            resource.get("parent_apu_codigo"),
            signature,
        }:
            if _clean_text(key):
                resource_map[_clean_text(key)] = db_obj

    def _resolve_cpc_id(self, db: Session, code: Any) -> int | None:
        code_text = _clean_text(code)
        if not code_text:
            return None
        cpc = db.query(CodCPC).filter(CodCPC.codCPC == code_text).first()
        return getattr(cpc, "id", None)

    def _register_candidate_keys(self, index: dict[str, dict[str, Any]], candidate: dict[str, Any]) -> None:
        for key in {
            candidate.get("temp_id"),
            candidate.get("codigo"),
            _build_signature(candidate.get("codigo"), candidate.get("descripcion"), candidate.get("unidad")),
            _build_signature(candidate.get("descripcion"), candidate.get("unidad")),
        }:
            cleaned = _clean_text(key)
            if cleaned and cleaned not in index:
                index[cleaned] = candidate

    def _build_budget_fallback_apu(self, row: dict[str, Any], index: int) -> dict[str, Any]:
        return {
            "temp_id": row.get("matched_apu_temp_id") or f"auto_empty_apu_{index}",
            "origin": "generated_empty_from_budget_unmatched",
            "status": "Pendiente sin recursos",
            "codigo": row.get("codigo") or row.get("nro") or f"RUB-{index:04d}",
            "descripcion": row.get("descripcion") or f"APU pendiente {index}",
            "unidad": row.get("unidad"),
            "chapter": row.get("capitulo"),
            "quantity": row.get("cantidad"),
            "precio_unitario": row.get("precio_unitario") or row.get("precio_u"),
            "unit_price": row.get("precio_unitario") or row.get("precio_u"),
            "cod_cpc_apu": row.get("cod_cpc_apu") or row.get("codigo_cpc_apu"),
            "resources": [],
            "resource_count": 0,
            "nested_apu_links": [],
            "nested_apu_count": 0,
        }

    def _collect_materialization_scope(
        self,
        budget_rows: list[dict[str, Any]],
        bundle_apus: list[dict[str, Any]],
        generated_apus: list[dict[str, Any]],
        bundle_resources: list[dict[str, Any]],
    ) -> dict[str, Any]:
        candidate_index: dict[str, dict[str, Any]] = {}
        for raw_candidate in [*bundle_apus, *generated_apus]:
            candidate = dict(raw_candidate or {})
            self._register_candidate_keys(candidate_index, candidate)

        resources_by_apu: dict[str, list[dict[str, Any]]] = {}
        for raw_resource in bundle_resources:
            resource = dict(raw_resource or {})
            parent_id = _clean_text(resource.get("apu_temp_id"))
            if parent_id:
                resources_by_apu.setdefault(parent_id, []).append(resource)

        selected_by_temp_id: dict[str, dict[str, Any]] = {}
        pending_queue: list[str] = []
        empty_apu_temp_ids: set[str] = set()

        for index, row in enumerate(budget_rows, start=1):
            matched_key = _clean_text(row.get("matched_apu_temp_id"))
            candidate = candidate_index.get(matched_key) if matched_key else None
            if candidate is None:
                candidate = self._build_budget_fallback_apu(row, index)
                self._register_candidate_keys(candidate_index, candidate)
            temp_id = _clean_text(candidate.get("temp_id")) or f"auto_empty_apu_{index}"
            candidate["temp_id"] = temp_id
            if temp_id not in selected_by_temp_id:
                selected_by_temp_id[temp_id] = candidate
                pending_queue.append(temp_id)
            if str(candidate.get("origin") or "").startswith("generated_empty") or not resources_by_apu.get(temp_id):
                empty_apu_temp_ids.add(temp_id)

        cursor = 0
        while cursor < len(pending_queue):
            current_temp_id = pending_queue[cursor]
            cursor += 1
            for resource in resources_by_apu.get(current_temp_id, []):
                if not resource.get("is_nested_apu"):
                    continue
                nested_key = _clean_text(resource.get("nested_apu_target"))
                nested_candidate = candidate_index.get(nested_key)
                if nested_candidate is None:
                    continue
                nested_temp_id = _clean_text(nested_candidate.get("temp_id"))
                if nested_temp_id and nested_temp_id not in selected_by_temp_id:
                    selected_by_temp_id[nested_temp_id] = nested_candidate
                    pending_queue.append(nested_temp_id)

        selected_temp_ids = set(selected_by_temp_id.keys())
        selected_resources = [
            dict(resource)
            for temp_id in selected_temp_ids
            for resource in resources_by_apu.get(temp_id, [])
        ]
        material_resources = [resource for resource in selected_resources if not resource.get("is_nested_apu")]

        return {
            "apus": list(selected_by_temp_id.values()),
            "apu_resources": selected_resources,
            "resources": material_resources,
            "empty_apus_count": len(empty_apu_temp_ids),
        }

    def _create_apus(
        self,
        db: Session,
        budget_rows: list[dict[str, Any]],
        candidates: list[dict[str, Any]],
        apu_resources: list[dict[str, Any]],
        resource_map: dict[str, Recurso],
        base: BaseTrabajo,
        empresa: Empresa,
        subcategories: dict[int, SubcategoriaItem],
    ) -> dict[str, APU]:
        apu_map: dict[str, APU] = {}
        subcategory = subcategories[5]
        created_pairs: list[tuple[APU, dict[str, Any]]] = []
        used_codes: set[str] = set()

        for index, candidate in enumerate(candidates, start=1):
            description = _clean_text(candidate.get("descripcion") or candidate.get("description"), f"APU importado {index}")
            unit = _clean_text(candidate.get("unidad"), "u")[:20]
            raw_code = _safe_code(candidate.get("codigo"), "", max_length=100)
            if raw_code and raw_code not in used_codes:
                code = raw_code
                used_codes.add(code)
            else:
                code = self._next_apu_code(used_codes, index)

            normalized_description = _normalize_text(description)
            unit_price = self._resolve_candidate_unit_price(candidate, budget_rows)
            apu = APU(
                codigo=code,
                descripcion=description[:500],
                descripcion_normalizada=normalized_description,
                unidad=unit,
                rendimiento_estandar=Decimal("1"),
                costo_directo=unit_price,
                costo_indirecto=Decimal("0"),
                precio_unitario_total=unit_price,
                moneda="USD",
                estado_revision="Pendiente" if self._is_empty_imported_apu(candidate) else "Revisado",
                revision=0,
                subcategoria_item_id=subcategory.id,
                base_trabajo_id=base.id,
                empresa_id=empresa.id,
                content_origin=PUBLIC_PROCUREMENT_CONTENT_ORIGIN,
                sync_status="not_applicable",
            )
            created_pairs.append((apu, candidate))

        if created_pairs:
            db.add_all([item[0] for item in created_pairs])
            db.flush()

        for apu, candidate in created_pairs:
            for key in {
                candidate.get("temp_id"),
                candidate.get("codigo"),
                _build_signature(candidate.get("codigo"), candidate.get("descripcion"), candidate.get("unidad")),
                _build_signature(candidate.get("descripcion"), candidate.get("unidad")),
            }:
                if _clean_text(key):
                    apu_map[_clean_text(key)] = apu

        resources_by_apu: dict[str, list[dict[str, Any]]] = {}
        for resource in apu_resources:
            parent_id = _clean_text(resource.get("apu_temp_id"))
            if parent_id:
                resources_by_apu.setdefault(parent_id, []).append(resource)

        line_objects: list[APULinea] = []
        dirty_apus: list[APU] = []
        for apu, candidate in created_pairs:
            line_total = Decimal("0")
            candidate_temp_id = _clean_text(candidate.get("temp_id"))
            for line_index, resource_payload in enumerate(resources_by_apu.get(candidate_temp_id, []), start=1):
                quantity = _to_decimal(resource_payload.get("cantidad"), "1")
                if resource_payload.get("is_nested_apu") and _clean_text(resource_payload.get("nested_apu_target")) in apu_map:
                    child_apu = apu_map[_clean_text(resource_payload.get("nested_apu_target"))]
                    frozen_price = _to_decimal(
                        resource_payload.get("precio") or resource_payload.get("precio_unitario") or child_apu.precio_unitario_total,
                        "0",
                    )
                    rendimiento = Decimal("1")
                    subtotal = frozen_price * quantity * rendimiento
                    line_total += subtotal
                    line_objects.append(APULinea(
                        apu_id=apu.id,
                        apu_hijo_id=child_apu.id,
                        cantidad=quantity,
                        rendimiento=rendimiento,
                        rendimiento_original=rendimiento,
                        orden=line_index,
                        precio_congelado=frozen_price,
                        subtotal=subtotal,
                    ))
                    continue

                resource = None
                for key in (resource_payload.get("temp_id"), resource_payload.get("codigo"), _build_signature(resource_payload.get("descripcion"), resource_payload.get("unidad"), resource_payload.get("resource_type"))):
                    if _clean_text(key) in resource_map:
                        resource = resource_map[_clean_text(key)]
                        break
                if not resource:
                    continue
                frozen_price = _to_decimal(resource_payload.get("precio") or resource_payload.get("precio_unitario") or resource.precio)
                rendimiento = _resolve_line_rendimiento(resource_payload)
                subtotal = frozen_price * quantity * rendimiento
                line_total += subtotal
                line_objects.append(APULinea(
                    apu_id=apu.id,
                    recurso_id=resource.id,
                    cantidad=quantity,
                    rendimiento=rendimiento,
                    rendimiento_original=rendimiento,
                    orden=line_index,
                    precio_congelado=frozen_price,
                    subtotal=subtotal,
                ))

            if line_total > 0:
                apu.costo_directo = line_total
                apu.precio_unitario_total = line_total
                apu.estado_revision = "Revisado"
                dirty_apus.append(apu)

        if line_objects:
            db.add_all(line_objects)
        if dirty_apus:
            db.add_all(dirty_apus)
        if line_objects or dirty_apus:
            db.flush()

        return apu_map

    def _is_empty_imported_apu(self, candidate: dict[str, Any]) -> bool:
        if str(candidate.get("origin") or "").startswith("generated_empty"):
            return True
        return not bool(candidate.get("resources") or candidate.get("resource_count") or candidate.get("nested_apu_count"))

    def _resolve_candidate_unit_price(self, candidate: dict[str, Any], budget_rows: list[dict[str, Any]]) -> Decimal:
        explicit = _to_decimal(candidate.get("precio_unitario") or candidate.get("unit_price") or candidate.get("precio_u") or candidate.get("precio"), "0")
        if explicit > 0:
            return explicit
        candidate_code = _normalize_text(candidate.get("codigo"))
        candidate_desc = _normalize_text(candidate.get("descripcion"))
        for row in budget_rows:
            if candidate_code and candidate_code == _normalize_text(row.get("codigo") or row.get("nro")):
                return _to_decimal(row.get("precio_unitario") or row.get("precio_u"), "0")
            if candidate_desc and candidate_desc == _normalize_text(row.get("descripcion")):
                return _to_decimal(row.get("precio_unitario") or row.get("precio_u"), "0")
        return Decimal("0")

    def _create_edt_chapters(
        self,
        db: Session,
        budget_rows: list[dict[str, Any]],
        proyecto: Proyecto,
        empresa: Empresa,
        presupuesto: Presupuesto,
    ) -> tuple[dict[str, EdtNode], dict[str, PresupuestoDetalle]]:
        chapters: dict[str, EdtNode] = {}
        details: dict[str, PresupuestoDetalle] = {}

        ordered_chapters: list[str] = []
        for row in budget_rows:
            chapter = _clean_text(row.get("capitulo"), "General")
            if chapter not in ordered_chapters:
                ordered_chapters.append(chapter)

        node_pairs: list[tuple[str, EdtNode]] = []
        for index, chapter in enumerate(ordered_chapters, start=1):
            node = EdtNode(
                proyecto_id=proyecto.id,
                empresa_id=empresa.id,
                parent_id=None,
                tipo_nodo=TipoNodoEdt.CUENTA_PAQUETE,
                orden=index,
                codigo=str(index),
                nombre=chapter[:255],
                definicion=f"Capitulo importado desde compra publica: {chapter}",
            )
            node_pairs.append((chapter, node))

        if node_pairs:
            db.add_all([item[1] for item in node_pairs])
            db.flush()

        detail_pairs: list[tuple[str, PresupuestoDetalle]] = []
        for index, (chapter, node) in enumerate(node_pairs, start=1):
            detail = PresupuestoDetalle(
                presupuesto_id=presupuesto.id,
                edt_id=node.id,
                parent_id=None,
                tipo=TipoNodoEdt.CUENTA_PAQUETE.value,
                codigo_item=node.codigo,
                descripcion=node.nombre or f"Capitulo {node.codigo}",
                unidad=None,
                cantidad=Decimal("1"),
                precio_unitario=Decimal("0"),
                precio_total=Decimal("0"),
                orden=index,
            )
            detail_pairs.append((chapter, detail))
            chapters[chapter] = node

        if detail_pairs:
            db.add_all([item[1] for item in detail_pairs])
            db.flush()

        for chapter, detail in detail_pairs:
            details[chapter] = detail

        return chapters, details

    def _create_budget_lines(
        self,
        db: Session,
        budget_rows: list[dict[str, Any]],
        presupuesto: Presupuesto,
        chapter_nodes: dict[str, EdtNode],
        chapter_details: dict[str, PresupuestoDetalle],
        apu_map: dict[str, APU],
    ) -> None:
        line_order_by_chapter: dict[str, int] = {}
        detail_objects: list[PresupuestoDetalle] = []
        for index, row in enumerate(budget_rows, start=1):
            chapter = _clean_text(row.get("capitulo"), "General")
            line_order_by_chapter[chapter] = line_order_by_chapter.get(chapter, 0) + 1
            apu = self._resolve_apu_for_row(row, apu_map)
            quantity = _to_decimal(row.get("cantidad"), "1")
            unit_price = _to_decimal(row.get("precio_unitario") or row.get("precio_u"), str(getattr(apu, "precio_unitario_total", 0) or 0))
            total = _to_decimal(row.get("precio_total"), str(quantity * unit_price))
            detail_objects.append(PresupuestoDetalle(
                presupuesto_id=presupuesto.id,
                apu_id=getattr(apu, "id", None),
                parent_id=chapter_details[chapter].id,
                tipo="RUBRO",
                edt_id=chapter_nodes[chapter].id,
                codigo_item=_safe_code(row.get("codigo") or row.get("nro"), f"R-{index:04d}"),
                descripcion=_clean_text(row.get("descripcion"), f"Rubro importado {index}")[:500],
                unidad=_clean_text(row.get("unidad"), getattr(apu, "unidad", None)),
                cantidad=quantity,
                precio_unitario=unit_price,
                precio_total=total,
                orden=line_order_by_chapter[chapter],
                notas="Linea importada desde compra publica.",
            ))
        if detail_objects:
            db.add_all(detail_objects)
            db.flush()

    def _resolve_apu_for_row(self, row: dict[str, Any], apu_map: dict[str, APU]) -> APU | None:
        for key in (
            row.get("matched_apu_temp_id"),
            row.get("codigo"),
            row.get("nro"),
            _build_signature(row.get("codigo") or row.get("nro"), row.get("descripcion"), row.get("unidad")),
            _build_signature(row.get("descripcion"), row.get("unidad")),
        ):
            cleaned = _clean_text(key)
            if cleaned in apu_map:
                return apu_map[cleaned]
        return None

    def _assign_project_apu_cpc(
        self,
        db: Session,
        budget_rows: list[dict[str, Any]],
        proyecto: Proyecto,
        empresa: Empresa,
        apu_map: dict[str, APU],
        current_user_id: int | None,
    ) -> int:
        assigned = 0
        seen: set[tuple[int, int]] = set()
        cpc_codes = {
            _clean_text(row.get("cod_cpc_apu") or row.get("codigo_cpc_apu"))
            for row in budget_rows
            if _clean_text(row.get("cod_cpc_apu") or row.get("codigo_cpc_apu"))
        }
        cpc_cache = self._build_cpc_cache(db, cpc_codes)
        cpc_objects: list[ProyectoApuCpc] = []
        for row in budget_rows:
            cpc_code = _clean_text(row.get("cod_cpc_apu") or row.get("codigo_cpc_apu"))
            if not cpc_code:
                continue
            apu = self._resolve_apu_for_row(row, apu_map)
            if not apu:
                continue
            cpc_id = cpc_cache.get(cpc_code)
            if not cpc_id:
                continue
            key = (int(apu.id), int(cpc_id))
            if key in seen:
                continue
            seen.add(key)
            cpc_objects.append(ProyectoApuCpc(
                empresa_id=empresa.id,
                proyecto_root_codigo=proyecto.codigo_root,
                apu_id=apu.id,
                cod_cpc_id=cpc_id,
                updated_by_usuario_id=current_user_id,
            ))
            assigned += 1
        if cpc_objects:
            db.add_all(cpc_objects)
            db.flush()
        return assigned

    def _ensure_indirectos(self, db: Session, presupuesto: Presupuesto, empresa: Empresa) -> None:
        existing = db.query(PresupuestoIndirecto.id).filter(PresupuestoIndirecto.presupuesto_id == presupuesto.id).first()
        if existing:
            return
        for item in FIXED_INDIRECTOS:
            db.add(PresupuestoIndirecto(
                presupuesto_id=presupuesto.id,
                empresa_id=empresa.id,
                concepto_codigo=item.get("concepto_codigo") or "importado",
                concepto_id=item.get("concepto_id"),
                categoria_codigo=item.get("categoria_codigo") or "importado",
                nombre=item.get("nombre") or "Indirecto importado",
                porcentaje=Decimal("0"),
                observaciones="Indirecto inicial para presupuesto importado.",
                fijo=bool(item.get("fijo", True)),
            ))

    def _store_certification_trace(self, proyecto: Proyecto, certification: dict[str, Any]) -> None:
        config = dict(proyecto.plantillas_config or {})
        import_trace = dict(config.get("public_procurement_import") or {})
        import_trace["apu_resource_certification"] = {
            "status": certification.get("status"),
            "valid": bool(certification.get("valid")),
            "issue_counts": dict(certification.get("issue_counts") or {}),
            "summary": dict(certification.get("summary") or {}),
        }
        config["public_procurement_import"] = import_trace
        proyecto.plantillas_config = config

    def _format_certification_error(self, certification: dict[str, Any]) -> str:
        issue_counts = dict(certification.get("issue_counts") or {})
        if not issue_counts:
            return "La importacion no cumple la certificacion APUs-recursos-presupuesto."
        detail = ", ".join(f"{code}: {count}" for code, count in sorted(issue_counts.items()))
        return f"La importacion no cumple la certificacion APUs-recursos-presupuesto ({detail})."


public_procurement_project_materializer = PublicProcurementProjectMaterializer()
