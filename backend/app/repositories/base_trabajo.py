import logging

from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from app.models.base_trabajo import BaseTrabajo
from app.schemas.base_trabajo import BaseTrabajoCreate, BaseTrabajoUpdate
from app.core.apu_status import normalize_apu_revision_status
from app.core.unit_normalization import canonicalize_unit_symbol
from typing import List, Optional, Any
from datetime import datetime, timezone

logger = logging.getLogger(__name__)

class BaseTrabajoRepository:
    def get_by_id(self, db: Session, id: int, empresa_id: int) -> Optional[BaseTrabajo]:
        return db.query(BaseTrabajo).filter(BaseTrabajo.id == id, BaseTrabajo.empresa_id == empresa_id).first()

    def get_multi(self, db: Session, empresa_id: int, skip: int = 0, limit: int = 100, user_id: Optional[int] = None) -> List[BaseTrabajo]:
        from app.models.proyecto import Proyecto
        from app.models.base_trabajo_asignacion import BaseTrabajoAsignacion
        
        # Realizamos un outerjoin con proyectos para obtener información de agrupación
        # Solo las bases de tipo "Base de Proyecto" tendrán estos campos
        query = db.query(
            BaseTrabajo,
            Proyecto.id.label("proyecto_id"),
            Proyecto.codigo_root.label("codigo_root"),
            Proyecto.revision.label("revision")
        ).outerjoin(
            Proyecto, 
            Proyecto.base_trabajo_id == BaseTrabajo.id
        ).filter(
            BaseTrabajo.empresa_id == empresa_id
        )
        
        # Filtro por asignación de usuario si se proporciona
        if user_id:
            query = query.join(
                BaseTrabajoAsignacion, 
                BaseTrabajoAsignacion.base_trabajo_id == BaseTrabajo.id
            ).filter(
                BaseTrabajoAsignacion.usuario_id == user_id
            )

        results = query.offset(skip).limit(limit).all()
        
        # Mapeamos los resultados para que los campos de proyecto
        # se inyecten como atributos dinámicos en el objeto BaseTrabajo
        # para que el schema los capture automáticamente.
        final_bases = []
        for base, proy_id, code_root, rev in results:
            base.proyecto_id = proy_id
            base.codigo_root = code_root
            base.revision = rev
            final_bases.append(base)
            
        return final_bases

    def get_active(self, db: Session, empresa_id: int) -> Optional[BaseTrabajo]:
        """
        Obtiene la base de trabajo activa de la empresa, incluyendo la revisión del proyecto si aplica.
        """
        from app.models.proyecto import Proyecto
        
        result = db.query(
            BaseTrabajo,
            Proyecto.revision.label("revision")
        ).outerjoin(
            Proyecto, 
            Proyecto.base_trabajo_id == BaseTrabajo.id
        ).filter(
            BaseTrabajo.empresa_id == empresa_id,
            BaseTrabajo.activa == True
        ).first()

        if not result:
            return None
            
        base, rev = result
        base.revision = rev
        return base

    def get_next_code(self, db: Session, empresa_id: int) -> str:
        from datetime import datetime
        year = datetime.now().year
        # Conteo por empresa: el código es único dentro de cada empresa (SaaS multi-tenant)
        count = db.query(BaseTrabajo).filter(BaseTrabajo.empresa_id == empresa_id).count()
        candidate = f"BT-{year}-{str(count + 1).zfill(3)}"
        # Loop de seguridad: saltar si ya existe ese código en la misma empresa
        while db.query(BaseTrabajo).filter(
            BaseTrabajo.codigo_unico == candidate,
            BaseTrabajo.empresa_id == empresa_id
        ).first():
            count += 1
            candidate = f"BT-{year}-{str(count + 1).zfill(3)}"
        return candidate


    def activate_base(self, db: Session, base_id: int, empresa_id: int) -> Optional[BaseTrabajo]:
        """
        Activa una base de trabajo y desactiva todas las demás de la misma empresa.
        Solo puede haber una base activa por empresa.
        """
        # Primero, desactivar todas las bases de esta empresa
        db.query(BaseTrabajo).filter(
            BaseTrabajo.empresa_id == empresa_id
        ).update({'activa': False})
        
        # Luego, activar la base seleccionada
        base = self.get_by_id(db, base_id, empresa_id)
        if base:
            base.activa = True
            db.add(base)
            db.commit()
            db.refresh(base)
        
        return base

    def deactivate_all(self, db: Session, empresa_id: int) -> int:
        """
        Desactiva todas las bases de trabajo de una empresa.
        Retorna el número de bases desactivadas.
        """
        result = db.query(BaseTrabajo).filter(
            BaseTrabajo.empresa_id == empresa_id,
            BaseTrabajo.activa == True
        ).update({'activa': False})
        db.commit()
        return result

    def create(self, db: Session, obj_in: BaseTrabajoCreate, empresa_id: int) -> BaseTrabajo:
        data = obj_in.model_dump(exclude={"source_base_id", "empresa_id", "content_revision"})
        
        # Autogenerar código único si no viene
        if not data.get("codigo_unico"):
            data["codigo_unico"] = self.get_next_code(db, empresa_id)
        
        # Forzar valores por defecto según solicitud del usuario
        data["tipo_rendimiento"] = "Rendimiento Unitario (Tiempo/Unidad)"
        data["unidad_tiempo"] = "Hora"

        db_obj = BaseTrabajo(
            **data,
            source_base_id=obj_in.source_base_id,
            clone_created_at=datetime.now(timezone.utc) if obj_in.source_base_id else None,
            empresa_id=empresa_id
        )
        try:
            db.add(db_obj)
            db.flush()
        except IntegrityError as e:
            db.rollback()
            if "uq_base_trabajo_nombre_empresa" in str(e.orig):
                raise ValueError(f"Ya existe una base de trabajo con el nombre '{data['nombre']}'")
            raise e

        # Lógica de Clonación Profunda (Deep Copy)
        if obj_in.source_base_id:
            try:
                # Buscar la base de origen para determinar su empresa_id (puede ser distinta en Superadmin)
                source_base = db.query(BaseTrabajo).filter(BaseTrabajo.id == obj_in.source_base_id).first()
                if not source_base:
                    raise ValueError(f"La base de origen {obj_in.source_base_id} no existe.")
                self._clone_deep_content(
                    db, 
                    source_id=obj_in.source_base_id, 
                    target_id=db_obj.id, 
                    source_empresa_id=source_base.empresa_id,
                    target_empresa_id=empresa_id,
                    target_revision=obj_in.content_revision
                )
                self._refresh_clone_snapshot(db, db_obj)
            except Exception as e:
                db.rollback()
                raise RuntimeError(f"Fallo en clonación profunda desde base {obj_in.source_base_id}: {str(e)}") from e
        else:
            # Si es una base nueva (no clonada), crear subcategorías "General" para que no esté vacía
            try:
                self._create_default_subcategories(db, db_obj.id, empresa_id)
            except Exception as e:
                db.rollback()
                raise RuntimeError(f"Fallo al crear subcategorías por defecto en base {db_obj.id}: {str(e)}") from e

        db.commit()
        db.refresh(db_obj)

        return db_obj

    def _create_default_subcategories(self, db: Session, base_id: int, empresa_id: int):
        """
        Crea items "General" para cada categoría (1-4, y opcionalmente 5 para APUs).
        """
        from app.models.subcategoria_item import SubcategoriaItem
        
        # Categorías: 1=Equipos, 2=Materiales, 3=Transporte, 4=ManoObra, 5=Precios Unitarios
        for cat_code in range(1, 6):
            # Verificar si ya existe (por si acaso o para idempotencia)
            existing = db.query(SubcategoriaItem).filter(
                SubcategoriaItem.base_trabajo_id == base_id,
                SubcategoriaItem.empresa_id == empresa_id,
                SubcategoriaItem.subcategoria_codigo == cat_code,
                SubcategoriaItem.descripcion == "General"
            ).first()
            
            if not existing:
                # Código secuencial: 1-001, 2-001, etc.
                codigo = f"{cat_code}-001"
                
                new_sub = SubcategoriaItem(
                    codigo=codigo,
                    descripcion="General",
                    subcategoria_codigo=cat_code,
                    base_trabajo_id=base_id,
                    empresa_id=empresa_id,
                    revisado=True
                )
                db.add(new_sub)
        
    def _clone_deep_content(self, db: Session, source_id: int, target_id: int, source_empresa_id: int, target_empresa_id: int, target_revision: Optional[int] = None):
        """
        Copia recursivamente todo el contenido de una base a otra (Subcategorías, Recursos, APUs).
        Soporta clonación entre empresas (útil para Superadmin clones de bases maestras).
        """
        from app.models.recurso import Recurso
        from app.models.subcategoria_item import SubcategoriaItem
        from app.models.apu import APU, APULinea
        from app.models.unidad import Unidad

        # 1. Clonar SubcategoriaItems (Navegación y Agrupación)
        old_subcats = db.query(SubcategoriaItem).filter(
            SubcategoriaItem.base_trabajo_id == source_id,
            SubcategoriaItem.empresa_id == source_empresa_id
        ).all()
        
        subcat_map = {} # {old_id: new_id}
        for sub in old_subcats:
            new_sub = SubcategoriaItem(
                codigo=sub.codigo,
                descripcion=sub.descripcion,
                observaciones=sub.observaciones,
                subcategoria_codigo=sub.subcategoria_codigo,
                base_trabajo_id=target_id,
                empresa_id=target_empresa_id,
                revisado=sub.revisado
            )
            db.add(new_sub)
            db.flush()
            subcat_map[sub.id] = new_sub.id

        # 2. Clonar Recursos
        old_recursos = db.query(Recurso).filter(
            Recurso.base_trabajo_id == source_id,
            Recurso.empresa_id == source_empresa_id
        ).all()
        
        recurso_map = {} # {old_id: new_id}
        for rec in old_recursos:
            # El código se mantiene porque es C-SSSS-RRRRR y las subcategorías clonadas mantienen el mismo SSSS (en teoría)
            # aunque el serial RRRRR podría variar si el orden de flush cambia, pero repo._generate_code lo maneja.
            # Aquí clonamos tal cual para mantener consistencia.
            new_rec = Recurso(
                codigo=rec.codigo,
                descripcion=rec.descripcion,
                descripcion_normalizada=rec.descripcion_normalizada,
                precio=rec.precio,
                unidad_id=rec.unidad_id,
                cod_cpc_id=rec.cod_cpc_id,
                especificaciones=rec.especificaciones,
                subcategoria_item_id=subcat_map.get(rec.subcategoria_item_id),
                base_trabajo_id=target_id,
                empresa_id=target_empresa_id,
                revisado=rec.revisado,
                revision=target_revision if target_revision is not None else rec.revision,
                source_recurso_id=rec.id,
                content_origin="inherited",
                sync_status="synced",
                last_sync_at=datetime.now(timezone.utc),
            )
            db.add(new_rec)
            db.flush()
            recurso_map[rec.id] = new_rec.id

        # 3. Clonar APUs (Cabeceras)
        old_apus = db.query(APU).filter(
            APU.empresa_id == source_empresa_id
        ).join(SubcategoriaItem, APU.subcategoria_item_id == SubcategoriaItem.id).filter(
            SubcategoriaItem.base_trabajo_id == source_id
        ).all()
        
        logger.debug(
            "Clone base source=%s target=%s found subcats=%s recursos=%s apus=%s",
            source_id,
            new_base.id,
            len(old_subcats),
            len(old_recursos),
            len(old_apus),
        )
        
        apu_map = {} # {old_id: new_id}
        for apu in old_apus:
            new_apu = APU(
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
                categoria_id=apu.categoria_id, # Global
                subcategoria_item_id=subcat_map.get(apu.subcategoria_item_id),
                base_trabajo_id=target_id,  # FIX: Vincular a la nueva base
                empresa_id=target_empresa_id,
                revision=target_revision if target_revision is not None else apu.revision,
                omniclass_codigo=apu.omniclass_codigo,
                omniclass_titulo=apu.omniclass_titulo,
                source_apu_id=apu.id,
                content_origin="inherited",
                sync_status="synced",
                last_sync_at=datetime.now(timezone.utc),
            )
            db.add(new_apu)
            db.flush()
            apu_map[apu.id] = new_apu.id

        

        # 4. Clonar APULineas (Detalle)
        # Necesitamos procesar las líneas de todos los APUs clonados
        for old_apu_id, new_apu_id in apu_map.items():
            old_lines = db.query(APULinea).filter(APULinea.apu_id == old_apu_id).all()
            for line in old_lines:
                new_line = APULinea(
                    apu_id=new_apu_id,
                    recurso_id=recurso_map.get(line.recurso_id) if line.recurso_id else None,
                    apu_hijo_id=apu_map.get(line.apu_hijo_id) if line.apu_hijo_id else None,
                    cantidad=line.cantidad,
                    rendimiento=line.rendimiento,
                    precio_congelado=line.precio_congelado,
                    subtotal=line.subtotal
                )
                db.add(new_line)

    def _refresh_clone_snapshot(self, db: Session, db_obj: BaseTrabajo) -> None:
        from app.models.subcategoria_item import SubcategoriaItem
        from app.models.recurso import Recurso
        from app.models.apu import APU

        db_obj.snapshot_subcategories_count = db.query(SubcategoriaItem).filter(
            SubcategoriaItem.base_trabajo_id == db_obj.id,
            SubcategoriaItem.empresa_id == db_obj.empresa_id
        ).count()
        db_obj.snapshot_resources_count = db.query(Recurso).filter(
            Recurso.base_trabajo_id == db_obj.id,
            Recurso.empresa_id == db_obj.empresa_id
        ).count()
        db_obj.snapshot_apus_count = db.query(APU).filter(
            APU.base_trabajo_id == db_obj.id,
            APU.empresa_id == db_obj.empresa_id
        ).count()
        db_obj.last_reconciled_at = datetime.now(timezone.utc)
        db.add(db_obj)


    def update(self, db: Session, db_obj: BaseTrabajo, obj_in: BaseTrabajoUpdate) -> BaseTrabajo:
        update_data = obj_in.model_dump(exclude_unset=True)
        if db_obj.tipo == "Base de Proyecto":
            update_data.pop("descripcion", None)
        for field, value in update_data.items():
            setattr(db_obj, field, value)
        
        try:
            db.add(db_obj)
            db.commit()
            db.refresh(db_obj)
        except IntegrityError as e:
            db.rollback()
            if "uq_base_trabajo_nombre_empresa" in str(e.orig):
                raise ValueError(f"Ya existe una base de trabajo con el nombre '{db_obj.nombre}'")
            raise e
        return db_obj

    def delete(self, db: Session, db_obj: BaseTrabajo):
        from app.models.apu import APU, APULinea
        from app.models.recurso import Recurso
        from app.models.subcategoria_item import SubcategoriaItem

        # Explicitly delete dependent entities in the correct order to avoid ForeignKeyViolation
        # 1. APU Lineas
        db.query(APULinea).filter(APULinea.apu_id.in_(
            db.query(APU.id).filter(APU.base_trabajo_id == db_obj.id)
        )).delete(synchronize_session=False)
        
        # 2. APUs
        db.query(APU).filter(APU.base_trabajo_id == db_obj.id).delete(synchronize_session=False)
        
        # 3. Recursos
        db.query(Recurso).filter(Recurso.base_trabajo_id == db_obj.id).delete(synchronize_session=False)
        
        # 4. Subcategorias
        db.query(SubcategoriaItem).filter(SubcategoriaItem.base_trabajo_id == db_obj.id).delete(synchronize_session=False)

        db.delete(db_obj)
        db.commit()
        return db_obj

    def assign_user(self, db: Session, base_id: int, usuario_id: int, asignado_por_id: int) -> Any:
        from app.models.base_trabajo_asignacion import BaseTrabajoAsignacion
        # Verificar si ya está asignado
        existing = db.query(BaseTrabajoAsignacion).filter(
            BaseTrabajoAsignacion.base_trabajo_id == base_id,
            BaseTrabajoAsignacion.usuario_id == usuario_id
        ).first()
        if existing:
            return existing
        
        new_asignacion = BaseTrabajoAsignacion(
            base_trabajo_id=base_id,
            usuario_id=usuario_id,
            asignado_por_id=asignado_por_id
        )
        db.add(new_asignacion)
        db.commit()
        db.refresh(new_asignacion)
        return new_asignacion

    def unassign_user(self, db: Session, base_id: int, usuario_id: int) -> bool:
        from app.models.base_trabajo_asignacion import BaseTrabajoAsignacion
        db.query(BaseTrabajoAsignacion).filter(
            BaseTrabajoAsignacion.base_trabajo_id == base_id,
            BaseTrabajoAsignacion.usuario_id == usuario_id
        ).delete()
        db.commit()
        return True

    def get_assigned_users(self, db: Session, base_id: int) -> List[Any]:
        from app.models.usuario import Usuario
        from app.models.base_trabajo_asignacion import BaseTrabajoAsignacion
        return db.query(Usuario).join(
            BaseTrabajoAsignacion,
            Usuario.id == BaseTrabajoAsignacion.usuario_id
        ).filter(
            BaseTrabajoAsignacion.base_trabajo_id == base_id
        ).all()

base_trabajo_repo = BaseTrabajoRepository()
