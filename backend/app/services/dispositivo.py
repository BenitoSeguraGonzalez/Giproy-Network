from sqlalchemy.orm import Session
from datetime import datetime
from typing import Optional, List
from app.models.dispositivo import Dispositivo
from app.schemas.dispositivo import DispositivoCreate, DispositivoUpdate, ValidacionDispositivoResponse

class DispositivoService:
    def get_dispositivo(self, db: Session, dispositivo_id: int) -> Optional[Dispositivo]:
        from app.repositories.dispositivo import dispositivo_repo
        return dispositivo_repo.get_by_id(db, dispositivo_id)

    def validar_dispositivo(self, db: Session, device_id: str, empresa_id: int) -> ValidacionDispositivoResponse:
        """Valida si un dispositivo está autorizado para acceder."""
        from app.repositories.dispositivo import dispositivo_repo
        dispositivo = dispositivo_repo.get_by_device_id(db, device_id)
        
        if not dispositivo:
            return ValidacionDispositivoResponse(
                valido=True,
                dispositivo_id=None,
                mensaje="Dispositivo no registrado. Se permitirá el acceso inicial.",
                requiere_aprobacion=False
            )
        
        if dispositivo.bloqueado:
            return ValidacionDispositivoResponse(
                valido=False,
                dispositivo_id=dispositivo.id,
                mensaje="Dispositivo bloqueado. Contacte al administrador.",
                requiere_aprobacion=True
            )
        
        if not dispositivo.activo:
            return ValidacionDispositivoResponse(
                valido=False,
                dispositivo_id=dispositivo.id,
                mensaje="Dispositivo inactivo. Contacte al administrador.",
                requiere_aprobacion=True
            )
        
        dispositivo_repo.update_ultimo_acceso(db, device_id)
        
        if dispositivo.es_confiable:
            return ValidacionDispositivoResponse(
                valido=True,
                dispositivo_id=dispositivo.id,
                mensaje="Dispositivo autorizado.",
                requiere_aprobacion=False
            )
        
        return ValidacionDispositivoResponse(
            valido=True,
            dispositivo_id=dispositivo.id,
            mensaje="Dispositivo en espera de aprobación.",
            requiere_aprobacion=True
        )

    def find_or_create_device(self, db: Session, device_id: str, empresa_id: int, **kwargs) -> Dispositivo:
        from app.repositories.dispositivo import dispositivo_repo
        dispositivo = dispositivo_repo.get_by_device_id(db, device_id)
        
        if dispositivo:
            update_data = {
                "fecha_ultimo_acceso": datetime.utcnow()
            }
            if "info_navegador" in kwargs: update_data["info_navegador"] = kwargs["info_navegador"]
            if "info_pantalla" in kwargs: update_data["info_pantalla"] = kwargs["info_pantalla"]
            if "info_sistema" in kwargs: update_data["info_sistema"] = kwargs["info_sistema"]
            return dispositivo_repo.update(db, dispositivo.id, update_data)
        
        new_data = DispositivoCreate(
            device_id=device_id,
            empresa_id=empresa_id,
            usuario_id=kwargs.get("usuario_id"),
            nombre=f"Dispositivo {device_id[:8]}",
            **{k: v for k, v in kwargs.items() if k not in ["usuario_id"]}
        )
        return dispositivo_repo.create(db, new_data)

    def update_dispositivo(self, db: Session, dispositivo_id: int, update_data: DispositivoUpdate) -> Optional[Dispositivo]:
        from app.repositories.dispositivo import dispositivo_repo
        return dispositivo_repo.update(db, dispositivo_id, update_data.model_dump(exclude_unset=True))

    def handle_login_failure(self, db: Session, device_id: str) -> Optional[Dispositivo]:
        from app.repositories.dispositivo import dispositivo_repo
        dispositivo = dispositivo_repo.get_by_device_id(db, device_id)
        if dispositivo:
            new_intentos = dispositivo.intentos_fallidos + 1
            bloqueado = new_intentos >= 5
            return dispositivo_repo.update(db, dispositivo.id, {
                "intentos_fallidos": new_intentos,
                "bloqueado": bloqueado
            })
        return None

    def reset_failures(self, db: Session, device_id: str) -> Optional[Dispositivo]:
        from app.repositories.dispositivo import dispositivo_repo
        dispositivo = dispositivo_repo.get_by_device_id(db, device_id)
        if dispositivo:
            return dispositivo_repo.update(db, dispositivo.id, {"intentos_fallidos": 0})
        return None

    def set_status(self, db: Session, dispositivo_id: int, status_key: str, value: bool) -> Optional[Dispositivo]:
        from app.repositories.dispositivo import dispositivo_repo
        update_map = {status_key: value}
        if status_key == "bloqueado" and value == False:
            update_map["intentos_fallidos"] = 0
        return dispositivo_repo.update(db, dispositivo_id, update_map)

dispositivo_service = DispositivoService()
