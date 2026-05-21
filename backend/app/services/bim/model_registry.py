from sqlalchemy import inspect
from sqlalchemy.orm import Session, selectinload

from app.models.bim_element import BimElement
from app.models.bim_link_apu import BimLinkApu
from app.models.bim_link_edt import BimLinkEdt
from app.models.bim_link_presupuesto import BimLinkPresupuesto
from app.models.bim_model import BimModel
from app.models.bim_model_version import BimModelVersion
from app.models.bim_storey import BimStorey
from app.models.bim_view_state import BimViewState
from app.schemas.bim_model import BimModelResponse, BimWorkspaceSummaryResponse


REQUIRED_BIM_TABLES = (
    "bim_models",
    "bim_model_versions",
    "bim_elements",
    "bim_storeys",
    "bim_view_states",
    "bim_link_edt",
    "bim_link_apu",
    "bim_link_presupuesto",
)


def ensure_bim_domain_tables(db: Session) -> None:
    bind = db.get_bind()
    if bind is None:
        return
    for table in (
        BimModel.__table__,
        BimModelVersion.__table__,
        BimElement.__table__,
        BimStorey.__table__,
        BimViewState.__table__,
        BimLinkEdt.__table__,
        BimLinkApu.__table__,
        BimLinkPresupuesto.__table__,
    ):
        table.create(bind=bind, checkfirst=True)


def bim_tables_ready(db: Session) -> bool:
    ensure_bim_domain_tables(db)
    inspector = inspect(db.bind)
    available_tables = set(inspector.get_table_names())
    return all(name in available_tables for name in REQUIRED_BIM_TABLES)


def list_models_for_project(db: Session, *, project_id: int, company_id: int) -> list[BimModel]:
    if not bim_tables_ready(db):
        return []

    return (
        db.query(BimModel)
        .options(selectinload(BimModel.versions))
        .filter(BimModel.proyecto_id == project_id, BimModel.empresa_id == company_id)
        .order_by(BimModel.fecha_creacion.desc(), BimModel.id.desc())
        .all()
    )


def get_workspace_summary(db: Session, *, project_id: int, company_id: int) -> BimWorkspaceSummaryResponse:
    tables_ready = bim_tables_ready(db)
    models = list_models_for_project(db, project_id=project_id, company_id=company_id) if tables_ready else []
    serialized_models = [BimModelResponse.model_validate(model, from_attributes=True) for model in models]

    active_version = None
    for model in serialized_models:
        active_version = next((version for version in model.versions if version.is_active), None)
        if active_version:
            break

    tree_nodes = []
    property_groups = []
    link_summary = []
    if active_version:
        storeys = (
            db.query(BimStorey)
            .filter(BimStorey.bim_model_version_id == active_version.id)
            .order_by(BimStorey.orden.asc(), BimStorey.id.asc())
            .all()
        )
        tree_nodes = [
            {"id": f"storey-{storey.id}", "label": storey.nombre, "count": storey.codigo or "nivel"}
            for storey in storeys
        ] or [
            {"id": f"discipline-{model.id}", "label": model.disciplina or "Modelo general", "count": len(model.versions)}
            for model in serialized_models
        ]
        property_groups = [
            {"label": "Version activa", "items": [
                {"key": "Version", "value": active_version.version_label},
                {"key": "Estado", "value": active_version.status},
                {"key": "Elementos", "value": active_version.element_count or 0},
                {"key": "Niveles", "value": active_version.storey_count or 0},
            ]}
        ]
        active_elements_count = (
            db.query(BimElement)
            .filter(BimElement.bim_model_version_id == active_version.id)
            .count()
        )
        link_summary = [
            {"type": "EDT", "count": db.query(BimLinkEdt).join(BimElement).filter(BimElement.bim_model_version_id == active_version.id).count()},
            {"type": "APUs", "count": db.query(BimLinkApu).join(BimElement).filter(BimElement.bim_model_version_id == active_version.id).count()},
            {"type": "Presupuesto", "count": db.query(BimLinkPresupuesto).join(BimElement).filter(BimElement.bim_model_version_id == active_version.id).count()},
        ]
        property_groups.append(
            {"label": "Cobertura BIM", "items": [
                {"key": "Elementos cargados", "value": active_elements_count},
                {"key": "Modelos registrados", "value": len(serialized_models)},
                {"key": "Niveles disponibles", "value": len(storeys)},
            ]}
        )

    return BimWorkspaceSummaryResponse(
        ready=tables_ready,
        tables_ready=tables_ready,
        project_id=project_id,
        company_id=company_id,
        models=serialized_models,
        active_version_id=active_version.id if active_version else None,
        active_version_label=active_version.version_label if active_version else None,
        tree_nodes=tree_nodes,
        property_groups=property_groups,
        link_summary=link_summary,
    )
