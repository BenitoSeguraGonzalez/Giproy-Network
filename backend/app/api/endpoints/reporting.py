from typing import Optional
import io
import threading
from fastapi import APIRouter, Depends, Query, HTTPException, BackgroundTasks
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from app.api.deps import get_db, get_current_user
from app.core.database import SessionLocal
from app.models.usuario import Usuario
from app.services.license import license_service
from app.services.reporting import reporting_service
from app.schemas.reporting import ReportPreviewRequest, ReportExportRequest
import urllib.parse

router = APIRouter()
_warm_exports_lock = threading.Lock()
_warm_exports_inflight: set[tuple] = set()


def _sanitize_filename_part(value: Optional[str], fallback: str = "Documento") -> str:
    sanitized = str(value or "").replace("\n", " ").replace("\r", " ")
    sanitized = sanitized.translate(str.maketrans({ch: " " for ch in '<>:"/\\|?*'}))
    sanitized = " ".join(sanitized.split()).strip()
    return sanitized or fallback


def _normalize_revision_token(revision: Optional[int]) -> str:
    try:
        numeric = int(revision or 0)
    except (TypeError, ValueError):
        numeric = 0
    return f"{max(numeric, 0):03d}"


def _build_report_filename(report_label: str, context_label: str, revision: Optional[int], extension: str) -> str:
    label = _sanitize_filename_part(report_label, "Reporte")
    context = _sanitize_filename_part(context_label, "Documento")
    ext = str(extension or "xlsx").replace(".", "").strip() or "xlsx"
    return f"{label} - {context} R{_normalize_revision_token(revision)}.{ext}"


def _build_content_disposition(filename: str) -> str:
    safe_ascii = _sanitize_filename_part(filename, "Documento")
    quoted_utf8 = urllib.parse.quote(filename)
    return f"attachment; filename=\"{safe_ascii}\"; filename*=UTF-8''{quoted_utf8}"


def _resolve_presupuesto_download_meta(db: Session, presupuesto_id: int, empresa_id: int) -> tuple[str, int]:
    from app.models.presupuesto import Presupuesto

    presupuesto = (
        db.query(Presupuesto)
        .filter(Presupuesto.id == presupuesto_id, Presupuesto.empresa_id == empresa_id)
        .first()
    )
    proyecto = getattr(presupuesto, "proyecto", None) if presupuesto else None
    context = getattr(proyecto, "nombre", None) or getattr(presupuesto, "descripcion", None) or f"Presupuesto {presupuesto_id}"
    revision = getattr(presupuesto, "revision", None) if presupuesto else None
    return context, revision


def _resolve_apu_download_meta(db: Session, apu_id: int, empresa_id: int) -> tuple[str, int]:
    from app.models.apu import APU

    apu = db.query(APU).filter(APU.id == apu_id, APU.empresa_id == empresa_id).first()
    context = getattr(apu, "codigo", None) or getattr(apu, "descripcion", None) or f"APU {apu_id}"
    revision = getattr(apu, "revision", None) if apu else None
    return context, revision


def _resolve_edt_download_meta(db: Session, proyecto_id: int, empresa_id: int) -> tuple[str, int]:
    from app.models.proyecto import Proyecto

    proyecto = db.query(Proyecto).filter(Proyecto.id == proyecto_id, Proyecto.empresa_id == empresa_id).first()
    context = getattr(proyecto, "nombre", None) or f"Proyecto {proyecto_id}"
    revision = getattr(proyecto, "revision", None) if proyecto else None
    return context, revision


def _resolve_edo_download_meta(db: Session, proyecto_id: int, empresa_id: int) -> tuple[str, int]:
    return _resolve_edt_download_meta(db, proyecto_id, empresa_id)


def _resolve_project_download_meta(db: Session, proyecto_id: int, empresa_id: int) -> tuple[str, int]:
    from app.models.proyecto import Proyecto

    proyecto = db.query(Proyecto).filter(Proyecto.id == proyecto_id, Proyecto.empresa_id == empresa_id).first()
    context = getattr(proyecto, "nombre", None) or f"Proyecto {proyecto_id}"
    revision = getattr(proyecto, "revision", None) if proyecto else None
    return context, revision

def _resolve_target_empresa_id(current_user: Usuario, empresa_id: Optional[int]) -> int:
    target_empresa_id = current_user.empresa_id
    if current_user.rol.lower() == "superadministrador" and empresa_id:
        target_empresa_id = empresa_id
    return target_empresa_id


def _build_export_response_parts(
    payload: ReportExportRequest,
    db: Session,
    target_empresa_id: int,
) -> tuple[io.BytesIO, str, str]:
    template_id = payload.template_id or "001"
    cache_key = reporting_service._build_report_export_cache_key(
        db,
        payload.report_type,
        payload.entity_ids,
        target_empresa_id,
        template_id,
        payload.variant,
        payload.format,
    )
    cached_payload = reporting_service.get_cached_report_export(cache_key)

    def _generate_xlsx_buffer_only() -> io.BytesIO:
        if payload.report_type == "apu":
            return reporting_service.generate_apu_report_bundle(
                db,
                payload.entity_ids,
                target_empresa_id,
                template_id
            )
        if payload.report_type == "presupuesto":
            if payload.variant == "indirectos":
                return reporting_service.generate_presupuesto_indirectos_report(
                    db,
                    payload.entity_ids[0],
                    target_empresa_id,
                    template_id
                )
            if payload.variant == "with_apus":
                return reporting_service.generate_presupuesto_report_bundle(
                    db,
                    payload.entity_ids[0],
                    target_empresa_id,
                    template_id
                )
            return reporting_service.generate_presupuesto_report(
                db,
                payload.entity_ids[0],
                target_empresa_id,
                template_id
            )
        if payload.report_type == "edt":
            return reporting_service.generate_edt_report(db, payload.entity_ids[0], target_empresa_id, payload.variant or "listado")
        if payload.report_type == "edo":
            return reporting_service.generate_edo_report(db, payload.entity_ids[0], target_empresa_id)
        if payload.report_type == "vae":
            return reporting_service.generate_vae_report(db, payload.entity_ids[0], target_empresa_id, template_id)
        if payload.report_type == "polinomica":
            return reporting_service.generate_polinomica_report(db, payload.entity_ids[0], target_empresa_id, template_id)
        if payload.report_type == "cronograma_valorado":
            return reporting_service.generate_cronograma_valorado_report(db, payload.entity_ids[0], target_empresa_id, template_id, payload.variant)
        if payload.report_type == "acta_constitucion":
            return reporting_service.generate_acta_constitucion_report(db, payload.entity_ids[0], target_empresa_id, template_id)
        if payload.report_type == "stakeholders":
            return reporting_service.generate_stakeholders_report(db, payload.entity_ids[0], target_empresa_id, template_id)
        raise ValueError(f"Tipo de reporte no soportado: {payload.report_type}")

    if payload.format in {"pdf", "pdf_excel"}:
        if payload.report_type == "presupuesto":
            context, revision = _resolve_presupuesto_download_meta(db, payload.entity_ids[0], target_empresa_id)
            report_label = "Indirectos del Presupuesto" if payload.variant == "indirectos" else "Presupuesto"
            filename = _build_report_filename(report_label, context, revision, "pdf")
        elif payload.report_type == "acta_constitucion":
            context, revision = _resolve_project_download_meta(db, payload.entity_ids[0], target_empresa_id)
            filename = _build_report_filename("Acta de Constitucion del Proyecto", context, revision, "pdf")
        elif payload.report_type == "stakeholders":
            context, revision = _resolve_project_download_meta(db, payload.entity_ids[0], target_empresa_id)
            filename = _build_report_filename("Equipo del Proyecto (Stakeholders)", context, revision, "pdf")
        elif payload.report_type == "apu":
            if len(payload.entity_ids) > 1:
                context = _sanitize_filename_part("Base de Trabajo", "Base de Trabajo")
                revision = 1
                filename = _build_report_filename("APUs", context, revision, "pdf")
            else:
                context, revision = _resolve_apu_download_meta(db, payload.entity_ids[0], target_empresa_id)
                filename = _build_report_filename("APU", context, revision, "pdf")
        elif payload.report_type == "edt":
            context, revision = _resolve_edt_download_meta(db, payload.entity_ids[0], target_empresa_id)
            filename = _build_report_filename(f"EDT {str(payload.variant or 'listado').upper()}", context, revision, "pdf")
        elif payload.report_type == "edo":
            context, revision = _resolve_edo_download_meta(db, payload.entity_ids[0], target_empresa_id)
            filename = _build_report_filename("EDO", context, revision, "pdf")
        elif payload.report_type == "vae":
            context, revision = _resolve_presupuesto_download_meta(db, payload.entity_ids[0], target_empresa_id)
            filename = _build_report_filename("VAE", context, revision, "pdf")
        elif payload.report_type == "polinomica":
            context, revision = _resolve_presupuesto_download_meta(db, payload.entity_ids[0], target_empresa_id)
            filename = _build_report_filename("Formula Polinomica", context, revision, "pdf")
        elif payload.report_type == "cronograma_valorado":
            context, revision = _resolve_presupuesto_download_meta(db, payload.entity_ids[0], target_empresa_id)
            report_label = "Cronograma Valorado"
            if payload.variant in {"gantt", "cash_flow", "flujo_caja", "caja", "integrado", "pareto"}:
                report_label = {
                    "gantt": "Cronograma Gantt",
                    "cash_flow": "Flujo de Caja",
                    "flujo_caja": "Flujo de Caja",
                    "caja": "Flujo de Caja",
                    "integrado": "Cronograma Integrado",
                    "pareto": "Pareto Temporal",
                }.get(payload.variant, report_label)
            filename = _build_report_filename(report_label, context, revision, "pdf")
        else:
            suffix = payload.variant or payload.report_type
            filename = _build_report_filename(str(suffix).upper(), "Documento", 1, "pdf")
        media_type = "application/pdf"
    else:
        if payload.report_type == "apu":
            if len(payload.entity_ids) > 1:
                filename = _build_report_filename("APUs", "Base de Trabajo", 1, "xlsx")
            else:
                context, revision = _resolve_apu_download_meta(db, payload.entity_ids[0], target_empresa_id)
                filename = _build_report_filename("APU", context, revision, "xlsx")
        elif payload.report_type == "acta_constitucion":
            context, revision = _resolve_project_download_meta(db, payload.entity_ids[0], target_empresa_id)
            filename = _build_report_filename("Acta de Constitucion del Proyecto", context, revision, "xlsx")
        elif payload.report_type == "stakeholders":
            context, revision = _resolve_project_download_meta(db, payload.entity_ids[0], target_empresa_id)
            filename = _build_report_filename("Equipo del Proyecto (Stakeholders)", context, revision, "xlsx")
        elif payload.report_type == "presupuesto":
            context, revision = _resolve_presupuesto_download_meta(db, payload.entity_ids[0], target_empresa_id)
            report_label = "Indirectos del Presupuesto" if payload.variant == "indirectos" else "Presupuesto"
            filename = _build_report_filename(report_label, context, revision, "xlsx")
        elif payload.report_type == "edt":
            context, revision = _resolve_edt_download_meta(db, payload.entity_ids[0], target_empresa_id)
            filename = _build_report_filename(f"EDT {str(payload.variant or 'listado').upper()}", context, revision, "xlsx")
        elif payload.report_type == "edo":
            context, revision = _resolve_edo_download_meta(db, payload.entity_ids[0], target_empresa_id)
            filename = _build_report_filename("EDO", context, revision, "xlsx")
        elif payload.report_type == "vae":
            context, revision = _resolve_presupuesto_download_meta(db, payload.entity_ids[0], target_empresa_id)
            filename = _build_report_filename("VAE", context, revision, "xlsx")
        elif payload.report_type == "polinomica":
            context, revision = _resolve_presupuesto_download_meta(db, payload.entity_ids[0], target_empresa_id)
            filename = _build_report_filename("Formula Polinomica", context, revision, "xlsx")
        elif payload.report_type == "cronograma_valorado":
            context, revision = _resolve_presupuesto_download_meta(db, payload.entity_ids[0], target_empresa_id)
            report_label = "Cronograma Valorado"
            if payload.variant in {"gantt", "cash_flow", "flujo_caja", "caja", "integrado", "pareto"}:
                report_label = {
                    "gantt": "Cronograma Gantt",
                    "cash_flow": "Flujo de Caja",
                    "flujo_caja": "Flujo de Caja",
                    "caja": "Flujo de Caja",
                    "integrado": "Cronograma Integrado",
                    "pareto": "Pareto Temporal",
                }.get(payload.variant, report_label)
            filename = _build_report_filename(report_label, context, revision, "xlsx")
        else:
            raise ValueError(f"Tipo de reporte no soportado: {payload.report_type}")
        media_type = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"

    if cached_payload is not None:
        return io.BytesIO(cached_payload), media_type, filename

    if payload.format == "pdf":
        file_buffer = reporting_service.generate_preview_pdf(
            db,
            payload.report_type,
            payload.entity_ids,
            target_empresa_id,
            template_id,
            payload.variant
        )
    elif payload.format == "pdf_excel":
        xlsx_cache_key = reporting_service._build_report_export_cache_key(
            db,
            payload.report_type,
            payload.entity_ids,
            target_empresa_id,
            template_id,
            payload.variant,
            "xlsx",
        )
        cached_xlsx_payload = reporting_service.get_cached_report_export(xlsx_cache_key)
        if cached_xlsx_payload is not None:
            xlsx_buffer = io.BytesIO(cached_xlsx_payload)
        else:
            xlsx_buffer = _generate_xlsx_buffer_only()
            reporting_service.set_cached_report_export(xlsx_cache_key, xlsx_buffer.getvalue())
        file_buffer = reporting_service._convert_excel_buffer_to_pdf(xlsx_buffer)
    else:
        file_buffer = _generate_xlsx_buffer_only()

    payload_bytes = file_buffer.getvalue()
    reporting_service.set_cached_report_export(cache_key, payload_bytes)
    return io.BytesIO(payload_bytes), media_type, filename


def _warm_report_exports_task(
    payload_data: dict,
    target_empresa_id: int,
    export_formats: tuple[str, ...] = ("xlsx", "pdf"),
) -> None:
    db = SessionLocal()
    try:
        for export_format in export_formats:
            warm_payload = ReportExportRequest(**{**payload_data, "format": export_format})
            _build_export_response_parts(warm_payload, db, target_empresa_id)
    except Exception:
        return
    finally:
        db.close()


def _build_warm_exports_key(payload_data: dict, target_empresa_id: int, export_formats: tuple[str, ...]) -> tuple:
    return (
        int(target_empresa_id),
        str(payload_data.get("report_type") or ""),
        tuple(int(entity_id) for entity_id in (payload_data.get("entity_ids") or [])),
        str(payload_data.get("template_id") or "001"),
        str(payload_data.get("variant") or ""),
        tuple(export_formats),
        reporting_service.REPORT_EXPORT_RENDER_VERSION,
    )


def _schedule_detached_warm_report_exports(
    payload_data: dict,
    target_empresa_id: int,
    export_formats: tuple[str, ...],
) -> None:
    warm_key = _build_warm_exports_key(payload_data, target_empresa_id, export_formats)
    with _warm_exports_lock:
        if warm_key in _warm_exports_inflight:
            return
        _warm_exports_inflight.add(warm_key)

    def _runner() -> None:
        try:
            _warm_report_exports_task(payload_data, target_empresa_id, export_formats)
        finally:
            with _warm_exports_lock:
                _warm_exports_inflight.discard(warm_key)

    threading.Thread(target=_runner, name="giproy-report-warmup", daemon=True).start()


def _payload_to_dict(payload: ReportPreviewRequest) -> dict:
    if hasattr(payload, "model_dump"):
        return payload.model_dump()
    return payload.dict()

@router.post("/preview")
def preview_report(
    payload: ReportPreviewRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
    empresa_id: Optional[int] = Query(None),
):
    try:
        target_empresa_id = _resolve_target_empresa_id(current_user, empresa_id)
        preview = reporting_service.preview_report(
            db,
            payload.report_type,
            payload.entity_ids,
            target_empresa_id,
            payload.template_id or "001",
            payload.variant
        )
        payload_data = _payload_to_dict(payload)
        should_warm_exports = payload.report_type in {"presupuesto", "apu", "vae", "polinomica", "edo", "edt", "stakeholders", "cronograma_valorado"}
        if payload.report_type == "presupuesto" and payload.variant == "with_apus":
            _schedule_detached_warm_report_exports(
                payload_data,
                target_empresa_id,
                ("xlsx",),
            )
        elif should_warm_exports:
            background_tasks.add_task(
                _warm_report_exports_task,
                payload_data,
                target_empresa_id,
            )
        return preview
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/export")
def export_report(
    payload: ReportExportRequest,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
    empresa_id: Optional[int] = Query(None),
):
    try:
        target_empresa_id = _resolve_target_empresa_id(current_user, empresa_id)
        license_service.ensure_commercial_exports_allowed(db, target_empresa_id)
        file_buffer, media_type, filename = _build_export_response_parts(payload, db, target_empresa_id)

        return StreamingResponse(
            file_buffer,
            media_type=media_type,
            headers={
                "Content-Disposition": _build_content_disposition(filename),
                "X-GiProy-Report-Render-Version": reporting_service.REPORT_EXPORT_RENDER_VERSION,
            }
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/apu/{apu_id}")
def get_apu_report(
    apu_id: int,
    template_id: str = Query("001"),
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    """Genera un reporte profesional de APU usando plantillas Excel."""
    try:
        license_service.ensure_commercial_exports_allowed(db, current_user.empresa_id)
        file_buffer = reporting_service.generate_apu_report(db, apu_id, current_user.empresa_id, template_id)
        context, revision = _resolve_apu_download_meta(db, apu_id, current_user.empresa_id)
        filename = _build_report_filename("APU", context, revision, "xlsx")
        return StreamingResponse(
            file_buffer,
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            headers={"Content-Disposition": _build_content_disposition(filename)}
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/presupuesto/{presupuesto_id}")
def get_presupuesto_report(
    presupuesto_id: int,
    template_id: str = Query("001"),
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
    empresa_id: Optional[int] = Query(None),
):
    """Genera un reporte profesional de Presupuesto usando plantillas Excel."""
    try:
        target_empresa_id = _resolve_target_empresa_id(current_user, empresa_id)
        license_service.ensure_commercial_exports_allowed(db, target_empresa_id)
        file_buffer = reporting_service.generate_presupuesto_report(db, presupuesto_id, target_empresa_id, template_id)
        context, revision = _resolve_presupuesto_download_meta(db, presupuesto_id, target_empresa_id)
        filename = _build_report_filename("Presupuesto", context, revision, "xlsx")
        return StreamingResponse(
            file_buffer,
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            headers={"Content-Disposition": _build_content_disposition(filename)}
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/edt/{proyecto_id}")
def get_edt_report(
    proyecto_id: int,
    report_type: str = Query("listado"),
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
    empresa_id: Optional[int] = Query(None),
):
    """Genera reportes profesionales de EDT (Listado, Diccionario, Valorada)."""
    try:
        target_empresa_id = _resolve_target_empresa_id(current_user, empresa_id)
        license_service.ensure_commercial_exports_allowed(db, target_empresa_id)
        file_buffer = reporting_service.generate_edt_report(db, proyecto_id, target_empresa_id, report_type)
        context, revision = _resolve_edt_download_meta(db, proyecto_id, target_empresa_id)
        filename = _build_report_filename(f"EDT {str(report_type).upper()}", context, revision, "xlsx")
        return StreamingResponse(
            file_buffer,
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            headers={"Content-Disposition": _build_content_disposition(filename)}
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/vae/{presupuesto_id}")
def get_vae_report(
    presupuesto_id: int,
    template_id: str = Query("001"),
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
    empresa_id: Optional[int] = Query(None),
):
    """Genera un reporte profesional de VAE usando plantillas Excel."""
    try:
        target_empresa_id = _resolve_target_empresa_id(current_user, empresa_id)
        license_service.ensure_commercial_exports_allowed(db, target_empresa_id)
        file_buffer = reporting_service.generate_vae_report(db, presupuesto_id, target_empresa_id, template_id)
        context, revision = _resolve_presupuesto_download_meta(db, presupuesto_id, target_empresa_id)
        filename = _build_report_filename("VAE", context, revision, "xlsx")
        return StreamingResponse(
            file_buffer,
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            headers={"Content-Disposition": _build_content_disposition(filename)}
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/polinomica/{presupuesto_id}")
def get_polinomica_report(
    presupuesto_id: int,
    template_id: str = Query("001"),
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
    empresa_id: Optional[int] = Query(None),
):
    """Genera un reporte profesional de Fórmula Polinómica usando plantillas Excel."""
    try:
        target_empresa_id = _resolve_target_empresa_id(current_user, empresa_id)
        license_service.ensure_commercial_exports_allowed(db, target_empresa_id)
        file_buffer = reporting_service.generate_polinomica_report(db, presupuesto_id, target_empresa_id, template_id)
        context, revision = _resolve_presupuesto_download_meta(db, presupuesto_id, target_empresa_id)
        filename = _build_report_filename("Formula Polinomica", context, revision, "xlsx")
        return StreamingResponse(
            file_buffer,
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            headers={"Content-Disposition": _build_content_disposition(filename)}
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
