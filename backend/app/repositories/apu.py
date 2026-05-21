from sqlalchemy.orm import Session, joinedload
from app.models.apu import APU, APULinea
from app.models.recurso import Recurso
from app.schemas.apu import APUCreate, APUUpdate
from typing import List, Optional

class APURepository:
    def get_by_id(self, db: Session, apu_id: int, empresa_id: int) -> Optional[APU]:
        return db.query(APU).options(
            joinedload(APU.lineas).joinedload(APULinea.recurso).joinedload(Recurso.cpc),
            joinedload(APU.lineas).joinedload(APULinea.apu_hijo),
            joinedload(APU.lineas).joinedload(APULinea.apu_hijo).joinedload(APU.lineas).joinedload(APULinea.recurso).joinedload(Recurso.cpc),
            joinedload(APU.lineas).joinedload(APULinea.apu_hijo).joinedload(APU.lineas).joinedload(APULinea.apu_hijo),
        ).filter(APU.id == apu_id, APU.empresa_id == empresa_id).first()

    def get_by_ids(self, db: Session, apu_ids: List[int], empresa_id: int) -> List[APU]:
        if not apu_ids:
            return []
        unique_ids = list(dict.fromkeys(int(apu_id) for apu_id in apu_ids if apu_id))
        if not unique_ids:
            return []
        apus = db.query(APU).options(
            joinedload(APU.lineas).joinedload(APULinea.recurso).joinedload(Recurso.cpc),
            joinedload(APU.lineas).joinedload(APULinea.apu_hijo),
            joinedload(APU.lineas).joinedload(APULinea.apu_hijo).joinedload(APU.lineas).joinedload(APULinea.recurso).joinedload(Recurso.cpc),
            joinedload(APU.lineas).joinedload(APULinea.apu_hijo).joinedload(APU.lineas).joinedload(APULinea.apu_hijo),
        ).filter(APU.id.in_(unique_ids), APU.empresa_id == empresa_id).all()
        apu_by_id = {int(apu.id): apu for apu in apus}
        return [apu_by_id[apu_id] for apu_id in unique_ids if apu_id in apu_by_id]

    def get_all(self, db: Session, empresa_id: int, base_trabajo_id: Optional[int] = None, subcategoria_item_id: Optional[int] = None, q: Optional[str] = None, revision: Optional[int] = None) -> List[APU]:
        query = db.query(APU).filter(APU.empresa_id == empresa_id)
        if base_trabajo_id:
            query = query.filter(APU.base_trabajo_id == base_trabajo_id)
        if revision is not None:
            query = query.filter(APU.revision == revision)
        if subcategoria_item_id:
            query = query.filter(APU.subcategoria_item_id == subcategoria_item_id)
        if q:
            query = query.filter(
                (APU.codigo.ilike(f"%{q}%")) | (APU.descripcion.ilike(f"%{q}%"))
            )
        return query.order_by(APU.codigo).all()

    def create(self, db: Session, obj_in: APUCreate, empresa_id: int, **kwargs) -> APU:
        apu_data = obj_in.model_dump(exclude={"lineas"})
        apu = APU(**apu_data, **kwargs, empresa_id=empresa_id)
        db.add(apu)
        db.flush()
        
        for index, linea_in in enumerate(obj_in.lineas):
            linea_data = linea_in.model_dump()
            linea_data["orden"] = linea_data.get("orden", index)
            linea = APULinea(**linea_data, apu_id=apu.id)
            db.add(linea)
        
        db.commit()
        db.refresh(apu)
        return apu

    def update(self, db: Session, db_obj: APU, obj_in: APUUpdate, **kwargs) -> APU:
        for key, value in obj_in.model_dump(exclude={"lineas"}).items():
            setattr(db_obj, key, value)
        
        for kwarg_key, kwarg_value in kwargs.items():
            setattr(db_obj, kwarg_key, kwarg_value)
            
        db.query(APULinea).filter(APULinea.apu_id == db_obj.id).delete()
        db.flush()
        
        for index, linea_in in enumerate(obj_in.lineas):
            linea_data = linea_in.model_dump()
            linea_data["orden"] = linea_data.get("orden", index)
            linea = APULinea(**linea_data, apu_id=db_obj.id)
            db.add(linea)
            
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def delete(self, db: Session, db_obj: APU) -> bool:
        db.delete(db_obj)
        db.commit()
        return True

    def reorder_lineas(self, db: Session, apu_id: int, ordered_linea_ids: List[int]) -> None:
        lineas = db.query(APULinea).filter(APULinea.apu_id == apu_id).all()
        lineas_map = {linea.id: linea for linea in lineas}
        for index, linea_id in enumerate(ordered_linea_ids):
            linea = lineas_map.get(linea_id)
            if linea:
                linea.orden = index
        db.flush()

apu_repo = APURepository()
