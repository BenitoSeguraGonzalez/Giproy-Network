from sqlalchemy.orm import Session
from typing import List, Optional
from app.models.empresa import Empresa
from app.schemas.empresa import EmpresaCreate, EmpresaUpdate

class EmpresaRepository:
    def get(self, db: Session, id: int) -> Optional[Empresa]:
        return db.query(Empresa).filter(Empresa.id == id).first()

    def get_all(self, db: Session) -> List[Empresa]:
        return db.query(Empresa).all()

    def create(self, db: Session, obj_in: EmpresaCreate, license_start_date=None, license_end_date=None) -> Empresa:
        payload = obj_in.model_dump()
        if license_start_date:
            payload["license_start_date"] = license_start_date
        if license_end_date:
            payload["license_end_date"] = license_end_date
            
        db_obj = Empresa(**payload)
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def update(self, db: Session, db_obj: Empresa, obj_in: EmpresaUpdate) -> Empresa:
        update_data = obj_in.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(db_obj, field, value)
        
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def remove(self, db: Session, id: int) -> Empresa:
        obj = db.query(Empresa).get(id)
        db.delete(obj)
        db.commit()
        return obj

empresa_repo = EmpresaRepository()
