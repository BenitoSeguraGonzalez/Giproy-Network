import httpx
from typing import List, Any, Optional
from sqlalchemy.orm import Session
from fastapi import HTTPException

from app.repositories.usuario import usuario_repo
from app.schemas.usuario import UsuarioCreate, UsuarioUpdate, ValidarRucResponse
from app.models.usuario import Usuario
from app.services.license_policy import validate_role_quota
from app.services.license import license_service
from app.core.phone_normalization import is_valid_phone, normalize_phone

RUC_API_URL = "https://app.62.171.171.124.sslip.io/ConsultarRuc.php"

class UsuarioService:
    COMMUNITY_ONLY_ROLE = "usuario_comunidad"
    ROLE_PRIORITY = {
        "usuario_comunidad": 0,
        "usuario": 1,
        "administrador": 2,
        "superadministrador": 3,
    }

    def _role_key(self, role: Optional[str]) -> str:
        return (role or "").strip().lower()

    def _role_priority(self, role: Optional[str]) -> int:
        return self.ROLE_PRIORITY.get(self._role_key(role), -1)

    def _is_superadmin(self, user: Usuario) -> bool:
        return self._role_key(user.rol) == "superadministrador"

    def _is_admin(self, user: Usuario) -> bool:
        return self._role_key(user.rol) == "administrador"

    def _can_manage_role(self, actor: Usuario, target_role: Optional[str]) -> bool:
        if self._is_superadmin(actor):
            return self._role_priority(target_role) >= 0
        if not self._is_admin(actor):
            return False
        return 0 <= self._role_priority(target_role) <= self._role_priority(actor.rol)

    def _assert_can_manage_user(self, actor: Usuario, target: Usuario) -> None:
        if self._is_superadmin(actor):
            return
        if not self._is_admin(actor):
            raise HTTPException(status_code=403, detail="No tiene permisos para gestionar usuarios.")
        if target.empresa_id != actor.empresa_id:
            raise HTTPException(status_code=403, detail="No tiene permisos para gestionar usuarios de otra empresa.")
        if self._role_priority(target.rol) > self._role_priority(actor.rol):
            raise HTTPException(status_code=403, detail="No tiene permisos para gestionar un rol superior.")

    def get_users(self, db: Session, current_user: Usuario, target_empresa_id: Optional[int] = None) -> List[Usuario]:
        user_role = self._role_key(current_user.rol)
        if user_role == "superadministrador":
            if target_empresa_id:
                return db.query(Usuario).filter(Usuario.empresa_id == target_empresa_id).all()
            return db.query(Usuario).all()
        elif user_role == "administrador":
            return db.query(Usuario).filter(Usuario.empresa_id == current_user.empresa_id, Usuario.rol.ilike("superadministrador") == False).all()
        else:
            raise HTTPException(status_code=403, detail="Permisos insuficientes")

    def create_usuario(self, db: Session, user_in: UsuarioCreate, current_user: Usuario, target_empresa_id: Optional[int] = None) -> Usuario:
        user_in.email = user_in.email.strip()
        user_in.nombre_completo = user_in.nombre_completo.strip()

        # 1. Determinación de Empresa
        final_empresa_id = current_user.empresa_id
        user_role = current_user.rol.lower() if current_user.rol else ""
        
        if user_role == "superadministrador":
            if target_empresa_id:
                final_empresa_id = target_empresa_id
            elif user_in.empresa_id:
                final_empresa_id = user_in.empresa_id
            
            if not self._can_manage_role(current_user, user_in.rol):
                 raise HTTPException(status_code=400, detail="Rol inválido para creación.")
        elif user_role == "administrador":
            if not self._can_manage_role(current_user, user_in.rol):
                raise HTTPException(status_code=403, detail="Este perfil solo puede crear usuarios con rol igual o inferior.")
            final_empresa_id = current_user.empresa_id
        else:
            raise HTTPException(status_code=403, detail="No tiene permisos para crear usuarios.")
        
        user_in.empresa_id = final_empresa_id
        if user_in.movil:
            if not is_valid_phone(user_in.movil):
                raise HTTPException(status_code=400, detail="El móvil debe tener un formato válido.")
            user_in.movil = normalize_phone(user_in.movil, user_in.pais)
            
        # 1.5 Validación de Cuotas de Personal
        from app.models.empresa import Empresa
        empresa = db.query(Empresa).filter(Empresa.id == final_empresa_id).first()
        if not empresa:
            raise HTTPException(status_code=404, detail="Empresa no encontrada")
        validate_role_quota(db, empresa, user_in.rol)
            
        # 2. Verificar existencia y roles previos para este email
        existing_accounts = usuario_repo.get_all_by_email(db, email=user_in.email)
        
        # 2.1. No duplicados en la misma empresa
        for acc in existing_accounts:
            if acc.empresa_id == final_empresa_id:
                raise HTTPException(
                    status_code=400,
                    detail="Este usuario ya está registrado en esta empresa.",
                )
        
        # 2.2. Regla Multi-Empresa: Solo 1 rol administrativo (administrador)
        # Nota: Los roles estándar y de comunidad permiten multiempresa.
        if self._role_key(user_in.rol) == "administrador":
            has_admin = any(self._role_key(acc.rol) == "administrador" for acc in existing_accounts)
            if has_admin:
                raise HTTPException(
                    status_code=400,
                    detail="Este usuario ya posee una cuenta administrativa en otra empresa."
                )
            
        # 3. Creación
        new_user = usuario_repo.create(db=db, obj_in=user_in)
        
        # 4. Actualizar métricas de uso (Sincronización reactiva)
        license_service.update_usage_metrics(db, final_empresa_id)
        
        return new_user

    def validar_ruc(self, ruc: str, token: str) -> ValidarRucResponse:
        """
        Valida un RUC consultando el servicio externo de SRI.
        """
        ruc_clean = ruc.strip()
        
        # Validar que el RUC tenga 13 dígitos
        if len(ruc_clean) != 13:
            return ValidarRucResponse(
                valido=False,
                mensaje="El RUC debe tener exactamente 13 dígitos.",
                ruc=ruc_clean
            )
        
        # Validar que sean solo dígitos
        if not ruc_clean.isdigit():
            return ValidarRucResponse(
                valido=False,
                mensaje="El RUC debe ser numérico.",
                ruc=ruc_clean
            )
        
        try:
            # Consultar el servicio externo
            with httpx.Client(timeout=15.0) as client:
                response = client.post(
                    RUC_API_URL,
                    json={"ruc": ruc_clean, "token": token},
                    headers={
                        "Content-Type": "application/json; charset=utf-8",
                        "Accept": "application/json"
                    }
                )
                
                if response.status_code != 200:
                    return ValidarRucResponse(
                        valido=False,
                        mensaje=f"Error del servidor: HTTP {response.status_code}",
                        ruc=ruc_clean
                    )
                
                data = response.json()
                
                # Verificar si hay error en la respuesta
                if not data.get("ok", False):
                    error_msg = data.get("error", "Error desconocido del servidor.")
                    return ValidarRucResponse(
                        valido=False,
                        mensaje=error_msg,
                        ruc=ruc_clean
                    )
                
                # Obtener los datos
                ruc_data = data.get("data", {})
                
                return ValidarRucResponse(
                    valido=True,
                    mensaje="RUC válido encontrado.",
                    ruc=ruc_clean,
                    razon_social=ruc_data.get("RAZON_SOCIAL", ""),
                    estado_contribuyente=ruc_data.get("ESTADO_CONTRIBUYENTE", ""),
                    clase_contribuyente=ruc_data.get("CLASE_CONTRIBUYENTE", ""),
                    fecha_inicio_actividades=ruc_data.get("FECHA_INICIO_ACTIVIDADES", ""),
                    actividad_economica=ruc_data.get("ACTIVIDAD_ECONOMICA", "")
                )
                
        except httpx.TimeoutException:
            return ValidarRucResponse(
                valido=False,
                mensaje="Tiempo de espera agotado. Intente más tarde.",
                ruc=ruc_clean
            )
        except httpx.RequestError as e:
            return ValidarRucResponse(
                valido=False,
                mensaje=f"Error de conexión: {str(e)}",
                ruc=ruc_clean
            )
        except Exception as e:
            return ValidarRucResponse(
                valido=False,
                mensaje=f"Error inesperado: {str(e)}",
                ruc=ruc_clean
            )

    def update_usuario(self, db: Session, user_id: int, user_in: UsuarioUpdate, current_user: Usuario, target_empresa_id: Optional[int] = None) -> Usuario:
        # 1. Obtener usuario
        user_to_update = usuario_repo.get(db, id=user_id)
        if not user_to_update:
            raise HTTPException(status_code=404, detail="Usuario no encontrado.")
            
        # 2. Validación de Jerarquía
        user_role = self._role_key(current_user.rol)
        if user_role != "superadministrador":
            self._assert_can_manage_user(current_user, user_to_update)
            if user_in.rol and not self._can_manage_role(current_user, user_in.rol):
                raise HTTPException(status_code=403, detail="No puede asignar un rol superior.")
        else:
             # Si es Superadmin pero el usuario no pertenece a la empresa objetivo (si se especificó)
            if target_empresa_id and user_to_update.empresa_id != target_empresa_id:
                 raise HTTPException(status_code=403, detail="El usuario no pertenece a la empresa especificada.")
            if user_in.rol and not self._can_manage_role(current_user, user_in.rol):
                raise HTTPException(status_code=400, detail="Rol inválido para actualización.")

        if user_in.email:
            requested_email = user_in.email.strip()
            existing_accounts = usuario_repo.get_all_by_email(db, email=requested_email)
            for acc in existing_accounts:
                if acc.id != user_to_update.id and acc.empresa_id == user_to_update.empresa_id:
                    raise HTTPException(
                        status_code=400,
                        detail="Este usuario ya está registrado en esta empresa.",
                    )
            user_in.email = requested_email

        if user_in.rol and self._role_key(user_in.rol) != self._role_key(user_to_update.rol):
            # Si el usuario es el último administrador, no puede cambiar su rol
            if self._role_key(user_to_update.rol) == "administrador":
                admin_count = db.query(Usuario).filter(
                    Usuario.empresa_id == user_to_update.empresa_id,
                    Usuario.rol.ilike("administrador")
                ).count()
                if admin_count <= 1:
                    raise HTTPException(
                        status_code=400, 
                        detail="No se puede cambiar el rol del último administrador de la empresa."
                    )

            from app.models.empresa import Empresa
            empresa = db.query(Empresa).filter(Empresa.id == user_to_update.empresa_id).first()
            if not empresa:
                raise HTTPException(status_code=404, detail="Empresa no encontrada.")
            validate_role_quota(db, empresa, user_in.rol, exclude_user_id=user_to_update.id)

        if user_in.movil:
            if not is_valid_phone(user_in.movil):
                raise HTTPException(status_code=400, detail="El móvil debe tener un formato válido.")
            user_in.movil = normalize_phone(user_in.movil, user_in.pais if user_in.pais is not None else user_to_update.pais)
            
        # 3. Actualizar
        updated_user = usuario_repo.update(db=db, db_obj=user_to_update, obj_in=user_in)
        
        # 4. Actualizar métricas de uso si cambió el rol o empresa
        license_service.update_usage_metrics(db, updated_user.empresa_id)
        
        # Log de éxito
        from app.core.debug_logger import log_debug
        log_debug(f"USER UPDATED: {updated_user.email} (ID: {updated_user.id})")
        
        return updated_user

    def delete_usuario(self, db: Session, user_id: int, current_user: Usuario, target_empresa_id: Optional[int] = None) -> Usuario:
        user_to_delete = usuario_repo.get(db, id=user_id)
        if not user_to_delete:
            raise HTTPException(status_code=404, detail="Usuario no encontrado.")
            
        if user_to_delete.id == current_user.id:
            raise HTTPException(status_code=400, detail="No puede eliminarse a sí mismo.")

        user_role = self._role_key(current_user.rol)
        if user_role != "superadministrador":
            self._assert_can_manage_user(current_user, user_to_delete)
        else:
             if target_empresa_id and user_to_delete.empresa_id != target_empresa_id:
                  raise HTTPException(status_code=403, detail="El usuario no pertenece a la empresa especificada.")

        # Regla: No eliminar último administrador
        if self._role_key(user_to_delete.rol) == "administrador":
            admin_count = db.query(Usuario).filter(
                Usuario.empresa_id == user_to_delete.empresa_id,
                Usuario.rol.ilike("administrador")
            ).count()
            if admin_count <= 1:
                raise HTTPException(
                    status_code=400, 
                    detail="No se puede eliminar al último administrador de la empresa."
                )
                
        deleted_empresa_id = user_to_delete.empresa_id
        usuario_repo.remove(db=db, id=user_id)
        
        # 4. Actualizar métricas de uso
        license_service.update_usage_metrics(db, deleted_empresa_id)
        
        return user_to_delete

usuario_service = UsuarioService()
