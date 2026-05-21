from sqlalchemy.orm import Session
from typing import List, Optional
from app.models.presupuesto import Presupuesto, PresupuestoDetalle, PresupuestoIndirecto, PresupuestoNota, PresupuestoVistaUsuario, PresupuestoLineaVistaUsuario
from app.schemas.presupuesto import PresupuestoCreate, PresupuestoUpdate, PresupuestoDetalleUpdate

class PresupuestoRepository:
    def get(self, db: Session, id: int, empresa_id: int) -> Optional[Presupuesto]:
        return db.query(Presupuesto).filter(
            Presupuesto.id == id,
            Presupuesto.empresa_id == empresa_id
        ).first()

    def get_multi(
        self, 
        db: Session, 
        empresa_id: int, 
        proyecto_id: Optional[int] = None, 
        skip: int = 0, 
        limit: int = 100
    ) -> List[Presupuesto]:
        query = db.query(Presupuesto).filter(Presupuesto.empresa_id == empresa_id)
        if proyecto_id:
            query = query.filter(Presupuesto.proyecto_id == proyecto_id)
        return query.offset(skip).limit(limit).all()

    def create(self, db: Session, obj_in: Presupuesto, flush: bool = False) -> Presupuesto:
        db.add(obj_in)
        if flush:
            db.flush()
        else:
            db.commit()
            db.refresh(obj_in)
        return obj_in

    def get_linea(self, db: Session, linea_id: int, empresa_id: int) -> Optional[PresupuestoDetalle]:
        return db.query(PresupuestoDetalle).join(Presupuesto).filter(
            PresupuestoDetalle.id == linea_id,
            Presupuesto.empresa_id == empresa_id
        ).first()

    def get_indirectos(self, db: Session, presupuesto_id: int) -> List[PresupuestoIndirecto]:
        return db.query(PresupuestoIndirecto).filter(
            PresupuestoIndirecto.presupuesto_id == presupuesto_id
        ).all()

    def delete_indirecto(self, db: Session, item: PresupuestoIndirecto, flush: bool = True):
        db.delete(item)
        if not flush:
            db.commit()

    def get_notas_query(self, db: Session, presupuesto_id: int):
        return db.query(PresupuestoNota).filter(
            PresupuestoNota.presupuesto_id == presupuesto_id
        )

    def get_vista_usuario(self, db: Session, presupuesto_id: int, usuario_id: int) -> Optional[PresupuestoVistaUsuario]:
        return db.query(PresupuestoVistaUsuario).filter(
            PresupuestoVistaUsuario.presupuesto_id == presupuesto_id,
            PresupuestoVistaUsuario.usuario_id == usuario_id
        ).first()

    def get_line_views(self, db: Session, presupuesto_id: int, usuario_id: int) -> List[PresupuestoLineaVistaUsuario]:
        return db.query(PresupuestoLineaVistaUsuario).filter(
            PresupuestoLineaVistaUsuario.presupuesto_id == presupuesto_id,
            PresupuestoLineaVistaUsuario.usuario_id == usuario_id
        ).all()

    def get_line_view(self, db: Session, presupuesto_id: int, linea_id: int, usuario_id: int) -> Optional[PresupuestoLineaVistaUsuario]:
        return db.query(PresupuestoLineaVistaUsuario).filter(
            PresupuestoLineaVistaUsuario.presupuesto_id == presupuesto_id,
            PresupuestoLineaVistaUsuario.linea_presupuesto_id == linea_id,
            PresupuestoLineaVistaUsuario.usuario_id == usuario_id
        ).first()

presupuesto_repo = PresupuestoRepository()
