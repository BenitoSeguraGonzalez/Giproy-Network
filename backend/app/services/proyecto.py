import logging
from copy import deepcopy

from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional, Tuple
from datetime import datetime, timedelta, timezone
from decimal import Decimal
from app.models.proyecto import Proyecto
from app.models.proyecto_asignacion import ProyectoAsignacion
from app.models.usuario import Usuario
from app.models.empresa import Empresa
from app.models.presupuesto import Presupuesto, PresupuestoDetalle, PresupuestoIndirecto
from app.models.base_trabajo import BaseTrabajo
from app.models.apu import APU, APULinea
from app.models.recurso import Recurso
from app.models.subcategoria_item import SubcategoriaItem
from app.models.edo import EdoNode
from app.models.edt import EdtNode
from app.models.stakeholder import Stakeholder
from app.models.stakeholder import ProyectoStakeholder
from app.models.cronograma import CronogramaValorado
from app.models.cronograma_trabajo import CronogramaTrabajo
from app.models.marketplace import MarketplaceProduct
from app.models.bim_model import BimModel
from app.models.bim_view_state import BimViewState
from app.models.unidad import Unidad
from app.models.base_trabajo_asignacion import BaseTrabajoAsignacion
from app.models.bim_link_apu import BimLinkApu
from app.models.project_calendar import ProjectCalendarOverride, ProjectCalendarSnapshot
from app.models.project_calendar_entry import ProjectCalendarEntry
from app.models.proyecto_apu_cpc import ProyectoApuCpc
from app.schemas.proyecto import ProyectoCreate, ProyectoUpdate
from app.schemas.base_trabajo import BaseTrabajoCreate
from app.repositories.proyecto import proyecto_repo
from app.repositories.base_trabajo import base_trabajo_repo
from app.services.license import license_service
from app.services.audit_event import record_audit_event
from app.core.unit_normalization import canonicalize_unit_symbol

logger = logging.getLogger(__name__)

class ProyectoService:
    RECYCLE_RETENTION_DAYS = 7
    GANTT_LINE_ID_METADATA_KEYS = {
        "budget_line_id",
        "budgetLineId",
        "presupuesto_linea_id",
        "presupuestoLineaId",
        "linea_presupuesto_id",
        "lineaPresupuestoId",
        "linea_id",
        "lineaId",
    }

    @staticmethod
    def _now_utc() -> datetime:
        return datetime.now(timezone.utc)

    @classmethod
    def _recycle_expiry(cls, deleted_at: datetime) -> datetime:
        return deleted_at + timedelta(days=cls.RECYCLE_RETENTION_DAYS)

    @staticmethod
    def _trash_text(value: Optional[str], item_id: int) -> str:
        base = (value or "sin-nombre").strip() or "sin-nombre"
        return f"{base} [papelera {item_id}]"

    def _mark_base_for_recycle(
        self,
        db: Session,
        base: BaseTrabajo,
        *,
        deleted_at: datetime,
        expires_at: datetime,
        user_id: Optional[int],
        reason: Optional[str],
    ) -> None:
        if base.deleted_at:
            return
        base.trash_original_nombre = base.trash_original_nombre or base.nombre
        base.trash_original_codigo_unico = base.trash_original_codigo_unico or base.codigo_unico
        base.trash_original_activa = bool(base.activa)
        base.deleted_at = deleted_at
        base.deleted_by_user_id = user_id
        base.recycle_expires_at = expires_at
        base.deletion_reason = reason
        base.activa = False
        base.nombre = self._trash_text(base.nombre, base.id)
        base.codigo_unico = self._trash_text(base.codigo_unico, base.id)
        db.add(base)

    def _restore_recycled_base(self, db: Session, base: BaseTrabajo, empresa_id: int) -> None:
        original_name = base.trash_original_nombre or base.nombre
        original_code = base.trash_original_codigo_unico or base.codigo_unico
        name_conflict = db.query(BaseTrabajo).filter(
            BaseTrabajo.empresa_id == empresa_id,
            BaseTrabajo.id != base.id,
            BaseTrabajo.deleted_at.is_(None),
            BaseTrabajo.nombre == original_name,
        ).first()
        if name_conflict:
            raise ValueError(f"No se puede restaurar la base porque ya existe una base activa con el nombre '{original_name}'.")
        code_conflict = db.query(BaseTrabajo).filter(
            BaseTrabajo.empresa_id == empresa_id,
            BaseTrabajo.id != base.id,
            BaseTrabajo.deleted_at.is_(None),
            BaseTrabajo.codigo_unico == original_code,
        ).first()
        if code_conflict:
            raise ValueError(f"No se puede restaurar la base porque ya existe una base activa con el codigo '{original_code}'.")

        should_restore_active = bool(base.trash_original_activa)
        if should_restore_active:
            active_base = db.query(BaseTrabajo).filter(
                BaseTrabajo.empresa_id == empresa_id,
                BaseTrabajo.id != base.id,
                BaseTrabajo.deleted_at.is_(None),
                BaseTrabajo.activa == True,
            ).first()
            should_restore_active = active_base is None

        base.nombre = original_name
        base.codigo_unico = original_code
        base.activa = should_restore_active
        base.deleted_at = None
        base.deleted_by_user_id = None
        base.recycle_expires_at = None
        base.deletion_reason = None
        base.trash_original_nombre = None
        base.trash_original_codigo_unico = None
        base.trash_original_activa = None
        db.add(base)

    def _convert_project_base_to_work_base(self, db: Session, base: BaseTrabajo, project: Proyecto) -> None:
        if base.deleted_at:
            return
        project_name = project.trash_original_nombre or project.nombre or "proyecto eliminado"
        base.tipo = "Base Maestra"
        base.descripcion = (
            f"Base de trabajo conservada desde el proyecto eliminado {project_name}. "
            "Se mantiene disponible para reutilizacion operativa."
        )
        db.add(base)

    @staticmethod
    def _sync_marketplace_products_before_project_delete(db: Session, project_ids: list[int], empresa_id: int) -> None:
        if not project_ids:
            return

        products = (
            db.query(MarketplaceProduct)
            .join(Usuario, MarketplaceProduct.seller_user_id == Usuario.id)
            .filter(
                Usuario.empresa_id == empresa_id,
                MarketplaceProduct.source_type == "proyecto",
                MarketplaceProduct.source_id.in_(project_ids),
            )
            .all()
        )
        if not products:
            return

        protected = [
            product for product in products
            if int(product.ventas_count or 0) > 0 or (product.estado == "approved" and product.activo)
        ]
        if protected:
            raise ValueError(
                "No se puede eliminar el proyecto porque tiene un producto Marketplace aprobado o con ventas. "
                "Retira primero la publicacion desde Ventas > Administrador > Productos."
            )

        for product in products:
            product.estado = "rejected"
            product.activo = False
            product.requiere_aprobacion = True
            product.approved_by_user_id = None
            product.admin_notes = (
                "Producto retirado automaticamente porque el proyecto origen fue eliminado antes de aprobarse o venderse."
            )
            db.add(product)

    @staticmethod
    def _delete_base_contents(db: Session, base_id: int, empresa_id: int) -> None:
        apu_ids_subq = db.query(APU.id).filter(APU.base_trabajo_id == base_id)

        db.query(BimLinkApu).filter(BimLinkApu.apu_id.in_(apu_ids_subq)).delete(synchronize_session=False)
        db.query(ProyectoApuCpc).filter(
            ProyectoApuCpc.empresa_id == empresa_id,
            ProyectoApuCpc.apu_id.in_(apu_ids_subq),
        ).delete(synchronize_session=False)
        db.query(APULinea).filter(APULinea.apu_id.in_(apu_ids_subq)).delete(synchronize_session=False)
        db.query(APU).filter(APU.base_trabajo_id == base_id).delete(synchronize_session=False)
        db.query(Recurso).filter(Recurso.base_trabajo_id == base_id).delete(synchronize_session=False)
        db.query(SubcategoriaItem).filter(SubcategoriaItem.base_trabajo_id == base_id).delete(synchronize_session=False)
        db.query(Unidad).filter(Unidad.base_trabajo_id == base_id).delete(synchronize_session=False)
        db.query(BaseTrabajoAsignacion).filter(BaseTrabajoAsignacion.base_trabajo_id == base_id).delete(synchronize_session=False)

    @staticmethod
    def _delete_project_contents(db: Session, proyecto_id: int, empresa_id: int) -> None:
        db.query(CronogramaValorado).filter(
            CronogramaValorado.proyecto_id == proyecto_id,
            CronogramaValorado.empresa_id == empresa_id,
        ).delete(synchronize_session=False)
        db.query(CronogramaTrabajo).filter(
            CronogramaTrabajo.proyecto_id == proyecto_id,
            CronogramaTrabajo.empresa_id == empresa_id,
        ).delete(synchronize_session=False)

        budgets = db.query(Presupuesto).filter(
            Presupuesto.proyecto_id == proyecto_id,
            Presupuesto.empresa_id == empresa_id,
        ).all()
        for budget in budgets:
            db.delete(budget)
        db.flush()

        db.query(ProjectCalendarOverride).filter(
            ProjectCalendarOverride.proyecto_id == proyecto_id,
            ProjectCalendarOverride.empresa_id == empresa_id,
        ).delete(synchronize_session=False)
        db.query(ProjectCalendarSnapshot).filter(
            ProjectCalendarSnapshot.proyecto_id == proyecto_id,
            ProjectCalendarSnapshot.empresa_id == empresa_id,
        ).delete(synchronize_session=False)
        db.query(BimViewState).filter(
            BimViewState.proyecto_id == proyecto_id,
            BimViewState.empresa_id == empresa_id,
        ).delete(synchronize_session=False)
        db.query(BimModel).filter(
            BimModel.proyecto_id == proyecto_id,
            BimModel.empresa_id == empresa_id,
        ).delete(synchronize_session=False)
        db.query(ProyectoAsignacion).filter(
            ProyectoAsignacion.proyecto_id == proyecto_id
        ).delete(synchronize_session=False)
        db.query(ProyectoStakeholder).filter(
            ProyectoStakeholder.proyecto_id == proyecto_id
        ).delete(synchronize_session=False)
        db.query(EdoNode).filter(EdoNode.proyecto_id == proyecto_id).delete(synchronize_session=False)
        db.query(EdtNode).filter(EdtNode.proyecto_id == proyecto_id).delete(synchronize_session=False)

    @staticmethod
    def _build_project_base_name(project: Proyecto, project_name: str) -> str:
        if (project.revision or 0) > 0:
            return f"Rev {str(project.revision).zfill(3)}: {project_name}"
        return f"Base: {project_name}"

    @staticmethod
    def _build_project_base_description(project: Proyecto, project_name: str) -> str:
        if (project.revision or 0) > 0:
            rev_str = str(project.revision).zfill(3)
            return f"Base desvinculada para revisión {rev_str} del proyecto {project_name}"
        return f"Base automática para el proyecto {project_name}"

    @staticmethod
    def _clone_edt_nodes(db: Session, source_project_id: int, target_project_id: int, empresa_id: int) -> dict:
        source_nodes = (
            db.query(EdtNode)
            .filter(
                EdtNode.proyecto_id == source_project_id,
                EdtNode.empresa_id == empresa_id,
            )
            .order_by(EdtNode.parent_id.nullsfirst(), EdtNode.orden.asc(), EdtNode.id.asc())
            .all()
        )

        node_id_map = {}
        for source_node in source_nodes:
            cloned_node = EdtNode(
                proyecto_id=target_project_id,
                parent_id=node_id_map.get(source_node.parent_id) if source_node.parent_id else None,
                tipo_nodo=source_node.tipo_nodo,
                orden=source_node.orden,
                codigo=source_node.codigo,
                nombre=source_node.nombre,
                definicion=source_node.definicion,
                stakeholder_id=source_node.stakeholder_id,
                rol_id=source_node.rol_id,
                actividades_claves=source_node.actividades_claves,
                empresa_id=empresa_id,
            )
            db.add(cloned_node)
            db.flush()
            node_id_map[source_node.id] = cloned_node.id

        return node_id_map

    @classmethod
    def _remap_gantt_metadata_line_ids(cls, value, line_id_map: dict[int, int]):
        if isinstance(value, list):
            return [cls._remap_gantt_metadata_line_ids(item, line_id_map) for item in value]
        if not isinstance(value, dict):
            return value

        remapped = {}
        for key, item in value.items():
            if key in cls.GANTT_LINE_ID_METADATA_KEYS:
                try:
                    item_as_int = int(item)
                    remapped[key] = line_id_map.get(item_as_int, item)
                    continue
                except Exception:
                    pass
            remapped[key] = cls._remap_gantt_metadata_line_ids(item, line_id_map)
        return remapped

    @classmethod
    def _clone_gantt_schedule_data(cls, source_schedule_data: dict | None, line_id_map: dict[int, int]) -> dict:
        source_schedule_data = deepcopy(source_schedule_data or {})
        raw_config = source_schedule_data.get("__config__") or source_schedule_data.get("config") or {}
        raw_lineas = (
            source_schedule_data.get("lineas")
            if "lineas" in source_schedule_data
            else {str(key): value for key, value in source_schedule_data.items() if str(key) != "__config__"}
        ) or {}

        config = deepcopy(raw_config)
        resource_modifications = config.get("apu_resource_modifications_v1")
        if isinstance(resource_modifications, dict):
            remapped_modifications = {}
            for key, value in resource_modifications.items():
                try:
                    source_line_id = int(key)
                except Exception:
                    continue
                target_line_id = line_id_map.get(source_line_id)
                if target_line_id:
                    remapped_modifications[str(target_line_id)] = cls._remap_gantt_metadata_line_ids(value, line_id_map)
            config["apu_resource_modifications_v1"] = remapped_modifications

        cloned_lineas: dict[str, dict] = {}
        for raw_key, raw_value in raw_lineas.items():
            try:
                source_line_id = int(raw_key)
            except Exception:
                continue
            target_line_id = line_id_map.get(source_line_id)
            if not target_line_id or not isinstance(raw_value, dict):
                continue

            cloned_value = deepcopy(raw_value)
            predecessors = []
            for predecessor in cloned_value.get("predecessors") or []:
                try:
                    mapped_predecessor = line_id_map.get(int(predecessor))
                except Exception:
                    mapped_predecessor = None
                if mapped_predecessor and mapped_predecessor not in predecessors:
                    predecessors.append(mapped_predecessor)
            cloned_value["predecessors"] = predecessors

            dependencies = []
            for dependency in cloned_value.get("dependencies") or []:
                if not isinstance(dependency, dict):
                    continue
                try:
                    source_id = int(dependency.get("source_id"))
                except Exception:
                    source_id = 0
                mapped_source_id = line_id_map.get(source_id)
                if not mapped_source_id:
                    continue
                cloned_dependency = deepcopy(dependency)
                cloned_dependency["source_id"] = mapped_source_id
                cloned_dependency["target_id"] = target_line_id
                cloned_dependency["metadata"] = cls._remap_gantt_metadata_line_ids(
                    cloned_dependency.get("metadata") or {},
                    line_id_map,
                )
                dependencies.append(cloned_dependency)
            cloned_value["dependencies"] = dependencies

            metadata = cloned_value.get("metadata")
            if isinstance(metadata, dict):
                cloned_value["metadata"] = cls._remap_gantt_metadata_line_ids(metadata, line_id_map)

            cloned_lineas[str(target_line_id)] = cloned_value

        return {"__config__": config, **cloned_lineas}

    def get_projects_roots(self, db: Session, current_user: Usuario, empresa_id: int, skip: int = 0, limit: int = 100) -> List[Proyecto]:
        # Implementation moved from repository and slightly adjusted for service layer
        query_subq = db.query(
            Proyecto.codigo_root,
            func.count(Proyecto.id).label("cnt")
        ).filter(
            Proyecto.empresa_id == empresa_id,
            Proyecto.deleted_at.is_(None),
        ).group_by(Proyecto.codigo_root)

        # Filtrar por asignación si el usuario es colaborador
        if current_user.rol.lower() == "usuario":
            query_subq = query_subq.join(
                ProyectoAsignacion, ProyectoAsignacion.proyecto_id == Proyecto.id
            ).filter(ProyectoAsignacion.usuario_id == current_user.id)

        subq = query_subq.subquery()

        query = db.query(Proyecto, subq.c.cnt).outerjoin(
            subq, Proyecto.codigo_root == subq.c.codigo_root
        ).filter(
            Proyecto.empresa_id == empresa_id,
            Proyecto.revision == 0,
            Proyecto.deleted_at.is_(None),
        )

        # Filtrar por asignación en el query principal si es colaborador
        if current_user.rol.lower() == "usuario":
            query = query.join(
                ProyectoAsignacion, ProyectoAsignacion.proyecto_id == Proyecto.id
            ).filter(ProyectoAsignacion.usuario_id == current_user.id)

        results = query.offset(skip).limit(limit).all()
        projects = []
        for p, cnt in results:
            p.num_revisiones = cnt or 1
            p.sole_presupuesto_total = None
            p.sole_indirectos_porcentaje = None

            if (cnt or 1) == 1:
                presupuesto = db.query(Presupuesto).filter(
                    Presupuesto.proyecto_id == p.id,
                    Presupuesto.empresa_id == empresa_id
                ).order_by(Presupuesto.revision.desc(), Presupuesto.id.desc()).first()
                if presupuesto:
                    p.sole_presupuesto_total = float(presupuesto.subtotal or 0)
                    p.sole_indirectos_porcentaje = float(presupuesto.indirectos_porcentaje or 0)
            projects.append(p)
        return projects

    def create_proyecto(self, db: Session, obj_in: ProyectoCreate, empresa_id: int) -> Proyecto:
        empresa = db.query(Empresa).filter(Empresa.id == empresa_id).first()
        if not empresa:
            raise ValueError("Empresa no encontrada")

        # 1. Generación de Código Automático
        prefix = empresa.proy_prefijo or empresa.nombre.replace(" ", "")[:20]
        period = empresa.proy_periodo or str(datetime.now().year)
        current_secuencial = empresa.proy_secuencial
        code_unique = False
        
        while not code_unique:
            seq_str = str(current_secuencial).zfill(empresa.proy_secuencial_size or 9)
            nuevo_codigo = f"{prefix}-{period}-{seq_str}"
            exists = db.query(Proyecto).filter(
                Proyecto.codigo == nuevo_codigo, 
                Proyecto.empresa_id == empresa_id,
                Proyecto.deleted_at.is_(None),
            ).first()
            if not exists:
                obj_in.codigo = nuevo_codigo
                code_unique = True
            else:
                current_secuencial += 1
        
        empresa.proy_secuencial = current_secuencial + 1
        db.add(empresa)

        # 2. Base de Trabajo Creation
        base_id = None
        if obj_in.source_base_id:
            source_base = base_trabajo_repo.get_by_id(db, id=obj_in.source_base_id, empresa_id=empresa_id)
            if source_base:
                new_base_in = BaseTrabajoCreate(
                    nombre=f"Base: {obj_in.nombre}",
                    tipo="Base de Proyecto",
                    descripcion=f"Base automática para el proyecto {obj_in.nombre}",
                    porcentaje_indirectos=source_base.porcentaje_indirectos,
                    pais_id=source_base.pais_id,
                    moneda=source_base.moneda,
                    source_base_id=obj_in.source_base_id,
                    content_revision=0
                )
                new_base = base_trabajo_repo.create(db, obj_in=new_base_in, empresa_id=empresa_id)
                base_id = new_base.id

        # 3. Create Project Header
        data = obj_in.model_dump(exclude={"source_base_id"})
        if not data.get("plantillas_config"):
            data["plantillas_config"] = empresa.plantillas_config
        data["moneda"] = (data.get("moneda") or "USD").strip() or "USD"

        db_obj = Proyecto(
            **data,
            base_trabajo_id=base_id,
            empresa_id=empresa_id
        )
        db.add(db_obj)
        db.flush()

        if not db_obj.codigo_root:
            db_obj.codigo_root = db_obj.codigo
            db.add(db_obj)
        
        db.commit()
        db.refresh(db_obj)
        
        # 4. Inicializar Presupuesto Base automáticamente
        from app.services.presupuesto import initialize_presupuesto_from_edt
        try:
            initialize_presupuesto_from_edt(db, db_obj.id, empresa_id)
        except Exception as e:
            logger.warning("Error al inicializar presupuesto: %s", e)
            # No bloqueamos la creación del proyecto si falla la inicialización del presupuesto
            # Pero lo ideal sería que no falle.
        
        # 5. Actualizar métricas de uso (Sincronización reactiva)
        license_service.update_usage_metrics(db, empresa_id)
        
        return db_obj

    def create_revision(self, db: Session, proyecto_id: int, empresa_id: int) -> Proyecto:
        original = proyecto_repo.get_by_id(db, id=proyecto_id, empresa_id=empresa_id)
        if not original:
            return None
        
        nueva_rev_num = (original.revision or 0) + 1
        rev_str = str(nueva_rev_num).zfill(3)
        root_code = original.codigo_root or original.codigo
        nuevo_codigo = f"{root_code}-R{rev_str}"
        
        # Clone Base
        new_base_in = BaseTrabajoCreate(
            nombre=f"Rev {rev_str}: {original.nombre}",
            tipo="Base de Proyecto",
            descripcion=f"Base desvinculada para revisión {rev_str}",
            source_base_id=original.base_trabajo_id,
            content_revision=nueva_rev_num
        )
        new_base = base_trabajo_repo.create(db, obj_in=new_base_in, empresa_id=empresa_id)

        # Clone Project
        nuevo_proyecto = Proyecto(
            nombre=original.nombre,
            codigo=nuevo_codigo,
            codigo_root=root_code,
            revision=nueva_rev_num,
            descripcion=original.descripcion,
            estado="Planificación",
            fecha_inicio=original.fecha_inicio,
            fecha_fin_estimada=original.fecha_fin_estimada,
            presupuesto_estimado=original.presupuesto_estimado,
            moneda=original.moneda or "USD",
            empresa_id=empresa_id,
            cliente_id=original.cliente_id,
            base_trabajo_id=new_base.id, 
            plantillas_config=original.plantillas_config
        )
        db.add(nuevo_proyecto)
        db.flush()
        
        if not original.codigo_root:
            original.codigo_root = root_code
            db.add(original)
        
        db.commit()
        db.refresh(nuevo_proyecto)

        edt_id_map = self._clone_edt_nodes(db, original.id, nuevo_proyecto.id, empresa_id)
        
        # Clone Budgets
        from app.services.presupuesto import (
            resolve_apu_for_target_base,
            _sync_presupuesto_line_from_apu,
        )
        presupuestos = db.query(Presupuesto).filter(Presupuesto.proyecto_id == original.id).all()
        for p_orig in presupuestos:
            nuevo_presupuesto = Presupuesto(
                codigo=f"{p_orig.codigo}-R{rev_str}" if p_orig.codigo else None,
                revision=nueva_rev_num,
                descripcion=p_orig.descripcion,
                subtotal=p_orig.subtotal,
                indirectos_total=p_orig.indirectos_total,
                impuestos=p_orig.impuestos,
                total=p_orig.total,
                estado="En Elaboración",
                moneda=p_orig.moneda,
                iva_aplicado=p_orig.iva_aplicado,
                dec_moneda=p_orig.dec_moneda,
                dec_calculos=p_orig.dec_calculos,
                proyecto_id=nuevo_proyecto.id,
                empresa_id=empresa_id
            )
            db.add(nuevo_presupuesto)
            db.flush()

            indirectos_porcentaje = sum(
                (Decimal(str(indirecto.porcentaje or 0)) for indirecto in (p_orig.indirectos or [])),
                Decimal("0.0"),
            )

            for indirecto in p_orig.indirectos or []:
                db.add(
                    PresupuestoIndirecto(
                        presupuesto_id=nuevo_presupuesto.id,
                        empresa_id=empresa_id,
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
            
            # Clone Details
            detalles_orig = db.query(PresupuestoDetalle).filter(PresupuestoDetalle.presupuesto_id == p_orig.id).all()
            id_map = {}
            for d in sorted(detalles_orig, key=lambda x: ((x.parent_id or 0), x.orden or 0, x.id or 0)):
                target_apu = None
                if d.apu_id:
                    target_apu = resolve_apu_for_target_base(
                        db,
                        d.apu_id,
                        new_base.id,
                        empresa_id,
                    )
                nuevo_detalle = PresupuestoDetalle(
                    presupuesto_id=nuevo_presupuesto.id,
                    apu_id=target_apu.id if target_apu else d.apu_id,
                    parent_id=id_map.get(d.parent_id) if d.parent_id else None,
                    tipo=d.tipo,
                    orden=d.orden,
                    descripcion=target_apu.descripcion if target_apu else d.descripcion,
                    unidad=canonicalize_unit_symbol(target_apu.unidad) if target_apu else canonicalize_unit_symbol(d.unidad),
                    cantidad=d.cantidad,
                    precio_unitario=d.precio_unitario,
                    precio_total=d.precio_total,
                    edt_id=edt_id_map.get(d.edt_id, d.edt_id),
                    codigo_item=d.codigo_item,
                    omniclass_codigo=target_apu.omniclass_codigo if target_apu else d.omniclass_codigo,
                    omniclass_titulo=target_apu.omniclass_titulo if target_apu else d.omniclass_titulo,
                    notas=d.notas,
                    tanteo_activo=d.tanteo_activo,
                )
                db.add(nuevo_detalle)
                db.flush()
                if target_apu:
                    _sync_presupuesto_line_from_apu(
                        nuevo_presupuesto,
                        nuevo_detalle,
                        target_apu,
                        indirectos_porcentaje=indirectos_porcentaje,
                    )
                id_map[d.id] = nuevo_detalle.id

            cronograma_original = db.query(CronogramaTrabajo).filter(
                CronogramaTrabajo.presupuesto_id == p_orig.id,
                CronogramaTrabajo.proyecto_id == original.id,
                CronogramaTrabajo.empresa_id == empresa_id,
            ).first()
            if cronograma_original:
                db.add(
                    CronogramaTrabajo(
                        presupuesto_id=nuevo_presupuesto.id,
                        proyecto_id=nuevo_proyecto.id,
                        empresa_id=empresa_id,
                        schedule_data=self._clone_gantt_schedule_data(
                            cronograma_original.schedule_data,
                            id_map,
                        ),
                    )
                )
        
        db.commit()
        db.refresh(nuevo_proyecto)
        
        # 4. Asegurar que la nueva revisión tenga presupuesto (especialmente si el original no tenía)
        from app.services.presupuesto import initialize_presupuesto_from_edt
        try:
            initialize_presupuesto_from_edt(db, nuevo_proyecto.id, empresa_id)
        except Exception as e:
            logger.warning("Error al asegurar presupuesto en revision: %s", e)

        # 5. Actualizar métricas
        license_service.update_usage_metrics(db, empresa_id)
        
        return nuevo_proyecto

    def update_proyecto(
        self,
        db: Session,
        proyecto_id: int,
        obj_in: ProyectoUpdate,
        empresa_id: int,
        user_id: int | None = None,
    ) -> Proyecto:
        db_obj = proyecto_repo.get_by_id(db, id=proyecto_id, empresa_id=empresa_id)
        if not db_obj:
            return None

        update_data = obj_in.model_dump(exclude_unset=True)
        previous_estado = str(db_obj.estado or "").strip()
        incoming_estado = str(update_data.get("estado") or "").strip() if "estado" in update_data else previous_estado
        sync_fields = {"presupuesto_estimado", "nombre"}
        root_code = db_obj.codigo_root or db_obj.codigo

        if any(field in update_data for field in sync_fields):
            revisions = db.query(Proyecto).filter(
                Proyecto.codigo_root == root_code,
                Proyecto.empresa_id == empresa_id
            ).all()
            for revision in revisions:
                for field in sync_fields:
                    if field in update_data:
                        setattr(revision, field, update_data[field])
                db.add(revision)

            if "nombre" in update_data:
                project_name = (update_data["nombre"] or "").strip()
                if project_name:
                    for revision in revisions:
                        if not revision.base_trabajo_id:
                            continue
                        base = db.query(BaseTrabajo).filter(
                            BaseTrabajo.id == revision.base_trabajo_id,
                            BaseTrabajo.empresa_id == empresa_id,
                            BaseTrabajo.tipo == "Base de Proyecto"
                        ).first()
                        if not base:
                            continue

                        base.nombre = self._build_project_base_name(revision, project_name)
                        base.descripcion = self._build_project_base_description(revision, project_name)
                        db.add(base)

        result = proyecto_repo.update(db, db_obj=db_obj, obj_in=obj_in)
        if "estado" in update_data and incoming_estado and incoming_estado != previous_estado:
            from app.services.gantt_workflow import gantt_workflow_service

            gantt_workflow_service.cancel_active_drafts_for_project(
                db,
                proyecto_id=proyecto_id,
                empresa_id=empresa_id,
                reason=f"project_state_changed:{previous_estado}->{incoming_estado}",
                user_id=user_id,
            )
        return result

    def list_recycled_projects(self, db: Session, empresa_id: int, skip: int = 0, limit: int = 100) -> List[Proyecto]:
        return proyecto_repo.get_deleted_roots(db, empresa_id=empresa_id, skip=skip, limit=limit)

    def soft_delete_full_project(
        self,
        db: Session,
        proyecto_id: int,
        empresa_id: int,
        *,
        current_user: Optional[Usuario] = None,
        reason: Optional[str] = None,
        delete_project_base: bool = True,
    ) -> bool:
        target = proyecto_repo.get_by_id(db, id=proyecto_id, empresa_id=empresa_id)
        if not target:
            return False

        root_code = target.codigo_root or target.codigo
        revisions = db.query(Proyecto).filter(
            Proyecto.codigo_root == root_code,
            Proyecto.empresa_id == empresa_id,
            Proyecto.deleted_at.is_(None),
        ).all()
        revision_ids = [r.id for r in revisions]
        self._sync_marketplace_products_before_project_delete(db, revision_ids, empresa_id)

        deleted_at = self._now_utc()
        expires_at = self._recycle_expiry(deleted_at)
        user_id = getattr(current_user, "id", None)
        base_ids = list(set([r.base_trabajo_id for r in revisions if r.base_trabajo_id]))

        try:
            for revision in revisions:
                revision.trash_original_nombre = revision.trash_original_nombre or revision.nombre
                revision.trash_original_codigo = revision.trash_original_codigo or revision.codigo
                revision.deleted_at = deleted_at
                revision.deleted_by_user_id = user_id
                revision.recycle_expires_at = expires_at
                revision.deletion_reason = reason
                db.add(revision)

            recycled_base_ids = []
            preserved_base_ids = []

            for base_id in base_ids:
                base = db.query(BaseTrabajo).filter(
                    BaseTrabajo.id == base_id,
                    BaseTrabajo.empresa_id == empresa_id,
                    BaseTrabajo.tipo == "Base de Proyecto",
                    BaseTrabajo.deleted_at.is_(None),
                ).first()
                if not base:
                    continue
                if delete_project_base:
                    self._mark_base_for_recycle(
                        db,
                        base,
                        deleted_at=deleted_at,
                        expires_at=expires_at,
                        user_id=user_id,
                        reason=f"Base de proyecto movida a papelera junto al proyecto {root_code}",
                    )
                    recycled_base_ids.append(base_id)
                else:
                    source_revision = next((revision for revision in revisions if revision.base_trabajo_id == base_id), target)
                    self._convert_project_base_to_work_base(db, base, source_revision)
                    preserved_base_ids.append(base_id)

            db.commit()
            license_service.update_usage_metrics(db, empresa_id)
            record_audit_event(
                db,
                module="proyectos",
                event_type="project_moved_to_recycle_bin",
                entity_type="proyecto",
                entity_id=target.id,
                actor=current_user,
                empresa_id=empresa_id,
                message=f"Proyecto movido a papelera: {target.trash_original_nombre or target.nombre}",
                payload={
                    "project_id": target.id,
                    "root_code": root_code,
                    "revision_ids": revision_ids,
                    "base_ids": base_ids,
                    "recycled_base_ids": recycled_base_ids,
                    "preserved_base_ids": preserved_base_ids,
                    "delete_project_base": bool(delete_project_base),
                    "deleted_at": deleted_at,
                    "recycle_expires_at": expires_at,
                    "retention_days": self.RECYCLE_RETENTION_DAYS,
                },
            )
            return True
        except Exception:
            db.rollback()
            raise

    def restore_full_project(
        self,
        db: Session,
        proyecto_id: int,
        empresa_id: int,
        *,
        current_user: Optional[Usuario] = None,
    ) -> Proyecto:
        target = proyecto_repo.get_by_id(db, id=proyecto_id, empresa_id=empresa_id, include_deleted=True)
        if not target or not target.deleted_at:
            return None

        root_code = target.codigo_root or target.codigo
        revisions = db.query(Proyecto).filter(
            Proyecto.codigo_root == root_code,
            Proyecto.empresa_id == empresa_id,
            Proyecto.deleted_at.isnot(None),
        ).all()
        base_ids = list(set([r.base_trabajo_id for r in revisions if r.base_trabajo_id]))

        try:
            for base_id in base_ids:
                base = db.query(BaseTrabajo).filter(
                    BaseTrabajo.id == base_id,
                    BaseTrabajo.empresa_id == empresa_id,
                ).first()
                if base and base.deleted_at:
                    self._restore_recycled_base(db, base, empresa_id)
                elif base and base.tipo != "Base de Proyecto":
                    source_revision = next((revision for revision in revisions if revision.base_trabajo_id == base_id), target)
                    base.tipo = "Base de Proyecto"
                    base.descripcion = self._build_project_base_description(source_revision, source_revision.trash_original_nombre or source_revision.nombre)
                    db.add(base)

            for revision in revisions:
                revision.nombre = revision.trash_original_nombre or revision.nombre
                revision.codigo = revision.trash_original_codigo or revision.codigo
                revision.deleted_at = None
                revision.deleted_by_user_id = None
                revision.recycle_expires_at = None
                revision.deletion_reason = None
                revision.trash_original_nombre = None
                revision.trash_original_codigo = None
                db.add(revision)

            db.commit()
            license_service.update_usage_metrics(db, empresa_id)
            db.refresh(target)
            record_audit_event(
                db,
                module="proyectos",
                event_type="project_restored_from_recycle_bin",
                entity_type="proyecto",
                entity_id=target.id,
                actor=current_user,
                empresa_id=empresa_id,
                message=f"Proyecto restaurado desde papelera: {target.nombre}",
                payload={"project_id": target.id, "root_code": root_code, "revision_count": len(revisions), "base_ids": base_ids},
            )
            return target
        except Exception:
            db.rollback()
            raise

    def purge_recycled_project(
        self,
        db: Session,
        proyecto_id: int,
        empresa_id: int,
        *,
        current_user: Optional[Usuario] = None,
        require_expired: bool = False,
    ) -> bool:
        target = proyecto_repo.get_by_id(db, id=proyecto_id, empresa_id=empresa_id, include_deleted=True)
        if not target or not target.deleted_at:
            return False
        if require_expired and target.recycle_expires_at and target.recycle_expires_at > self._now_utc():
            return False
        root_code = target.codigo_root or target.codigo
        success = self.delete_full_project(db, proyecto_id=target.id, empresa_id=empresa_id)
        if success:
            record_audit_event(
                db,
                module="proyectos",
                event_type="project_purged_from_recycle_bin",
                entity_type="proyecto",
                entity_id=target.id,
                actor=current_user,
                empresa_id=empresa_id,
                message=f"Proyecto purgado definitivamente desde papelera: {root_code}",
                payload={"project_id": target.id, "root_code": root_code},
            )
        return success

    def purge_expired_recycled_projects(self, db: Session, empresa_id: int, *, limit: int = 100) -> int:
        now = self._now_utc()
        expired = (
            db.query(Proyecto)
            .filter(
                Proyecto.empresa_id == empresa_id,
                Proyecto.revision == 0,
                Proyecto.deleted_at.isnot(None),
                Proyecto.recycle_expires_at <= now,
            )
            .order_by(Proyecto.recycle_expires_at.asc(), Proyecto.id.asc())
            .limit(limit)
            .all()
        )
        purged = 0
        for project in expired:
            if self.purge_recycled_project(db, project.id, empresa_id, require_expired=True):
                purged += 1
        return purged

    def delete_full_project(self, db: Session, proyecto_id: int, empresa_id: int) -> bool:
        target = proyecto_repo.get_by_id(db, id=proyecto_id, empresa_id=empresa_id, include_deleted=True)
        if not target:
            return False

        root_code = target.codigo_root or target.codigo
        revisions = db.query(Proyecto).filter(
            Proyecto.codigo_root == root_code,
            Proyecto.empresa_id == empresa_id
        ).all()
        revision_ids = [r.id for r in revisions]
        self._sync_marketplace_products_before_project_delete(db, revision_ids, empresa_id)

        try:
            base_ids = list(set([r.base_trabajo_id for r in revisions if r.base_trabajo_id]))

            db.query(ProjectCalendarEntry).filter(
                ProjectCalendarEntry.empresa_id == empresa_id,
                ProjectCalendarEntry.proyecto_codigo_root == root_code,
            ).delete(synchronize_session=False)

            for revision_id in revision_ids:
                self._delete_project_contents(db, revision_id, empresa_id)

            db.query(Stakeholder).filter(
                Stakeholder.empresa_id == empresa_id,
                Stakeholder.proyecto_codigo_root == root_code
            ).delete(synchronize_session=False)

            for rev in revisions:
                db.delete(rev)
            db.flush()

            for b_id in base_ids:
                base = db.query(BaseTrabajo).filter(
                    BaseTrabajo.id == b_id,
                    BaseTrabajo.empresa_id == empresa_id,
                    BaseTrabajo.tipo == "Base de Proyecto"
                ).first()
                if base:
                    self._delete_base_contents(db, base.id, empresa_id)
                    db.delete(base)

            db.commit()
            license_service.update_usage_metrics(db, empresa_id)
            return True
        except Exception:
            db.rollback()
            raise

    def delete_revision(self, db: Session, proyecto_id: int, empresa_id: int) -> bool:
        target = proyecto_repo.get_by_id(db, id=proyecto_id, empresa_id=empresa_id)
        if not target:
            return False

        if int(target.revision or 0) == 0:
            raise ValueError("La revisión base R000 no puede eliminarse.")

        base_id = target.base_trabajo_id
        self._sync_marketplace_products_before_project_delete(db, [target.id], empresa_id)

        try:
            self._delete_project_contents(db, target.id, empresa_id)

            db.delete(target)
            db.flush()

            if base_id:
                base = db.query(BaseTrabajo).filter(
                    BaseTrabajo.id == base_id,
                    BaseTrabajo.empresa_id == empresa_id,
                    BaseTrabajo.tipo == "Base de Proyecto"
                ).first()
                if base:
                    self._delete_base_contents(db, base.id, empresa_id)
                    db.delete(base)

            db.commit()
            license_service.update_usage_metrics(db, empresa_id)
            return True
        except Exception:
            db.rollback()
            raise

    def assign_user(self, db: Session, proyecto_id: int, usuario_id: int, asignado_por_id: int, edt_id: Optional[int] = None, modulo: str = "todos", es_global: bool = False) -> ProyectoAsignacion:
        # Verificar si ya está asignado con los mismos criterios
        query = db.query(ProyectoAsignacion).filter(
            ProyectoAsignacion.proyecto_id == proyecto_id,
            ProyectoAsignacion.usuario_id == usuario_id,
            ProyectoAsignacion.modulo == modulo,
            ProyectoAsignacion.es_global == es_global
        )
        
        if edt_id:
            query = query.filter(ProyectoAsignacion.edt_id == edt_id)
        else:
            query = query.filter(ProyectoAsignacion.edt_id.is_(None))
            
        existing = query.first()
        
        if not existing:
            db_obj = ProyectoAsignacion(
                proyecto_id=proyecto_id,
                usuario_id=usuario_id,
                asignado_por_id=asignado_por_id,
                edt_id=edt_id,
                modulo=modulo,
                es_global=es_global
            )
            db.add(db_obj)
            db.commit()
            db.refresh(db_obj)
            existing = db_obj

        # AUTOMÁTICO: Asignar también la base de trabajo del proyecto
        if not edt_id:
            proyecto = db.query(Proyecto).filter(Proyecto.id == proyecto_id).first()
            if proyecto and proyecto.base_trabajo_id:
                from app.repositories.base_trabajo import base_trabajo_repo
                base_trabajo_repo.assign_user(db, base_id=proyecto.base_trabajo_id, usuario_id=usuario_id, asignado_por_id=asignado_por_id)
            
        return existing

    def unassign_user(self, db: Session, proyecto_id: int, usuario_id: int, edt_id: Optional[int] = None, modulo: str = "todos", es_global: bool = False) -> bool:
        query = db.query(ProyectoAsignacion).filter(
            ProyectoAsignacion.proyecto_id == proyecto_id,
            ProyectoAsignacion.usuario_id == usuario_id,
            ProyectoAsignacion.modulo == modulo,
            ProyectoAsignacion.es_global == es_global
        )
        
        if edt_id:
            query = query.filter(ProyectoAsignacion.edt_id == edt_id)
        else:
            query = query.filter(ProyectoAsignacion.edt_id.is_(None))
            
        query.delete()
        
        if not edt_id:
            from app.models.proyecto import Proyecto
            proyecto = db.query(Proyecto).filter(Proyecto.id == proyecto_id).first()
            if proyecto and proyecto.base_trabajo_id:
                from app.models.base_trabajo_asignacion import BaseTrabajoAsignacion
                db.query(BaseTrabajoAsignacion).filter(
                    BaseTrabajoAsignacion.base_trabajo_id == proyecto.base_trabajo_id,
                    BaseTrabajoAsignacion.usuario_id == usuario_id
                ).delete()
            
        db.commit()
        return True

    def get_assigned_users(self, db: Session, proyecto_id: int, edt_id: Optional[int] = None, modulo: str = "todos") -> List[Usuario]:
        # 1. Obtener el proyecto para saber su codigo_root
        proyecto = db.query(Proyecto).filter(Proyecto.id == proyecto_id).first()
        if not proyecto:
            return []

        # 2. Construir query con filtros de alcance
        from sqlalchemy import or_
        query = db.query(Usuario).join(
            ProyectoAsignacion, ProyectoAsignacion.usuario_id == Usuario.id
        )
        
        # Filtro de Proyecto/Revisión
        #  - Asignación directa a este proyecto_id
        #  - O asignación Global al codigo_root
        proj_filter = or_(
            ProyectoAsignacion.proyecto_id == proyecto_id,
            ProyectoAsignacion.es_global == True
        )
        # Nota: Si es global, debemos asegurarnos que pertenezca al mismo codigo_root
        # Para simplificar en esta fase, asumimos que si es global y proyecto_id 
        # coinciden en el join indirecto (o via repo), pero lo ideal es filtrar por codigo_root.
        query = query.filter(proj_filter)

        # Filtro de Módulo
        #  - Asignación a "todos"
        #  - O asignación al "modulo" específico solicitado
        if modulo != "todos":
            query = query.filter(or_(
                ProyectoAsignacion.modulo == "todos",
                ProyectoAsignacion.modulo == modulo
            ))
        
        # Filtro de EDT
        if edt_id:
            query = query.filter(ProyectoAsignacion.edt_id == edt_id)
        else:
            query = query.filter(ProyectoAsignacion.edt_id.is_(None))
            
        return query.all()

    def get_user_permissions(self, db: Session, proyecto_id: int, usuario_id: int) -> dict:
        """
        Calcula los permisos de un usuario sobre un proyecto considerando módulos y EDT.
        Garantiza acceso total a Administradores y Superadministradores.
        """
        from app.models.usuario import Usuario
        user = db.query(Usuario).filter(Usuario.id == usuario_id).first()
        
        # Si es Admin o Superadmin, tiene acceso completo SIEMPRE
        role_lower = user.rol.lower() if user and user.rol else ""
        if role_lower in ["administrador", "superadministrador"]:
            return {
                "is_restricted": False, 
                "edt_ids": [], 
                "has_assignment": True,
                "allowed_modules": ["todos"],
                "module_restrictions": {}
            }

        # Obtener todas las asignaciones del usuario para este proyecto
        asignaciones = db.query(ProyectoAsignacion).filter(
            ProyectoAsignacion.proyecto_id == proyecto_id,
            ProyectoAsignacion.usuario_id == usuario_id
        ).all()
        
        if not asignaciones:
            return {
                "is_restricted": False, 
                "edt_ids": [], 
                "has_assignment": False,
                "allowed_modules": [],
                "module_restrictions": {}
            }
        
        # Construir mapa de permisos por módulo
        allowed_modules = set()
        edt_by_module = {} # modulo -> list of edt_ids
        is_restricted_global = False
        all_edt_ids = []

        for asig in asignaciones:
            mod = asig.modulo
            allowed_modules.add(mod)
            
            if asig.edt_id:
                is_restricted_global = True
                all_edt_ids.append(asig.edt_id)
                if mod not in edt_by_module:
                    edt_by_module[mod] = []
                edt_by_module[mod].append(asig.edt_id)
            else:
                # Si para un módulo edt_id es None, tiene acceso global a ese módulo
                if mod not in edt_by_module:
                    edt_by_module[mod] = None # None significa "unrestricted" para este módulo específico
        
        # Si tiene "todos", simplificamos
        if "todos" in allowed_modules:
            # Si "todos" es global, tiene acceso a todo
            global_asig = next((a for a in asignaciones if a.modulo == "todos"), None)
            if global_asig and not global_asig.edt_id:
                return {
                    "is_restricted": False, 
                    "edt_ids": [], 
                    "has_assignment": True,
                    "allowed_modules": ["todos"],
                    "module_restrictions": {}
                }

        return {
            "has_assignment": True,
            "allowed_modules": list(allowed_modules),
            "is_restricted": is_restricted_global,
            "edt_ids": list(set(all_edt_ids)),
            "module_restrictions": edt_by_module
        }

    def get_assignment_dashboard(self, db: Session, proyecto_id: int, modulo: str = "todos") -> List[dict]:
        """
        Retorna un resumen de asignaciones para el proyecto y su EDT filtrado por módulo.
        """
        proyecto = db.query(Proyecto).filter(Proyecto.id == proyecto_id).first()
        if not proyecto:
            return []

        # Obtener todos los nodos EDT
        edt_nodes = db.query(EdtNode).filter(EdtNode.proyecto_id == proyecto_id).all()
        
        # Obtener todas las asignaciones que aplican
        from sqlalchemy import or_
        asignaciones = db.query(ProyectoAsignacion).filter(
            or_(
                ProyectoAsignacion.proyecto_id == proyecto_id,
                ProyectoAsignacion.es_global == True
            )
        )
        
        if modulo != "todos":
            asignaciones = asignaciones.filter(
                or_(
                    ProyectoAsignacion.modulo == "todos",
                    ProyectoAsignacion.modulo == modulo
                )
            )
            
        asignaciones = asignaciones.all()
        
        # Agrupar usuarios por edt_id
        from app.schemas.usuario import UsuarioResponse
        users_map = {} # edt_id -> List[Usuario]
        
        for a in asignaciones:
            eid = a.edt_id
            if eid not in users_map:
                users_map[eid] = []
            if a.usuario not in users_map[eid]:
                users_map[eid].append(a.usuario)

        dashboard = []
        
        # 1. Nodo Raíz (Proyecto Completo)
        global_users = users_map.get(None, [])
        dashboard.append({
            "id": None,
            "codigo": proyecto.codigo,
            "nombre": "Todo el Proyecto",
            "tipo": "root",
            "assigned_users": [UsuarioResponse.model_validate(u) for u in global_users],
            "status": "success" if global_users else "warning"
        })
        
        # 2. Nodos EDT
        for node in edt_nodes:
            node_users = users_map.get(node.id, [])
            dashboard.append({
                "id": node.id,
                "parent_id": node.parent_id,
                "codigo": node.codigo,
                "nombre": node.nombre,
                "tipo": "edt",
                "assigned_users": [UsuarioResponse.model_validate(u) for u in node_users],
                "status": "success" if node_users else "warning"
            })
            
        # Inyectar el filtro activo en los datos para que el frontend lo reconozca
        for item in dashboard:
            item["modulo_filter"] = modulo
            
        return dashboard

    def get_user_assignment_summary(self, db: Session, proyecto_id: int, usuario_id: int) -> dict:
        """
        Retorna un resumen detallado de todas las asignaciones de un usuario en un proyecto.
        """
        from app.models.usuario import Usuario
        usuario = db.query(Usuario).filter(Usuario.id == usuario_id).first()
        if not usuario:
            return {}

        proyecto = db.query(Proyecto).filter(Proyecto.id == proyecto_id).first()
        if not proyecto:
            return {}

        # Buscamos asignaciones vinculadas a este proyecto específico
        asignaciones = db.query(ProyectoAsignacion).filter(
            ProyectoAsignacion.proyecto_id == proyecto_id,
            ProyectoAsignacion.usuario_id == usuario_id
        ).all()

        summary = {
            "usuario_id": usuario.id,
            "nombre": usuario.nombre_completo,
            "cargo": usuario.profesion or "Colaborador",
            "email": usuario.email,
            "total_asignaciones": len(asignaciones),
            "items": []
        }

        for asig in asignaciones:
            summary["items"].append({
                "modulo": asig.modulo,
                "es_global": asig.es_global,
                "edt_id": asig.edt_id,
                "edt_codigo": asig.edt_node.codigo if asig.edt_node else None,
                "edt_nombre": asig.edt_node.nombre if asig.edt_node else "Todo el Proyecto",
                "fecha": asig.fecha_asignacion.isoformat() if asig.fecha_asignacion else None
            })

        return summary

proyecto_service = ProyectoService()
