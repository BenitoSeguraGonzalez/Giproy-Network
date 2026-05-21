from sqlalchemy.orm import Session
from sqlalchemy.orm.attributes import flag_modified
from app.models.cronograma_trabajo import CronogramaTrabajo
from typing import Optional

class CronogramaTrabajoRepository:
    def get_by_budget_id(self, db: Session, presupuesto_id: int, empresa_id: int) -> Optional[CronogramaTrabajo]:
        return db.query(CronogramaTrabajo).filter(
            CronogramaTrabajo.presupuesto_id == presupuesto_id,
            CronogramaTrabajo.empresa_id == empresa_id
        ).first()

    def create(self, db: Session, obj_in: dict) -> CronogramaTrabajo:
        db_obj = CronogramaTrabajo(**obj_in)
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def update(self, db: Session, db_obj: CronogramaTrabajo, obj_in: dict) -> CronogramaTrabajo:
        for field, value in obj_in.items():
            setattr(db_obj, field, value)
            if field == "schedule_data":
                # SQLAlchemy JSON columns do not always detect semantic replacements
                # across nested schedule payloads unless we mark the field dirty.
                flag_modified(db_obj, "schedule_data")
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

cronograma_trabajo_repo = CronogramaTrabajoRepository()
