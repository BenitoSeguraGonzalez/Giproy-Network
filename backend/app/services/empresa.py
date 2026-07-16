from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from typing import List, Optional
from datetime import date, datetime, timedelta, timezone
from pathlib import Path
import base64
import mimetypes

from app.repositories.empresa import empresa_repo
from app.models.empresa import Empresa
from app.models.usuario import Usuario
from app.schemas.empresa import EmpresaCreate, EmpresaUpdate, EmpresaResponse
from app.services.audit_event import record_audit_event
from app.services.license_policy import validate_company_limits_against_usage, validate_license_window
from app.core.phone_normalization import is_valid_phone, normalize_phone

class EmpresaService:
    def get_display_name(self, empresa: Optional[Empresa]) -> Optional[str]:
        if not empresa:
            return None
        alias = (getattr(empresa, "alias", None) or "").strip()
        return alias or getattr(empresa, "nombre", None)

    def _resolve_logo_url(self, logo_url: Optional[str]) -> Optional[str]:
        if not logo_url or not isinstance(logo_url, str):
            return None if logo_url is None else (logo_url if isinstance(logo_url, str) else None)

        try:
            normalized = logo_url.strip().replace("\\", "/")
        except Exception:
            return None
        if not normalized:
            return None

        if normalized.startswith("data:") or normalized.startswith("http://") or normalized.startswith("https://"):
            return normalized

        if normalized.startswith("/uploads/") or normalized.startswith("uploads/"):
            base_dir = Path(__file__).resolve().parents[2]
            relative_path = normalized.lstrip("/")
            file_path = base_dir / relative_path
            try:
                if file_path.exists() and file_path.is_file():
                    mime_type, _ = mimetypes.guess_type(str(file_path))
                    mime_type = mime_type or "image/jpeg"
                    encoded = base64.b64encode(file_path.read_bytes()).decode("utf-8")
                    return f"data:{mime_type};base64,{encoded}"
            except Exception:
                return None

        return normalized

    def serialize_empresa(self, empresa: Empresa) -> dict:
        payload = EmpresaResponse.model_validate(empresa, from_attributes=True).model_dump()
        payload["logo_url"] = self._resolve_logo_url(payload.get("logo_url"))
        return payload

    def serialize_empresas(self, empresas: List[Empresa]) -> List[dict]:
        return [self.serialize_empresa(empresa) for empresa in empresas]

    def get_empresa(self, db: Session, empresa_id: int) -> Empresa:
        empresa = empresa_repo.get(db, id=empresa_id)
        if not empresa:
            raise HTTPException(status_code=404, detail="Empresa no encontrada")
        return empresa

    def get_all_empresas(self, db: Session) -> List[Empresa]:
        return empresa_repo.get_all(db)

    def create_empresa(self, db: Session, empresa_in: EmpresaCreate, current_user: Usuario) -> Empresa:
        if not empresa_in.ruc or len(empresa_in.ruc.strip()) != 13 or not empresa_in.ruc.strip().isdigit():
            raise HTTPException(status_code=400, detail="El RUC empresarial debe contener exactamente 13 dígitos.")
        from app.services.sri_ruc import lookup_ruc

        fiscal_data = lookup_ruc(db, empresa_in.ruc.strip())
        if not fiscal_data:
            raise HTTPException(status_code=409, detail="El RUC no consta en la fuente fiscal vigente.")
        empresa_in.nombre = fiscal_data["business_name"]
        license_start_date = empresa_in.license_start_date or date.today()
        license_end_date = empresa_in.license_end_date or (license_start_date + timedelta(days=365))
        if empresa_in.telefono:
            if not is_valid_phone(empresa_in.telefono):
                raise HTTPException(status_code=400, detail="El teléfono principal debe tener un formato válido.")
            empresa_in.telefono = normalize_phone(empresa_in.telefono, empresa_in.pais)
        if empresa_in.contacto_telefono:
            if not is_valid_phone(empresa_in.contacto_telefono):
                raise HTTPException(status_code=400, detail="El teléfono del contacto debe tener un formato válido.")
            empresa_in.contacto_telefono = normalize_phone(empresa_in.contacto_telefono, empresa_in.pais)
        
        validate_license_window(license_start_date, license_end_date)
        
        db_obj = empresa_repo.create(
            db, 
            obj_in=empresa_in, 
            license_start_date=license_start_date, 
            license_end_date=license_end_date
        )
        db_obj.fiscal_status = fiscal_data.get("status")
        db_obj.fiscal_taxpayer_type = fiscal_data.get("taxpayer_type")
        db_obj.fiscal_start_date = fiscal_data.get("start_date")
        db_obj.fiscal_economic_activity = fiscal_data.get("economic_activity")
        db_obj.fiscal_source = fiscal_data.get("source")
        db_obj.fiscal_source_date = fiscal_data.get("source_date")
        db_obj.fiscal_verified_at = datetime.now(timezone.utc)
        db.commit()
        db.refresh(db_obj)

        record_audit_event(
            db,
            module="empresas",
            event_type="empresa_created",
            severity="warning",
            actor=current_user,
            target_empresa_id=db_obj.id,
            entity_type="empresa",
            entity_id=db_obj.id,
            message=f"Empresa creada: {self.get_display_name(db_obj)}",
            payload={"empresa_nombre": self.get_display_name(db_obj), "nombre_legal": db_obj.nombre},
        )
        return db_obj

    def update_empresa(self, db: Session, empresa_id: int, empresa_in: EmpresaUpdate, current_user: Usuario) -> Empresa:
        db_obj = self.get_empresa(db, empresa_id)
        
        # Validación de permisos
        if current_user.rol.lower() != "superadministrador":
            if current_user.rol.lower() != "administrador" and current_user.empresa_id != empresa_id:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="No tiene permisos para modificar esta empresa"
                )
        
        update_data = empresa_in.model_dump(exclude_unset=True)
        if "ruc" in update_data or "nombre" in update_data:
            raise HTTPException(status_code=409, detail="El RUC y la razón social fiscal no son editables manualmente.")
        if update_data.get("activa") is True and getattr(db_obj, "lifecycle_status", "active") == "baja_purgada":
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="La empresa esta dada de baja y purgada. Cargue y restaure una copia validada antes de activarla.",
            )
        effective_country = update_data.get("pais", db_obj.pais)
        if "telefono" in update_data and update_data["telefono"]:
            if not is_valid_phone(update_data["telefono"]):
                raise HTTPException(status_code=400, detail="El teléfono principal debe tener un formato válido.")
            update_data["telefono"] = normalize_phone(update_data["telefono"], effective_country)
        if "contacto_telefono" in update_data and update_data["contacto_telefono"]:
            if not is_valid_phone(update_data["contacto_telefono"]):
                raise HTTPException(status_code=400, detail="El teléfono del contacto debe tener un formato válido.")
            update_data["contacto_telefono"] = normalize_phone(update_data["contacto_telefono"], effective_country)
        
        # Restricciones para Administradores (no Superadmins)
        if current_user.rol.lower() != "superadministrador":
            forbidden_fields = [
                "limite_administradores",
                "limite_usuarios",
                "license_start_date",
                "license_end_date",
                "activa",
                "session_timeout_minutes",
                "marketplace_can_sell",
                "lifecycle_status",
                "baja_purged_at",
                "baja_backup_hash",
                "baja_backup_manifest",
                "baja_purged_counts",
                "baja_requested_by_email",
                "baja_recovery_required",
            ]
            for field in forbidden_fields:
                if field in update_data:
                    del update_data[field]

        validate_license_window(update_data.get("license_start_date"), update_data.get("license_end_date"))
        validate_company_limits_against_usage(db_obj, update_data)

        updated_obj = empresa_repo.update(db, db_obj=db_obj, obj_in=EmpresaUpdate(**update_data))

        if update_data:
            record_audit_event(
                db,
                module="empresas",
                event_type="empresa_updated",
                severity="warning" if current_user.rol.lower() == "superadministrador" else "info",
                actor=current_user,
                empresa_id=updated_obj.id,
                target_empresa_id=updated_obj.id,
                entity_type="empresa",
                entity_id=updated_obj.id,
                message=f"Empresa actualizada: {self.get_display_name(updated_obj)}",
                payload={"fields": sorted(update_data.keys())},
            )
        return updated_obj

    def delete_empresa(self, db: Session, empresa_id: int, current_user: Usuario) -> None:
        self.get_empresa(db, empresa_id)
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=(
                "La eliminacion fisica de empresas esta bloqueada. Use SaaS > Empresas > Baja purgada "
                "con copia de seguridad validada para liberar almacenamiento y conservar la ficha minima."
            ),
        )

    def update_logo(self, db: Session, empresa_id: int, logo_url: str, current_user: Usuario) -> Empresa:
        db_obj = self.get_empresa(db, empresa_id)
        
        # Validación de permisos (ya hecha en el endpoint pero reforzada aquí)
        if current_user.rol.lower() != "superadministrador":
            if current_user.rol.lower() != "administrador" or current_user.empresa_id != empresa_id:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="No tiene permisos para modificar el logo de esta empresa"
                )
        
        db_obj.logo_url = logo_url
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

empresa_service = EmpresaService()
