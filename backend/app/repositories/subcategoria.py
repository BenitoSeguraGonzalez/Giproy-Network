from sqlalchemy.orm import Session
from app.models.recurso import CategoriaRecurso
from app.schemas.recurso import CategoriaBase
from typing import List, Optional

class SubcategoriaRepository:
    def get_by_id(self, db: Session, id: int, empresa_id: int) -> Optional[CategoriaRecurso]:
        return db.query(CategoriaRecurso).filter(
            CategoriaRecurso.id == id,
            (CategoriaRecurso.empresa_id == empresa_id) | (CategoriaRecurso.empresa_id == None)
        ).first()

    def get_multi_by_base(self, db: Session, base_id: int, empresa_id: int) -> List[CategoriaRecurso]:
        # Las categorías pueden estar vinculadas a la base o ser globales (None)
        return db.query(CategoriaRecurso).filter(
            (CategoriaRecurso.empresa_id == empresa_id) | (CategoriaRecurso.empresa_id == None),
            (CategoriaRecurso.base_trabajo_id == base_id) | (CategoriaRecurso.base_trabajo_id == None)
        ).all()

    def create(self, db: Session, obj_in: CategoriaBase, empresa_id: int) -> CategoriaRecurso:
        db_obj = CategoriaRecurso(
            **obj_in.model_dump(),
            empresa_id=empresa_id
        )
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def update(self, db: Session, db_obj: CategoriaRecurso, obj_in: CategoriaBase) -> CategoriaRecurso:
        update_data = obj_in.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(db_obj, field, value)
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def delete(self, db: Session, db_obj: CategoriaRecurso):
        db.delete(db_obj)
        db.commit()
        return db_obj

subcategoria_repo = SubcategoriaRepository()
