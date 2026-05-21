from sqlalchemy.orm import Session
from app.models.dispositivo import Dispositivo
from app.schemas.dispositivo import DispositivoCreate
from typing import Optional, List, Dict
from datetime import datetime

class DispositivoRepository:
    def __init__(self, db: Session = None):
        self.db = db

    def get_by_id(self, db: Optional[Session], dispositivo_id: int) -> Optional[Dispositivo]:
        db = db or self.db
        return db.query(Dispositivo).filter(Dispositivo.id == dispositivo_id).first()
    
    def get_by_device_id(self, db: Optional[Session], device_id: str) -> Optional[Dispositivo]:
        db = db or self.db
        return db.query(Dispositivo).filter(Dispositivo.device_id == device_id).first()
    
    def find_or_create(self, device_id: str, empresa_id: int, usuario_id: int) -> Dispositivo:
        if not self.db:
            raise ValueError("Repository initialized without session")
        
        dispositivo = self.get_by_device_id(self.db, device_id)
        if not dispositivo:
            dispositivo = Dispositivo(
                device_id=device_id,
                empresa_id=empresa_id,
                usuario_id=usuario_id,
                activo=True,
                es_confiable=False,
                intentos_fallidos=0,
                bloqueado=False,
                fecha_primer_acceso=datetime.utcnow(),
                fecha_ultimo_acceso=datetime.utcnow()
            )
            self.db.add(dispositivo)
            self.db.commit()
            self.db.refresh(dispositivo)
        else:
            # Actualizar último acceso y usuario si cambió
            dispositivo.fecha_ultimo_acceso = datetime.utcnow()
            dispositivo.usuario_id = usuario_id
            self.db.add(dispositivo)
            self.db.commit()
            self.db.refresh(dispositivo)
            
        return dispositivo

    def get_by_empresa(self, db: Session, empresa_id: int, skip: int = 0, limit: int = 100) -> List[Dispositivo]:
        return db.query(Dispositivo).filter(
            Dispositivo.empresa_id == empresa_id
        ).order_by(Dispositivo.fecha_ultimo_acceso.desc()).offset(skip).limit(limit).all()
    
    def get_count_by_empresa(self, db: Session, empresa_id: int) -> int:
        return db.query(Dispositivo).filter(
            Dispositivo.empresa_id == empresa_id
        ).count()
    
    def create(self, db: Session, obj_in: DispositivoCreate) -> Dispositivo:
        db_dispositivo = Dispositivo(
            **obj_in.model_dump(),
            activo=True,
            es_confiable=False,
            intentos_fallidos=0,
            bloqueado=False
        )
        db.add(db_dispositivo)
        db.commit()
        db.refresh(db_dispositivo)
        return db_dispositivo
    
    def update(self, db: Session, dispositivo_id: int, update_dict: Dict) -> Optional[Dispositivo]:
        dispositivo = self.get_by_id(db, dispositivo_id)
        if not dispositivo:
            return None
        
        for key, value in update_dict.items():
            setattr(dispositivo, key, value)
        
        db.commit()
        db.refresh(dispositivo)
        return dispositivo
    
    def delete(self, db: Session, dispositivo_id: int) -> bool:
        dispositivo = self.get_by_id(db, dispositivo_id)
        if not dispositivo:
            return False
        db.delete(dispositivo)
        db.commit()
        return True

    def update_ultimo_acceso(self, db: Session, device_id: str):
        dispositivo = self.get_by_device_id(db, device_id)
        if dispositivo:
            dispositivo.fecha_ultimo_acceso = datetime.utcnow()
            db.commit()

dispositivo_repo = DispositivoRepository()
