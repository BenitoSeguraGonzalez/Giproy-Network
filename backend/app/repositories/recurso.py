"""
Repositorio para la gestión de Recursos
Capa pura de acceso a datos (CRUD).
"""
from sqlalchemy.orm import Session
from app.models.recurso import Recurso
from app.schemas.recurso import RecursoCreate
from typing import List, Optional, Union

class RecursoRepository:
    def get_by_id(self, db: Session, recurso_id: int) -> Optional[Recurso]:
        return db.query(Recurso).filter(Recurso.id == recurso_id).first()

    def get_all(self, db: Session, base_trabajo_id: int, empresa_id: int, subcategoria_item_id: Optional[int] = None, revision: Optional[int] = None) -> List[Recurso]:
        query = db.query(Recurso).filter(
            Recurso.base_trabajo_id == base_trabajo_id,
            Recurso.empresa_id == empresa_id
        )
        if revision is not None:
            query = query.filter(Recurso.revision == revision)
        if subcategoria_item_id:
            query = query.filter(Recurso.subcategoria_item_id == subcategoria_item_id)
        return query.order_by(Recurso.codigo).all()

    def create(self, db: Session, obj_in: RecursoCreate, base_trabajo_id: int, empresa_id: int, **kwargs) -> Recurso:
        db_obj = Recurso(
            **obj_in.model_dump(),
            **kwargs,
            base_trabajo_id=base_trabajo_id,
            empresa_id=empresa_id,
            revisado=kwargs.get("revisado", True)
        )
        db.add(db_obj)
        db.flush() # Se prefiere flush en lugar de commit aquí para delegar el commit al service/endpoint
        return db_obj

    def update(self, db: Session, db_obj: Recurso, obj_in: Union[dict, RecursoCreate]) -> Recurso:
        update_data = obj_in if isinstance(obj_in, dict) else obj_in.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(db_obj, key, value)
        db.add(db_obj)
        db.flush()
        return db_obj

    def delete(self, db: Session, db_obj: Recurso) -> bool:
        db.delete(db_obj)
        db.commit()
        return True

recurso_repo = RecursoRepository()
