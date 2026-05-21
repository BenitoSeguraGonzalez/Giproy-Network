from __future__ import annotations

from typing import Any

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status

from app.api.deps import get_current_user
from app.models.usuario import Usuario
from app.services.public_procurement_import_profile_engine import public_procurement_import_profile_engine
from app.services.public_procurement_technical_analysis import public_procurement_technical_analysis_service

router = APIRouter()


def check_superadmin(current_user: Usuario = Depends(get_current_user)) -> Usuario:
    if str(current_user.rol or "").strip().lower() != "superadministrador":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Operacion permitida solo para Superadministradores.",
        )
    return current_user


@router.get("/")
def list_import_models(
    include_inactive: bool = True,
    current_user: Usuario = Depends(check_superadmin),
):
    return {
        "items": public_procurement_import_profile_engine.list_profiles(include_inactive=include_inactive),
    }


@router.get("/{profile_id}")
def get_import_model(
    profile_id: str,
    current_user: Usuario = Depends(check_superadmin),
):
    return public_procurement_import_profile_engine.get_profile(profile_id)


@router.put("/{profile_id}")
def save_import_model(
    profile_id: str,
    payload: dict[str, Any],
    current_user: Usuario = Depends(check_superadmin),
):
    normalized_payload = dict(payload or {})
    normalized_payload["id"] = profile_id
    return public_procurement_import_profile_engine.save_profile(normalized_payload)


@router.post("/{profile_id}/clone")
def clone_import_model(
    profile_id: str,
    payload: dict[str, Any] | None = None,
    current_user: Usuario = Depends(check_superadmin),
):
    return public_procurement_import_profile_engine.clone_profile(profile_id, payload or {})


@router.post("/{profile_id}/activate")
def activate_import_model(
    profile_id: str,
    current_user: Usuario = Depends(check_superadmin),
):
    return public_procurement_import_profile_engine.set_profile_status(profile_id, "active")


@router.post("/{profile_id}/deactivate")
def deactivate_import_model(
    profile_id: str,
    current_user: Usuario = Depends(check_superadmin),
):
    return public_procurement_import_profile_engine.set_profile_status(profile_id, "inactive")


@router.post("/autocreate-preview")
async def autocreate_import_model_preview(
    file: UploadFile = File(...),
    desired_name: str | None = Form(None),
    current_user: Usuario = Depends(check_superadmin),
):
    payload = await file.read()
    filename = file.filename or "modelo.pdf"
    analysis = public_procurement_technical_analysis_service.analyze_uploads(
        [(filename, payload)],
        include_parser_contract=True,
    )
    draft = public_procurement_import_profile_engine.propose_profile_from_analysis(
        analysis,
        desired_name=desired_name,
    )
    return {
        "draft": draft,
        "analysis_summary": analysis.get("summary") or {},
        "technical_import_contract": analysis.get("technical_import_contract") or {},
        "diagnostics": (analysis.get("import_model") or {}).get("diagnostics") or {},
    }
