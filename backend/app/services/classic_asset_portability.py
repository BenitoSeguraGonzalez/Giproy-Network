from __future__ import annotations

from copy import deepcopy
from dataclasses import dataclass
from datetime import datetime, timezone
from typing import Any

from sqlalchemy.orm import Session

from app.core.apu_status import normalize_apu_revision_status
from app.core.unit_normalization import canonicalize_unit_symbol
from app.models.apu import APU, APULinea
from app.models.base_trabajo import BaseTrabajo
from app.models.edt import EdtNode
from app.models.presupuesto import Presupuesto, PresupuestoDetalle, PresupuestoIndirecto
from app.models.proyecto import Proyecto
from app.models.recurso import CategoriaRecurso, Recurso
from app.models.subcategoria_item import SubcategoriaItem
from app.models.unidad import Unidad
from app.schemas.base_trabajo import BaseTrabajoCreate
from app.services.presupuesto import calculate_presupuesto_totals


@dataclass
class ClassicProjectCopyResult:
    project: Proyecto
    base: BaseTrabajo | None
    edt_id_map: dict[int, int]
    apu_id_map: dict[int, int]
    presupuesto_id_map: dict[int, int]
    presupuesto_detalle_id_map: dict[int, dict[int, int]]


@dataclass
class ClassicBaseDependencyScope:
    root_apu_ids: set[int]
    apu_ids: set[int]
    resource_ids: set[int]
    unit_ids: set[int]
    category_ids: set[int]
    subcategory_ids: set[int]
    subcategory_codes: set[int]


class ClassicAssetPortabilityService:
    """Common classic-domain copy engine for project/base/APU/budget graphs."""

    def clone_project_to_company(
        self,
        db: Session,
        *,
        source_project_id: int,
        source_empresa_id: int | None,
        target_empresa_id: int,
        context: str,
        name_suffix: str,
        code_suffix: str | None = None,
        target_code: str | None = None,
        include_schedules: bool = False,
        restrict_base_to_budget_apus: bool = False,
        metadata: dict[str, Any] | None = None,
    ) -> ClassicProjectCopyResult:
        if include_schedules:
            raise ValueError("classic_project_schedule_copy_not_supported")

        query = db.query(Proyecto).filter(Proyecto.id == source_project_id)
        if source_empresa_id is not None:
            query = query.filter(Proyecto.empresa_id == source_empresa_id)
        source_project = query.first()
        if not source_project:
            raise ValueError("classic_project_source_not_found")

        apu_scope_ids = (
            self.collect_project_budget_apu_ids(
                db,
                project_id=source_project.id,
                empresa_id=source_project.empresa_id,
            )
            if restrict_base_to_budget_apus
            else None
        )
        cloned_base = self._clone_project_base(
            db,
            source_project=source_project,
            target_empresa_id=target_empresa_id,
            context=context,
            name_suffix=name_suffix,
            apu_scope_ids=apu_scope_ids,
        )
        apu_id_map = self._build_apu_map(
            db,
            source_base_id=source_project.base_trabajo_id,
            target_base_id=getattr(cloned_base, "id", None),
            target_empresa_id=target_empresa_id,
        )

        target_project = Proyecto(
            nombre=self._unique_project_name(db, target_empresa_id, f"{source_project.nombre} {name_suffix}".strip()),
            codigo=target_code or self._copy_code(source_project.codigo, code_suffix),
            codigo_root=target_code or self._copy_code(source_project.codigo_root, code_suffix),
            revision=0,
            descripcion=source_project.descripcion,
            estado=source_project.estado,
            fecha_inicio=source_project.fecha_inicio,
            fecha_fin_estimada=source_project.fecha_fin_estimada,
            presupuesto_estimado=source_project.presupuesto_estimado or 0,
            moneda=source_project.moneda or "USD",
            empresa_id=target_empresa_id,
            cliente_id=None,
            base_trabajo_id=getattr(cloned_base, "id", None),
            plantillas_config=self._merge_metadata(source_project.plantillas_config, context, metadata),
        )
        db.add(target_project)
        db.flush()

        edt_id_map = self._clone_edt_nodes(
            db,
            source_project_id=source_project.id,
            target_project_id=target_project.id,
            target_empresa_id=target_empresa_id,
        )
        fallback_edt_id = self._ensure_project_root_edt(db, target_project.id, target_empresa_id)
        presupuesto_id_map, detalle_id_map = self._clone_presupuestos(
            db,
            source_project=source_project,
            target_project=target_project,
            target_empresa_id=target_empresa_id,
            edt_id_map=edt_id_map,
            apu_id_map=apu_id_map,
            fallback_edt_id=fallback_edt_id,
        )
        self.assert_project_budget_apu_integrity(
            db,
            project_id=target_project.id,
            empresa_id=target_empresa_id,
            base_trabajo_id=target_project.base_trabajo_id,
        )
        return ClassicProjectCopyResult(
            project=target_project,
            base=cloned_base,
            edt_id_map=edt_id_map,
            apu_id_map=apu_id_map,
            presupuesto_id_map=presupuesto_id_map,
            presupuesto_detalle_id_map=detalle_id_map,
        )

    def assert_project_budget_apu_integrity(
        self,
        db: Session,
        *,
        project_id: int,
        empresa_id: int,
        base_trabajo_id: int | None,
    ) -> None:
        if not base_trabajo_id:
            raise ValueError("classic_project_without_base_trabajo")
        base_apus_count = (
            db.query(APU)
            .filter(APU.empresa_id == empresa_id, APU.base_trabajo_id == base_trabajo_id)
            .count()
        )
        if base_apus_count <= 0:
            raise ValueError("classic_project_without_apus")
        details = (
            db.query(PresupuestoDetalle)
            .join(Presupuesto, PresupuestoDetalle.presupuesto_id == Presupuesto.id)
            .filter(Presupuesto.proyecto_id == project_id, Presupuesto.empresa_id == empresa_id)
            .all()
        )
        operational_details = [
            detail
            for detail in details
            if str(detail.tipo or "").upper() != "CUENTA_PAQUETE"
        ]
        if not operational_details:
            raise ValueError("classic_project_budget_without_operational_apu")
        apu_ids = {int(detail.apu_id) for detail in details if detail.apu_id}
        apus = {}
        if apu_ids:
            apus = {
                int(apu.id): apu
                for apu in db.query(APU).filter(APU.id.in_(apu_ids), APU.empresa_id == empresa_id).all()
            }
        for detail in operational_details:
            if not detail.apu_id:
                raise ValueError("classic_project_budget_line_without_apu")
            apu = apus.get(int(detail.apu_id))
            if not apu:
                raise ValueError("classic_project_budget_apu_not_found")
            if int(apu.base_trabajo_id) != int(base_trabajo_id):
                raise ValueError("classic_project_budget_apu_out_of_scope")

    def collect_project_budget_apu_ids(self, db: Session, *, project_id: int, empresa_id: int) -> set[int]:
        details = (
            db.query(PresupuestoDetalle)
            .join(Presupuesto, PresupuestoDetalle.presupuesto_id == Presupuesto.id)
            .filter(Presupuesto.proyecto_id == project_id, Presupuesto.empresa_id == empresa_id)
            .all()
        )
        return {
            int(detail.apu_id)
            for detail in details
            if detail.apu_id and str(detail.tipo or "").upper() != "CUENTA_PAQUETE"
        }

    def collect_base_dependency_scope(
        self,
        db: Session,
        *,
        empresa_id: int,
        base_id: int,
        root_apu_ids: set[int] | list[int] | tuple[int, ...],
    ) -> ClassicBaseDependencyScope:
        root_ids = {int(item) for item in (root_apu_ids or []) if item}
        apu_ids: set[int] = set()
        resource_ids: set[int] = set()
        category_ids: set[int] = set()
        subcategory_ids: set[int] = set()

        pending = set(root_ids)
        while pending:
            current_ids = pending - apu_ids
            pending.clear()
            if not current_ids:
                continue
            apus = (
                db.query(APU)
                .filter(
                    APU.id.in_(current_ids),
                    APU.empresa_id == empresa_id,
                    APU.base_trabajo_id == base_id,
                )
                .all()
            )
            valid_ids = {int(apu.id) for apu in apus}
            apu_ids.update(valid_ids)
            for apu in apus:
                if apu.categoria_id:
                    category_ids.add(int(apu.categoria_id))
                if apu.subcategoria_item_id:
                    subcategory_ids.add(int(apu.subcategoria_item_id))
            if not valid_ids:
                continue
            lines = db.query(APULinea).filter(APULinea.apu_id.in_(valid_ids)).all()
            for line in lines:
                if line.recurso_id:
                    resource_ids.add(int(line.recurso_id))
                if line.apu_hijo_id and int(line.apu_hijo_id) not in apu_ids:
                    pending.add(int(line.apu_hijo_id))

        unit_ids: set[int] = set()
        subcategory_codes: set[int] = set()
        if resource_ids:
            resources = (
                db.query(Recurso)
                .filter(
                    Recurso.id.in_(resource_ids),
                    Recurso.empresa_id == empresa_id,
                    Recurso.base_trabajo_id == base_id,
                )
                .all()
            )
            resource_ids = {int(resource.id) for resource in resources}
            for resource in resources:
                if resource.unidad_id:
                    unit_ids.add(int(resource.unidad_id))
                if resource.subcategoria_item_id:
                    subcategory_ids.add(int(resource.subcategoria_item_id))

        if unit_ids:
            units = db.query(Unidad).filter(Unidad.id.in_(unit_ids)).all()
            unit_ids = {int(unit.id) for unit in units}
            subcategory_codes.update(int(unit.subcategoria_codigo) for unit in units if unit.subcategoria_codigo is not None)

        if subcategory_ids:
            subcategories = (
                db.query(SubcategoriaItem)
                .filter(
                    SubcategoriaItem.empresa_id == empresa_id,
                    SubcategoriaItem.base_trabajo_id == base_id,
                    SubcategoriaItem.id.in_(subcategory_ids),
                )
                .all()
            )
            subcategory_ids.update(int(item.id) for item in subcategories)
            subcategory_codes.update(int(item.subcategoria_codigo) for item in subcategories if item.subcategoria_codigo is not None)

        return ClassicBaseDependencyScope(
            root_apu_ids=root_ids,
            apu_ids=apu_ids,
            resource_ids=resource_ids,
            unit_ids=unit_ids,
            category_ids=category_ids,
            subcategory_ids=subcategory_ids,
            subcategory_codes=subcategory_codes,
        )

    def _clone_project_base(
        self,
        db: Session,
        *,
        source_project: Proyecto,
        target_empresa_id: int,
        context: str,
        name_suffix: str,
        apu_scope_ids: set[int] | None = None,
    ) -> BaseTrabajo | None:
        if not source_project.base_trabajo_id:
            return None
        from app.repositories.base_trabajo import base_trabajo_repo

        source_base = db.query(BaseTrabajo).filter(BaseTrabajo.id == source_project.base_trabajo_id).first()
        if not source_base:
            raise ValueError("classic_project_source_base_not_found")

        base_name = self._unique_base_name(db, target_empresa_id, f"{source_base.nombre} {name_suffix}".strip())
        if apu_scope_ids is not None:
            return self._clone_project_base_subset(
                db,
                source_base=source_base,
                source_project=source_project,
                target_empresa_id=target_empresa_id,
                context=context,
                base_name=base_name,
                root_apu_ids=apu_scope_ids,
            )
        return base_trabajo_repo.create(
            db,
            BaseTrabajoCreate(
                nombre=base_name,
                tipo=source_base.tipo or "Base de Proyecto",
                descripcion=source_base.descripcion or f"Base copiada por {context}",
                porcentaje_indirectos=source_base.porcentaje_indirectos,
                pais_id=source_base.pais_id,
                moneda=source_base.moneda or source_project.moneda or "USD",
                observaciones=source_base.observaciones,
                source_base_id=source_base.id,
                empresa_id=target_empresa_id,
            ),
            target_empresa_id,
            commit=False,
        )

    def _clone_project_base_subset(
        self,
        db: Session,
        *,
        source_base: BaseTrabajo,
        source_project: Proyecto,
        target_empresa_id: int,
        context: str,
        base_name: str,
        root_apu_ids: set[int],
    ) -> BaseTrabajo:
        source_empresa_id = int(source_base.empresa_id)
        scope = self.collect_base_dependency_scope(
            db,
            empresa_id=source_empresa_id,
            base_id=int(source_base.id),
            root_apu_ids=root_apu_ids,
        )
        if not scope.apu_ids:
            raise ValueError("classic_project_without_apus")

        target_base = BaseTrabajo(
            codigo_unico=self._unique_base_code(db, target_empresa_id, f"{source_base.codigo_unico or 'BT'}-TRF"),
            nombre=base_name,
            tipo=source_base.tipo or "Base de Proyecto",
            descripcion=source_base.descripcion or f"Base copiada por {context}",
            porcentaje_indirectos=source_base.porcentaje_indirectos,
            activa=False,
            tipo_rendimiento=source_base.tipo_rendimiento or "Rendimiento Unitario (Tiempo/Unidad)",
            unidad_tiempo=source_base.unidad_tiempo or "Hora",
            pais_id=source_base.pais_id,
            moneda=source_base.moneda or source_project.moneda or "USD",
            observaciones=source_base.observaciones,
            empresa_id=target_empresa_id,
            source_base_id=source_base.id,
            clone_created_at=datetime.now(timezone.utc),
            sync_mode="snapshot_locked",
        )
        db.add(target_base)
        db.flush()

        category_map: dict[int, int] = {}
        if scope.category_ids:
            categories = (
                db.query(CategoriaRecurso)
                .filter(
                    CategoriaRecurso.id.in_(scope.category_ids),
                    (CategoriaRecurso.empresa_id == source_empresa_id) | (CategoriaRecurso.base_trabajo_id == source_base.id),
                )
                .order_by(CategoriaRecurso.id.asc())
                .all()
            )
            for category in categories:
                cloned = CategoriaRecurso(
                    nombre=category.nombre,
                    descripcion=category.descripcion,
                    base_trabajo_id=target_base.id if category.base_trabajo_id else None,
                    empresa_id=target_empresa_id if category.empresa_id else None,
                )
                db.add(cloned)
                db.flush()
                category_map[int(category.id)] = int(cloned.id)

        subcategory_map: dict[int, int] = {}
        if scope.subcategory_ids:
            subcategories = (
                db.query(SubcategoriaItem)
                .filter(
                    SubcategoriaItem.id.in_(scope.subcategory_ids),
                    SubcategoriaItem.empresa_id == source_empresa_id,
                    SubcategoriaItem.base_trabajo_id == source_base.id,
                )
                .order_by(SubcategoriaItem.subcategoria_codigo.asc(), SubcategoriaItem.orden.asc(), SubcategoriaItem.id.asc())
                .all()
            )
            for subcategory in subcategories:
                cloned = SubcategoriaItem(
                    codigo=subcategory.codigo,
                    descripcion=subcategory.descripcion,
                    observaciones=subcategory.observaciones,
                    subcategoria_codigo=subcategory.subcategoria_codigo,
                    orden=subcategory.orden,
                    base_trabajo_id=target_base.id,
                    empresa_id=target_empresa_id,
                    revisado=subcategory.revisado,
                    omniclass_codigo=subcategory.omniclass_codigo,
                    omniclass_titulo=subcategory.omniclass_titulo,
                )
                db.add(cloned)
                db.flush()
                subcategory_map[int(subcategory.id)] = int(cloned.id)

        unit_map: dict[int, int] = {}
        if scope.unit_ids:
            units = db.query(Unidad).filter(Unidad.id.in_(scope.unit_ids)).order_by(Unidad.id.asc()).all()
            for unit in units:
                if unit.es_global:
                    unit_map[int(unit.id)] = int(unit.id)
                    continue
                cloned = Unidad(
                    descripcion=unit.descripcion,
                    descripcion_completa=unit.descripcion_completa,
                    subcategoria_codigo=unit.subcategoria_codigo,
                    es_global=False,
                    empresa_id=target_empresa_id,
                    base_trabajo_id=target_base.id,
                )
                db.add(cloned)
                db.flush()
                unit_map[int(unit.id)] = int(cloned.id)

        resource_map: dict[int, int] = {}
        if scope.resource_ids:
            resources = (
                db.query(Recurso)
                .filter(
                    Recurso.id.in_(scope.resource_ids),
                    Recurso.empresa_id == source_empresa_id,
                    Recurso.base_trabajo_id == source_base.id,
                )
                .order_by(Recurso.codigo.asc(), Recurso.id.asc())
                .all()
            )
            for resource in resources:
                unidad_id = unit_map.get(int(resource.unidad_id)) if resource.unidad_id else None
                subcategory_id = subcategory_map.get(int(resource.subcategoria_item_id)) if resource.subcategoria_item_id else None
                if not unidad_id or not subcategory_id:
                    raise ValueError("classic_project_resource_dependency_missing")
                cloned = Recurso(
                    codigo=resource.codigo,
                    descripcion=resource.descripcion,
                    descripcion_normalizada=resource.descripcion_normalizada,
                    precio=resource.precio,
                    equipment_ownership_kind=resource.equipment_ownership_kind,
                    governing_resource_kind=resource.governing_resource_kind,
                    unidad_id=unidad_id,
                    cod_cpc_id=resource.cod_cpc_id,
                    especificaciones=resource.especificaciones,
                    subcategoria_item_id=subcategory_id,
                    base_trabajo_id=target_base.id,
                    empresa_id=target_empresa_id,
                    source_recurso_id=resource.id,
                    content_origin="inherited",
                    sync_status="synced",
                    last_sync_at=datetime.now(timezone.utc),
                    revisado=resource.revisado,
                    revision=source_project.revision if source_project.revision is not None else resource.revision,
                    tanteo_activo=resource.tanteo_activo,
                    precio_original=resource.precio_original,
                    precio_tanteo=resource.precio_tanteo,
                    omniclass_codigo=resource.omniclass_codigo,
                    omniclass_titulo=resource.omniclass_titulo,
                )
                db.add(cloned)
                db.flush()
                resource_map[int(resource.id)] = int(cloned.id)

        apu_map: dict[int, int] = {}
        apus = (
            db.query(APU)
            .filter(
                APU.id.in_(scope.apu_ids),
                APU.empresa_id == source_empresa_id,
                APU.base_trabajo_id == source_base.id,
            )
            .order_by(APU.codigo.asc(), APU.id.asc())
            .all()
        )
        for apu in apus:
            cloned = APU(
                codigo=apu.codigo,
                descripcion=apu.descripcion,
                descripcion_normalizada=apu.descripcion_normalizada,
                unidad=canonicalize_unit_symbol(apu.unidad),
                rendimiento_estandar=apu.rendimiento_estandar,
                costo_directo=apu.costo_directo,
                costo_indirecto=apu.costo_indirecto,
                precio_unitario_total=apu.precio_unitario_total,
                moneda=apu.moneda,
                estado_revision=normalize_apu_revision_status(apu.estado_revision),
                revision=source_project.revision if source_project.revision is not None else apu.revision,
                categoria_id=category_map.get(int(apu.categoria_id)) if apu.categoria_id else None,
                subcategoria_item_id=subcategory_map.get(int(apu.subcategoria_item_id)) if apu.subcategoria_item_id else None,
                base_trabajo_id=target_base.id,
                empresa_id=target_empresa_id,
                omniclass_codigo=apu.omniclass_codigo,
                omniclass_titulo=apu.omniclass_titulo,
                source_apu_id=apu.id,
                content_origin="inherited",
                sync_status="synced",
                last_sync_at=datetime.now(timezone.utc),
            )
            db.add(cloned)
            db.flush()
            apu_map[int(apu.id)] = int(cloned.id)

        lines = (
            db.query(APULinea)
            .filter(APULinea.apu_id.in_(scope.apu_ids))
            .order_by(APULinea.apu_id.asc(), APULinea.orden.asc(), APULinea.id.asc())
            .all()
        )
        for line in lines:
            db.add(
                APULinea(
                    apu_id=apu_map[int(line.apu_id)],
                    recurso_id=resource_map.get(int(line.recurso_id)) if line.recurso_id else None,
                    apu_hijo_id=apu_map.get(int(line.apu_hijo_id)) if line.apu_hijo_id else None,
                    cantidad=line.cantidad,
                    rendimiento=line.rendimiento,
                    orden=line.orden,
                    tanteo_activo=line.tanteo_activo,
                    rendimiento_original=line.rendimiento_original,
                    rendimiento_tanteo=line.rendimiento_tanteo,
                    precio_congelado=line.precio_congelado,
                    subtotal=line.subtotal,
                )
            )

        target_base.snapshot_subcategories_count = len(subcategory_map)
        target_base.snapshot_resources_count = len(resource_map)
        target_base.snapshot_apus_count = len(apu_map)
        target_base.last_reconciled_at = datetime.now(timezone.utc)
        db.add(target_base)
        db.flush()
        return target_base

    def _build_apu_map(
        self,
        db: Session,
        *,
        source_base_id: int | None,
        target_base_id: int | None,
        target_empresa_id: int,
    ) -> dict[int, int]:
        if not source_base_id or not target_base_id:
            return {}
        source_apus = db.query(APU).filter(APU.base_trabajo_id == source_base_id).all()
        target_apus = db.query(APU).filter(APU.base_trabajo_id == target_base_id, APU.empresa_id == target_empresa_id).all()
        by_source = {int(apu.source_apu_id): int(apu.id) for apu in target_apus if apu.source_apu_id}
        by_code = {str(apu.codigo or "").strip().lower(): int(apu.id) for apu in target_apus if apu.codigo}
        mapping: dict[int, int] = {}
        for source_apu in source_apus:
            target_id = by_source.get(int(source_apu.id))
            if not target_id and source_apu.codigo:
                target_id = by_code.get(str(source_apu.codigo).strip().lower())
            if target_id:
                mapping[int(source_apu.id)] = target_id
        return mapping

    def _clone_edt_nodes(
        self,
        db: Session,
        *,
        source_project_id: int,
        target_project_id: int,
        target_empresa_id: int,
    ) -> dict[int, int]:
        source_nodes = (
            db.query(EdtNode)
            .filter(EdtNode.proyecto_id == source_project_id)
            .order_by(EdtNode.parent_id.asc().nullsfirst(), EdtNode.orden.asc(), EdtNode.id.asc())
            .all()
        )
        id_map: dict[int, int] = {}
        pending = list(source_nodes)
        while pending:
            progressed = False
            for source_node in list(pending):
                if source_node.parent_id and source_node.parent_id not in id_map:
                    continue
                cloned_node = EdtNode(
                    proyecto_id=target_project_id,
                    parent_id=id_map.get(source_node.parent_id) if source_node.parent_id else None,
                    tipo_nodo=source_node.tipo_nodo,
                    orden=source_node.orden,
                    codigo=source_node.codigo,
                    nombre=source_node.nombre,
                    definicion=source_node.definicion,
                    stakeholder_id=None,
                    rol_id=None,
                    actividades_claves=source_node.actividades_claves,
                    empresa_id=target_empresa_id,
                )
                db.add(cloned_node)
                db.flush()
                id_map[int(source_node.id)] = int(cloned_node.id)
                pending.remove(source_node)
                progressed = True
            if not progressed:
                raise ValueError("classic_project_edt_cycle_or_parent_missing")
        return id_map

    def _ensure_project_root_edt(self, db: Session, target_project_id: int, empresa_id: int) -> int:
        root = (
            db.query(EdtNode)
            .filter(EdtNode.proyecto_id == target_project_id, EdtNode.empresa_id == empresa_id)
            .order_by(EdtNode.parent_id.asc().nullsfirst(), EdtNode.orden.asc(), EdtNode.id.asc())
            .first()
        )
        if root:
            return int(root.id)
        root = EdtNode(
            proyecto_id=target_project_id,
            parent_id=None,
            tipo_nodo="CUENTA_PAQUETE",
            orden=1,
            codigo="1",
            nombre="Proyecto recibido",
            empresa_id=empresa_id,
        )
        db.add(root)
        db.flush()
        return int(root.id)

    def _clone_presupuestos(
        self,
        db: Session,
        *,
        source_project: Proyecto,
        target_project: Proyecto,
        target_empresa_id: int,
        edt_id_map: dict[int, int],
        apu_id_map: dict[int, int],
        fallback_edt_id: int,
    ) -> tuple[dict[int, int], dict[int, dict[int, int]]]:
        presupuesto_map: dict[int, int] = {}
        all_detail_maps: dict[int, dict[int, int]] = {}
        budgets = (
            db.query(Presupuesto)
            .filter(Presupuesto.proyecto_id == source_project.id)
            .order_by(Presupuesto.revision.asc(), Presupuesto.id.asc())
            .all()
        )
        for budget in budgets:
            cloned_budget = Presupuesto(
                codigo=budget.codigo,
                revision=budget.revision,
                descripcion=budget.descripcion,
                subtotal=budget.subtotal,
                indirectos_total=budget.indirectos_total,
                impuestos=budget.impuestos,
                total=budget.total,
                estado=budget.estado,
                moneda=budget.moneda or target_project.moneda or "USD",
                iva_aplicado=budget.iva_aplicado,
                dec_moneda=budget.dec_moneda,
                dec_calculos=budget.dec_calculos,
                proyecto_id=target_project.id,
                empresa_id=target_empresa_id,
            )
            db.add(cloned_budget)
            db.flush()
            presupuesto_map[int(budget.id)] = int(cloned_budget.id)

            detail_map: dict[int, int] = {}
            details = (
                db.query(PresupuestoDetalle)
                .filter(PresupuestoDetalle.presupuesto_id == budget.id)
                .order_by(PresupuestoDetalle.parent_id.asc().nullsfirst(), PresupuestoDetalle.orden.asc(), PresupuestoDetalle.id.asc())
                .all()
            )
            pending = list(details)
            while pending:
                progressed = False
                for source_detail in list(pending):
                    if source_detail.parent_id and source_detail.parent_id not in detail_map:
                        continue
                    cloned_apu_id = None
                    if source_detail.apu_id:
                        cloned_apu_id = apu_id_map.get(int(source_detail.apu_id))
                        if not cloned_apu_id and str(source_detail.tipo or "").upper() != "CUENTA_PAQUETE":
                            raise ValueError("classic_project_budget_apu_mapping_missing")
                    cloned_detail = PresupuestoDetalle(
                        presupuesto_id=cloned_budget.id,
                        apu_id=cloned_apu_id,
                        parent_id=detail_map.get(source_detail.parent_id) if source_detail.parent_id else None,
                        tipo=source_detail.tipo,
                        edt_id=edt_id_map.get(int(source_detail.edt_id or 0), fallback_edt_id),
                        codigo_item=source_detail.codigo_item,
                        descripcion=source_detail.descripcion,
                        unidad=canonicalize_unit_symbol(source_detail.unidad),
                        cantidad=source_detail.cantidad,
                        precio_unitario=source_detail.precio_unitario,
                        precio_total=source_detail.precio_total,
                        orden=source_detail.orden,
                        omniclass_codigo=source_detail.omniclass_codigo,
                        omniclass_titulo=source_detail.omniclass_titulo,
                        notas=source_detail.notas,
                        tanteo_activo=source_detail.tanteo_activo,
                    )
                    db.add(cloned_detail)
                    db.flush()
                    detail_map[int(source_detail.id)] = int(cloned_detail.id)
                    pending.remove(source_detail)
                    progressed = True
                if not progressed:
                    raise ValueError("classic_project_budget_parent_missing")
            all_detail_maps[int(budget.id)] = detail_map

            indirectos = (
                db.query(PresupuestoIndirecto)
                .filter(PresupuestoIndirecto.presupuesto_id == budget.id)
                .order_by(PresupuestoIndirecto.id.asc())
                .all()
            )
            for indirecto in indirectos:
                db.add(
                    PresupuestoIndirecto(
                        presupuesto_id=cloned_budget.id,
                        empresa_id=target_empresa_id,
                        concepto_codigo=indirecto.concepto_codigo,
                        concepto_id=indirecto.concepto_id,
                        categoria_codigo=indirecto.categoria_codigo,
                        nombre=indirecto.nombre,
                        porcentaje=indirecto.porcentaje,
                        observaciones=indirecto.observaciones,
                        fijo=indirecto.fijo,
                        usuario=indirecto.usuario,
                        custom=indirecto.custom,
                    )
                )
            calculate_presupuesto_totals(db, cloned_budget)
        return presupuesto_map, all_detail_maps

    def _merge_metadata(self, source_config: Any, context: str, metadata: dict[str, Any] | None) -> dict[str, Any]:
        config = deepcopy(source_config) if isinstance(source_config, dict) else {}
        config["classic_portability"] = {
            "context": context,
            "copied_at": datetime.now(timezone.utc).isoformat(),
            **(metadata or {}),
        }
        return config

    def _copy_code(self, value: Any, suffix: str | None) -> str | None:
        if not value:
            return None
        clean = str(value).strip()
        if not clean:
            return None
        if not suffix:
            return clean[:50]
        return f"{clean}-{suffix}"[:50]

    def _unique_project_name(self, db: Session, empresa_id: int, base_name: str) -> str:
        return self._unique_text_value(db, Proyecto.nombre, Proyecto.empresa_id, empresa_id, base_name, max_length=255)

    def _unique_base_name(self, db: Session, empresa_id: int, base_name: str) -> str:
        return self._unique_text_value(db, BaseTrabajo.nombre, BaseTrabajo.empresa_id, empresa_id, base_name, max_length=255)

    def _unique_base_code(self, db: Session, empresa_id: int, base_code: str) -> str:
        return self._unique_text_value(db, BaseTrabajo.codigo_unico, BaseTrabajo.empresa_id, empresa_id, base_code, max_length=100)

    @staticmethod
    def _unique_text_value(db: Session, column, scope_column, scope_value: int, base_value: str, *, max_length: int) -> str:
        clean = str(base_value or "").strip() or "Copia"
        clean = clean[:max_length]
        candidate = clean
        counter = 2
        while db.query(column).filter(column == candidate, scope_column == scope_value).first():
            suffix = f" ({counter})"
            candidate = f"{clean[: max_length - len(suffix)]}{suffix}"
            counter += 1
        return candidate


classic_asset_portability_service = ClassicAssetPortabilityService()
