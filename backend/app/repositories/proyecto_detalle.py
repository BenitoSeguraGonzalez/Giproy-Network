from sqlalchemy.orm import Session
from app.models.proyecto_detalle import ProyectoDetalle
from app.schemas.proyecto_detalle import ProyectoDetalleCreate, ProyectoDetalleUpdate
from typing import Optional

class ProyectoDetalleRepository:
    def get_by_root(self, db: Session, codigo_root: str, empresa_id: int) -> Optional[ProyectoDetalle]:
        return (
            db.query(ProyectoDetalle)
            .filter(
                ProyectoDetalle.codigo_root == codigo_root,
                ProyectoDetalle.empresa_id == empresa_id,
            )
            .first()
        )

    def create(self, db: Session, obj_in: ProyectoDetalleCreate, empresa_id: int) -> ProyectoDetalle:
        db_obj = ProyectoDetalle(**obj_in.model_dump(), empresa_id=empresa_id)
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def update(self, db: Session, db_obj: ProyectoDetalle, obj_in: ProyectoDetalleUpdate) -> ProyectoDetalle:
        update_data = obj_in.model_dump(exclude_unset=True)
        for field in update_data:
            setattr(db_obj, field, update_data[field])
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

proyecto_detalle_repo = ProyectoDetalleRepository()
