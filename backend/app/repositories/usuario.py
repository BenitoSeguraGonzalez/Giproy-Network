from typing import List
from sqlalchemy import func
from sqlalchemy.orm import Session
from app.models.usuario import Usuario
from app.schemas.usuario import UsuarioCreate, UsuarioUpdate
from app.core.security import get_password_hash

class UsuarioRepository:
    def get_by_email(self, db: Session, email: str) -> Usuario | None:
        normalized_email = email.strip().lower()
        return db.query(Usuario).filter(func.lower(Usuario.email) == normalized_email).first()

    def get_all_by_email(self, db: Session, email: str) -> List[Usuario]:
        normalized_email = email.strip().lower()
        return db.query(Usuario).filter(func.lower(Usuario.email) == normalized_email).all()

    def get(self, db: Session, id: int) -> Usuario | None:
        return db.query(Usuario).filter(Usuario.id == id).first()

    def get_by_id(self, db: Session, user_id: int, empresa_id: int) -> Usuario | None:
        return db.query(Usuario).filter(
            Usuario.id == user_id, 
            Usuario.empresa_id == empresa_id
        ).first()

    def get_by_ruc(self, db: Session, ruc: str, empresa_id: int) -> Usuario | None:
        return db.query(Usuario).filter(
            Usuario.ruc == ruc,
            Usuario.empresa_id == empresa_id
        ).first()

    def create(self, db: Session, obj_in: UsuarioCreate) -> Usuario:
        db_obj = Usuario(
            email=obj_in.email,
            hashed_password=get_password_hash(obj_in.password),
            nombre_completo=obj_in.nombre_completo,
            rol=obj_in.rol,
            empresa_id=obj_in.empresa_id,
            # Nuevos campos
            ruc=obj_in.ruc,
            nombres=obj_in.nombres,
            apellidos=obj_in.apellidos,
            alias=obj_in.alias,
            nacionalidad=obj_in.nacionalidad,
            profesion=obj_in.profesion,
            ciudad=obj_in.ciudad,
            provincia=obj_in.provincia,
            canton=obj_in.canton,
            pais=obj_in.pais,
            movil=obj_in.movil,
            acepta_politica_privacidad=obj_in.acepta_politica_privacidad,
            acepta_politicas_comunicacion=obj_in.acepta_politicas_comunicacion,
            autoriza_publicidad=obj_in.autoriza_publicidad,
        )
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj
    
    def update(self, db: Session, db_obj: Usuario, obj_in: UsuarioUpdate) -> Usuario:
        update_data = obj_in.model_dump(exclude_unset=True)
        
        # Si se actualiza la contraseña, hashearla
        if 'password' in update_data:
            update_data['hashed_password'] = get_password_hash(update_data.pop('password'))
        
        for field, value in update_data.items():
            setattr(db_obj, field, value)
        
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def remove(self, db: Session, id: int) -> Usuario | None:
        db_obj = self.get(db, id=id)
        if not db_obj:
            return None

        db.delete(db_obj)
        db.commit()
        return db_obj

usuario_repo = UsuarioRepository()
