import math

from sqlalchemy.orm import Session

from app.models.bim_site_georeference import BimSiteGeoreference
from app.schemas.bim_site_georeference import BimSiteGeoreferenceResponse, BimSiteGeoreferenceSave
from app.services.bim.federation_service import get_active_federation


EARTH_RADIUS_METERS = 6378137.0
UNIT_TO_METERS = {"m": 1.0, "mm": 0.001, "ft": 0.3048}


def _local_to_wgs84(site: BimSiteGeoreference, point: tuple[float, float, float]) -> tuple[float, float, float]:
    dx = point[0] - site.local_origin_x
    dy = point[1] - site.local_origin_y
    dz = point[2] - site.local_origin_z
    heading = math.radians(site.heading_degrees)
    east = dx * math.cos(heading) + dy * math.sin(heading)
    north = -dx * math.sin(heading) + dy * math.cos(heading)
    latitude = site.latitude + math.degrees(north / EARTH_RADIUS_METERS)
    longitude = site.longitude + math.degrees(east / (EARTH_RADIUS_METERS * math.cos(math.radians(site.latitude))))
    return latitude, longitude, site.altitude + dz


def _member_origin(member) -> tuple[float, float, float]:
    georeference = member.georeference.model_dump() if hasattr(member.georeference, "model_dump") else member.georeference
    transform = member.transform.model_dump() if hasattr(member.transform, "model_dump") else member.transform
    factor = UNIT_TO_METERS.get(georeference.get("units"), 1.0)
    origin = georeference.get("origin") or (0.0, 0.0, 0.0)
    translation = transform.get("translation") or (0.0, 0.0, 0.0)
    return tuple((float(origin[index]) + float(translation[index])) * factor for index in range(3))


def _serialize(db: Session, site: BimSiteGeoreference) -> BimSiteGeoreferenceResponse:
    federation = get_active_federation(db, project_id=site.proyecto_id, company_id=site.empresa_id)
    map_points = []
    for member in federation.members if federation else []:
        if not member.enabled:
            continue
        latitude, longitude, altitude = _local_to_wgs84(site, _member_origin(member))
        map_points.append({
            "version_id": member.version_id,
            "model_id": member.model_id,
            "model_name": member.model_name,
            "version_label": member.version_label,
            "discipline": member.discipline,
            "latitude": round(latitude, 8),
            "longitude": round(longitude, 8),
            "altitude": round(altitude, 3),
            "alignment_status": member.alignment_status,
        })
    return BimSiteGeoreferenceResponse(
        id=site.id,
        project_id=site.proyecto_id,
        company_id=site.empresa_id,
        revision=site.revision,
        status=site.status,
        project_root_code=site.project_root_code,
        project_revision=site.project_revision,
        crs=site.crs,
        latitude=site.latitude,
        longitude=site.longitude,
        altitude=site.altitude,
        local_origin=(site.local_origin_x, site.local_origin_y, site.local_origin_z),
        heading_degrees=site.heading_degrees,
        map_zoom=site.map_zoom,
        justification=site.justification,
        created_by=site.created_by,
        created_at=site.created_at,
        map_points=map_points,
    )


def get_active_site_georeference(db: Session, *, project_id: int, company_id: int) -> BimSiteGeoreferenceResponse | None:
    site = (
        db.query(BimSiteGeoreference)
        .filter(
            BimSiteGeoreference.proyecto_id == project_id,
            BimSiteGeoreference.empresa_id == company_id,
            BimSiteGeoreference.status == "active",
        )
        .order_by(BimSiteGeoreference.revision.desc())
        .first()
    )
    return _serialize(db, site) if site else None


def save_site_georeference(
    db: Session,
    *,
    project_id: int,
    company_id: int,
    project_root_code: str | None,
    project_revision: int,
    user_id: int,
    payload: BimSiteGeoreferenceSave,
) -> BimSiteGeoreferenceResponse:
    current = (
        db.query(BimSiteGeoreference)
        .filter(
            BimSiteGeoreference.proyecto_id == project_id,
            BimSiteGeoreference.empresa_id == company_id,
            BimSiteGeoreference.status == "active",
        )
        .order_by(BimSiteGeoreference.revision.desc())
        .first()
    )
    revision = (current.revision if current else 0) + 1
    if current:
        current.status = "superseded"
    site = BimSiteGeoreference(
        proyecto_id=project_id,
        empresa_id=company_id,
        revision=revision,
        status="active",
        project_root_code=project_root_code,
        project_revision=project_revision,
        crs=payload.crs,
        latitude=payload.latitude,
        longitude=payload.longitude,
        altitude=payload.altitude,
        local_origin_x=payload.local_origin[0],
        local_origin_y=payload.local_origin[1],
        local_origin_z=payload.local_origin[2],
        heading_degrees=payload.heading_degrees,
        map_zoom=payload.map_zoom,
        justification=payload.justification,
        created_by=user_id,
    )
    db.add(site)
    db.commit()
    return get_active_site_georeference(db, project_id=project_id, company_id=company_id)
