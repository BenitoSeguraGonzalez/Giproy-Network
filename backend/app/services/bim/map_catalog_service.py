from sqlalchemy.orm import Session

from app.models.bim_map_catalog import BimMapCatalog
from app.schemas.bim_map_catalog import BimMapCatalogResponse, BimMapCatalogSave


def _serialize(catalog: BimMapCatalog) -> BimMapCatalogResponse:
    return BimMapCatalogResponse(
        id=catalog.id,
        project_id=catalog.proyecto_id,
        company_id=catalog.empresa_id,
        revision=catalog.revision,
        status=catalog.status,
        project_root_code=catalog.project_root_code,
        project_revision=catalog.project_revision,
        layers=catalog.layers_json,
        justification=catalog.justification,
        created_by=catalog.created_by,
        created_at=catalog.created_at,
    )


def get_active_map_catalog(db: Session, *, project_id: int, company_id: int) -> BimMapCatalogResponse | None:
    catalog = (
        db.query(BimMapCatalog)
        .filter(
            BimMapCatalog.proyecto_id == project_id,
            BimMapCatalog.empresa_id == company_id,
            BimMapCatalog.status == "active",
        )
        .order_by(BimMapCatalog.revision.desc())
        .first()
    )
    return _serialize(catalog) if catalog else None


def save_map_catalog(
    db: Session,
    *,
    project_id: int,
    company_id: int,
    project_root_code: str | None,
    project_revision: int,
    user_id: int,
    payload: BimMapCatalogSave,
) -> BimMapCatalogResponse:
    current = (
        db.query(BimMapCatalog)
        .filter(
            BimMapCatalog.proyecto_id == project_id,
            BimMapCatalog.empresa_id == company_id,
            BimMapCatalog.status == "active",
        )
        .with_for_update()
        .first()
    )
    revision = (current.revision if current else 0) + 1
    if current:
        current.status = "superseded"
    catalog = BimMapCatalog(
        empresa_id=company_id,
        proyecto_id=project_id,
        revision=revision,
        status="active",
        project_root_code=project_root_code,
        project_revision=project_revision,
        layers_json=[layer.model_dump(mode="json") for layer in payload.layers],
        justification=payload.justification.strip(),
        created_by=user_id,
    )
    db.add(catalog)
    db.commit()
    return get_active_map_catalog(db, project_id=project_id, company_id=company_id)
