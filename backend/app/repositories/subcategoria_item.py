"""
Repositorio para Items de Subcategoría de Precios Unitarios.
Capa pura de acceso a datos (CRUD y consultas complejas).
La lógica de negocio reside en SubcategoriaService.
"""
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from app.models.subcategoria_item import SubcategoriaItem
from app.models.recurso import Recurso
from app.models.apu import APU
from app.schemas.subcategoria_item import SubcategoriaItemCreate, SubcategoriaItemUpdate
from typing import List, Optional, Any, Dict
from sqlalchemy import func
from app.core.text_formatting import normalize_uppercase_label

class SubcategoriaItemRepository:
    def get_by_id(self, db: Session, id: int, empresa_id: int) -> Optional[SubcategoriaItem]:
        return db.query(SubcategoriaItem).filter(
            SubcategoriaItem.id == id,
            SubcategoriaItem.empresa_id == empresa_id
        ).first()
    
    def get_multi_by_subcategoria(
        self, 
        db: Session,
        base_trabajo_id: int, 
        empresa_id: int, 
        subcategoria_codigo: int,
        revision: Optional[int] = None
    ) -> List[Dict[str, Any]]:
        """Obtener items con conteo de recursos/APUs."""
        items = db.query(SubcategoriaItem).filter(
            SubcategoriaItem.base_trabajo_id == base_trabajo_id,
            SubcategoriaItem.empresa_id == empresa_id,
            SubcategoriaItem.subcategoria_codigo == subcategoria_codigo
        ).order_by(SubcategoriaItem.orden.asc(), SubcategoriaItem.id.asc()).all()

        result = []
        for item in items:
            count = self._get_item_count(db, item, revision)
            result.append(self._format_item_response(item, count))
        
        return result
    
    def get_all_by_base(
        self, 
        db: Session, 
        base_trabajo_id: int, 
        empresa_id: int, 
        revision: Optional[int] = None
    ) -> List[Dict[str, Any]]:
        """Obtener todos los items de una base con conteo."""
        items = db.query(SubcategoriaItem).filter(
            SubcategoriaItem.base_trabajo_id == base_trabajo_id,
            SubcategoriaItem.empresa_id == empresa_id
        ).order_by(SubcategoriaItem.subcategoria_codigo.asc(), SubcategoriaItem.orden.asc(), SubcategoriaItem.id.asc()).all()

        result = []
        for item in items:
            count = self._get_item_count(db, item, revision)
            result.append(self._format_item_response(item, count))
        
        return result

    def create(self, db: Session, obj_in: SubcategoriaItemCreate, base_trabajo_id: int, empresa_id: int) -> SubcategoriaItem:
        """Crear persistencia de un nuevo item."""
        db_obj = SubcategoriaItem(
            **obj_in.model_dump(),
            base_trabajo_id=base_trabajo_id,
            empresa_id=empresa_id,
            orden=self._get_next_order(db, base_trabajo_id, empresa_id, obj_in.subcategoria_codigo)
        )
        try:
            db.add(db_obj)
            db.commit()
            db.refresh(db_obj)
            return db_obj
        except IntegrityError as e:
            db.rollback()
            if "uq_subcategoria_item_descripcion" in str(e.orig):
                raise ValueError("Ya existe un item con esta descripción en esta subcategoría")
            if "uq_subcategoria_item_codigo" in str(e.orig):
                raise ValueError("Ya existe un item con este código")
            raise

    def create_duplicate(self, db: Session, original: SubcategoriaItem, new_codigo: str, new_desc: str, empresa_id: int, use_omniclass: bool = True) -> SubcategoriaItem:
        """Crea la copia física de un item."""
        db_obj = SubcategoriaItem(
            codigo=new_codigo,
            descripcion=new_desc,
            observaciones=original.observaciones,
            subcategoria_codigo=original.subcategoria_codigo,
            orden=self._get_next_order(db, original.base_trabajo_id, empresa_id, original.subcategoria_codigo),
            base_trabajo_id=original.base_trabajo_id,
            empresa_id=empresa_id,
            revisado=False,
            omniclass_codigo=original.omniclass_codigo if use_omniclass else None,
            omniclass_titulo=original.omniclass_titulo if use_omniclass else None
        )
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def update(self, db: Session, db_obj: SubcategoriaItem, obj_in: SubcategoriaItemUpdate) -> SubcategoriaItem:
        """Actualizar campos persistentes."""
        update_data = obj_in.model_dump(exclude_unset=True)
        
        for field, value in update_data.items():
            setattr(db_obj, field, value)
        
        # Lógica de "revisado" si cambia la descripción (opcional mantener aquí o en servicio)
        if 'descripcion' in update_data and "-duplicado" not in update_data['descripcion']:
            db_obj.revisado = True
            
        try:
            db.add(db_obj)
            db.commit()
            db.refresh(db_obj)
            return db_obj
        except IntegrityError:
            db.rollback()
            raise ValueError("Conflicto de integridad al actualizar")

    def delete(self, db: Session, db_obj: SubcategoriaItem) -> SubcategoriaItem:
        """Eliminación física y re-numeración."""
        deleted_subcat = db_obj.subcategoria_codigo
        base_id = db_obj.base_trabajo_id
        empresa_id = db_obj.empresa_id
        
        db.delete(db_obj)
        db.commit()
        
        # El repositorio mantiene la re-numeración por ser una operación de consistencia de BD
        self._renumber_items(db, base_id, empresa_id, deleted_subcat)
        return db_obj

    def bulk_delete(self, db: Session, item_ids: List[int], empresa_id: int) -> List[int]:
        """Borrado masivo con re-numeración final."""
        items = db.query(SubcategoriaItem).filter(
            SubcategoriaItem.id.in_(item_ids),
            SubcategoriaItem.empresa_id == empresa_id
        ).all()

        affected_subcats = set()
        for item in items:
            affected_subcats.add((item.base_trabajo_id, item.empresa_id, item.subcategoria_codigo))
            db.delete(item)

        db.flush()
        for base_id, target_empresa_id, subcat_code in affected_subcats:
            self._renumber_items(db, base_id, target_empresa_id, subcat_code, auto_commit=False)

        db.commit()
        return item_ids

    def import_items(self, db: Session, base_id: int, empresa_id: int, subcat_code: int, items_data: List[dict], use_omniclass: bool = True) -> dict:
        """Importación atómica. Mantenemos el bucle aquí por proximidad al DB context."""
        # Nota: Idealmente esto llama a create() por cada item
        # Pero se mantiene como método de lote por rendimiento
        from app.core.utils import normalize_string, TECHNICAL_TERMS
        imported, duplicates, errors = 0, 0, []
        
        # Cache de items existentes para evitar N+1 queries
        existing_items = db.query(SubcategoriaItem).filter(
            SubcategoriaItem.subcategoria_codigo == subcat_code,
            SubcategoriaItem.base_trabajo_id == base_id,
            SubcategoriaItem.empresa_id == empresa_id
        ).all()
        normalized_existing = {normalize_string(i.descripcion): i for i in existing_items}

        for idx, data in enumerate(items_data):
            desc = data.get('descripcion', '').strip()
            if not desc:
                errors.append(f"Fila {idx+1}: Descripción vacía")
                continue
            
            norm_desc = normalize_string(desc)
            if norm_desc in normalized_existing:
                duplicates += 1
                continue
            
            # Normalización (Service logic duplicated here for efficiency in bulk, or call service)
            # Por simplicidad mantenemos esta lógica de 'bulk' en el repo pero el servicio la orquesta.
            try:
                # Simular lógica de servicio para códigos si no se quiere inyectar servicio en repo
                last_code = db.query(SubcategoriaItem.codigo).filter(
                    SubcategoriaItem.base_trabajo_id == base_id,
                    SubcategoriaItem.empresa_id == empresa_id,
                    SubcategoriaItem.subcategoria_codigo == subcat_code
                ).order_by(SubcategoriaItem.codigo.desc()).first()
                
                next_num = 1
                if last_code:
                    match = re.search(r'-(\d+)$', last_code[0])
                    next_num = int(match.group(1)) + 1 if match else 1
                
                new_item = SubcategoriaItem(
                    descripcion=normalize_uppercase_label(TECHNICAL_TERMS.get(norm_desc, desc)),
                    codigo=f"{subcat_code}-{str(next_num).zfill(3)}",
                    subcategoria_codigo=subcat_code,
                    orden=self._get_next_order(db, base_id, empresa_id, subcat_code),
                    base_trabajo_id=base_id,
                    empresa_id=empresa_id,
                    omniclass_codigo=data.get('omniclass_codigo') if use_omniclass else None,
                    omniclass_titulo=data.get('omniclass_titulo') if use_omniclass else None
                )
                db.add(new_item)
                db.flush()
                imported += 1
                normalized_existing[norm_desc] = new_item # Update cache
            except Exception as e:
                errors.append(f"Fila {idx+1}: {str(e)}")

        db.commit()
        return {"success": True, "imported": imported, "duplicates": duplicates, "errors": errors}

    def move(self, db: Session, item_id: int, target_subcat: int, empresa_id: int) -> SubcategoriaItem:
        """Movimiento físico entre categorías."""
        item = self.get_by_id(db, item_id, empresa_id)
        if not item: raise ValueError("Item no encontrado")
        
        source_subcat = item.subcategoria_codigo
        item.subcategoria_codigo = target_subcat
        item.codigo = f"{target_subcat}-TMP-{item.id}"
        item.orden = self._get_next_order(db, item.base_trabajo_id, empresa_id, target_subcat)
        db.add(item)
        db.commit()
        
        self._renumber_items(db, item.base_trabajo_id, empresa_id, source_subcat)
        self._renumber_items(db, item.base_trabajo_id, empresa_id, target_subcat)
        db.refresh(item)
        return item

    def reorder_within_subcategoria(
        self,
        db: Session,
        item_id: int,
        target_item_id: int,
        place_after: bool,
        empresa_id: int
    ) -> SubcategoriaItem:
        item = self.get_by_id(db, item_id, empresa_id)
        target = self.get_by_id(db, target_item_id, empresa_id)
        if not item or not target:
            raise ValueError("Item no encontrado")
        if item.id == target.id:
            return item
        if item.base_trabajo_id != target.base_trabajo_id or item.subcategoria_codigo != target.subcategoria_codigo:
            raise ValueError("Solo se puede reordenar entre elementos de la misma categoría")

        siblings = db.query(SubcategoriaItem).filter(
            SubcategoriaItem.base_trabajo_id == item.base_trabajo_id,
            SubcategoriaItem.empresa_id == empresa_id,
            SubcategoriaItem.subcategoria_codigo == item.subcategoria_codigo
        ).order_by(SubcategoriaItem.orden.asc(), SubcategoriaItem.id.asc()).all()

        siblings = [sibling for sibling in siblings if sibling.id != item.id]
        target_index = next((idx for idx, sibling in enumerate(siblings) if sibling.id == target.id), None)
        if target_index is None:
            raise ValueError("Destino de reordenamiento no encontrado")

        insert_index = target_index + (1 if place_after else 0)
        siblings.insert(insert_index, item)

        for idx, sibling in enumerate(siblings):
            sibling.orden = idx
            db.add(sibling)

        db.commit()
        db.refresh(item)
        self._renumber_items(db, item.base_trabajo_id, empresa_id, item.subcategoria_codigo)
        db.refresh(item)
        return item

    # --- Internals ---
    def _get_item_count(self, db: Session, item: SubcategoriaItem, revision: Optional[int]) -> int:
        if item.subcategoria_codigo == 5:
            q = db.query(APU).filter(APU.subcategoria_item_id == item.id)
            if revision is not None: q = q.filter(APU.revision == revision)
        else:
            q = db.query(Recurso).filter(Recurso.subcategoria_item_id == item.id)
            if revision is not None: q = q.filter(Recurso.revision == revision)
        return q.count()

    def _format_item_response(self, item: SubcategoriaItem, count: int) -> Dict[str, Any]:
        return {
            "id": item.id, "codigo": item.codigo, "descripcion": item.descripcion,
            "observaciones": item.observaciones, "subcategoria_codigo": item.subcategoria_codigo,
            "orden": item.orden,
            "base_trabajo_id": item.base_trabajo_id, "empresa_id": item.empresa_id,
            "revisado": item.revisado, "fecha_creacion": item.fecha_creacion,
            "ultima_modificacion": item.ultima_modificacion, "items_count": count,
            "omniclass_codigo": item.omniclass_codigo, "omniclass_titulo": item.omniclass_titulo
        }

    def _get_next_order(self, db: Session, base_id: int, empresa_id: int, subcat_code: int) -> int:
        max_order = db.query(func.max(SubcategoriaItem.orden)).filter(
            SubcategoriaItem.base_trabajo_id == base_id,
            SubcategoriaItem.empresa_id == empresa_id,
            SubcategoriaItem.subcategoria_codigo == subcat_code
        ).scalar()
        return 0 if max_order is None else int(max_order) + 1

    def _renumber_items(self, db: Session, base_id: int, empresa_id: int, subcat_code: int, auto_commit: bool = True):
        items = db.query(SubcategoriaItem).filter(
            SubcategoriaItem.base_trabajo_id == base_id,
            SubcategoriaItem.empresa_id == empresa_id,
            SubcategoriaItem.subcategoria_codigo == subcat_code
        ).order_by(SubcategoriaItem.orden.asc(), SubcategoriaItem.id.asc()).all()
        
        for idx, item in enumerate(items):
            if item.orden != idx:
                item.orden = idx
                db.add(item)
        for idx, item in enumerate(items, start=1):
            new_code = f"{subcat_code}-{str(idx).zfill(3)}"
            if item.codigo != new_code:
                item.codigo = new_code
                db.add(item)
        if auto_commit: db.commit()

subcategoria_item_repo = SubcategoriaItemRepository()
import re # Ensure re is available inside methods or top level
