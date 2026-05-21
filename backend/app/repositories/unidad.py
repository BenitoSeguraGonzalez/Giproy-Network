"""
Repositorio para la gestión de Unidades
"""
from sqlalchemy.orm import Session
from sqlalchemy import or_
from app.models.unidad import Unidad
from app.schemas.unidad import UnidadCreate
from app.core.unit_normalization import canonicalize_unit_symbol
from app.core.text_formatting import normalize_lowercase_label

class UnidadRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_by_id(self, unidad_id: int):
        return self.db.query(Unidad).get(unidad_id)

    def get_available(self, subcategoria_codigo: int, base_trabajo_id: int, empresa_id: int):
        """
        Lista unidades filtradas por categoría. 
        Incluye globales y las específicas de la empresa/base actual.
        """
        return self.db.query(Unidad).filter(
            Unidad.subcategoria_codigo == subcategoria_codigo,
            or_(
                Unidad.es_global == True,
                (Unidad.empresa_id == empresa_id) & (Unidad.base_trabajo_id == base_trabajo_id)
            )
        ).all()

    def create(self, obj_in: UnidadCreate):
        data = obj_in.model_dump()
        data["descripcion"] = canonicalize_unit_symbol(data.get("descripcion"))
        data["descripcion_completa"] = normalize_lowercase_label(data.get("descripcion_completa"))
        db_obj = Unidad(**data)
        self.db.add(db_obj)
        self.db.commit()
        self.db.refresh(db_obj)
        return db_obj
