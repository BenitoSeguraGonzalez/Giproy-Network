import os
import mimetypes
import math
import re
import unicodedata
from pathlib import Path
import uuid
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timezone
from typing import Any, Optional
import httpx
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status, Query
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from sqlalchemy import or_
from app.api import deps
from app.schemas.proyecto_detalle import (
    ProyectoDetalleCreate,
    ProyectoDetalleUpdate,
    ProyectoDetalleResponse,
    ProyectoDocumentoResponse,
    ProyectoGeocodeRequest,
    ProyectoGeocodeResponse,
)
from app.schemas.cronograma_trabajo import CronogramaTrabajoUpdate
from app.repositories.proyecto_detalle import proyecto_detalle_repo
from app.repositories.presupuesto import presupuesto_repo
from app.models.usuario import Usuario
from app.models.proyecto import Proyecto
from app.models.proyecto_documento import ProyectoDocumento
from app.models.proyecto_detalle import ProyectoDetalle
from app.models.presupuesto import Presupuesto
from app.core.database import SessionLocal
from app.services.reporting import reporting_service
from app.services.cronograma_trabajo import cronograma_trabajo_service
from app.services.audit_event import record_audit_event

router = APIRouter()

GEOCODE_USER_AGENT = "GiProy-Network/1.0 proyecto-detalles-geocoder"
_GEOREF_MAP_EXECUTOR = ThreadPoolExecutor(max_workers=1, thread_name_prefix="giproy-georef")
GEOCODE_ACCENT_ALIASES = (
    ("simon", "Simón"),
    ("bolivar", "Bolívar"),
    ("velez", "Vélez"),
    ("america", "América"),
    ("espana", "España"),
    ("colon", "Colón"),
    ("ordonez", "Ordóñez"),
    ("ordónez", "Ordóñez"),
    ("republica", "República"),
    ("mexico", "México"),
    ("panama", "Panamá"),
    ("peru", "Perú"),
    ("rio", "Río"),
    ("jeronimo", "Jerónimo"),
    ("jose", "José"),
    ("maria", "María"),
    ("arizaga", "Arízaga"),
    ("martin", "Martín"),
    ("antonio", "Antonio"),
)


def _refresh_project_georef_map_cache_background(detail_id: int, empresa_id: int) -> None:
    """Genera el mapa fuera de la respuesta HTTP y con una sesión independiente."""
    db = SessionLocal()
    try:
        detail = (
            db.query(ProyectoDetalle)
            .filter(
                ProyectoDetalle.id == detail_id,
                ProyectoDetalle.empresa_id == empresa_id,
            )
            .first()
        )
        if detail:
            reporting_service.refresh_project_georef_map_cache(db, detail, empresa_id)
    finally:
        db.close()


def _queue_project_georef_map_refresh(
    db: Session,
    detail: ProyectoDetalle,
    empresa_id: int,
) -> None:
    """Marca una regeneración una sola vez y libera inmediatamente la petición."""
    signature = reporting_service._build_project_georef_signature(detail)
    if not signature:
        return
    stored_signature = str(getattr(detail, "georef_map_signature", "") or "")
    stored_status = str(getattr(detail, "georef_map_status", "") or "")
    cached_payload = reporting_service._get_project_cached_georef_map_bytes(detail)
    if stored_status == "ready" and stored_signature == signature and cached_payload:
        return
    if stored_status == "pending" and stored_signature == signature:
        return

    detail.georef_map_status = "pending"
    detail.georef_map_signature = signature
    detail.georef_map_error = None
    db.add(detail)
    db.commit()
    db.refresh(detail)
    _GEOREF_MAP_EXECUTOR.submit(
        _refresh_project_georef_map_cache_background,
        int(detail.id),
        int(empresa_id),
    )


OVERPASS_INTERSECTION_URL = "https://overpass-api.de/api/interpreter"


def _resolve_target_empresa_id(current_user: Usuario, empresa_id: Optional[int]) -> int:
    if current_user.rol.lower() == "superadministrador" and empresa_id:
        return empresa_id
    return current_user.empresa_id


def _project_exists_for_root(db: Session, codigo_root: str, empresa_id: int) -> bool:
    return (
        db.query(Proyecto.id)
        .filter(
            Proyecto.empresa_id == empresa_id,
            or_(Proyecto.codigo_root == codigo_root, Proyecto.codigo == codigo_root),
        )
        .first()
        is not None
    )


def _project_for_root(db: Session, codigo_root: str, empresa_id: int) -> Proyecto | None:
    return db.query(Proyecto).filter(
        Proyecto.empresa_id == empresa_id,
        or_(Proyecto.codigo_root == codigo_root, Proyecto.codigo == codigo_root),
    ).order_by(Proyecto.revision.desc()).first()


def _audit_project_detail(db: Session, *, project: Proyecto, actor: Usuario, event_type: str, message: str, entity_type: str, entity_id, operation_status: str = "applied", payload: dict | None = None):
    return record_audit_event(db, module="proyecto", event_type=event_type, message=message, actor=actor, empresa_id=project.empresa_id, proyecto_id=project.id, proyecto_codigo_root=project.codigo_root, proyecto_revision=project.revision, entity_type=entity_type, entity_id=entity_id, operation_status=operation_status, payload=payload or {})


def _resolve_project_upload_path(raw_path: str) -> Path:
    normalized = str(raw_path or "").strip().replace("\\", "/")
    if normalized.startswith("/"):
        normalized = normalized[1:]
    if not normalized.startswith("uploads/proyectos/"):
        raise HTTPException(status_code=400, detail="Ruta de imagen no permitida.")

    relative_path = Path(normalized)
    if relative_path.is_absolute():
        candidates = [relative_path]
    else:
        backend_root = Path(__file__).resolve().parents[3]
        repo_root = backend_root.parent
        candidates = [
            Path.cwd() / relative_path,
            backend_root / relative_path,
            repo_root / relative_path,
        ]

    for candidate in candidates:
        if candidate.exists() and candidate.is_file():
            return candidate

    raise HTTPException(status_code=404, detail="Imagen no encontrada.")


def _project_image_file_response(raw_path: str) -> FileResponse:
    absolute_path = _resolve_project_upload_path(raw_path)
    media_type, _ = mimetypes.guess_type(str(absolute_path))
    return FileResponse(str(absolute_path), media_type=media_type or "application/octet-stream")


def _sanitize_upload_filename(filename: str) -> str:
    raw_name = Path(filename or "documento.pdf").name.strip() or "documento.pdf"
    safe_name = "".join(char if char.isalnum() or char in (" ", ".", "_", "-") else "_" for char in raw_name)
    return safe_name[:180] or "documento.pdf"


def _ensure_project_document_access(db: Session, codigo_root: str, empresa_id: int) -> None:
    if not _project_exists_for_root(db, codigo_root, empresa_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Proyecto no encontrado o acceso denegado.")


def _join_query_parts(parts: list[Optional[str]]) -> str:
    return ", ".join(str(part or "").strip() for part in parts if str(part or "").strip())


def _unique_query_parts(parts: list[Optional[str]]) -> list[str]:
    seen = set()
    unique_parts: list[str] = []
    for part in parts:
        normalized = _normalize_geocode_text(part)
        if not normalized:
            continue
        key = normalized.casefold()
        if key in seen:
            continue
        seen.add(key)
        unique_parts.append(normalized)
    return unique_parts


def _normalize_geocode_text(value: Optional[str]) -> str:
    return re.sub(r"\s+", " ", str(value or "").strip())


def _strip_geocode_diacritics(value: str) -> str:
    return "".join(
        char for char in unicodedata.normalize("NFD", value)
        if unicodedata.category(char) != "Mn"
    )


def _apply_geocode_accent_aliases(value: str) -> str:
    updated = value
    for raw_word, accented_word in GEOCODE_ACCENT_ALIASES:
        updated = re.sub(rf"\b{re.escape(raw_word)}\b", accented_word, updated, flags=re.IGNORECASE)
    return _normalize_geocode_text(updated)


def _expand_geocode_query_variants(query: str) -> list[str]:
    normalized = _normalize_geocode_text(query)
    variants: list[str] = []

    for candidate in (
        normalized,
        _strip_geocode_diacritics(normalized),
        _apply_geocode_accent_aliases(normalized),
        _apply_geocode_accent_aliases(_strip_geocode_diacritics(normalized)),
    ):
        cleaned = _normalize_geocode_text(candidate)
        if cleaned and cleaned not in variants:
            variants.append(cleaned)

    return variants


def _geocode_match_key(value: Optional[str]) -> str:
    return _strip_geocode_diacritics(_normalize_geocode_text(value)).casefold()


def _geocode_required_terms(*streets: str) -> list[str]:
    terms: list[str] = []
    for street in streets:
        for token in re.findall(r"[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]+", _geocode_match_key(street)):
            if len(token) < 3 or token in {"calle", "avenida", "av", "via", "pasaje"}:
                continue
            if token not in terms:
                terms.append(token)
    return terms


def _geocode_match_satisfies_required_terms(match: dict[str, Any], required_terms: Optional[list[str]]) -> bool:
    if not required_terms:
        return True
    display_name = _geocode_match_key(match.get("display_name"))
    address = match.get("address") or {}
    address_blob = _geocode_match_key(" ".join(str(value or "") for value in address.values()))
    searchable = f"{display_name} {address_blob}"
    return all(term in searchable for term in required_terms)


def _overpass_street_regex(street: str) -> str:
    escaped = re.escape(_normalize_geocode_text(street))
    replacements = {
        "a": "[aá]",
        "e": "[eé]",
        "i": "[ií]",
        "o": "[oó]",
        "u": "[uúü]",
        "n": "[nñ]",
        "A": "[AÁ]",
        "E": "[EÉ]",
        "I": "[IÍ]",
        "O": "[OÓ]",
        "U": "[UÚÜ]",
        "N": "[NÑ]",
    }
    return "".join(replacements.get(char, char) for char in escaped)


def _haversine_meters(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    radius = 6371000.0
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    delta_phi = math.radians(lat2 - lat1)
    delta_lambda = math.radians(lon2 - lon1)
    a = (
        math.sin(delta_phi / 2) ** 2
        + math.cos(phi1) * math.cos(phi2) * math.sin(delta_lambda / 2) ** 2
    )
    return radius * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))


def _street_name_matches(street: str, osm_name: Optional[str]) -> bool:
    street_terms = _geocode_required_terms(street)
    osm_key = _geocode_match_key(osm_name)
    return bool(street_terms) and all(term in osm_key for term in street_terms)


def _nearest_intersection_from_osm_ways(
    first_street: str,
    second_street: str,
    ways: list[dict[str, Any]],
) -> Optional[tuple[float, float, float]]:
    first_geometries: list[list[dict[str, Any]]] = []
    second_geometries: list[list[dict[str, Any]]] = []

    for way in ways:
        if way.get("type") != "way" or not isinstance(way.get("geometry"), list):
            continue
        name = (way.get("tags") or {}).get("name")
        if _street_name_matches(first_street, name):
            first_geometries.append(way["geometry"])
        if _street_name_matches(second_street, name):
            second_geometries.append(way["geometry"])

    best: Optional[tuple[float, float, float]] = None
    for first_geometry in first_geometries:
        for second_geometry in second_geometries:
            for first_point in first_geometry:
                for second_point in second_geometry:
                    lat1 = float(first_point["lat"])
                    lon1 = float(first_point["lon"])
                    lat2 = float(second_point["lat"])
                    lon2 = float(second_point["lon"])
                    distance = _haversine_meters(lat1, lon1, lat2, lon2)
                    if best is None or distance < best[0]:
                        best = (distance, (lat1 + lat2) / 2, (lon1 + lon2) / 2)

    if best and best[0] <= 35:
        return best
    return None


def _geocode_intersection_from_overpass(data: ProyectoGeocodeRequest, intersection: tuple[str, str]) -> Optional[ProyectoGeocodeResponse]:
    if not _is_ecuador_geocode(data):
        return None

    first_street, second_street = intersection
    city = _normalize_geocode_text(data.ciudad or data.canton)
    if not city:
        return None

    first_regex = _overpass_street_regex(first_street)
    second_regex = _overpass_street_regex(second_street)
    city_regex = _overpass_street_regex(city)
    provincia_key = _geocode_match_key(data.provincia)
    city_key = _geocode_match_key(city)
    if city_key == "cuenca" and "azuay" in provincia_key:
        area_selector = "(-3.05,-79.08,-2.80,-78.90)"
        query = f"""
[out:json][timeout:12];
(
  way["highway"]["name"~"{first_regex}",i]{area_selector};
  way["highway"]["name"~"{second_regex}",i]{area_selector};
);
out geom tags;
"""
    else:
        query = f"""
[out:json][timeout:12];
area["ISO3166-1"="EC"][admin_level=2]->.country;
area["boundary"="administrative"]["name"~"^{city_regex}$",i](area.country)->.searchArea;
(
  way["highway"]["name"~"{first_regex}",i](area.searchArea);
  way["highway"]["name"~"{second_regex}",i](area.searchArea);
);
out geom tags;
"""

    try:
        with httpx.Client(timeout=14.0, follow_redirects=True, headers={"User-Agent": GEOCODE_USER_AGENT}) as client:
            response = client.post(OVERPASS_INTERSECTION_URL, data={"data": query})
            response.raise_for_status()
            payload = response.json()
    except (httpx.HTTPError, ValueError):
        return None

    match = _nearest_intersection_from_osm_ways(first_street, second_street, payload.get("elements") or [])
    if not match:
        return None

    _, latitud, longitud = match
    return ProyectoGeocodeResponse(
        latitud=latitud,
        longitud=longitud,
        map_zoom=18,
        message="Intersección localizada desde geometría OSM. Verifica el punto y ajústalo si hace falta.",
        query=_join_query_parts([f"{first_street} y {second_street}", city, data.provincia, data.pais]),
        source="overpass",
        display_name=f"{first_street} y {second_street}, {city}",
    )


def _is_ecuador_geocode(data: ProyectoGeocodeRequest) -> bool:
    return _normalize_geocode_text(data.pais).lower() == "ecuador"


def _split_ecuador_intersection_address(address: str) -> Optional[tuple[str, str]]:
    normalized = _normalize_geocode_text(address)
    if not normalized:
        return None

    explicit_match = re.search(
        r"\b(?:entre|intersecci[oó]n(?:\s+de)?|cruce(?:\s+de)?|esquina(?:\s+de)?)\s+(.+?)\s+(?:y|e|con|&|/)\s+(.+)$",
        normalized,
        flags=re.IGNORECASE,
    )
    if explicit_match:
        first, second = explicit_match.group(1), explicit_match.group(2)
    else:
        parts = re.split(r"\s+(?:y|e|con)\s+|\s*[&/]\s*", normalized, maxsplit=1, flags=re.IGNORECASE)
        if len(parts) != 2:
            return None
        first, second = parts

    first = _normalize_geocode_text(first.strip(" ,.-"))
    second = _normalize_geocode_text(second.strip(" ,.-"))
    if len(first) < 3 or len(second) < 3:
        return None
    return first, second


def _add_geocode_candidate(
    candidates: list[dict[str, Any]],
    key: str,
    query: str,
    zoom: int,
    message: str,
    required_terms: Optional[list[str]] = None,
) -> None:
    if not query:
        return
    for query_variant in _expand_geocode_query_variants(query):
        candidates.append({
            "key": key,
            "query": query_variant,
            "zoom": zoom,
            "message": message,
            "required_terms": required_terms or [],
        })


def _build_geocode_candidates(data: ProyectoGeocodeRequest) -> list[dict[str, Any]]:
    pais = _normalize_geocode_text(data.pais)
    provincia = _normalize_geocode_text(data.provincia)
    canton = _normalize_geocode_text(data.canton)
    ciudad = _normalize_geocode_text(data.ciudad)
    direccion = _normalize_geocode_text(data.direccion)
    location_context = _unique_query_parts([ciudad, canton, provincia, pais])
    location_context_without_city = _unique_query_parts([canton, provincia, pais])

    candidates: list[dict[str, Any]] = []

    if direccion:
        intersection = _split_ecuador_intersection_address(direccion) if _is_ecuador_geocode(data) else None
        required_terms = _geocode_required_terms(*intersection) if intersection else []

        if intersection:
            first_street, second_street = intersection
            for first, second in ((first_street, second_street), (second_street, first_street)):
                for separator in (" y ", " & ", " con ", " / ", ", "):
                    _add_geocode_candidate(
                        candidates,
                        "interseccion",
                        _join_query_parts([f"{first}{separator}{second}", *location_context]),
                        17,
                        "Se buscó como intersección urbana. Verifica la posición y ajusta el punto si hace falta.",
                        required_terms,
                    )

        _add_geocode_candidate(
            candidates,
            "exacta",
            _join_query_parts([direccion, *location_context]),
            16,
            "Ubicación exacta sugerida cargada. Ajusta el punto en el mapa si necesitas más precisión.",
            required_terms,
        )

        _add_geocode_candidate(
            candidates,
            "exacta_legacy",
            _join_query_parts([pais, provincia, canton, ciudad, direccion]),
            16,
            "Ubicación exacta sugerida cargada. Ajusta el punto en el mapa si necesitas más precisión.",
            required_terms,
        )
        if not intersection:
            _add_geocode_candidate(
                candidates,
                "mixta",
                _join_query_parts([direccion, *location_context_without_city]),
                14,
                "Se ubicó una referencia parcial usando cantón y dirección. Verifica la posición y ajústala si hace falta.",
            )

    if not direccion or not (_is_ecuador_geocode(data) and _split_ecuador_intersection_address(direccion)):
        _add_geocode_candidate(
            candidates,
            "urbana",
            _join_query_parts(location_context),
            14,
            "Se ubicó una referencia urbana del sector. Conviene ajustar el punto exacto en el mapa.",
        )
        _add_geocode_candidate(
            candidates,
            "territorial",
            _join_query_parts([canton, provincia, pais]),
            12,
            "Se ubicó una referencia territorial del cantón. Ajusta manualmente el punto exacto.",
        )
        _add_geocode_candidate(
            candidates,
            "regional",
            _join_query_parts([provincia, pais]),
            10,
            "Solo se pudo ubicar una referencia general de la provincia. Ajusta manualmente el punto exacto.",
        )

    seen = set()
    unique_candidates: list[dict[str, Any]] = []
    for candidate in candidates:
        query = candidate.get("query")
        if not query or query in seen:
            continue
        seen.add(query)
        unique_candidates.append(candidate)
    return unique_candidates


def _country_code_for_geocode(country: Optional[str]) -> Optional[str]:
    normalized = (country or "").strip().lower()
    if normalized == "ecuador":
        return "ec"
    if normalized == "colombia":
        return "co"
    if normalized in {"perú", "peru"}:
        return "pe"
    return None


def _load_project_document_or_404(db: Session, document_id: int, empresa_id: int) -> ProyectoDocumento:
    document = (
        db.query(ProyectoDocumento)
        .filter(
            ProyectoDocumento.id == document_id,
            ProyectoDocumento.empresa_id == empresa_id,
            ProyectoDocumento.deleted_at.is_(None),
        )
        .first()
    )
    if not document:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Documento no encontrado.")
    return document


def _project_document_file_response(document: ProyectoDocumento) -> FileResponse:
    absolute_path = Path(document.storage_path)
    if not absolute_path.exists() or not absolute_path.is_file():
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Archivo PDF no encontrado.")
    return FileResponse(
        str(absolute_path),
        media_type=document.content_type or "application/pdf",
        filename=document.file_name,
    )


@router.get("/media/image-proxy")
def read_project_image_media_proxy(
    path: str = Query(...),
) -> Any:
    """
    Sirve la imagen referencial del proyecto con una ruta estable que no colisiona
    con `/{codigo_root}` y que puede usarse directamente desde etiquetas <img>.
    """
    return _project_image_file_response(path)


@router.post("/geocode-address", response_model=ProyectoGeocodeResponse)
def geocode_project_address(
    data: ProyectoGeocodeRequest,
    current_user: Usuario = Depends(deps.get_current_active_user),
) -> ProyectoGeocodeResponse:
    """
    Geocodifica una direccion de proyecto desde el backend comun para evitar CORS,
    bloqueos por User-Agent de navegador y duplicacion por usuario.
    """
    user_role = (current_user.rol or "").lower()
    if user_role not in ["administrador", "superadministrador"]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="No tiene permisos para georreferenciar proyectos.")

    candidates = _build_geocode_candidates(data)
    if not candidates:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Complete la dirección del proyecto antes de solicitar la georreferenciación.")

    intersection = _split_ecuador_intersection_address(_normalize_geocode_text(data.direccion)) if _is_ecuador_geocode(data) else None
    if intersection:
        overpass_match = _geocode_intersection_from_overpass(data, intersection)
        if overpass_match:
            return overpass_match

    country_code = _country_code_for_geocode(data.pais)
    headers = {
        "Accept": "application/json",
        "User-Agent": GEOCODE_USER_AGENT,
        "Referer": "https://giproy.network",
    }

    try:
        with httpx.Client(timeout=8.0, follow_redirects=True, headers=headers) as client:
            for candidate in candidates:
                params = {
                    "q": candidate["query"],
                    "format": "jsonv2",
                    "limit": "5" if candidate.get("required_terms") else "1",
                    "addressdetails": "1",
                    "accept-language": "es",
                }
                if country_code:
                    params["countrycodes"] = country_code

                response = client.get("https://nominatim.openstreetmap.org/search", params=params)
                response.raise_for_status()
                results = response.json()
                if isinstance(results, list) and results:
                    match = next(
                        (
                            item for item in results
                            if isinstance(item, dict) and _geocode_match_satisfies_required_terms(item, candidate.get("required_terms"))
                        ),
                        None,
                    )
                    if not match:
                        continue
                    return ProyectoGeocodeResponse(
                        latitud=float(match["lat"]),
                        longitud=float(match["lon"]),
                        map_zoom=int(candidate["zoom"]),
                        message=str(candidate["message"]),
                        query=str(candidate["query"]),
                        display_name=match.get("display_name"),
                    )
    except (httpx.HTTPError, ValueError, KeyError) as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="No fue posible consultar el servicio de georreferenciación en este momento. Reintente en unos segundos o ajuste el punto manualmente.",
        ) from exc

    raise HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail="No se pudo localizar la dirección exacta ni una referencia territorial útil con los datos actuales. Ajusta el punto manualmente en el mapa.",
    )


@router.get("/{codigo_root}/documents", response_model=list[ProyectoDocumentoResponse])
def list_project_documents(
    codigo_root: str,
    empresa_id: Optional[int] = Query(None),
    db: Session = Depends(deps.get_db),
    current_user: Usuario = Depends(deps.get_current_active_user),
) -> Any:
    target_empresa_id = _resolve_target_empresa_id(current_user, empresa_id)
    _ensure_project_document_access(db, codigo_root, target_empresa_id)
    return (
        db.query(ProyectoDocumento)
        .filter(
            ProyectoDocumento.codigo_root == codigo_root,
            ProyectoDocumento.empresa_id == target_empresa_id,
            ProyectoDocumento.deleted_at.is_(None),
        )
        .order_by(ProyectoDocumento.created_at.desc(), ProyectoDocumento.id.desc())
        .all()
    )


@router.post("/{codigo_root}/documents", response_model=ProyectoDocumentoResponse)
async def upload_project_document(
    codigo_root: str,
    file: UploadFile = File(...),
    empresa_id: Optional[int] = Query(None),
    db: Session = Depends(deps.get_db),
    current_user: Usuario = Depends(deps.get_current_active_user),
) -> Any:
    user_role = (current_user.rol or "").lower()
    if user_role not in ["administrador", "superadministrador"]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="No tiene permisos para subir documentos.")

    target_empresa_id = _resolve_target_empresa_id(current_user, empresa_id)
    _ensure_project_document_access(db, codigo_root, target_empresa_id)

    original_name = _sanitize_upload_filename(file.filename or "documento.pdf")
    if not original_name.lower().endswith(".pdf") or file.content_type not in {"application/pdf", "application/x-pdf"}:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Solo se permiten documentos PDF.")

    upload_dir = Path("uploads") / "proyectos" / str(target_empresa_id) / codigo_root / "documentos"
    upload_dir.mkdir(parents=True, exist_ok=True)
    unique_filename = f"{uuid.uuid4()}.pdf"
    file_path = upload_dir / unique_filename

    content = await file.read()
    if not content:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="El PDF está vacío.")

    with open(file_path, "wb") as buffer:
        buffer.write(content)

    document = ProyectoDocumento(
        codigo_root=codigo_root,
        empresa_id=target_empresa_id,
        uploaded_by_user_id=current_user.id,
        file_name=original_name,
        storage_path=str(file_path),
        content_type="application/pdf",
        size_bytes=len(content),
    )
    db.add(document)
    db.commit()
    db.refresh(document)
    project = _project_for_root(db, codigo_root, target_empresa_id)
    if project:
        _audit_project_detail(db, project=project, actor=current_user, event_type="project_document_uploaded", message="Documento del proyecto cargado.", entity_type="project_document", entity_id=document.id, payload={"file_name": document.file_name, "size_bytes": document.size_bytes, "content_type": document.content_type})
    return document


@router.get("/documents/{document_id}/download")
def download_project_document(
    document_id: int,
    empresa_id: Optional[int] = Query(None),
    db: Session = Depends(deps.get_db),
    current_user: Usuario = Depends(deps.get_current_active_user),
) -> Any:
    target_empresa_id = _resolve_target_empresa_id(current_user, empresa_id)
    document = _load_project_document_or_404(db, document_id, target_empresa_id)
    _ensure_project_document_access(db, document.codigo_root, target_empresa_id)
    return _project_document_file_response(document)


@router.delete("/documents/{document_id}", response_model=ProyectoDocumentoResponse)
def delete_project_document(
    document_id: int,
    empresa_id: Optional[int] = Query(None),
    db: Session = Depends(deps.get_db),
    current_user: Usuario = Depends(deps.get_current_active_user),
) -> Any:
    user_role = (current_user.rol or "").lower()
    if user_role not in ["administrador", "superadministrador"]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="No tiene permisos para eliminar documentos.")

    target_empresa_id = _resolve_target_empresa_id(current_user, empresa_id)
    document = _load_project_document_or_404(db, document_id, target_empresa_id)
    _ensure_project_document_access(db, document.codigo_root, target_empresa_id)
    document.deleted_at = datetime.now(timezone.utc)
    db.add(document)
    db.commit()
    db.refresh(document)
    project = _project_for_root(db, document.codigo_root, target_empresa_id)
    if project:
        _audit_project_detail(db, project=project, actor=current_user, event_type="project_document_deleted", message="Documento del proyecto retirado.", entity_type="project_document", entity_id=document.id, operation_status="deleted", payload={"file_name": document.file_name})
    return document

@router.get("/{codigo_root}", response_model=ProyectoDetalleResponse)
def read_proyecto_detalle(
    codigo_root: str,
    empresa_id: Optional[int] = Query(None),
    db: Session = Depends(deps.get_db),
    current_user: Usuario = Depends(deps.get_current_active_user)
) -> Any:
    """
    Obtiene los detalles comunes del proyecto.
    """
    target_empresa_id = _resolve_target_empresa_id(current_user, empresa_id)
    if not _project_exists_for_root(db, codigo_root, target_empresa_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Proyecto no encontrado o acceso denegado.")

    detalle = proyecto_detalle_repo.get_by_root(db=db, codigo_root=codigo_root, empresa_id=target_empresa_id)
    if not detalle:
        # Si no existe, devolvemos un objeto vacío con el codigo_root para inicializarlo en el front
        return {"codigo_root": codigo_root, "empresa_id": target_empresa_id}
    # La lectura del portafolio debe ser estrictamente de consulta. La imagen
    # georreferenciada se regenera al guardar los datos del proyecto; hacerlo
    # aquí iniciaba descargas de teselas por cada tarjeta y bloqueaba cargas
    # consecutivas del portafolio.
    return detalle

@router.post("/", response_model=ProyectoDetalleResponse)
def create_or_update_proyecto_detalle(
    *,
    db: Session = Depends(deps.get_db),
    detalle_in: ProyectoDetalleCreate,
    empresa_id: Optional[int] = Query(None),
    current_user: Usuario = Depends(deps.get_current_active_user)
) -> Any:
    """
    Crea o actualiza los detalles del proyecto. Solo Admin/Superadmin.
    """
    user_role = (current_user.rol or "").lower()
    if user_role not in ["administrador", "superadministrador"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tiene permisos para modificar los detalles del proyecto."
        )

    target_empresa_id = _resolve_target_empresa_id(current_user, empresa_id)
    if not _project_exists_for_root(db, detalle_in.codigo_root, target_empresa_id):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Proyecto no encontrado o acceso denegado.",
        )

    db_obj = proyecto_detalle_repo.get_by_root(
        db=db,
        codigo_root=detalle_in.codigo_root,
        empresa_id=target_empresa_id,
    )

    # Detectar si cambió fecha_inicio para disparar sincronización de cronogramas
    fecha_inicio_changed = False
    if db_obj:
        old_fecha_inicio = getattr(db_obj, 'fecha_inicio', None)
        new_fecha_inicio = getattr(detalle_in, 'fecha_inicio', None)
        fecha_inicio_changed = old_fecha_inicio != new_fecha_inicio

    if db_obj:
        detail = proyecto_detalle_repo.update(db=db, db_obj=db_obj, obj_in=detalle_in)
    else:
        detail = proyecto_detalle_repo.create(db=db, obj_in=detalle_in, empresa_id=target_empresa_id)

    # Si cambió fecha_inicio, sincronizar cronogramas de todos los presupuestos
    if fecha_inicio_changed and detail:
        proyecto_id = db.query(Proyecto.id).filter(
            Proyecto.codigo_root == detail.codigo_root,
            Proyecto.empresa_id == target_empresa_id,
        ).first()
        if proyecto_id:
            proyecto_id = proyecto_id[0]
            presupuestos = presupuesto_repo.find_filtered(
                db,
                filters={
                    "proyecto_id": proyecto_id,
                    "empresa_id": target_empresa_id,
                }
            ) or []
            for presupuesto in presupuestos:
                try:
                    cronograma_trabajo_service.update_schedule(
                        db,
                        presupuesto_id=presupuesto.id,
                        proyecto_id=presupuesto.proyecto_id,
                        empresa_id=presupuesto.empresa_id,
                        obj_in=CronogramaTrabajoUpdate(),  # Empty update triggers sync from Datos Proyecto
                    )
                    record_audit_event(
                        db,
                        module="cronogramas_trabajo",
                        event_type="cronograma_fecha_sincronizado",
                        severity="info",
                        actor=current_user,
                        target_empresa_id=target_empresa_id,
                        entity_type="presupuesto",
                        entity_id=presupuesto.id,
                        message=f"Cronograma sincronizado por cambio de fecha en Datos Proyecto",
                    )
                except Exception as sync_err:
                    # Log pero no bloquear: un error de sincronización no debe fallar la actualización de Datos Proyecto
                    pass

    _queue_project_georef_map_refresh(
        db,
        detail,
        target_empresa_id,
    )
    project = _project_for_root(db, detail.codigo_root, target_empresa_id)
    if project:
        _audit_project_detail(db, project=project, actor=current_user, event_type="project_details_updated", message="Datos de proyecto actualizados.", entity_type="project_details", entity_id=detail.id, payload={"changed_fields": sorted(detalle_in.model_dump(exclude_unset=True).keys()), "schedule_start_synchronized": fecha_inicio_changed})
    return detail

@router.post("/upload-image")
async def upload_project_image(
    file: UploadFile = File(...),
    codigo_root: str = Query(..., min_length=1),
    empresa_id: Optional[int] = Query(None),
    db: Session = Depends(deps.get_db),
    current_user: Usuario = Depends(deps.get_current_active_user)
) -> Any:
    """
    Sube una imagen referencial del proyecto.
    """
    if (current_user.rol or "").lower() not in ["administrador", "superadministrador"]:
        raise HTTPException(status_code=403, detail="No tiene permisos para subir imágenes del proyecto.")
    target_empresa_id = _resolve_target_empresa_id(current_user, empresa_id)
    project = _project_for_root(db, codigo_root, target_empresa_id)
    if not project:
        raise HTTPException(status_code=404, detail="Proyecto no encontrado o acceso denegado.")
    allowed_types = {"image/jpeg": (b"\xff\xd8\xff",), "image/png": (b"\x89PNG\r\n\x1a\n",), "image/webp": (b"RIFF",)}
    if file.content_type not in allowed_types:
        raise HTTPException(status_code=400, detail="El archivo debe ser una imagen.")
    
    upload_dir = "uploads/proyectos"
    if not os.path.exists(upload_dir):
        os.makedirs(upload_dir, exist_ok=True)
    
    file_extension = os.path.splitext(file.filename)[1]
    unique_filename = f"{uuid.uuid4()}{file_extension}"
    file_path = os.path.join(upload_dir, unique_filename)
    
    content = await file.read()
    if not content or len(content) > 10 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="La imagen debe contener datos y no superar 10 MiB.")
    if not any(content.startswith(signature) for signature in allowed_types[file.content_type]):
        raise HTTPException(status_code=400, detail="La firma del archivo no coincide con el formato de imagen declarado.")
    if file.content_type == "image/webp" and content[8:12] != b"WEBP":
        raise HTTPException(status_code=400, detail="La firma WebP no es válida.")
    with open(file_path, "wb") as buffer:
        buffer.write(content)
    _audit_project_detail(db, project=project, actor=current_user, event_type="project_reference_image_uploaded", message="Imagen referencial del proyecto cargada.", entity_type="project_image", entity_id=unique_filename, payload={"content_type": file.content_type, "size_bytes": len(content)})
    return {"url": f"/uploads/proyectos/{unique_filename}"}


@router.get("/image-proxy")
def read_project_image_proxy(
    path: str = Query(...),
    current_user: Usuario = Depends(deps.get_current_active_user),
) -> Any:
    """
    Sirve la imagen referencial del proyecto a traves del prefijo API para evitar
    dependencias de proxy sobre /uploads.
    """
    return _project_image_file_response(path)
