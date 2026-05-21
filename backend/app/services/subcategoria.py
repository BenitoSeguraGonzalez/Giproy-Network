"""
Servicio para la gestión de Subcategorías y Subcategorías Items.
Centraliza la lógica de negocio, validaciones y generación de códigos.
"""
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from typing import List, Optional, Any, Dict
import re

from app.models.subcategoria_item import SubcategoriaItem
from app.models.recurso import CategoriaRecurso, Recurso
from app.models.apu import APU
from app.models.empresa import Empresa
from app.schemas.subcategoria_item import (
    SubcategoriaItemCreate, SubcategoriaItemUpdate,
    SubcategoriaItemImport, SubcategoriaItemReorder
)
from app.schemas.recurso import CategoriaBase
from app.repositories.subcategoria import subcategoria_repo
from app.repositories.subcategoria_item import subcategoria_item_repo
from app.core.utils import normalize_string, TECHNICAL_TERMS
from app.core.text_formatting import normalize_uppercase_label

class SubcategoriaService:
    def _company_uses_omniclass(self, db: Session, empresa_id: int) -> bool:
        empresa = db.query(Empresa.id, Empresa.use_omniclass).filter(Empresa.id == empresa_id).first()
        return bool(getattr(empresa, "use_omniclass", True)) if empresa else True

    def _strip_omniclass_from_payload(self, payload) -> None:
        if hasattr(payload, "omniclass_codigo"):
            payload.omniclass_codigo = None
        if hasattr(payload, "omniclass_titulo"):
            payload.omniclass_titulo = None

    # --- Lógica de Subcategoría (Categoría Base) ---

    def get_subcategorias(self, db: Session, base_id: int, empresa_id: int) -> List[CategoriaRecurso]:
        """Obtener subcategorías de una base."""
        return subcategoria_repo.get_multi_by_base(db, base_id=base_id, empresa_id=empresa_id)

    def create_subcategoria(self, db: Session, obj_in: CategoriaBase, empresa_id: int) -> CategoriaRecurso:
        """Crear una nueva subcategoría vinculada a una empresa."""
        return subcategoria_repo.create(db, obj_in=obj_in, empresa_id=empresa_id)

    def update_subcategoria(self, db: Session, id: int, obj_in: CategoriaBase, empresa_id: int) -> CategoriaRecurso:
        """Actualizar una subcategoría existente."""
        db_obj = subcategoria_repo.get_by_id(db, id=id, empresa_id=empresa_id)
        if not db_obj:
            raise ValueError("Subcategoría no encontrada")
        return subcategoria_repo.update(db, db_obj=db_obj, obj_in=obj_in)

    def delete_subcategoria(self, db: Session, id: int, empresa_id: int) -> CategoriaRecurso:
        """Eliminar una subcategoría."""
        db_obj = subcategoria_repo.get_by_id(db, id=id, empresa_id=empresa_id)
        if not db_obj:
            raise ValueError("Subcategoría no encontrada")
        return subcategoria_repo.delete(db, db_obj=db_obj)

    # --- Lógica de Subcategoría Item (Items específicos de P.U.) ---

    def get_items_by_subcategoria(
        self, 
        db: Session,
        base_trabajo_id: int, 
        empresa_id: int, 
        subcategoria_codigo: int,
        revision: Optional[int] = None
    ) -> List[Dict[str, Any]]:
        """Obtener items de una subcategoría con conteo de recursos/APUs."""
        return subcategoria_item_repo.get_multi_by_subcategoria(
            db, base_trabajo_id, empresa_id, subcategoria_codigo, revision=revision
        )

    def get_all_items_by_base(
        self, 
        db: Session, 
        base_trabajo_id: int, 
        empresa_id: int, 
        revision: Optional[int] = None
    ) -> List[Dict[str, Any]]:
        """Obtener todos los items de una base con conteo."""
        return subcategoria_item_repo.get_all_by_base(
            db, base_trabajo_id, empresa_id, revision=revision
        )

    def create_item(self, db: Session, obj_in: SubcategoriaItemCreate, base_trabajo_id: int, empresa_id: int) -> SubcategoriaItem:
        """Crear un nuevo item de subcategoría con generación de código y normalización."""
        if not self._company_uses_omniclass(db, empresa_id):
            self._strip_omniclass_from_payload(obj_in)
        
        # 1. Generar código automáticamente si falta
        if not obj_in.codigo:
            obj_in.codigo = self._generate_next_code(
                db, base_trabajo_id, empresa_id, obj_in.subcategoria_codigo
            )
        
        # 2. Normalizar descripción basada en tesauro técnico
        obj_in.descripcion = self._apply_technical_normalization(db, obj_in.descripcion, empresa_id)
        obj_in.descripcion = normalize_uppercase_label(obj_in.descripcion)

        # 3. Delegar creación al repositorio
        try:
            return subcategoria_item_repo.create(db, obj_in, base_trabajo_id, empresa_id)
        except ValueError as e:
            raise ValueError(str(e))

    def update_item(self, db: Session, item_id: int, obj_in: SubcategoriaItemUpdate, empresa_id: int) -> SubcategoriaItem:
        """Actualizar descripción u observaciones de un item."""
        db_obj = subcategoria_item_repo.get_by_id(db, item_id, empresa_id)
        if not db_obj:
            raise ValueError("Item de subcategoría no encontrado")
        if not self._company_uses_omniclass(db, empresa_id):
            self._strip_omniclass_from_payload(obj_in)
        
        # Marcado automático como revisado si se quita el sufijo de duplicado
        if obj_in.descripcion and "-duplicado" not in obj_in.descripcion:
            # Esta lógica puede ir aquí o en el repo, pero el servicio la orquesta
            pass
        if obj_in.descripcion is not None:
            obj_in.descripcion = normalize_uppercase_label(obj_in.descripcion)

        return subcategoria_item_repo.update(db, db_obj, obj_in)

    def duplicate_item(self, db: Session, item_id: int, empresa_id: int) -> SubcategoriaItem:
        """Duplicar un item con nuevo código y descripción única."""
        original = subcategoria_item_repo.get_by_id(db, item_id, empresa_id)
        if not original:
            raise ValueError("Item de subcategoría no encontrado")
        
        # La lógica de generación de nombres y códigos vive en el servicio
        new_codigo = self._generate_duplicate_code(
            db, original.base_trabajo_id, empresa_id, original.codigo
        )
        new_desc = self._generate_unique_description(
            db, original.base_trabajo_id, empresa_id, original.subcategoria_codigo, original.descripcion
        )

        # Usamos el repo para la persistencia pura
        return subcategoria_item_repo.create_duplicate(
            db, original, new_codigo, new_desc, empresa_id, self._company_uses_omniclass(db, empresa_id)
        )

    def delete_item(self, db: Session, item_id: int, empresa_id: int) -> SubcategoriaItem:
        """Eliminar un item previa validación de integridad."""
        db_obj = subcategoria_item_repo.get_by_id(db, item_id, empresa_id)
        if not db_obj:
            raise ValueError("Item de subcategoría no encontrado")
        
        # Validación de integridad: ¿tiene hijos?
        self._ensure_can_delete(db, db_obj)
        
        return subcategoria_item_repo.delete(db, db_obj)

    def bulk_delete_items(self, db: Session, item_ids: List[int], empresa_id: int) -> List[int]:
        """Borrado masivo atómico."""
        # Validar todos antes de borrar
        items = db.query(SubcategoriaItem).filter(
            SubcategoriaItem.id.in_(item_ids),
            SubcategoriaItem.empresa_id == empresa_id
        ).all()
        
        if len(items) != len(set(item_ids)):
            raise ValueError("Algunas subcategorías no existen o no pertenecen a la empresa.")

        for item in items:
            self._ensure_can_delete(db, item)

        return subcategoria_item_repo.bulk_delete(db, item_ids, empresa_id)

    def import_items(
        self, 
        db: Session, 
        base_trabajo_id: int, 
        empresa_id: int, 
        subcategoria_codigo: int, 
        items_data: List[dict]
    ) -> dict:
        """Importar items desde portapapeles."""
        # Podríamos mover la lógica de bucle aquí, pero por ahora delegamos al repo 
        # que ya tiene implementada la lógica atómica de importación.
        # En una refactorización ideal, el bucle de importación llama a create_item del servicio.
        return subcategoria_item_repo.import_items(
            db, base_trabajo_id, empresa_id, subcategoria_codigo, items_data, self._company_uses_omniclass(db, empresa_id)
        )

    def move_item(self, db: Session, item_id: int, target_subcategoria_codigo: int, empresa_id: int) -> SubcategoriaItem:
        """Mover item a otra categoría y re-numerar."""
        return subcategoria_item_repo.move(db, item_id, target_subcategoria_codigo, empresa_id)

    def reorder_item(self, db: Session, item_id: int, reorder_in: SubcategoriaItemReorder, empresa_id: int) -> SubcategoriaItem:
        """Reordenar item dentro de la misma categoría."""
        return subcategoria_item_repo.reorder_within_subcategoria(
            db,
            item_id,
            reorder_in.target_item_id,
            reorder_in.place_after,
            empresa_id
        )

    def export_items(
        self, 
        db: Session, 
        empresa_id: int, 
        item_ids: List[int]
    ) -> List[dict]:
        """Exportar items a formato para portapeles."""
        return subcategoria_item_repo.export_items(db, empresa_id, item_ids)

    # --- Helpers de Lógica de Negocio ---

    def _ensure_can_delete(self, db: Session, db_obj: SubcategoriaItem) -> None:
        """Regla: no borrar si tiene recursos o APUs."""
        has_recursos = db.query(Recurso).filter(Recurso.subcategoria_item_id == db_obj.id).first()
        has_apus = db.query(APU).filter(APU.subcategoria_item_id == db_obj.id).first()

        if has_recursos or has_apus:
            raise ValueError(
                f"La subcategoría '{db_obj.descripcion}' contiene recursos o APUs registrados. Debe vaciarla primero."
            )

    def _apply_technical_normalization(self, db: Session, descripcion: str, empresa_id: int) -> str:
        """Aplica normalización técnica global y por empresa."""
        normalized_new = normalize_string(descripcion)
        
        # 1. Diccionario Global
        if normalized_new in TECHNICAL_TERMS:
            return TECHNICAL_TERMS[normalized_new]
        
        # 2. Coincidencia con existentes en la empresa
        existing = db.query(SubcategoriaItem).filter(
            SubcategoriaItem.empresa_id == empresa_id
        ).all()
        
        for item in existing:
            if normalize_string(item.descripcion) == normalized_new:
                return item.descripcion
                
        return normalize_uppercase_label(descripcion)

    def _generate_next_code(self, db: Session, base_trabajo_id: int, empresa_id: int, subcategoria_codigo: int) -> str:
        """Genera el siguiente código secuencial (formato X-00Y)."""
        last_item = db.query(SubcategoriaItem).filter(
            SubcategoriaItem.base_trabajo_id == base_trabajo_id,
            SubcategoriaItem.empresa_id == empresa_id,
            SubcategoriaItem.subcategoria_codigo == subcategoria_codigo
        ).order_by(SubcategoriaItem.codigo.desc()).first()
        
        if last_item:
            match = re.search(r'-(\d+)$', last_item.codigo)
            next_num = int(match.group(1)) + 1 if match else 1
        else:
            next_num = 1
        
        return f"{subcategoria_codigo}-{str(next_num).zfill(3)}"

    def _generate_duplicate_code(self, db: Session, base_trabajo_id: int, empresa_id: int, original_codigo: str) -> str:
        """Genera código para duplicados (sufijo -00X)."""
        base_pattern = f"{original_codigo}-"
        duplicates = db.query(SubcategoriaItem).filter(
            SubcategoriaItem.base_trabajo_id == base_trabajo_id,
            SubcategoriaItem.empresa_id == empresa_id,
            SubcategoriaItem.codigo.like(f"{base_pattern}%")
        ).all()
        
        if not duplicates:
            return f"{original_codigo}-001"
        
        max_num = 0
        for d in duplicates:
            match = re.search(r'-(\d+)$', d.codigo)
            if match:
                num = int(match.group(1))
                if num > max_num: max_num = num
        
        return f"{original_codigo}-{str(max_num + 1).zfill(3)}"

    def _generate_unique_description(self, db: Session, base_trabajo_id: int, empresa_id: int, subcategoria_codigo: int, original_desc: str) -> str:
        """Genera descripción única con sufijo '-duplicadoX'."""
        base_desc = re.sub(r'-duplicado\d+$', '', original_desc)
        pattern = f"{base_desc}-duplicado"
        
        existing = db.query(SubcategoriaItem).filter(
            SubcategoriaItem.base_trabajo_id == base_trabajo_id,
            SubcategoriaItem.empresa_id == empresa_id,
            SubcategoriaItem.subcategoria_codigo == subcategoria_codigo,
            SubcategoriaItem.descripcion.like(f"{pattern}%")
        ).all()
        
        if not existing:
            return f"{base_desc}-duplicado1"
        
        max_num = 0
        for item in existing:
            match = re.search(r'-duplicado(\d+)$', item.descripcion)
            if match:
                num = int(match.group(1))
                if num > max_num: max_num = num
        
        return f"{base_desc}-duplicado{max_num + 1}"

subcategoria_service = SubcategoriaService()
