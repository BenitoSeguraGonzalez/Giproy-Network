from typing import List, Optional
from sqlalchemy.orm import Session
from app.models.polinomica import FormulaPolinomica, FormulaPolinomicaMonomio, CuadrillaTipo, IndiceINEC, FormulaPolinomicaAsignacion
from app.models.presupuesto import Presupuesto

class FormulaPolinomicaRepository:
    def get_by_presupuesto(self, db: Session, presupuesto_id: int) -> Optional[FormulaPolinomica]:
        return db.query(FormulaPolinomica).filter(FormulaPolinomica.presupuesto_id == presupuesto_id).first()

    def create(self, db: Session, formula_in: dict) -> FormulaPolinomica:
        db_obj = FormulaPolinomica(**formula_in)
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def update(self, db: Session, db_obj: FormulaPolinomica, obj_in: dict) -> FormulaPolinomica:
        for field, value in obj_in.items():
            setattr(db_obj, field, value)
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def delete_monomios(self, db: Session, formula_id: int):
        db.query(FormulaPolinomicaMonomio).filter(FormulaPolinomicaMonomio.formula_id == formula_id).delete()
        db.commit()

    def create_monomio(self, db: Session, monomio_in: dict) -> FormulaPolinomicaMonomio:
        db_obj = FormulaPolinomicaMonomio(**monomio_in)
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def delete_cuadrilla_tipo(self, db: Session, formula_id: int):
        db.query(CuadrillaTipo).filter(CuadrillaTipo.formula_id == formula_id).delete()
        db.commit()

    def create_cuadrilla_item(self, db: Session, item_in: dict) -> CuadrillaTipo:
        db_obj = CuadrillaTipo(**item_in)
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def get_indices_inec(self, db: Session) -> List[IndiceINEC]:
        return db.query(IndiceINEC).all()

    def create_indice_inec(self, db: Session, indice_in: dict) -> IndiceINEC:
        db_obj = IndiceINEC(**indice_in)
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def get_assignments(self, db: Session, formula_id: int) -> List[FormulaPolinomicaAsignacion]:
        return db.query(FormulaPolinomicaAsignacion).filter(FormulaPolinomicaAsignacion.formula_id == formula_id).all()

    def delete_assignments(self, db: Session, formula_id: int):
        db.query(FormulaPolinomicaAsignacion).filter(FormulaPolinomicaAsignacion.formula_id == formula_id).delete()
        db.commit()

    def upsert_assignment(self, db: Session, formula_id: int, recurso_id: int, simbolo: str) -> FormulaPolinomicaAsignacion:
        db_obj = db.query(FormulaPolinomicaAsignacion).filter(
            FormulaPolinomicaAsignacion.formula_id == formula_id,
            FormulaPolinomicaAsignacion.recurso_id == recurso_id
        ).first()
        
        if db_obj:
            db_obj.simbolo = simbolo
        else:
            db_obj = FormulaPolinomicaAsignacion(formula_id=formula_id, recurso_id=recurso_id, simbolo=simbolo)
            db.add(db_obj)
        
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def delete_assignment(self, db: Session, formula_id: int, recurso_id: int) -> None:
        db.query(FormulaPolinomicaAsignacion).filter(
            FormulaPolinomicaAsignacion.formula_id == formula_id,
            FormulaPolinomicaAsignacion.recurso_id == recurso_id,
        ).delete()
        db.commit()

    def update_monomio_index(self, db: Session, formula_id: int, simbolo: str, indice_inec_id: Optional[int]) -> Optional[FormulaPolinomicaMonomio]:
        db_obj = db.query(FormulaPolinomicaMonomio).filter(
            FormulaPolinomicaMonomio.formula_id == formula_id,
            FormulaPolinomicaMonomio.simbolo == simbolo,
        ).first()
        if not db_obj:
            return None
        db_obj.indice_inec_id = indice_inec_id
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def update_cuadrilla_index(self, db: Session, formula_id: int, recurso_id: int, indice_inec_id: Optional[int]) -> Optional[CuadrillaTipo]:
        db_obj = db.query(CuadrillaTipo).filter(
            CuadrillaTipo.formula_id == formula_id,
            CuadrillaTipo.recurso_id == recurso_id,
        ).first()
        if not db_obj:
            return None
        db_obj.indice_inec_id = indice_inec_id
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

formula_polinomica_repo = FormulaPolinomicaRepository()
