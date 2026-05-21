from sqlalchemy.orm import Session
from app.models.proyecto import Proyecto
from app.schemas.proyecto import ProyectoCreate, ProyectoUpdate
from typing import List, Optional

class ProyectoRepository:
    def get_by_id(self, db: Session, id: int, empresa_id: int) -> Optional[Proyecto]:
        return db.query(Proyecto).filter(Proyecto.id == id, Proyecto.empresa_id == empresa_id).first()

    def get_by_base_id(self, db: Session, base_id: int, empresa_id: int) -> Optional[Proyecto]:
        return db.query(Proyecto).filter(Proyecto.base_trabajo_id == base_id, Proyecto.empresa_id == empresa_id).first()

    def get_multi(self, db: Session, empresa_id: int, skip: int = 0, limit: int = 100) -> List[Proyecto]:
        return db.query(Proyecto).filter(Proyecto.empresa_id == empresa_id).offset(skip).limit(limit).all()

    def get_revisions_by_codigo_root(self, db: Session, codigo_root: str, empresa_id: int) -> List[Proyecto]:
        return db.query(Proyecto).filter(
            Proyecto.codigo_root == codigo_root, 
            Proyecto.empresa_id == empresa_id
        ).order_by(Proyecto.revision.asc()).all()

    def create(self, db: Session, obj_in: ProyectoCreate, empresa_id: int) -> Proyecto:
        # Simple creation, business logic moved to service
        db_obj = Proyecto(
            **obj_in.model_dump(exclude={"source_base_id"}),
            empresa_id=empresa_id
        )
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def update(self, db: Session, db_obj: Proyecto, obj_in: ProyectoUpdate) -> Proyecto:
        # Simple update, sync logic moved to service
        update_data = obj_in.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(db_obj, field, value)
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj
        
    def delete(self, db: Session, db_obj: Proyecto) -> Proyecto:
        db.delete(db_obj)
        db.commit()
        return db_obj

proyecto_repo = ProyectoRepository()
