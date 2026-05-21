from typing import List, Optional
from sqlalchemy.orm import Session
from fastapi import HTTPException

from app.models.pais import Pais

class PaisService:
    def get_paises(self, db: Session, skip: int = 0, limit: int = 100, q: Optional[str] = None) -> List[Pais]:
        query = db.query(Pais)
        if q:
            query = query.filter(Pais.nombre.ilike(f"%{q}%"))
        
        return query.offset(skip).limit(limit).all()

    def get_pais_by_id(self, db: Session, pais_id: int) -> Pais:
        pais = db.query(Pais).filter(Pais.id == pais_id).first()
        if not pais:
            raise HTTPException(status_code=404, detail="País no encontrado")
        return pais

pais_service = PaisService()
