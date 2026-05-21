from typing import Optional

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.deps import get_current_active_user, get_db
from app.models.usuario import Usuario
from app.services.bim.feature_flags import resolve_bim_feature_access

router = APIRouter()


@router.get("/feature-flags/me")
def get_bim_feature_flags(
    empresa_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user),
):
    resolved_company_id = current_user.empresa_id
    if current_user.rol.lower() == "superadministrador" and empresa_id:
        resolved_company_id = empresa_id

    access = resolve_bim_feature_access(
        db=db,
        user_id=current_user.id,
        company_id=resolved_company_id,
        role=current_user.rol,
    )
    return access.to_dict()
